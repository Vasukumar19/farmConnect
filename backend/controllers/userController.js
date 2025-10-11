import userModel from '../models/userModel.js';
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

const createToken = (id, userType) => {
    const secret = process.env.JWT_SECRET || 'your_secret_key';
    return jwt.sign({ id, userType: userType }, secret, { expiresIn: '30d' });
}

const registerUser = async (req, res) => {
    const { name, email, password, userType, phone, address, farmName, location } = req.body;
    
    try {
        const existsUser = await userModel.findOne({ email });
        if (existsUser) {
            return res.json({ success: false, message: 'User already exists' });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: 'Please enter a valid email' });
        }

        if (password.length < 8) {
            return res.json({ success: false, message: 'Password must be at least 8 characters' });
        }

        if (!['farmer', 'customer'].includes(userType)) {
            return res.json({ success: false, message: 'Invalid user type' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword,
            userType,
            phone,
            address: userType === 'customer' ? address : undefined,
            farmName: userType === 'farmer' ? farmName : undefined,
            location: userType === 'farmer' ? location : undefined
        });

        const user = await newUser.save();
        const token = createToken(user._id, user.userType);

        res.json({
            success: true,
            token,
            message: 'User registered successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                userType: user.userType,
                phone: user.phone || '',
                address: user.address || '',
                farmName: user.farmName || '',
                location: user.location || '',
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.json({ success: false, message: error.message || 'Registration failed' });
    }
}

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: 'User does not exist' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: 'Invalid credentials' });
        }

        const token = createToken(user._id, user.userType);

        res.json({
            success: true,
            token,
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                userType: user.userType,
                phone: user.phone || '',
                address: user.address || '',
                farmName: user.farmName || '',
                location: user.location || '',
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.json({ success: false, message: 'Login failed' });
    }
}

const updateProfile = async (req, res) => {
    const { name, phone, address, farmName, location } = req.body;
    
    try {
        const updateData = { name, phone };
        
        if (req.body.userType === 'farmer' || req.user.userType === 'farmer') {
            if (farmName) updateData.farmName = farmName;
            if (location) updateData.location = location;
        } else {
            if (address) updateData.address = address;
        }

        const user = await userModel.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                userType: user.userType,
                phone: user.phone || '',
                address: user.address || '',
                farmName: user.farmName || '',
                location: user.location || '',
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.json({ success: false, message: error.message || 'Failed to update profile' });
    }
};

export { loginUser, registerUser, updateProfile };