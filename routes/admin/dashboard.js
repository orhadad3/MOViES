const express = require("express");
const router = express.Router();
const adminController = require("../../controllers/admin/adminController");

router.get("/", async (req, res) => {
    try {
        const [stats, dbInfo, apisStatus] = await Promise.all([
            adminController.getAdminStats(),
            adminController.getDatabaseInfo(),
            adminController.getExternalAPIsStatus()
        ]);

        res.render("admin/admin", { 
            title: "Admin Panel",
            adminPage: "dashboard",
            activePage: "admin",
            userType: req.session.userType,
            stats,
            dbInfo,
            apisStatus
        });
    } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
        res.status(500).send("Error loading admin dashboard.");
    }
});

// Toggle database mode endpoint
router.post("/toggle-database", adminController.toggleDatabaseMode);

module.exports = router;