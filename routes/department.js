const express = require('express');
const authmiddleware = require('../middlewares/authMidleware');
const { addDepartment, getDepartment, getDepartmentById, editDepartment, deleteDepartment } = require('../controllers/departmentController');



const router = express.Router();
router.post("/add", authmiddleware, addDepartment);
router.get("/", authmiddleware, getDepartment);
router.get("/:id", authmiddleware, getDepartmentById);
router.put("/:id", authmiddleware, editDepartment);
router.delete("/:id", authmiddleware, deleteDepartment);


module.exports = router;