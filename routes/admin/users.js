const express = require("express");
const router = express.Router();
const usersController = require("../../controllers/admin/adminUsersController");

router.get("/", (req, res) => {
    res.render("admin/admin-users", { 
        title: "User Management", 
        adminPage: "users", 
        activePage: "admin", 
        userType: req.session.userType 
    });
});

router.get("/getUsers", usersController.getUsers);
router.put("/updateUser/:userId", usersController.updateUser);
router.delete("/deleteUser/:userId", usersController.deleteUser);

module.exports = router;