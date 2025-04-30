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
// Database configuration
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "fundme",
};

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
  secret: "changetosecureaftertesting",
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

// Database connection
const db = mysql.createConnection(dbConfig);

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
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
    
    // Close the db
    // db.end((err) => {
    //   if (err) {
    //     console.error('Error closing connection:', err);
    //   } else {
    //     console.log('Connection closed successfully.');
    //   }
    // });
  });
});

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
      done(null, users[0]);
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
      // Successful authentication
      // Store user in session for compatibility with existing code
      req.session.user = [req.user];
      
      // Redirect to dashboard after successful login
      res.redirect(`${FRONTEND_URL}/collaboratordashboard`);
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
// Get collaborations for the current user
app.get("/api/collaborations", checkAuth, (req, res) => {
  const userEmail = req.user ? req.user.email : req.session.user[0].email;
  
  if (!userEmail) {
    return res.json({ success: false, message: "User not authenticated" });
  }

  // Query projects where the user is a collaborator
  db.query(
    `SELECT p.*, c.role, c.status 
     FROM projects p 
     JOIN collaborators c ON p.id = c.project_id 
     WHERE c.collaborator_email = ?
     ORDER BY p.created_at DESC`,
    [userEmail],
    (err, results) => {
      if (err) {
        console.error("Error fetching collaborations:", err);
        return res.json({ 
          success: false, 
          message: "Error fetching collaborations"
        });
      }
      
      return res.json({ 
        success: true, 
        projects: results
      });
    }
  );
});

// Get matching opportunities for the current user
app.get("/api/opportunities", checkAuth, (req, res) => {
  const userEmail = req.user ? req.user.email : req.session.user[0].email;
  
  if (!userEmail) {
    return res.json({ success: false, message: "User not authenticated" });
  }

  // Optional query parameters for filtering
  const { area, institution, matchThreshold } = req.query;
  
  // First, get user's skills
  db.query(
    `SELECT research_areas, technical_skills 
     FROM researcher_skills 
     WHERE email = ?`,
    [userEmail],
    (err, userSkills) => {
      if (err) {
        console.error("Error fetching user skills:", err);
        return res.json({ 
          success: false, 
          message: "Error fetching user skills"
        });
      }
      
      // Build filter conditions for the query
      let conditions = [];
      let params = [];
      
      if (area) {
        conditions.push("p.research_area = ?");
        params.push(area);
      }
      
      if (institution) {
        conditions.push("p.institution = ?");
        params.push(institution);
      }
      
      // Filter projects where user is not already a collaborator
      const whereClause = conditions.length > 0 
        ? `WHERE ${conditions.join(" AND ")} AND p.id NOT IN (SELECT project_id FROM collaborators WHERE collaborator_email = ?)`
        : `WHERE p.id NOT IN (SELECT project_id FROM collaborators WHERE collaborator_email = ?)`;
      
      params.push(userEmail);
      
      // Query projects with potential opportunities
      db.query(
        `SELECT p.*, 
          p.creator_email != ? AS is_opportunity,
          DATE_FORMAT(p.created_at, '%Y-%m-%d') AS formatted_date
         FROM projects p
         ${whereClause}
         AND p.collaborators_needed = true
         ORDER BY p.created_at DESC`,
        params,
        (err, results) => {
          if (err) {
            console.error("Error fetching opportunities:", err);
            return res.json({ 
              success: false, 
              message: "Error fetching opportunities"
            });
          }
          
          // If we have user skills, calculate match scores
          if (userSkills && userSkills.length > 0) {
            const userAreas = JSON.parse(userSkills[0].research_areas || '[]');
            const userTechSkills = JSON.parse(userSkills[0].technical_skills || '[]');
            
            // Calculate match score for each opportunity
            results = results.map(opportunity => {
              let matchScore = 0;
              let totalFactors = 0;
              
              // Match research area
              if (userAreas.includes(opportunity.research_area)) {
                matchScore += 50;
                totalFactors += 1;
              }
              
              // Match technical skills against required roles
              if (opportunity.collaborator_roles && userTechSkills.length > 0) {
                const requiredRoles = opportunity.collaborator_roles.split(',').map(role => role.trim().toLowerCase());
                const matchingSkills = userTechSkills.filter(skill => 
                  requiredRoles.some(role => role.includes(skill.toLowerCase()))
                );
                
                if (matchingSkills.length > 0) {
                  matchScore += Math.min(50, (matchingSkills.length / requiredRoles.length) * 50);
                  totalFactors += 1;
                }
              }
              
              // Calculate final score (default to 0 if no factors matched)
              const finalScore = totalFactors > 0 ? Math.round(matchScore / totalFactors) : 0;
              
              return {
                ...opportunity,
                matchScore: finalScore,
                skills_needed: opportunity.collaborator_roles ? 
                  opportunity.collaborator_roles.split(',').map(role => role.trim()) : []
              };
            });
            
            // Filter by match threshold if specified
            if (matchThreshold) {
              results = results.filter(opp => opp.matchScore >= parseInt(matchThreshold));
            }
            
            // Sort by match score (highest first)
            results.sort((a, b) => b.matchScore - a.matchScore);
          }
          
          return res.json({ 
            success: true, 
            opportunities: results
          });
        }
      );
    }
  );
});

