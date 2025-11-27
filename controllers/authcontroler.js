const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/usermodel.js");

const register = async (req, res) => {
  try {
    const { name, email, password, role, profileImage } = req.body;

    // Basic validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password, and role are required" });
    }

    // Validate role against enum values
    const validRoles = ["admin", "manager", "employee"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Role must be one of: admin, manager, employee" });
    }

    // Trim email to match model behavior
    const trimmedEmail = email.trim();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    // Check if user already exists (only email needs to be unique)
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name.trim(),
      email: trimmedEmail,
      password: hashedPassword,
      role,
      profileImage
    });

    await newUser.save();

    res.status(201).json({
      message: `User registered with name: ${name}`
    });

  } catch (err) {
    console.error(err.message);

    if (err.code === 11000) { // Mongo duplicate key error
      return res.status(409).json({ message: "Duplicate email not allowed" });
    }

    res.status(500).json({
      message: "Something went wrong during registration",
      error: err.message
    });
  }
};

const login = async (req, res) => {
  try {
    console.log('Login attempt - Body:', { email: req.body.email, hasPassword: !!req.body.password });
    
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Login failed: Missing credentials');
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Trim email to match model behavior
    const trimmedEmail = email.trim();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      console.log('Login failed: Invalid email format');
      return res.status(400).json({ success: false, message: "Please provide a valid email address" });
    }

    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      console.log('Login failed: User not found -', trimmedEmail);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Login failed: Invalid password for -', trimmedEmail);
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "10d" }
    );

    console.log('Login successful:', trimmedEmail, 'Role:', user.role);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage
      }
    });

  } catch (err) {
    console.error('Login error:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({
      success: false,
      message: "Something went wrong during login",
      error: err.message
    });
  }
};


const verify = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Token is valid",
    user: req.user
  });
}

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude password field
    console.log('Total users found:', users.length);
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`, {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    });
    
    return res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message
    });
  }
}

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        error: "Current password and new password are required" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: "New password must be at least 6 characters long" 
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "User not found" 
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        success: false,
        error: "Current password is incorrect" 
      });
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ 
        success: false,
        error: "New password must be different from current password" 
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await User.findByIdAndUpdate(userId, { 
      password: hashedNewPassword 
    });

    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (err) {
    console.error("Change password error:", err.message);
    res.status(500).json({
      success: false,
      error: "Something went wrong while changing password",
      details: err.message
    });
  }
};

module.exports = {
  register,
  login,
  verify,
  changePassword,
  getAllUsers
};
