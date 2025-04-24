const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require('dotenv').config();

// Constants
const SALT_ROUNDS = 10;
const PORT = process.env.PORT || 8081;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 1000; // 24 hours in milliseconds

// URLs - Environment variables with fallbacks for local development
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8081';

// Google OAuth configuration
const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = `${BACKEND_URL}/auth/google/callback`;

// Database configuration
const dbConfig = {
  host: "sql7.freesqldatabase.com",
  user: "sql7775008",
  password: "85VfWdsNTQ",
  database: "sql7775008",
  port: "3306",
};

// Global error handlers for production environment
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application can continue running
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Give the server time to finish current requests before exiting
  setTimeout(() => {
    process.exit(1); // Process manager will restart the application
  }, 1000);
});

// Express app setup
const app = express();

// Middleware configuration
app.use(cors({
  origin: FRONTEND_URL,
  methods: ["GET", "POST", "DELETE"],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'] // Add this
}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  key: "email",
  secret: process.env.SESSION_SECRET || "changetosecureaftertesting",
  resave: true, // Change to true
  saveUninitialized: true, // Change to true
  cookie: {
    expires: new Date(Date.now() + COOKIE_MAX_AGE),
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax', // Add this
    secure: process.env.NODE_ENV === 'production' // Add this - true in production
  }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Create a better database connection pool with reconnection logic
function createDbPool() {
  const pool = mysql.createPool({
    ...dbConfig,
    connectionLimit: 10,
    queueLimit: 0,
    waitForConnections: true,
    acquireTimeout: 30000,
    connectTimeout: 30000
  });
  
  // Test the connection
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to database pool:', err);
      if (err.code === 'PROTOCOL_CONNECTION_LOST' || 
          err.code === 'ECONNREFUSED' || 
          err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
        console.log('Database connection issue. Server will continue and retry connections as needed.');
      }
      return;
    }
    
    console.log('Successfully connected to the database pool!');
    // Release the connection back to the pool
    connection.release();
    
    // Test query
    pool.query('SHOW TABLES', (err, results) => {
      if (err) {
        console.error('Error executing test query:', err);
      } else {
        console.log('Tables in the database:');
        console.log(results);
      }
    });
  });
  
  return pool;
}

// Use a pool instead of a single connection
const db = createDbPool();

// Add these helper functions for safer database operations
function executeQuery(query, params = [], callback) {
  db.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection from pool:', err);
      return callback(err);
    }
    
    connection.query(query, params, (error, results) => {
      // Always release the connection back to the pool
      connection.release();
      
      if (error) {
        console.error('Query error:', error, 'for query:', query);
      }
      
      callback(error, results);
    });
  });
}

// Promise-based version for async/await usage
function queryPromise(query, params = []) {
  return new Promise((resolve, reject) => {
    executeQuery(query, params, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

// Helper functions
const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// Passport configuration
passport.serializeUser((user, done) => {
  console.log("Serializing user:", user.email);
  done(null, user.email);
});

passport.deserializeUser((email, done) => {
  console.log("Deserializing user:", email);
  executeQuery(
    "SELECT * FROM personalInfo WHERE email = ?",
    [email],
    (err, users) => {
      if (err) {
        console.error("Deserialize error:", err);
        return done(err);
      }
      if (users && users.length > 0) {
        console.log("User found during deserialization");
        done(null, users[0]);
      } else {
        console.log("No user found during deserialization");
        done(null, false);
      }
    }
  );
});

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: clientID,
    clientSecret: clientSecret,
    callbackURL: GOOGLE_CALLBACK_URL,
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      
      // Check if user exists
      executeQuery(
        "SELECT * FROM personalInfo WHERE email = ?",
        [email],
        async (err, users) => {
          if (err) return done(err);
          
          if (users.length === 0) {
            // Create new user with Google data
            const name = profile.name.givenName;
            const surname = profile.name.familyName;
            
            // Insert into personalInfo with minimal data
            executeQuery(
              "INSERT INTO personalInfo (email, name, surname, password, oauth_provider) VALUES (?, ?, ?, ?, ?)",
              [email, name, surname, 'google-oauth-user', 'google'],
              (err) => {
                if (err) return done(err);
                
                // Insert into schoolInfo
                executeQuery(
                  "INSERT INTO schoolInfo (email) VALUE (?)",
                  [email],
                  (err) => {
                    if (err) return done(err);
                    
                    // Get the newly created user
                    executeQuery(
                      "SELECT * FROM personalInfo WHERE email = ?",
                      [email],
                      (err, newUsers) => {
                        if (err) return done(err);
                        return done(null, newUsers[0]);
                      }
                    );
                  }
                );
              }
            );
          } else {
            // Existing user, return the user
            return done(null, users[0]);
          }
        }
      );
    } catch (error) {
      return done(error);
    }
  }
));

