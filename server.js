const express = require('express');
const cors = require('cors'); 
const cookieParser = require("cookie-parser");
const app = express();
require('dotenv').config();

const builderRoutes = require("./routes/builderRoutes");
const projectRoutes = require("./routes/projectRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const inquiryRoutes = require("./routes/inquiryRoutes");
const adminRoutes = require("./routes/adminRoutes");
const propertyImageRoutes = require("./routes/propertyImageRoutes");

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3002',
  'https://trinity-housing-userend-obh8.vercel.app' 
];

// 2. CORS Middleware Configure
app.use(cors({
    origin: function (origin, callback) {
      // Postman / server-to-server requests allow karne ke liye (!origin)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Preflight OPTIONS handling
app.options('*', cors());

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/builders", builderRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/properties", propertyImageRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});