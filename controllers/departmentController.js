const Department = require("../models/department");

const getDepartment = async (req, res) => {


    try {
        const departments = await Department.find();
        return res.status(200).json({
            success: true,
            departments
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: 'get department controller ' + error.message
        })
    }
}

const addDepartment = async (req, res) => {
    try {
        const { dep_name, description } = req.body;
        const newDep = new Department({ dep_name, description });
        await newDep.save();
        return res.status(201).json({
            success: true,
            message: "Department added successfully",
            department: newDep
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        })
    }
}

const getDepartmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const department = await Department.findById(id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }
        return res.status(200).json({
            success: true,
            department
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

const editDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const department = await Department.findById(id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }
        const { dep_name, description } = req.body;
        department.dep_name = dep_name;
        department.description = description;
        await department.save();
        return res.status(200).json({
            success: true,
            message: "Department updated successfully",
            department
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

const deleteDepartment = async (req, res) => {
    try {
        console.log("Delete request received for ID:", req.params.id);
        const { id } = req.params;
        
        // Validate if ID is a valid MongoDB ObjectId
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid department ID format"
            });
        }
        
        const department = await Department.findByIdAndDelete(id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }
        
        console.log("Department deleted successfully:", department._id);
        return res.status(200).json({
            success: true,
            message: "Department deleted successfully"
        });
    } catch (error) {
        console.error("Delete department error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

module.exports = { addDepartment, getDepartment, getDepartmentById, editDepartment, deleteDepartment };