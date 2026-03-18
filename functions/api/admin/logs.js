/* ====================================================================
   Admin Audit Logs API - GET endpoint with pagination and filtering
   - GET: List audit log entries with pagination
   ==================================================================== */

import admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();
const auth = admin.auth();

// GET handler: List audit logs with pagination and filtering
async function handleGetLogs(req, res) {
  console.log("[Logs GET] Request started");

  // Verify Bearer token
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    console.warn("[Logs GET] Missing authorization token");
    return res.status(401).json({ error: "Unauthorized - missing token" });
  }

  try {
    // Verify token and get user info
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    console.log(`[Logs GET] Verified token for uid: ${uid}`);

    // Check if user is authorized (must be in adminUsers)
    const adminUserRef = db.collection("adminUsers").doc(uid);
    const adminUserSnap = await adminUserRef.get();

    if (!adminUserSnap.exists) {
      console.warn(`[Logs GET] User not authorized (uid: ${uid})`);
      return res.status(403).json({
        error: "Not authorized to view logs",
        success: false,
      });
    }

    console.log("[Logs GET] User authorized, fetching logs");

    // Parse query parameters for pagination and filtering
    const pageSize = Math.min(parseInt(req.query.pageSize || "25"), 100); // Max 100 per page
    const pageNumber = Math.max(parseInt(req.query.pageNumber || "1"), 1); // Min page 1
    const eventType = req.query.eventType || "";
    const email = req.query.email || "";

    // Build query
    let query = db.collection("adminAuditLogs");

    // Apply filters if provided
    if (eventType) {
      query = query.where("eventType", "==", eventType);
    }

    if (email) {
      query = query.where("email", "==", email.toLowerCase().trim());
    }

    // Order by timestamp descending (most recent first)
    query = query.orderBy("timestamp", "desc");

    // Get total count for pagination info (approximate for large collections)
    const countSnapshot = await query.get();
    const totalCount = countSnapshot.size;

    // Calculate skip for pagination
    const skip = (pageNumber - 1) * pageSize;

    // Get paginated results
    const snapshot = await query.offset(skip).limit(pageSize).get();

    const logs = [];
    snapshot.forEach((doc) => {
      const logData = doc.data();
      logs.push({
        id: doc.id,
        uid: logData.uid || "",
        email: logData.email || "",
        targetUid: logData.targetUid || "",
        targetEmail: logData.targetEmail || "",
        eventType: logData.eventType || "",
        action: logData.action || "",
        targetRole: logData.targetRole || "",
        ipAddress: logData.ipAddress || "unknown",
        userAgent: logData.userAgent || "unknown",
        timestamp: logData.timestamp ? logData.timestamp.toDate().toISOString() : null,
      });
    });

    console.log(`[Logs GET] Returning ${logs.length} logs (page ${pageNumber})`);

    return res.status(200).json({
      success: true,
      logs: logs,
      pagination: {
        pageNumber: pageNumber,
        pageSize: pageSize,
        totalCount: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      filters: {
        eventType: eventType || null,
        email: email || null,
      },
    });
  } catch (error) {
    console.error("[Logs GET Error]", error.code || error.message);

    if (error.code === "auth/argument-error" || error.code === "auth/invalid-credential") {
      return res.status(401).json({
        error: "Invalid or expired token",
        success: false,
      });
    }

    return res.status(500).json({
      error: "Failed to fetch logs",
      success: false,
    });
  }
}

// Main handler
export default async function handler(req, res) {
  console.log(`[Logs API] ${req.method} request`);

  if (req.method === "GET") {
    return await handleGetLogs(req, res);
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }
}
