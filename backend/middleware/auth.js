const admin = require("firebase-admin");
const User = require("../model/User");

// Initialize Firebase Admin SDK only if credentials are provided
const isFirebaseConfigured = process.env.FIREBASE_PROJECT_ID && 
  process.env.FIREBASE_PRIVATE_KEY && 
  process.env.FIREBASE_CLIENT_EMAIL;

if (isFirebaseConfigured && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

/**
 * Verify Firebase ID token and attach user to request
 */
const verifyToken = async (req, res, next) => {
  try {
    // Development mode bypass - skip auth if Firebase not configured
    if (!isFirebaseConfigured && process.env.NODE_ENV !== "production") {
      // For development, try to get user from header or use a test user
      const testUserId = req.headers["x-test-user-id"];
      if (testUserId) {
        const user = await User.findById(testUserId);
        if (user) {
          req.user = user;
          return next();
        }
      }
      // Continue without user for public routes
      return next();
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        success: false, 
        message: "No token provided" 
      });
    }

    const token = authHeader.split(" ")[1];
    
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Find user in database
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "User not found in database" 
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({ 
        success: false, 
        message: "Your account has been blocked" 
      });
    }

    // Attach user info to request
    req.user = user;
    req.firebaseUser = decodedToken;
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({ 
        success: false, 
        message: "Token expired" 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: "Invalid token" 
    });
  }
};

/**
 * Check if user has required role
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required role: ${roles.join(" or ")}` 
      });
    }

    next();
  };
};

/**
 * Check if user is verified
 */
const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: "Authentication required" 
    });
  }

  if (!req.user.isVerified && req.user.role !== "admin") {
    return res.status(403).json({ 
      success: false, 
      message: "Account verification required" 
    });
  }

  next();
};

/**
 * Optional authentication - attaches user if token exists
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (user && !user.isBlocked) {
      req.user = user;
      req.firebaseUser = decodedToken;
    }
    
    next();
  } catch (error) {
    // Token invalid, but continue without auth
    next();
  }
};

module.exports = {
  verifyToken,
  requireRole,
  requireVerified,
  optionalAuth,
};
