const {
  getAdminServices,
  getClientIP,
  getUserAgent,
  isValidEmail,
  isValidRole,
  logAuditEvent,
  normalizeEmail
} = require("./_shared");
const {
  isTransactionalEmailConfigured,
  buildAdminPasswordResetEmail,
  sendTransactionalEmail
} = require("./_mailer");

class PasswordResetRequestError extends Error {
  constructor(message, status, auditReason) {
    super(message);
    this.name = "PasswordResetRequestError";
    this.status = status;
    this.auditReason = auditReason || message;
  }
}

function isAuthPermissionError(error) {
  const message = String((error && error.message) || error || "").toLowerCase();
  const code = String((error && error.code) || "").toLowerCase();

  return (
    code === "auth/internal-error" &&
    (
      message.includes("serviceusage.serviceusageconsumer") ||
      message.includes("serviceusage.services.use") ||
      message.includes("permission_denied") ||
      message.includes("caller does not have required permission")
    )
  );
}

function isContinueUrlErrorMessage(message) {
  const normalized = String(message || "").toUpperCase();
  return (
    normalized.includes("INVALID_CONTINUE_URI") ||
    normalized.includes("UNAUTHORIZED_CONTINUE_URI") ||
    normalized.includes("UNAUTHORIZED_DOMAIN")
  );
}

async function postFirebasePasswordResetEmail(apiKey, payload) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function sendFirebasePasswordResetEmail(email, continueUrl, clientIP) {
  const apiKey = String(process.env.FIREBASE_WEB_API_KEY || "").trim();
  if (!apiKey) {
    throw new PasswordResetRequestError(
      "Password reset is unavailable right now.",
      503,
      "FIREBASE_WEB_API_KEY is missing for Firebase password reset fallback"
    );
  }

  const payload = {
    requestType: "PASSWORD_RESET",
    email
  };

  if (continueUrl) {
    payload.continueUrl = continueUrl;
  }

  if (clientIP && clientIP !== "unknown") {
    payload.userIp = clientIP;
  }

  let { response, data } = await postFirebasePasswordResetEmail(apiKey, payload);

  if (!response.ok) {
    let apiMessage = String(data && data.error && data.error.message || "").trim();

    if (continueUrl && isContinueUrlErrorMessage(apiMessage)) {
      const retryPayload = {
        requestType: "PASSWORD_RESET",
        email
      };

      if (clientIP && clientIP !== "unknown") {
        retryPayload.userIp = clientIP;
      }

      const retried = await postFirebasePasswordResetEmail(apiKey, retryPayload);
      response = retried.response;
      data = retried.data;
      apiMessage = String(data && data.error && data.error.message || "").trim();

      if (response.ok) {
        return {
          provider: "firebase-auth-email"
        };
      }
    }

    if (apiMessage === "EMAIL_NOT_FOUND") {
      throw new PasswordResetRequestError(
        "Password reset is not available for this account.",
        403,
        "Allowlisted admin is missing a password-auth user"
      );
    }

    if (apiMessage === "OPERATION_NOT_ALLOWED") {
      throw new PasswordResetRequestError(
        "Password reset is unavailable right now.",
        503,
        "Firebase email/password reset is not enabled"
      );
    }

    if (isContinueUrlErrorMessage(apiMessage)) {
      throw new PasswordResetRequestError(
        "Password reset is unavailable right now.",
        503,
        `Invalid password reset continue URL: ${apiMessage}`
      );
    }

    if (apiMessage === "TOO_MANY_ATTEMPTS_TRY_LATER") {
      throw new PasswordResetRequestError(
        "Too many reset requests. Please wait and try again.",
        429,
        "Firebase rate limited password reset requests"
      );
    }

    throw new PasswordResetRequestError(
      "Unable to send password reset email.",
      502,
      `Firebase password reset fallback failed: ${apiMessage || `HTTP ${response.status}`}`
    );
  }

  return {
    provider: "firebase-auth-email"
  };
}

function getContinueUrl(req) {
  const configured = String(process.env.ADMIN_PASSWORD_RESET_CONTINUE_URL || "").trim();
  if (configured) {
    return configured;
  }

  const forwardedHost = req.headers && (req.headers["x-forwarded-host"] || req.headers.host);
  const host = typeof forwardedHost === "string" ? forwardedHost.trim() : "";
  if (!host) {
    return "";
  }

  const forwardedProto = req.headers && req.headers["x-forwarded-proto"];
  const proto = typeof forwardedProto === "string" && forwardedProto.trim() ? forwardedProto.trim() : "https";
  return `${proto}://${host}/elitech/admin/`;
}