// Apply to a project/opportunity
app.post("/api/opportunities/:id/apply", checkAuth, (req, res) => {
  const projectId = req.params.id;
  const userEmail = req.user ? req.user.email : req.session.user[0].email;
  const { message, role } = req.body;
  
  if (!userEmail) {
    return res.json({ success: false, message: "User not authenticated" });
  }
  
  // Check if project exists
  db.query(
    "SELECT * FROM projects WHERE id = ?",
    [projectId],
    (err, projects) => {
      if (err) {
        console.error("Error checking project:", err);
        return res.json({ 
          success: false, 
          message: "Error processing application"
        });
      }
      
      if (projects.length === 0) {
        return res.json({
          success: false,
          message: "Project not found"
        });
      }
      
      // Check if user already applied
      db.query(
        "SELECT * FROM applications WHERE project_id = ? AND applicant_email = ?",
        [projectId, userEmail],
        (err, applications) => {
          if (err) {
            console.error("Error checking existing applications:", err);
            return res.json({ 
              success: false, 
              message: "Error processing application"
            });
          }
          
          if (applications.length > 0) {
            return res.json({
              success: false,
              message: "You have already applied to this project"
            });
          }
          
          // Insert application
          db.query(
            `INSERT INTO applications 
             (project_id, applicant_email, message, requested_role, status, created_at)
             VALUES (?, ?, ?, ?, 'pending', NOW())`,
            [projectId, userEmail, message || '', role || 'Collaborator'],
            (err, result) => {
              if (err) {
                console.error("Error creating application:", err);
                return res.json({ 
                  success: false, 
                  message: "Error submitting application"
                });
              }
              
              // Also insert notification for project creator
              db.query(
                `INSERT INTO notifications 
                 (user_email, message, type, related_id, created_at)
                 VALUES (?, ?, 'application', ?, NOW())`,
                [projects[0].creator_email, 
                 `New application from ${userEmail} for "${projects[0].title}"`, 
                 result.insertId],
                (err) => {
                  if (err) {
                    console.error("Error creating notification:", err);
                  }
                }
              );
              
              return res.json({ 
                success: true, 
                message: "Application submitted successfully",
                applicationId: result.insertId
              });
            }
          );
        }
      );
    }
  );
});

// Get user's applications
app.get("/api/applications", checkAuth, (req, res) => {
  const userEmail = req.user ? req.user.email : req.session.user[0].email;
  
  if (!userEmail) {
    return res.json({ success: false, message: "User not authenticated" });
  }

  db.query(
    `SELECT a.*, p.title as project_title, p.research_area, p.institution
     FROM applications a
     JOIN projects p ON a.project_id = p.id
     WHERE a.applicant_email = ?
     ORDER BY a.created_at DESC`,
    [userEmail],
    (err, results) => {
      if (err) {
        console.error("Error fetching applications:", err);
        return res.json({ 
          success: false, 
          message: "Error fetching applications"
        });
      }
      
      return res.json({ 
        success: true, 
        applications: results
      });
    }
  );
});

// Get user's notifications
app.get("/api/notifications", checkAuth, (req, res) => {
  const userEmail = req.user ? req.user.email : req.session.user[0].email;
  
  if (!userEmail) {
    return res.json({ success: false, message: "User not authenticated" });
  }

  db.query(
    `SELECT * FROM notifications
     WHERE user_email = ?
     ORDER BY created_at DESC
     LIMIT 10`,
    [userEmail],
    (err, results) => {
      if (err) {
        console.error("Error fetching notifications:", err);
        return res.json({ 
          success: false, 
          message: "Error fetching notifications"
        });
      }
      
      return res.json({ 
        success: true, 
        notifications: results
      });
    }
  );
});

