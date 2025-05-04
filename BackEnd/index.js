import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import passport from 'passport';
import session from 'express-session';
import authRoutes from './Authentication/RouteA.js';
import userRoutes from './Api/Routes/UserR.js';
import notificationRoutes from './Api/Routes/NotificationR.js';
import createprojectRoutes from './Api/Routes/ProjectR.js';
import collaboratorRoutes from './Api/Routes/CollaboratorR.js';
import messageRoutes from './Api/Routes/MessageR.js';
import './Authentication/passport.js';
import { fileURLToPath } from 'url';
import cors from 'cors';


const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8081';

const app = express();
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB Connection "3ev5Likg9xKEey0Q"
const mongoURI = 'mongodb+srv://phuthigab:3ev5Likg9xKEey0Q@rcluster.fgc7eum.mongodb.net/?retryWrites=true&w=majority&appName=RCluster'; 
mongoose.connect(mongoURI, {
  serverSelectionTimeoutMS: 50000 
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());

// Session Setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
}));

// Passport Init
app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/createproject', createprojectRoutes);
app.use('/api/collaborator', collaboratorRoutes);
app.use('/api/message', messageRoutes);


app.get('/',  (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get("/", (req, res) => {
  res.send("we are live" + BACKEND_URL);
});

// Start Server
const port = process.env.PORT || 8081;
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
