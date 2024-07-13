const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { promisify } = require("util");

const db = require("../config/database");
const User = require("../models/userModel");
const auditService = require("./../services/auditService");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const generateTokens = require("../utils/generateTokens");
const Email = require("./../utils/sendEmail");

const userLoginSchema = require("./../validators/auth/login-user-schema");
const userSignUpSchema = require("./../validators/auth/signup-user-schema");
const updatePasswordSchema = require("./../validators/auth/updatePasswords-schema");
const forgotPasswordSchema = require("./../validators/auth/forgot-password-schema");
const resetPasswordSchema = require("./../validators/auth/reset-password-schema");
const cookieOptions = {
  expiresIn: new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
  ),
  secure: true,
  httpOnly: true,
};

exports.signup = catchAsync(async (req, res) => {
  const result = await userSignUpSchema.validateAsync(req.body);

  const { name, email, password } = result;

  const user = await User.create({
    name,
    email,
    password,
    photo: "defaultImage",
  });

  auditService.prepareAudit(
    "USER_SIGNUP",
    user.toJSON(),
    null,
    "postman",
    dateFormat()
  );

  res.status(201).json({
    status: "success",
    user,
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const result = await userLoginSchema.validateAsync(req.body);
  const { email, password } = result;

  const user = await User.findOne({ where: { email } });

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError("Invalid email or password", 401));
  }

  const accessToken = generateTokens.generateAccessToken(user.id);
  const refreshToken = generateTokens.generateRefreshToken(user.id);

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie("jwtAccess", accessToken, cookieOptions);
  res.cookie("jwtRefresh", refreshToken, cookieOptions);

  res.status(200).json({
    status: "success",
    accessToken,
    refreshToken,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  const accessToken = req.cookies.jwtAccess;

  if (!accessToken) return next(new AppError("You are not logged in!", 401));
  [];

  const decodedPayload = await generateTokens.verifyAccessToken(accessToken);
  console.log(decodedPayload);

  const foundUser = await User.findOne({ where: { id: decodedPayload.id } });
  if (!foundUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  req.user = foundUser;

  next();
});

exports.getAccessToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;
  const foundUser = await User.findOne({
    where: {
      refreshToken,
    },
  });

  if (!foundUser) return next(new AppError("User no longer exist", 401));

  const accessToken = generateTokens.generateAccessToken(foundUser.id);
  res.cookie("jwtAccess", accessToken, cookieOptions);

  res.status(200).json({
    status: "success",
    accessToken,
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  console.log(req.user.id);

  const result = await updatePasswordSchema.validateAsync(req.body);
  const { currentPassword, newPassword } = result;

  const user = await User.findByPk(req.user.id);

  if (!user || !(await user.comparePassword(currentPassword))) {
    return next(new AppError("User no longer exist, Or Invalid Password", 400));
  }

  user.password = newPassword;
  await user.save();
  res.status(200).json({
    status: "success",
    message: "Password updated successfully",
  });
});

const dateFormat = () => {
  return new Date(Date.now()).toLocaleString();
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const result = await forgotPasswordSchema.validateAsync(req.body);
  const { email } = result;
  const foundUser = await User.findOne({ where: { email } });
  if (!foundUser) {
    return next(new AppError("User Not Found", 404));
  }

  const resetToken = await foundUser.createPasswordResetToken();

  await new Email(foundUser, resetToken, req).sendResetToken();
  console.log(req.protocol, req.host);

  res.status(200).json({
    status: "success",
    message: "Check Your Email To update the Password",
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const result = await resetPasswordSchema.validateAsync(req.body);
  const { newPassword } = result;

  const { resetToken } = req.params;

  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  console.log(hashedToken);
  const foundUser = await User.findOne({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: {
        [Op.gte]: Date.now(),
      },
    },
  });
  if (!foundUser) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  foundUser.set({
    password: newPassword,
    passwordResetToken: undefined,
    passwordResetExpires: undefined,
  });

  await foundUser.save();
  res.status(200).json({
    status: "success",
    message: "Password Updated Succesfully",
  });
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You dont have permission to perfrom this action", 403)
      );
    }
    next();
  };
};
