const router = require("express").Router();
const authController = require("../controllers/authController");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/refreshToken", authController.getAccessToken);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:resetToken", authController.resetPassword);

module.exports = router;
