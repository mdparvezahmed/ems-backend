const express = require('express');
const authmiddleware = require('../middlewares/authMidleware');
const { addEmployee, upload, getEmployee, getEmployeeById, editEmployee } = require('../controllers/employeeController');


const router = express.Router();
router.post("/add", authmiddleware, upload.single("image"), addEmployee);
router.get("/", authmiddleware, getEmployee);
router.get("/:id", authmiddleware, getEmployeeById);
router.put("/edit/:id", authmiddleware, upload.single("image"), editEmployee);
// router.delete("/:id", authmiddleware, deleteEmployee);


module.exports = router;