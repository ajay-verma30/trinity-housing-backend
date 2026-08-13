const pool = require("../db/conn");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");


// Generate random refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};


// Hash refresh token before storing it in DB
const hashRefreshToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)  
    .digest("hex");
};


// --------------------------------
// Shared cookie options for the refresh token cookie
// --------------------------------

const REFRESH_COOKIE_NAME = "refreshToken";

const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // requires HTTPS in prod
  sameSite: "strict",
  maxAge: REFRESH_COOKIE_MAX_AGE_MS
});


// POST /api/admin/create
const createAdmin = async (req, res) => {

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, email and password are required"
    });
  }

  try {

    // Check if admin already exists
    const existingAdmin = await pool.query(
      `
      SELECT id
      FROM admin
      WHERE email = $1
      `,
      [email]
    );

    if (existingAdmin.rows.length > 0) {
      return res.status(409).json({
        message: "Admin already exists"
      });
    }


    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);


    // Create admin
    await pool.query(
      `
      INSERT INTO admin
      (
        name,
        email,
        password_hash
      )
      VALUES
      ($1, $2, $3)
      `,
      [
        name,
        email,
        passwordHash
      ]
    );


    res.status(201).json({
      message: "Admin created successfully"
    });

  } catch (error) {

    console.error("Create admin error:", error);

    res.status(500).json({
      message: "Failed to create admin"
    });
  }
};


// POST /api/admin/login
const loginAdmin = async (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required"
    });
  }

  try {

    // Find admin
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        password_hash
      FROM admin
      WHERE email = $1
      `,
      [email]
    );


    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }


    const admin = result.rows[0];


    // Compare plaintext password with bcrypt hash
    const passwordMatch = await bcrypt.compare(
      password,
      admin.password_hash
    );


    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }


    // --------------------------------
    // Generate Access Token
    // --------------------------------

    const accessToken = jwt.sign(
      {
        adminId: admin.id,
        email: admin.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m"
      }
    );


    // --------------------------------
    // Generate Refresh Token
    // --------------------------------

    const refreshToken = generateRefreshToken();

    const refreshTokenHash = hashRefreshToken(
      refreshToken
    );


    // Refresh token valid for 30 days
    const refreshTokenExpiry = new Date();

    refreshTokenExpiry.setDate(
      refreshTokenExpiry.getDate() + 30
    );


    // Store only the HASH of refresh token
    await pool.query(
      `
      INSERT INTO admin_refresh_tokens
      (
        admin_id,
        token_hash,
        expires_at
      )
      VALUES
      ($1, $2, $3)
      `,
      [
        admin.id,
        refreshTokenHash,
        refreshTokenExpiry
      ]
    );


    // Set refresh token as httpOnly cookie — never expose it
    // in the response body, so client-side JS (and therefore
    // an XSS payload) can't read it.
    res.cookie(
      REFRESH_COOKIE_NAME,
      refreshToken,
      getRefreshCookieOptions()
    );


    // Return only the access token in the body
    res.status(200).json({
      message: "Login successful",

      accessToken
    });

  } catch (error) {

    console.error("Admin login error:", error);

    res.status(500).json({
      message: "Failed to login"
    });
  }
};


// POST /api/admin/refresh
const refreshAdminToken = async (req, res) => {

  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

  if (!refreshToken) {
    return res.status(401).json({
      message: "Refresh token is required"
    });
  }

  try {

    // Hash received refresh token
    const tokenHash = hashRefreshToken(
      refreshToken
    );


    // Find refresh token
    const result = await pool.query(
      `
      SELECT
        rt.id,
        rt.admin_id,
        rt.expires_at,
        rt.revoked_at,

        a.email

      FROM admin_refresh_tokens rt

      JOIN admin a
        ON rt.admin_id = a.id

      WHERE rt.token_hash = $1
      `,
      [tokenHash]
    );


    if (result.rows.length === 0) {
      res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());

      return res.status(401).json({
        message: "Invalid refresh token"
      });
    }


    const storedToken = result.rows[0];


    // Check if token was revoked
    if (storedToken.revoked_at) {
      res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());

      return res.status(401).json({
        message: "Refresh token has been revoked"
      });
    }


    // Check if token expired
    if (
      new Date(storedToken.expires_at) <= new Date()
    ) {
      res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());

      return res.status(401).json({
        message: "Refresh token has expired"
      });
    }


    // --------------------------------
    // Revoke old refresh token
    // --------------------------------

    await pool.query(
      `
      UPDATE admin_refresh_tokens
      SET revoked_at = NOW()
      WHERE id = $1
      `,
      [storedToken.id]
    );


    // --------------------------------
    // Generate new Access Token
    // --------------------------------

    const accessToken = jwt.sign(
      {
        adminId: storedToken.admin_id,
        email: storedToken.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m"
      }
    );


    // --------------------------------
    // Generate new Refresh Token
    // --------------------------------

    const newRefreshToken = generateRefreshToken();

    const newRefreshTokenHash = hashRefreshToken(
      newRefreshToken
    );


    const newRefreshTokenExpiry = new Date();

    newRefreshTokenExpiry.setDate(
      newRefreshTokenExpiry.getDate() + 30
    );


    // Store new refresh token hash
    await pool.query(
      `
      INSERT INTO admin_refresh_tokens
      (
        admin_id,
        token_hash,
        expires_at
      )
      VALUES
      ($1, $2, $3)
      `,
      [
        storedToken.admin_id,
        newRefreshTokenHash,
        newRefreshTokenExpiry
      ]
    );


    // Rotate the cookie with the new refresh token
    res.cookie(
      REFRESH_COOKIE_NAME,
      newRefreshToken,
      getRefreshCookieOptions()
    );


    res.status(200).json({
      accessToken
    });

  } catch (error) {

    console.error("Refresh token error:", error);

    res.status(500).json({
      message: "Failed to refresh access token"
    });
  }
};


// POST /api/admin/logout
const logoutAdmin = async (req, res) => {

  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

  try {

    if (refreshToken) {

      const tokenHash = hashRefreshToken(refreshToken);

      // Revoke it server-side so it can't be replayed
      await pool.query(
        `
        UPDATE admin_refresh_tokens
        SET revoked_at = NOW()
        WHERE token_hash = $1
          AND revoked_at IS NULL
        `,
        [tokenHash]
      );
    }

    res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());

    res.status(200).json({
      message: "Logged out successfully"
    });

  } catch (error) {

    console.error("Logout error:", error);

    // Clear the cookie even if the DB update fails —
    // the client should still be logged out locally.
    res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());

    res.status(500).json({
      message: "Failed to logout cleanly"
    });
  }
};


module.exports = {
  createAdmin,
  loginAdmin,
  refreshAdminToken,
  logoutAdmin
};