// Authentication middleware
const checkAuth = (req, res, next) => {
  console.log("checkAuth middleware running");
  
  // Check both Passport and session authentication format
  if (req.isAuthenticated && req.isAuthenticated()) {
    console.log("User authenticated via Passport");
    next();
  } else if (req.session && req.session.user) {
    console.log("User found in session");
    next();
  } else if (req.session && req.session.passport && req.session.passport.user) {
    // Add this check for passport serialized format
    console.log("User found in passport session");
    // Fetch the user data to populate req.user
    executeQuery(
      "SELECT * FROM personalInfo WHERE email = ?",
      [req.session.passport.user],
      (err, users) => {
        if (err || !users.length) {
          console.log("Failed to fetch user from passport session");
          res.json({ loggedIn: false });
          return;
        }
        req.user = users[0];
        next();
      }
    );
  } else {
    console.log("No authenticated user found");
    res.json({ loggedIn: false });
  }
};

app.get("/", (req, res) => {
  res.send("we are live" + BACKEND_URL);
});

// Google OAuth routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// In your Google OAuth callback endpoint
app.get('/auth/google/callback', 
  (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
      if (err) {
        console.error("Error during Google authentication:", err);
        return res.redirect(`${FRONTEND_URL}/login?error=server`);
      }
      
      if (!user) {
        console.log("Authentication failed:", info);
        return res.redirect(`${FRONTEND_URL}/login?error=auth`);
      }
      
      req.logIn(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.redirect(`${FRONTEND_URL}/login?error=login`);
        }
        
        // Set session info
        req.session.user = [user];
        
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.redirect(`${FRONTEND_URL}/login?error=session`);
          }
          
          console.log("Session saved successfully");
          console.log("Session after:", req.session);
          
          res.cookie('auth_test', 'true', { 
            maxAge: 900000,
            httpOnly: false
          });
          
          res.redirect(`${FRONTEND_URL}/auth-success`);
        });
      });
    })(req, res, next);
  }
);

// In your Express backend
app.get('/auth/status', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated() || (req.session && req.session.user)) {
    // Return user info without sensitive data
    const user = req.user || req.session.user[0];
    res.json({ 
      authenticated: true, 
      user: {
        id: user.id,
        name: user.displayName || user.name,
        email: user.email,
        // other non-sensitive user data
      } 
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Add this to your server.js
app.get('/auth/check', (req, res) => {
  console.log('Session:', req.session);
  console.log('User:', req.user);
  console.log('Session user:', req.session.user);
  console.log('Authenticated:', req.isAuthenticated && req.isAuthenticated());
  
  res.json({
    sessionExists: !!req.session,
    sessionUser: req.session.user ? true : false,
    passportUser: req.user ? true : false,
    isAuthenticated: req.isAuthenticated && req.isAuthenticated()
  });
});

// Existing routes
app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    const hash = await hashPassword(password);

    // Insert into personalInfo
    executeQuery("INSERT INTO personalInfo (email, password, oauth_provider) VALUES (?, ?, ?)", 
      [email, hash, 'local'], 
      (err, data) => {
        if (err) return res.status(500).json("Error creating user");
        
        // Insert into schoolInfo
        executeQuery("INSERT INTO schoolInfo (email) VALUE (?)",
          [email],
          (err) => {
            if (err) return res.status(500).json("Error creating school info");
            res.json(data);
          }
        );
    });
  } catch (error) {
    res.status(500).json("Server error during signup");
  }
});

app.get("/UserData", (req, res) => {
  console.log("UserData endpoint hit");
  console.log("Session data:", req.session);
  console.log("User in request:", req.user);
  console.log("Passport in session:", req.session.passport);
  
  // First try passport-based auth
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    console.log("Using passport user:", req.user);
    return res.json({
      loggedIn: true,
      user: [{
        id: req.user.id || '',
        name: req.user.name || '',
        email: req.user.email || '',
        institution: req.user.institution || req.user.school || '',
        avatar: req.user.avatar || '',
      }]
    });
  }
  
  // Then try session-based auth
  if (req.session && req.session.user) {
    console.log("Using session user:", req.session.user);
    return res.json({
      loggedIn: true, 
      user: req.session.user.map(user => ({
        id: user.id || '',
        name: user.name || '',
        email: user.email || '',
        institution: user.institution || user.school || '',
        avatar: user.avatar || '',
      }))
    });
  }
  
  // Finally try passport session directly
  if (req.session && req.session.passport && req.session.passport.user) {
    console.log("Found passport session, fetching user data");
    return executeQuery(
      "SELECT * FROM personalInfo WHERE email = ?",
      [req.session.passport.user],
      (err, users) => {
        if (err || !users.length) {
          console.log("Failed to fetch user from passport session");
          return res.json({ loggedIn: false });
        }
        
        const user = users[0];
        return res.json({
          loggedIn: true,
          user: [{
            id: user.id || '',
            name: user.name || '',
            email: user.email || '',
            institution: user.institution || user.school || '',
            avatar: user.avatar || '',
          }]
        });
      }
    );
  }
  
  console.log("No user data found");
  return res.json({ loggedIn: false });
});

app.get("/MainContainer", checkAuth, (req, res) => {
  const userData = req.session.user || (req.user ? [req.user] : null);
  res.json({ loggedIn: true, user: userData });
});

