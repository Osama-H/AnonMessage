const router = require("express").Router();
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const awsBucket = require("../services/awsImageService");



router.use(authController.protect);

router.get("/", userController.getUsers);
router.get("/myProfile", userController.getMyProfile);

router.patch(
  "/updateMe",
  awsBucket.uploadUserPhoto,
  awsBucket.resizeUserImage,
  awsBucket.sendUserPhoto,
  userController.updateMe
);

router.patch("/updatePassword", authController.updatePassword);

router.get("/:id", userController.getUser);

router.use(authController.restrictTo("admin"));

router.delete("/deactivate/:id", userController.deactiveUserAccount);
router.patch("/activate/:id", userController.activeUserAccount);

module.exports = router;