async function findAuthorizedAdminByEmail(db, email) {
  const snapshot = await db
    .collection("adminUsers")
    .where("email", "==", email)
    .limit(5)
    .get();

  for (const doc of snapshot.docs) {
    const value = doc.data() || {};
    const role = String(value.role || "").trim();

    if (!isValidRole(role)) {
      continue;
    }

    return {
      ref: doc.ref,
      id: doc.id,
      uid: String(value.uid || doc.id || ""),
      email: normalizeEmail(value.email || email),
      role
    };
  }

  return null;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  const email = normalizeEmail(req.body && req.body.email);
  const clientIP = getClientIP(req);
  const userAgent = getUserAgent(req);
  let db = null;
  let auditEmail = email;
  let auditUid = "";
  let auditRole = "";

  try {
    if (!email || !isValidEmail(email)) {
      throw new PasswordResetRequestError("Enter a valid email address.", 400);
    }

    const services = getAdminServices();
    if (!services.ok) {
      throw new PasswordResetRequestError("Password reset is unavailable right now.", services.status || 500);
    }

    db = services.db;
    const auth = services.auth;
    const adminUser = await findAuthorizedAdminByEmail(db, email);

    if (!adminUser) {
      throw new PasswordResetRequestError(
        "Password reset is not available for this account.",
        403,
        "Email not found in admin allowlist"
      );
    }

    auditUid = adminUser.uid;
    auditRole = adminUser.role;

    let authUser = null;
    let authLookupBlocked = false;

    try {
      authUser = await auth.getUserByEmail(email);
    } catch (error) {
      if (String(error && error.code || "") === "auth/user-not-found") {
        throw new PasswordResetRequestError(
          "Password reset is not available for this account.",
          403,
          "Allowlisted admin has no Firebase Auth user"
        );
      }

      if (isAuthPermissionError(error)) {
        authLookupBlocked = true;
      } else {
        throw error;
      }
    }

    if (authUser && authUser.disabled) {
      throw new PasswordResetRequestError(
        "Password reset is not available for this account.",
        403,
        "Allowlisted admin account is disabled"
      );
    }

    const continueUrl = getContinueUrl(req);
    let delivery = null;

    if (!isTransactionalEmailConfigured()) {
      delivery = await sendFirebasePasswordResetEmail(email, continueUrl, clientIP);
    } else {
      try {
        let resetUrl = "";
        if (continueUrl) {
          try {
            resetUrl = await auth.generatePasswordResetLink(email, {
              url: continueUrl,
              handleCodeInApp: false
            });
          } catch (error) {
            const message = String((error && error.message) || error || "");
            if (!isContinueUrlErrorMessage(message)) {
              throw error;
            }

            resetUrl = await auth.generatePasswordResetLink(email);
          }
        } else {
          resetUrl = await auth.generatePasswordResetLink(email);
        }

        const template = buildAdminPasswordResetEmail({
          recipientEmail: email,
          resetUrl
        });

        const sent = await sendTransactionalEmail({
          to: email,
          subject: template.subject,
          html: template.html,
          text: template.text
        });

        if (!sent.ok) {
          throw new PasswordResetRequestError(
            "Unable to send password reset email.",
            502,
            `Unable to send password reset email: ${sent.error || "Unknown email provider error"}`
          );
        }

        delivery = {
          provider: sent.provider
        };
      } catch (error) {
        if (!isAuthPermissionError(error)) {
          throw error;
        }

        authLookupBlocked = true;
        delivery = await sendFirebasePasswordResetEmail(email, continueUrl, clientIP);
      }
    }

    await logAuditEvent(db, {
      uid: authUser ? authUser.uid : adminUser.uid,
      email,
      targetUid: authUser ? authUser.uid : adminUser.uid,
      targetEmail: email,
      eventType: "admin.password_reset.sent",
      action: "password_reset_requested",
      targetRole: adminUser.role,
      role: adminUser.role,
      status: 200,
      reason: authLookupBlocked
        ? `Password reset email sent via ${delivery.provider} after Firebase Admin Auth fallback`
        : `Password reset email sent via ${delivery.provider}`,
      ipAddress: clientIP,
      userAgent
    });

    return res.status(200).json({
      success: true,
      message: "Password reset email sent. Check your inbox and spam folder."
    });
  } catch (error) {
    console.error("[Admin Password Reset] Request failed:", error.message || error);

    if (db) {
      await logAuditEvent(db, {
        uid: auditUid,
        email: auditEmail,
        targetUid: auditUid,
        targetEmail: auditEmail,
        eventType: "admin.password_reset.denied",
        action: "password_reset_requested",
        targetRole: auditRole,
        role: auditRole,
        status: error instanceof PasswordResetRequestError ? error.status : 500,
        reason: error instanceof PasswordResetRequestError
          ? error.auditReason
          : (error.message || "Unknown password reset error"),
        ipAddress: clientIP,
        userAgent
      });
    }

    return res.status(error instanceof PasswordResetRequestError ? error.status : 500).json({
      success: false,
      error: error instanceof PasswordResetRequestError
        ? error.message
        : "Unable to process password reset request."
    });
  }
};
