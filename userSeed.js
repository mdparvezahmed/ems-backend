const User = require("./models/usermodel.js");
const bcrypt = require("bcrypt");
const dbconnect = require("./config/dbconnect.js");



const userRegister = async () => {
    dbconnect();    
    try {
        const hashedPassword = bcrypt.hashSync("admin123", 10);
        const adminUser = new User({
            name: "Admin",
            email: "admin@gmail.com",
            password: hashedPassword,
            role: "admin"
        });
        await adminUser.save();
    } catch (error) {
        console.error("Error registering user:", error);
    }


};

userRegister();