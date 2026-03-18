const {
  MAX_LOG_SCAN,
  mapAuditLog,
  normalizeEmail,
  normalizeEventType,
  verifyAdminRequest
} = require("./_shared");

function toPositiveInt(value, fallback, max) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, max);
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  const authResult = await verifyAdminRequest(req);
  if (!authResult.ok) {
    return res.status(authResult.status).json({
      success: false,
      error: authResult.error
    });
  }

  const pageSize = toPositiveInt(req.query && req.query.pageSize, 25, 100);
  const pageNumber = toPositiveInt(req.query && req.query.pageNumber, 1, 1000);
  const requestedEventType = normalizeEventType(req.query && req.query.eventType);
  const requestedEmail = normalizeEmail(req.query && req.query.email);

  try {
    const snapshot = await authResult.db
      .collection("adminAuditLogs")
      .orderBy("timestamp", "desc")
      .limit(MAX_LOG_SCAN)
      .get();

    let logs = snapshot.docs.map(mapAuditLog);

    if (requestedEventType) {
      logs = logs.filter((log) => log.eventType === requestedEventType);
    }

    if (requestedEmail) {
      logs = logs.filter((log) => log.email === requestedEmail || log.targetEmail === requestedEmail);
    }

    const totalCount = logs.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePageNumber = Math.min(pageNumber, totalPages);
    const startIndex = (safePageNumber - 1) * pageSize;
    const pageLogs = logs.slice(startIndex, startIndex + pageSize);

    return res.status(200).json({
      success: true,
      logs: pageLogs,
      pagination: {
        pageNumber: safePageNumber,
        pageSize,
        totalCount,
        totalPages
      },
      filters: {
        eventType: requestedEventType || null,
        email: requestedEmail || null
      }
    });
  } catch (error) {
    console.error("[Admin Logs] Failed to fetch audit logs:", error.message || error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch audit logs"
    });
  }
};
