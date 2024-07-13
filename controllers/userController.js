const { Op } = require("sequelize");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const AppError = require("../utils/AppError");
const User = require("./../models/userModel");
const getSetCache = require("../utils/cache");
const catchAsync = require("../utils/catchAsync");

const updateUserSchema = require("./../validators/user/update-user-schema");

const s3Bucket = require("../utils/s3Bucket");

exports.getMyProfile = catchAsync(async (req, res) => {
  const userId = req.user?.id || 58;
  const user = await User.findByPk(userId, {
    attributes: {
      exclude: ["password", "updatedAt", "refreshToken"],
    },
  });
  const sentMessages = await user.getSendMessages({
    attributes: {
      exclude: ["sender_id", "createdAt"],
    },
    order: [["createdAt", "DESC"]],
  });

  let receivedMessages = await user.getReceivedMessages({
    attributes: {
      exclude: ["recipient_id", "updatedAt"],
    },
    order: [["createdAt", "DESC"]],
  });

  const formattedMessages = receivedMessages.map((message) => {
    return message.asAnonymousSender
      ? {
          id: message.id,
          text: message.text,
          sentSince: message.createdAt,
          asAnonymousSender: true,
        }
      : {
          id: message.id,
          text: message.text,
          asAnonymousSender: false,
          sender_id: message.sender_id,
          sentSince: message.createdAt,
        };
  });

  if (user.photo) {
    let getObjectParams;

    getObjectParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: `user photos/${user.photo}`,
    };
    const command = new GetObjectCommand(getObjectParams);
    url = await getSignedUrl(s3Bucket, command, { expiresIn: 3600 });
  }

  res.status(200).json({
    status: "success",
    user,
    sentMessages,
    receivedMessages: formattedMessages,
    url,
  });
});

exports.getUsers = async (req, res) => {
  const userName = req.query.username || "";
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const offset = limit * (page - 1);

  const id = req.query.id;

  const users = await getSetCache(`users?id=${id}`, async () => {
    const data = await User.findAll({
      where: {
        name: {
          [Op.iLike]: `%${userName}%`,
        },
      },
      attributes: {
        exclude: ["email", "updatedAt", "password", "refreshToken"],
      },
      limit,
      offset,
    });
    return data;
  });

  res.status(200).json({
    status: "success",
    numOfUsers: users.length,
    users,
  });
};

exports.getUser = async (req, res, next) => {
  const userId = req.params.id;

  const user = await User.findByPk(userId, {
    attributes: {
      exclude: ["password", "updatedAt", "email"],
    },
  });

  if (!user) return next(new AppError("User not found", 404));

  if (user.photo) {
    let getObjectParams;

    getObjectParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: `user photos/${user.photo}`,
    };
    const command = new GetObjectCommand(getObjectParams);
    url = await getSignedUrl(s3Bucket, command, { expiresIn: 3600 });
  }

  res.status(200).json({
    status: "success",
    user,
    url,
  });
};

exports.updateMe = catchAsync(async (req, res, next) => {
  const result = await updateUserSchema.validateAsync(req.body);
  const userId = req.user?.id || 78;

  await User.update(result, {
    where: {
      id: userId,
    },
  });

  res.send("Updated Successfully!");

  console.log(req.body);
});

// This is for the Admin
exports.deactiveUserAccount = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findByPk(id);
  if (!user) {
    return next(new AppError("User Not Found", 404));
  }

  await user.destroy();

  res.status(204).json({
    status: "success",
  });
});

exports.activeUserAccount = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  await User.restore({
    where: {
      id,
    },
  });
  res.status(200).json({
    status: "success",
    message: "User activated Successfully!",
  });
});