// Get user's skills profile
app.get("/api/skills", checkAuth, (req, res) => {
  const userEmail = req.user ? req.user.email : req.session.user[0].email;
  
  if (!userEmail) {
    return res.json({ success: false, message: "User not authenticated" });
  }

  db.query(
    `SELECT * FROM researcher_skills
     WHERE email = ?`,
    [userEmail],
    (err, results) => {
      if (err) {
        console.error("Error fetching skills:", err);
        return res.json({ 
          success: false, 
          message: "Error fetching skills profile"
        });
      }
      
      if (results.length === 0) {
        return res.json({
          success: true,
          skills: {
            research_areas: [],
            technical_skills: [],
            publications: 0,
            email: userEmail
          }
        });
      }
      
      // Parse JSON strings
      const skills = results[0];
      try {
        skills.research_areas = JSON.parse(skills.research_areas || '[]');
        skills.technical_skills = JSON.parse(skills.technical_skills || '[]');
      } catch (e) {
        console.error("Error parsing skills JSON:", e);
        skills.research_areas = [];
        skills.technical_skills = [];
      }
      
      return res.json({ 
        success: true, 
        skills
      });
    }
  );
});

// Update user's skills profile
app.post("/api/skills", checkAuth, (req, res) => {
  const userEmail = req.user ? req.user.email : req.session.user[0].email;
  const { research_areas, technical_skills, publications } = req.body;
  
  if (!userEmail) {
    return res.json({ success: false, message: "User not authenticated" });
  }

  // Check if user already has a skills profile
  db.query(
    `SELECT * FROM researcher_skills WHERE email = ?`,
    [userEmail],
    (err, results) => {
      if (err) {
        console.error("Error checking skills profile:", err);
        return res.json({ 
          success: false, 
          message: "Error updating skills profile"
        });
      }
      
      const researchAreasJson = JSON.stringify(research_areas || []);
      const technicalSkillsJson = JSON.stringify(technical_skills || []);
      
      if (results.length === 0) {
        // Insert new skills profile
        db.query(
          `INSERT INTO researcher_skills 
           (email, research_areas, technical_skills, publications, updated_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [userEmail, researchAreasJson, technicalSkillsJson, publications || 0],
          (err) => {
            if (err) {
              console.error("Error creating skills profile:", err);
              return res.json({ 
                success: false, 
                message: "Error creating skills profile"
              });
            }
            
            return res.json({ 
              success: true, 
              message: "Skills profile created successfully"
            });
          }
        );
      } else {
        // Update existing skills profile
        db.query(
          `UPDATE researcher_skills 
           SET research_areas = ?, technical_skills = ?, publications = ?, updated_at = NOW()
           WHERE email = ?`,
          [researchAreasJson, technicalSkillsJson, publications || 0, userEmail],
          (err) => {
            if (err) {
              console.error("Error updating skills profile:", err);
              return res.json({ 
                success: false, 
                message: "Error updating skills profile"
              });
            }
            
            return res.json({ 
              success: true, 
              message: "Skills profile updated successfully"
            });
          }
        );
      }
    }
  );
});

// Get upcoming deadlines
app.get("/api/deadlines", checkAuth, (req, res) => {
  const userEmail = req.user ? req.user.email : req.session.user[0].email;
  
  if (!userEmail) {
    return res.json({ success: false, message: "User not authenticated" });
  }

  db.query(
    `SELECT t.*, p.title as project_title
     FROM tasks t
     JOIN projects p ON t.project_id = p.id
     JOIN collaborators c ON p.id = c.project_id AND c.collaborator_email = ?
     WHERE t.deadline IS NOT NULL AND t.completed = false
     ORDER BY t.deadline ASC
     LIMIT 5`,
    [userEmail],
    (err, results) => {
      if (err) {
        console.error("Error fetching deadlines:", err);
        return res.json({ 
          success: false, 
          message: "Error fetching deadlines"
        });
      }
      
      return res.json({ 
        success: true, 
        deadlines: results
      });
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});