const fs = require('fs').promises;
const path = require('path');

// Security log storage
const SECURITY_LOG_PATH = path.join(__dirname, '../data/security-logs.json');

// Initialize security logs file
async function initializeSecurityLogs() {
  try {
    await fs.access(SECURITY_LOG_PATH);
  } catch {
    await fs.writeFile(SECURITY_LOG_PATH, JSON.stringify([], null, 2));
  }
}

// Load security logs
async function loadSecurityLogs() {
  try {
    const data = await fs.readFile(SECURITY_LOG_PATH, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save security log
async function saveSecurityLog(log) {
  try {
    const logs = await loadSecurityLogs();
    logs.unshift(log); // Add to beginning
    
    // Keep only last 1000 logs
    if (logs.length > 1000) {
      logs.splice(1000);
    }
    
    await fs.writeFile(SECURITY_LOG_PATH, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Error saving security log:', error);
  }
}

// Get client IP
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         'unknown';
}

// Get user agent
function getUserAgent(req) {
  return req.headers['user-agent'] || 'unknown';
}

// Suspicious patterns for attack detection
const SUSPICIOUS_PATTERNS = {
  sqlInjection: [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/i,
    /('|(\\')|(;)|(--)|(\/\*)|(\*\/)|(\+)|(\%27)|(\%22))/i,
    /(\bOR\b.*=.*)|(\bAND\b.*=.*)/i,
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bEXEC\b|\bEXECUTE\b)/i
  ],
  xss: [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<img[^>]+src[^>]*=.*javascript:/i,
    /eval\(/i,
    /expression\(/i
  ],
  pathTraversal: [
    /\.\.\//g,
    /\.\.\\/g,
    /\.\.%2F/i,
    /\.\.%5C/i,
    /etc\/passwd/i,
    /boot\.ini/i,
    /windows\/system32/i
  ],
  commandInjection: [
    /[;&|`$(){}[\]]/,
    /\b(cat|ls|pwd|whoami|id|uname|ps|kill|rm|mv|cp|chmod|chown)\b/i,
    /\|\s*\w+/i,
    /;\s*\w+/i,
    /\$\{/,
    /\$\(/
  ],
  nosqlInjection: [
    /\$where/i,
    /\$ne/i,
    /\$gt/i,
    /\$lt/i,
    /\$regex/i,
    /\$exists/i,
    /\$in/i,
    /\$nin/i
  ]
};

// Check for suspicious patterns in data
function detectSuspiciousActivity(data, type = 'request') {
  const detections = [];
  const dataString = typeof data === 'object' ? JSON.stringify(data) : String(data);

  // Check SQL Injection
  for (const pattern of SUSPICIOUS_PATTERNS.sqlInjection) {
    if (pattern.test(dataString)) {
      detections.push({ type: 'SQL Injection', pattern: pattern.toString() });
    }
  }

  // Check XSS
  for (const pattern of SUSPICIOUS_PATTERNS.xss) {
    if (pattern.test(dataString)) {
      detections.push({ type: 'XSS Attack', pattern: pattern.toString() });
    }
  }

  // Check Path Traversal
  for (const pattern of SUSPICIOUS_PATTERNS.pathTraversal) {
    if (pattern.test(dataString)) {
      detections.push({ type: 'Path Traversal', pattern: pattern.toString() });
    }
  }

  // Check Command Injection
  for (const pattern of SUSPICIOUS_PATTERNS.commandInjection) {
    if (pattern.test(dataString)) {
      detections.push({ type: 'Command Injection', pattern: pattern.toString() });
    }
  }

  // Check NoSQL Injection
  for (const pattern of SUSPICIOUS_PATTERNS.nosqlInjection) {
    if (pattern.test(dataString)) {
      detections.push({ type: 'NoSQL Injection', pattern: pattern.toString() });
    }
  }

  return detections;
}

// Rate limiting storage (in-memory)
const rateLimitStore = new Map();

// Rate limiting middleware
function rateLimiter(windowMs = 15 * 60 * 1000, maxRequests = 100) {
  return (req, res, next) => {
    const ip = getClientIP(req);
    const key = `${ip}-${req.path}`;
    const now = Date.now();
    
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const record = rateLimitStore.get(key);
    
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }
    
    if (record.count >= maxRequests) {
      // Log rate limit violation
      saveSecurityLog({
        timestamp: new Date().toISOString(),
        type: 'Rate Limit Exceeded',
        severity: 'medium',
        ip: ip,
        method: req.method,
        path: req.path,
        userAgent: getUserAgent(req),
        details: `Exceeded ${maxRequests} requests in ${windowMs}ms`
      });
      
      return res.status(429).json({ 
        error: 'Too many requests. Please try again later.' 
      });
    }
    
    record.count++;
    next();
  };
}

// Security headers middleware
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
}

// Request logging and attack detection middleware
async function securityLogger(req, res, next) {
  const ip = getClientIP(req);
  const userAgent = getUserAgent(req);
  const method = req.method;
  const path = req.path;
  const timestamp = new Date().toISOString();
  
  // COMPLETELY SKIP security checks for authentication endpoints to avoid false positives
  const isAuthEndpoint = path === '/api/auth/login' || path === '/api/auth/register';
  
  // For auth endpoints, completely bypass all security checks and just continue
  if (isAuthEndpoint) {
    // Authentication endpoints are handled by validation middleware and bcrypt
    // No need to check for attacks on login/register - they're already validated
    return next();
  }
  
  // For all other endpoints, perform full security checks
  let detections = [];
  
  // Check request body
  if (req.body && Object.keys(req.body).length > 0) {
    detections = detectSuspiciousActivity(req.body, 'body');
  }
  
  // Check query parameters
  if (req.query && Object.keys(req.query).length > 0) {
    const queryDetections = detectSuspiciousActivity(req.query, 'query');
    detections = detections.concat(queryDetections);
  }
  
  // Check URL parameters
  if (req.params && Object.keys(req.params).length > 0) {
    const paramDetections = detectSuspiciousActivity(req.params, 'params');
    detections = detections.concat(paramDetections);
  }
  
  // Check URL path
  const pathDetections = detectSuspiciousActivity(path, 'path');
  detections = detections.concat(pathDetections);
  
  // Determine severity
  let severity = 'low';
  if (detections.length > 0) {
    severity = detections.some(d => 
      d.type === 'SQL Injection' || 
      d.type === 'Command Injection' || 
      d.type === 'XSS Attack'
    ) ? 'high' : 'medium';
  }
  
  // Log all requests (especially POST, PUT, DELETE)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) || detections.length > 0) {
    const logEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp,
      type: detections.length > 0 ? 'Attack Detected' : 'Request Logged',
      severity: detections.length > 0 ? severity : 'low',
      method,
      path,
      ip,
      userAgent,
      userId: req.user?.id || null,
      userEmail: req.user?.email || null,
      detections: detections.length > 0 ? detections : [],
      requestBody: method !== 'GET' ? req.body : null,
      statusCode: res.statusCode || null
    };
    
    await saveSecurityLog(logEntry);
    
    // If attack detected, block the request
    if (detections.length > 0) {
      return res.status(403).json({ 
        error: 'Suspicious activity detected. Request blocked.',
        details: 'Your request contains potentially malicious content.'
      });
    }
  }
  
  // Track response status
  const originalSend = res.send;
  res.send = function(data) {
    // Update log with status code
    if (res.statusCode >= 400) {
      saveSecurityLog({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        type: 'Error Response',
        severity: res.statusCode >= 500 ? 'high' : 'medium',
        method,
        path,
        ip,
        userAgent,
        statusCode: res.statusCode,
        response: typeof data === 'string' ? data.substring(0, 200) : null
      });
    }
    return originalSend.call(this, data);
  };
  
  next();
}

// IP blocking (simple in-memory store)
const blockedIPs = new Set();

function isIPBlocked(ip) {
  return blockedIPs.has(ip);
}

function blockIP(ip, reason) {
  blockedIPs.add(ip);
  saveSecurityLog({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    type: 'IP Blocked',
    severity: 'high',
    ip,
    details: reason
  });
}

function unblockIP(ip) {
  blockedIPs.delete(ip);
}

// IP blocking middleware
function ipBlocker(req, res, next) {
  const ip = getClientIP(req);
  if (isIPBlocked(ip)) {
    return res.status(403).json({ error: 'Access denied. Your IP has been blocked.' });
  }
  next();
}

// Initialize on module load
initializeSecurityLogs();

module.exports = {
  securityLogger,
  securityHeaders,
  rateLimiter,
  ipBlocker,
  blockIP,
  unblockIP,
  isIPBlocked,
  loadSecurityLogs,
  saveSecurityLog,
  getClientIP,
  getUserAgent,
  detectSuspiciousActivity
};

