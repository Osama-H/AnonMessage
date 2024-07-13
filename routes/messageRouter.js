const router = require("express").Router();
const authController = require("../controllers/authController");
const messageController = require("../controllers/messageController");

router.use(authController.protect);

router.post("/", messageController.sendMessage);

router.get("/received", messageController.getMyReceivedMessages);

router.get("/sent", messageController.getMySentMessages);

module.exports = router;
