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

// 2. CORS Middleware Configure (Routes se pehle lagana zaroori hai)
app.use(cors({
    origin: ['http://localhost:3002', 'http://127.0.0.1:3002', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
}));

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
    console.log(`Server running on http://localhost:${port}`);
});