const prisma = require("../config/database")

const auditLogger = async (req, res, next) => {
  // Skip logging for health checks and static assets
  if (req.path.includes("/health") || req.path.includes("/favicon")) {
    return next()
  }

  // Store original end function
  const originalEnd = res.end

  // Override end function to log after response
  res.end = function (chunk, encoding) {
    // Call original end function
    originalEnd.call(this, chunk, encoding)

    // Log the request (async, don't block response)
    setImmediate(async () => {
      try {
        await prisma.auditLog.create({
          data: {
            userId: req.user?.id || null,
            action: `${req.method}_${req.route?.path || req.path}`,
            resource: req.route?.path || req.path,
            ipAddress: req.ip,
            userAgent: req.get("User-Agent"),
            success: res.statusCode < 400,
            errorMessage: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null,
            metadata: {
              method: req.method,
              statusCode: res.statusCode,
              responseTime: Date.now() - req.startTime,
            },
          },
        })
      } catch (error) {
        console.error("Audit logging error:", error)
      }
    })
  }

  // Store request start time
  req.startTime = Date.now()

  next()
}

module.exports = auditLogger