app.post("/MainContainer", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    executeQuery(
      "SELECT * FROM personalInfo WHERE email = ? AND oauth_provider = 'local'",
      [email],
      async (err, data) => {
        if (err) return res.status(500).json("Database error");
        if (data.length === 0) return res.json("Fail");
        
        const isValid = await comparePassword(password, data[0].password);
        if (isValid) {
          // Store user data in session
          req.session.user = data;
          // Make sure to save the session before responding
          req.session.save((err) => {
            if (err) {
              console.error("Session save error:", err);
              return res.status(500).json("Session error");
            }
            res.json(data);
          });
        } else {
          res.json("Fail");
        }
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json("Server error during login");
  }
});

// Project routes
app.post("/api/projects/create", checkAuth, (req, res) => {
  const {
    title,
    description,
    researchGoals,
    researchArea,
    startDate,
    endDate,
    fundingAvailable,
    fundingAmount,
    collaboratorsNeeded,
    collaboratorRoles,
    institution,
    contactEmail
  } = req.body;

  // Get user email from session or passport
  const userEmail = req.user ? req.user.email : req.session.user[0].email;
  
  if (!userEmail) {
    return res.json({ success: false, message: "User not authenticated" });
  }

  // Validate required fields
  if (!title || !description || !researchGoals || !researchArea || !startDate || !endDate) {
    return res.json({ 
      success: false, 
      message: "Missing required fields" 
    });
  }

  // Insert into projects table
  executeQuery(
    `INSERT INTO projects (
      creator_email, 
      title, 
      description, 
      research_goals, 
      research_area, 
      start_date, 
      end_date, 
      funding_available, 
      funding_amount, 
      collaborators_needed, 
      collaborator_roles, 
      institution, 
      contact_email
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userEmail,
      title,
      description,
      researchGoals,
      researchArea,
      startDate,
      endDate,
      fundingAvailable,
      fundingAmount || null,
      collaboratorsNeeded,
      collaboratorRoles || null,
      institution || null,
      contactEmail || userEmail
    ],
    (err, result) => {
      if (err) {
        console.error("Project creation error:", err);
        return res.json({ 
          success: false, 
          message: "Error creating project"
        });
      }
      
      return res.json({ 
        success: true, 
        message: "Project created successfully",
        projectId: result.insertId
      });
    }
  );
});

// Get user's projects
app.get("/api/projects/user", checkAuth, (req, res) => {
  const userEmail = req.user ? req.user.email : req.session.user[0].email;
  
  if (!userEmail) {
    return res.json({ success: false, message: "User not authenticated" });
  }

  executeQuery(
    "SELECT * FROM projects WHERE creator_email = ? ORDER BY created_at DESC",
    [userEmail],
    (err, results) => {
      if (err) {
        console.error("Error fetching projects:", err);
        return res.json({ 
          success: false, 
          message: "Error fetching projects"
        });
      }
      
      return res.json({ 
        success: true, 
        projects: results
      });
    }
  );
});

// Get project by ID
app.get("/api/projects/:id", checkAuth, (req, res) => {
  const projectId = req.params.id;
  
  executeQuery(
    "SELECT * FROM projects WHERE id = ?",
    [projectId],
    (err, results) => {
      if (err) {
        console.error("Error fetching project:", err);
        return res.json({ 
          success: false, 
          message: "Error fetching project details"
        });
      }
      
      if (results.length === 0) {
        return res.json({
          success: false,
          message: "Project not found"
        });
      }
      
      return res.json({ 
        success: true, 
        project: results[0]
      });
    }
  );
});

// Get all projects (for project discovery)
app.get("/api/projects", checkAuth, (req, res) => {
  // Optional filtering by research area
  const { area } = req.query;
  
  let query = "SELECT * FROM projects";
  let params = [];
  
  if (area) {
    query += " WHERE research_area = ?";
    params.push(area);
  }
  
  query += " ORDER BY created_at DESC";
  
  executeQuery(query, params, (err, results) => {
    if (err) {
      console.error("Error fetching projects:", err);
      return res.json({ 
        success: false, 
        message: "Error fetching projects" 
      });
    }
    
    return res.json({ 
      success: true, 
      projects: results 
    });
  });
});

app.post('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { 
      return res.status(500).json({ message: 'Could not log out, please try again' });
    }
    
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Could not log out, please try again' });
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: 'Logged out successfully' });
    });
  });
});

// Add a test-session endpoint for debugging
app.get('/test-session', (req, res) => {
  console.log("Session in test:", req.session);
  
  if (!req.session.testValue) {
    req.session.testValue = Date.now();
    console.log("Setting new test value:", req.session.testValue);
  } else {
    console.log("Existing test value:", req.session.testValue);
  }
  
  res.json({ 
    sessionExists: !!req.session,
    testValue: req.session.testValue,
    passportUser: req.user || null
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).send('Something went wrong with the server');
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  console.log('Received kill signal, shutting down gracefully');
  server.close(() => {
    console.log('Closed out remaining connections');
    // Close database connection
    if (db) {
      db.end();
    }
    process.exit(0);
  });

  // If server hasn't finished in 30 seconds, shut down forcefully
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
}