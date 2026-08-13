const jwt = require("jsonwebtoken");

const tokenValidation = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Authorization header missing
    if (!authHeader) {
      return res.status(401).json({
        message: "Authorization token is required"
      });
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        message: "Invalid authorization format"
      });
    }

    const token = parts[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Store decoded information in request
    req.admin = decoded;

    next();

  } catch (error) {

    console.error("Token validation error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};

module.exports = tokenValidation;