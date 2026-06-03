import jwt from "jsonwebtoken";

// backend/middleware/auth.js
const authMiddleware = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
  
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          message: "Not authorized, login again" 
        });
      }
  
      const token = authHeader.split(' ')[1];
      const jwtSecret = process.env.JWT_SECRET || 'your_secret_key';
      const token_decode = jwt.verify(token, jwtSecret);
      
      // ✅ Only set userType, remove role
      req.user = {
        id: token_decode.id.toString(),
        userType: token_decode.userType
      };
      
      next();
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(401).json({ 
        success: false, 
        message: "Invalid token" 
      });
    }
  };
  
  export default authMiddleware;