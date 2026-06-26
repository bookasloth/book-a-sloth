const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { list, markAllRead, markRead } = require("../controllers/notificationController");

router.get("/", protect, list);
router.post("/read-all", protect, markAllRead);
router.patch("/:id/read", protect, markRead);

module.exports = router;
