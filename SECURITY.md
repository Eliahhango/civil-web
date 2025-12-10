# Security Features Documentation

## Overview

This application includes comprehensive security features to protect against various types of attacks and monitor suspicious activity.

## Security Features Implemented

### 1. Attack Detection
The system automatically detects and blocks:
- **SQL Injection**: Detects SQL injection patterns in requests
- **XSS (Cross-Site Scripting)**: Detects script injection attempts
- **Path Traversal**: Prevents directory traversal attacks
- **Command Injection**: Detects shell command injection attempts
- **NoSQL Injection**: Protects against NoSQL injection attacks

### 2. Rate Limiting
- **Default**: 100 requests per 15 minutes per IP
- Automatically blocks excessive requests
- Logs rate limit violations

### 3. Security Headers
The following security headers are automatically added to all responses:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`
- `Content-Security-Policy`
- `Referrer-Policy`
- `Permissions-Policy`

### 4. Input Validation
All user inputs are validated and sanitized:
- Email format validation
- Password strength requirements
- Username format validation
- Text input sanitization (XSS prevention)
- URL validation for image fields
- Length limits on all text fields

### 5. IP Blocking
- Manual IP blocking from admin panel
- Automatic blocking for repeated attacks
- IP unblocking capability

### 6. Security Logging
All security events are logged:
- Attack attempts
- Rate limit violations
- Error responses
- All POST, PUT, DELETE requests
- IP addresses and user agents
- Request details and timestamps

### 7. Request Size Limits
- Maximum request body size: 10MB
- Prevents DoS attacks via large payloads

## Admin Security Panel

Access the security monitoring panel from the Admin Dashboard:

### Features:
1. **Security Statistics Dashboard**
   - Total security events
   - Events in last 24 hours
   - High severity alerts
   - Attack count

2. **Security Logs**
   - Real-time security event logs
   - Filter by severity (High, Medium, Low)
   - Filter by event type
   - View request details
   - Block IPs directly from logs

3. **IP Management**
   - View top attacking IPs
   - Block suspicious IPs
   - Unblock IPs

## API Endpoints

### Security Logs (Admin Only)
- `GET /api/security/logs` - Get security logs
  - Query params: `limit`, `offset`, `severity`, `type`
- `GET /api/security/stats` - Get security statistics
- `POST /api/security/block-ip` - Block an IP address
- `POST /api/security/unblock-ip` - Unblock an IP address

## Security Best Practices

1. **Change Default Credentials**: Always change default admin credentials in production
2. **Use Strong JWT Secret**: Set a strong `JWT_SECRET` in environment variables
3. **Enable HTTPS**: Use HTTPS in production
4. **Regular Monitoring**: Check security logs regularly
5. **Update Dependencies**: Keep all dependencies up to date
6. **Environment Variables**: Never commit sensitive data to version control

## Configuration

### Environment Variables
```env
PORT=5000
JWT_SECRET=your-strong-secret-key-here
FRONTEND_URL=http://localhost:3000
```

### Rate Limiting Configuration
Edit `server/middleware/security.js` to adjust rate limits:
```javascript
rateLimiter(windowMs, maxRequests)
```

## Security Log Storage

Security logs are stored in:
- `server/data/security-logs.json`
- Maximum 1000 logs (oldest are automatically removed)
- Logs include full request details for investigation

## Attack Response

When an attack is detected:
1. Request is immediately blocked (403 Forbidden)
2. Event is logged with full details
3. IP address is recorded
4. Admin is notified via security panel
5. Repeated attacks from same IP may trigger automatic blocking

## Monitoring Recommendations

1. **Daily Checks**: Review high-severity events daily
2. **Weekly Reviews**: Analyze attack patterns weekly
3. **IP Blocking**: Block persistent attackers
4. **Log Analysis**: Investigate suspicious patterns
5. **Update Rules**: Adjust detection patterns based on false positives

## Support

For security concerns or questions, contact the development team.

