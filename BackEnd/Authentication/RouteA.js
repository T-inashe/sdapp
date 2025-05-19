import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import User from '../Api/Models/User.js'; 

const router = express.Router();

// Get frontend URL from environment variable or use default for local development
const FRONTEND_URL = 'https://icy-desert-06b45041e.6.azurestaticapps.net';
// const FRONTEND_URL = 'http://localhost:5173';

// Google OAuth login route
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  async function (req, res) {
    /* istanbul ignore next */
    try {
      const userId = req.user.user._id;
      const role = req.user.role;
      const token = req.user.token;

      if (!role) {
        return res.redirect(`${FRONTEND_URL}/signup?userId=${userId}&message=You%20need%20to%20create%20an%20account%20before%20you%20log%20in.`);
      }

      if(role === "Researcher"){
        return res.redirect(`${FRONTEND_URL}/collaboratordashboard?token=${token}`);
      }

      if(role === "Admin"){
        return res.redirect(`${FRONTEND_URL}/admindashboard?token=${token}`);
      }

      if(role === "Reviewer"){
        return res.redirect(`${FRONTEND_URL}/reviewerdashboard?token=${token}`);
      }
    } catch (error) {
      console.error("Error during Google OAuth callback:", error);
      res.redirect("/");
    }
  }
);

router.get("/UserData", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ loggedIn: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(404).json({ loggedIn: false });

    res.json({
      loggedIn: true,
      user: {
        _id: user._id,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        institution: user.institution || user.school || '',
        avatar: user.avatar || '',
        role: user.role
      }
    });
  } catch (err) {
    console.error("JWT verification error:", err);
    res.status(403).json({ loggedIn: false });
  }
});

// Logout route
router.get("/logout", function (req, res) {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect(`${FRONTEND_URL}/login`);
  });
});

export default router;