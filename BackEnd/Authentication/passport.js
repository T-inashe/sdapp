import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import User from '../Api/Models/User.js';
import jwt from 'jsonwebtoken';

dotenv.config();

// Get the base URL from environment variables or use a default for local development
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8081';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: `${BACKEND_URL}/auth/google/callback`, // Use absolute URL
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      /* istanbul ignore next */
      try {
        let user = await User.findOne({ googleId: profile.id });
        
        if (!user) {
          // Create a new user
          user = new User({
            googleId: profile.id,
            fname: profile.name.givenName,
            lname: profile.name.familyName,
            role: null,
            academicrole: null,
            contact: null,
            department: null,
            researcharea: null,
            researchExperience: null,
          });
          
          await user.save();
        }
        
        const token = jwt.sign(
          { id: user._id },
          process.env.JWT_SECRET,
          { expiresIn: '100h' }
        );
        
        return done(null, { user, token, role: user.role });
      } catch (error) {
        console.error('Error during Google OAuth:', error);
        return done(error, null);
      }
    }
  )
);

/* istanbul ignore next */
passport.serializeUser((data, done) => {
  done(null, { id: data.user.id, token: data.token });
});

/* istanbul ignore next */
passport.deserializeUser(async (data, done) => {
  try {
    const user = await User.findById(data.id);
    done(null, { user, token: data.token });
  } catch (error) {
    done(error, null);
  }
});

export default passport;