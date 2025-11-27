const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv").config();
const { PORT, CLIENT_URLS } = require('./config/appConfig');
const dbConnect = require('./config/dbconnect.js');
const authRoutes = require("./routes/authRoutes.js");
const userRouter = require("./routes/userRoute.js");
const departmentRouter = require("./routes/department.js");
const employeeRouter = require("./routes/employee.js");
const leavRouter = require("./routes/leave.js");
const attendanceRouter = require("./routes/attendance.js");
const adminRouter = require("./routes/admin.js");


dbConnect();

//middleware
const app = express();

// CORS configuration optimized for Vercel
const corsOptions = {
    origin: function(origin, callback) {
        console.log('CORS request from origin:', origin);
        console.log('Allowed origins:', CLIENT_URLS);
        
        // Allow requests with no origin (like mobile apps, Postman, or curl)
        if (!origin) {
            return callback(null, true);
        }
        
        // Check if origin is allowed
        if (CLIENT_URLS.includes(origin)) {
            return callback(null, true);
        }
        
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    optionsSuccessStatus: 200,
    preflightContinue: false,
    maxAge: 86400 // Cache preflight requests for 24 hours
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('/*', cors(corsOptions));

app.use(express.json());

// Serve static files from public/uploads directory
app.use('/uploads', express.static('public/uploads'));


//routes
app.use("/", (req, res) => {
    res.send("server is running...");
});
app.use("/api/auth", authRoutes);
app.use("/api/users", userRouter);
app.use("/api/department", departmentRouter);
app.use("/api/employee", employeeRouter);
app.use("/api/leave", leavRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/admin', adminRouter);

// Auto-generate daily QR token at midnight (server local time)
const QRToken = require('./models/qrToken');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// helper: today's date string in local timezone
const todayString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

async function generateDailyTokenIfMissing(){
    try {
        const date = todayString();
        const existing = await QRToken.findOne({ date });
        if (existing) {
            console.log('Daily QR token already exists for', date);
            return;
        }
        const raw = crypto.randomBytes(32).toString('hex');
        const doc = new QRToken({ token: raw, date });
        await doc.save();
        const signed = jwt.sign({ t: raw, d: date }, process.env.JWT_SECRET || 'secret');
        console.log('Generated daily QR token for', date);
        // If you want to broadcast or persist the signed token someplace, add that here.
    } catch (err) {
        console.error('Failed to generate daily QR token', err);
    }
}

// schedule first run at next midnight then every 24h
function scheduleDailyGeneration(){
    const now = new Date();
    const next = new Date(now);
    next.setHours(24,0,5,0); // a few seconds after midnight
    const ms = next.getTime() - now.getTime();
    console.log('Scheduling daily QR generation in', ms, 'ms');
    setTimeout(async () => {
        await generateDailyTokenIfMissing();
        setInterval(generateDailyTokenIfMissing, 24*60*60*1000);
    }, ms);
}

// start schedule (don't block startup)
generateDailyTokenIfMissing().catch(console.error).finally(scheduleDailyGeneration);


//run server
app.listen(PORT, () => {
    console.log(`Server running at port: ${PORT}`);
    console.log('CORS allowed origins:', CLIENT_URLS.join(', '));
});