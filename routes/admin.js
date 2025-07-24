const express = require("express");
const router = express.Router();
const { verifyAdmin } = require("../middleware/authMiddleware");
const { useMongoDB } = require("../config");

router.use(verifyAdmin);

router.use("/", require("./admin/dashboard"));
router.use("/users", require("./admin/users"));
router.use("/links", require("./admin/links"));
router.use("/reviews", require("./admin/reviews"));
router.get("/config", (req, res) => { res.json({ useMongoDB }); });

module.exports = router;