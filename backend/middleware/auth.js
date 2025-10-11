import jwt from "jsonwebtoken";

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
        
        // Set user info from token - use userType consistently
        req.user = {
            id: token_decode.id.toString(), // Ensure it's a string
            userType: token_decode.userType, // Should match what's in token
            role: token_decode.userType // For backward compatibility
        };
        
        console.log('Auth middleware - req.user:', req.user); // Debug log
        
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