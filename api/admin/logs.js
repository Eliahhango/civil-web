const { getFirestore } = require("../cms/firebase");
const admin = require("firebase-admin");

/**
 * Admin Audit Logs Endpoint
 * 
 * GET: Retrieve paginated and filtered audit logs
 *   - Requires admin or super_admin role
 *   - Query parameters:
 *     - pageNumber: page number (default 1)
 *     - pageSize: items per page (default 25, max 100)
 *     - eventType: filter by event type (optional)
 *     - email: filter by email address (optional)
 *   - Returns paginated logs with metadata
 */

module.exports = async function handler(req, res) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  const tokenPart = authHeader.split("Bearer ")[1];
  let decodedToken;
  
  try {
    decodedToken = await admin.auth().verifyIdToken(tokenPart);
  } catch (error) {
    console.error("[Logs] Token verification failed:", error.code);
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const userRole = decodedToken.role; // Standardized custom claim
  console.log(`[Logs] Request from ${decodedToken.email} with role: ${userRole}`);

  // GET: Retrieve audit logs
  if (req.method === "GET") {
    try {
      // Require admin or super_admin role
      if (!userRole || !["admin", "super_admin"].includes(userRole)) {
        console.warn(`[Logs] Unauthorized GET from: ${decodedToken.email} (role: ${userRole})`);
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }

      // Parse query parameters
      const pageNumber = Math.max(1, parseInt(req.query.pageNumber || "1", 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || "25", 10)));
      const eventTypeFilter = req.query.eventType || null;
      const emailFilter = req.query.email || null;

      const db = getFirestore();

      // Calculate offset
      const offset = (pageNumber - 1) * pageSize;

      // Build query
      let query = db.collection("adminAuditLogs").orderBy("timestamp", "desc");

      // Apply filters
      if (eventTypeFilter && eventTypeFilter.trim()) {
        query = query.where("eventType", "==", eventTypeFilter.trim());
      }
      if (emailFilter && emailFilter.trim()) {
        query = query.where("email", "==", emailFilter.trim().toLowerCase());
      }

      // Get total count
      const countSnapshot = await query.count().get();
      const totalCount = countSnapshot.data().count;
      const totalPages = Math.ceil(totalCount / pageSize);

      // Get paginated logs
      const logsSnapshot = await query.offset(offset).limit(pageSize).get();

      const logs = [];
      logsSnapshot.forEach(doc => {
        const data = doc.data();
        logs.push({
          id: doc.id,
          timestamp: data.timestamp ? data.timestamp.toDate?.().toISOString() : new Date().toISOString(),
          email: data.email || "Unknown",
          eventType: data.eventType || "unknown",
          reason: data.reason || "",
          targetEmail: data.targetEmail || null,
          targetRole: data.targetRole || null,
          status: data.status || null,
          ipAddress: data.ipAddress || "unknown",
          userAgent: data.userAgent || "unknown",
        });
      });

      console.log(`[Logs] Retrieved ${logs.length} logs for page ${pageNumber}`);

      return res.status(200).json({
        success: true,
        logs,
        pagination: {
          pageNumber,
          pageSize,
          totalCount,
          totalPages,
          hasNextPage: pageNumber < totalPages,
          hasPreviousPage: pageNumber > 1,
        }
      });

    } catch (error) {
      console.error("[Logs] GET error:", error);
      if (error.code === "PERMISSION_DENIED") {
        return res.status(403).json({ error: "Firestore permission denied" });
      }
      return res.status(500).json({ error: "Failed to retrieve logs" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
};
