const express = require("express");
const router = express.Router();
const linksController = require("../../controllers/admin/adminLinksController");

router.get("/", (req, res) => {
    res.render("admin/admin-links", { 
        title: "Link Management", 
        adminPage: "links", 
        activePage: "admin", 
        userType: req.session.userType 
    });
});

router.get("/getPublicLinks", linksController.getPublicLinks);
router.delete("/deleteLink/:linkId", linksController.deleteLink);

module.exports = router;