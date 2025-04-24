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
  credentials: true
}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  key: "email",
  secret: process.env.SESSION_SECRET || "changetosecureaftertesting",
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: new Date(Date.now() + COOKIE_MAX_AGE),
    maxAge: COOKIE_MAX_AGE,
  }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Create a function to handle database connection and reconnection
function connectToDb() {
  const db = mysql.createConnection(dbConfig);

  db.connect((err) => {
    if (err) {
      console.error('Error connecting to the database:', err);
      console.log('Retrying connection in 5 seconds...');
      setTimeout(connectToDb, 5000);
      return;
    }
    
    console.log('Successfully connected to the database!');
    
    // Test query
    db.query('SHOW TABLES', (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
      } else {
        console.log('Tables in the database:');
        console.log(results);
      }
    });
  });

  // Handle connection errors
  db.on('error', (err) => {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || 
        err.code === 'ECONNRESET' ||
        err.code === 'ETIMEDOUT') {
      console.log('Lost connection to MySQL. Reconnecting...');
      return connectToDb();
    } else {
      throw err;
    }
  });

  return db;
}

// Database connection
const db = connectToDb();

// Helper functions
const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// Passport configuration
passport.serializeUser((user, done) => {
  done(null, user.email);
});

passport.deserializeUser((email, done) => {
  db.query(
    "SELECT * FROM personalInfo WHERE email = ?",
    [email],
    (err, users) => {
      if (err) return done(err);
      if (users && users.length > 0) {
        done(null, users[0]);
      } else {
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
      db.query(
        "SELECT * FROM personalInfo WHERE email = ?",
        [email],
        async (err, users) => {
          if (err) return done(err);
          
          if (users.length === 0) {
            // Create new user with Google data
            const name = profile.name.givenName;
            const surname = profile.name.familyName;
            
            // Insert into personalInfo with minimal data
            db.query(
              "INSERT INTO personalInfo (email, name, surname, password, oauth_provider) VALUES (?, ?, ?, ?, ?)",
              [email, name, surname, 'google-oauth-user', 'google'],
              (err) => {
                if (err) return done(err);
                
                // Insert into schoolInfo
                db.query(
                  "INSERT INTO schoolInfo (email) VALUE (?)",
                  [email],
                  (err) => {
                    if (err) return done(err);
                    
                    // Get the newly created user
                    db.query(
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
  if (req.session.user || req.isAuthenticated()) {
    next();
  } else {
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

app.get('/auth/google/callback', 
  passport.authenticate('google', {    
    failureRedirect: `${FRONTEND_URL}/login`  
  }),
  (req, res) => {
    console.log("hi there");
    req.session.user = [req.user];
    
    // Redirect to auth success page instead
    res.redirect(`${FRONTEND_URL}/auth-success`);
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
    db.query("INSERT INTO personalInfo (email, password, oauth_provider) VALUES (?, ?, ?)", 
      [email, hash, 'local'], 
      (err, data) => {
        if (err) return res.status(500).json("Error creating user");
        
        // Insert into schoolInfo
        db.query("INSERT INTO schoolInfo (email) VALUE (?)",
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

// Update the UserData route to return data in the format expected by the frontend
app.get("/UserData", checkAuth, (req, res) => {
  // Handle both passport and session authentication
  const userData = req.session.user || (req.user ? [req.user] : null);
  
  if (!userData) {
    return res.json({ loggedIn: false });
  }
  
  // Format user data for frontend
  const formattedUser = {
    loggedIn: true,
    user: userData.map(user => ({
      id: user.id || '',
      name: user.name || '',
      email: user.email || '',
      institution: user.institution || user.school || '',  // Adapt based on your database fields
      avatar: user.avatar || '',
    }))
  };
  
  res.json(formattedUser);
});

app.get("/MainContainer", checkAuth, (req, res) => {
  const userData = req.session.user || (req.user ? [req.user] : null);
  res.json({ loggedIn: true, user: userData });
});

app.post("/MainContainer", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    db.query(
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
  db.query(
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

  db.query(
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
  
  db.query(
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
  
  db.query(query, params, (err, results) => {
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