const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const adminUploadLimiter = rateLimit({

  windowMs: 10 * 60 * 1000,

  limit: 10,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  keyGenerator: (req) => {
    if (req.admin && req.admin.adminId) {
      return `admin:${req.admin.adminId}`;
    }
    return ipKeyGenerator(req.ip);
  },

  message: {
    message: "Too many upload requests. Please try again later."
  }

});


module.exports = {
  adminUploadLimiter
};