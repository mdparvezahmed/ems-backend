const Employee = require('../models/Employee');
const User = require('../models/usermodel');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const { uploadToImgBB } = require('../config/imgbbUpload');

// Use memory storage for ImgBB uploads
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)'));
        }
    }
})

const addEmployee = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);

        const {
            name,
            email,
            password,
            employeeId,
            dob,
            gender,
            maritalStatus,
            designation,
            department,
            image,
            salary,
            role


        } = req.body;

        // Validate required fields
        if (!name || !email || !password || !employeeId || !dob || !gender || !maritalStatus || !designation || !department || !salary) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Profile image is required'
            });
        }

        const user = await User.findOne({ email });
        if (user) {
            console.log('User already exists with email:', email);
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists'
            });
        }

        // Upload image to ImgBB
        const imageUrl = await uploadToImgBB(req.file.buffer, req.file.originalname);
        console.log('Image uploaded to ImgBB:', imageUrl);

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'employee',
            profileImage: imageUrl,
        });
        const savedUser = await newUser.save();

        const newEmployee = new Employee({
            userId: savedUser._id,
            employeeId,
            name,
            email,
            dob,
            gender,
            maritalStatus,
            designation,
            department,
            salary,
            image: imageUrl,
            password: hashedPassword,
            role: role || 'employee'
        });

        await newEmployee.save();

        res.status(201).json({
            success: true,
            message: 'Employee added successfully',
            employee: newEmployee
        });
    } catch (error) {
        console.log('Error in addEmployee:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
}

const getEmployee = async (req, res) => {
    try {
        const employees = await Employee.find().populate('userId', { password: 0 }).populate('department');
        console.log('Total employees found:', employees.length);
        employees.forEach((emp, index) => {
            console.log(`Employee ${index + 1}:`, {
                _id: emp._id,
                userId: emp.userId?._id,
                name: emp.name,
                email: emp.email,
                employeeId: emp.employeeId
            });
        });
        
        return res.status(200).json({
            success: true,
            employees
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: 'get employee controller ' + error.message
        })
    }
}

const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Getting employee by ID:', id);
        console.log('ID type:', typeof id);
        console.log('ID length:', id.length);
        
        let employee;
        
        // Validate ObjectId format first
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.log('Invalid ObjectId format:', id);
            return res.status(400).json({
                success: false,
                message: "Invalid ID format"
            });
        }

        // Since User._id = Employee.userId, search by userId first (most common case)
        console.log('Searching by Employee.userId (User._id -> Employee.userId)');
        employee = await Employee.findOne({ userId: id })
            .populate('userId', { password: 0 })
            .populate('department');
        
        console.log('Employee found by userId:', employee ? 'Yes' : 'No');

        // If not found by userId, try by Employee._id (less common case)
        if (!employee) {
            console.log('Searching by Employee._id as fallback');
            employee = await Employee.findById(id)
                .populate('userId', { password: 0 })
                .populate('department');
            
            console.log('Employee found by _id:', employee ? 'Yes' : 'No');
        }

        if (!employee) {
            console.log('No employee found with ID:', id);
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        console.log('Employee found:', employee.name || employee.userId?.name);
        return res.status(200).json({
            success: true,
            employee
        });
    } catch (error) {
        console.error('Error in getEmployeeById:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: 'get employee by id controller ' + error.message
        });
    }
}

const editEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            email,
            password,
            employeeId,
            dob,
            gender,
            maritalStatus,
            designation,
            department,
            salary,
            role
        } = req.body;

        // Find the employee
        const employee = await Employee.findById(id);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        // Update fields
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (employeeId) updateData.employeeId = employeeId;
        if (dob) updateData.dob = dob;
        if (gender) updateData.gender = gender;
        if (maritalStatus) updateData.maritalStatus = maritalStatus;
        if (designation) updateData.designation = designation;
        if (department) updateData.department = department;
        if (salary) updateData.salary = salary;
        if (role) updateData.role = role;

        // Handle image update
        if (req.file) {
            const imageUrl = await uploadToImgBB(req.file.buffer, req.file.originalname);
            console.log('Image uploaded to ImgBB:', imageUrl);
            updateData.image = imageUrl;
        }

        // Handle password update
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }

        // Update employee
        const updatedEmployee = await Employee.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('department');

        // Also update user data if email, name, role, or password changed
        const userUpdateData = {};
        if (name) userUpdateData.name = name;
        if (email) userUpdateData.email = email;
        if (role) userUpdateData.role = role;
        if (req.file) {
            const imageUrl = await uploadToImgBB(req.file.buffer, req.file.originalname);
            userUpdateData.profileImage = imageUrl;
        }
        if (password && password.trim() !== '') {
            userUpdateData.password = await bcrypt.hash(password, 10);
        }

        if (Object.keys(userUpdateData).length > 0) {
            await User.findByIdAndUpdate(employee.userId, userUpdateData);
        }

        res.status(200).json({
            success: true,
            message: 'Employee updated successfully',
            employee: updatedEmployee
        });
    } catch (error) {
        console.log('Error in editEmployee:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
}

module.exports = { addEmployee, upload, getEmployee, getEmployeeById, editEmployee };