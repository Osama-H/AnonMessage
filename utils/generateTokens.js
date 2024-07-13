const jwt = require("jsonwebtoken");
const { promisify } = require("util");

exports.generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_Access_SECRET, {
    expiresIn: "30m",
  });
};

exports.generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_Refresh_SECRET, {
    expiresIn: "30d",
  });
};

exports.verifyAccessToken = async (token) => {
  return await promisify(jwt.verify)(token, process.env.JWT_Access_SECRET);
};

exports.verifyRefreshToken = async (token) => {
  return await promisify(jwt.verify)(token, process.env.JWT_Refresh_SECRET);
};
