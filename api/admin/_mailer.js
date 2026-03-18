function getRequiredEnv(name) {
  const value = process.env[name];
  return value && String(value).trim() ? String(value).trim() : "";
}

function getMailBrandName() {
  return (
    getRequiredEnv("ADMIN_EMAIL_BRAND") ||
    getRequiredEnv("CMS_SITE_NAME") ||
    "Admin Panel"
  );
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isTransactionalEmailConfigured() {
  return Boolean(
    getRequiredEnv("RESEND_API_KEY") &&
    getRequiredEnv("RESEND_FROM_EMAIL")
  );
}

function buildAdminPasswordResetEmail(params) {
  const recipientEmail = String(params && params.recipientEmail || "").trim();
  const resetUrl = String(params && params.resetUrl || "").trim();
  const brandName = escapeHtml(getMailBrandName());
  const safeRecipientEmail = escapeHtml(recipientEmail);
  const safeResetUrl = escapeHtml(resetUrl);
  const plainBrandName = getMailBrandName();

  return {
    subject: `${plainBrandName} password reset`,
    text: [
      `${plainBrandName} password reset request`,
      "",
      `A password reset was requested for ${recipientEmail}.`,
      "Use the secure link below to set a new password:",
      resetUrl,
      "",
      "If you did not request this, you can ignore this email."
    ].join("\n"),
    html: `
      <div style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e5e7eb;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;">${brandName}</p>
          <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;">Password Reset Request</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
            A password reset was requested for <strong>${safeRecipientEmail}</strong>.
          </p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">
            Use the secure button below to set a new password for your admin account.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${safeResetUrl}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:#111827;color:#ffffff;text-decoration:none;font-weight:600;">Reset Password</a>
          </p>
          <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#6b7280;">
            If the button does not work, copy and paste this link into your browser:
          </p>
          <p style="margin:0 0 24px;font-size:13px;line-height:1.6;word-break:break-all;color:#2563eb;">
            ${safeResetUrl}
          </p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">
            If you did not request this reset, you can safely ignore this email.
          </p>
        </div>
      </div>
    `
  };
}

async function sendTransactionalEmail(params) {
  const apiKey = getRequiredEnv("RESEND_API_KEY");
  const from = getRequiredEnv("RESEND_FROM_EMAIL");

  if (!apiKey || !from) {
    return {
      ok: false,
      provider: "",
      error: "Password reset email service is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL."
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from,
      to: [String(params && params.to || "").trim()],
      subject: String(params && params.subject || "").trim(),
      html: String(params && params.html || ""),
      text: String(params && params.text || "")
    })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const apiError =
      payload &&
      typeof payload === "object" &&
      (
        (payload.error && payload.error.message) ||
        payload.message ||
        payload.error
      );

    return {
      ok: false,
      provider: "resend",
      error: apiError ? String(apiError) : `HTTP ${response.status}`
    };
  }

  return {
    ok: true,
    provider: "resend",
    id: String(payload && payload.id || "")
  };
}

module.exports = {
  isTransactionalEmailConfigured,
  buildAdminPasswordResetEmail,
  sendTransactionalEmail
};
