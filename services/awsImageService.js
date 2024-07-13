// const multer = require("multer");
// const sharp = require("sharp");
// const {
//   PutObjectCommand,
//   GetObjectCommand,
//   DeleteObjectCommand,
// } = require("@aws-sdk/client-s3");
// const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// const bucketName = process.env.BUCKET_NAME;

// const s3 = require("../utils/s3Bucket");

// exports.uploadUserPhoto = upload.single("photo");

// exports.resizeUserImage = async (req, res, next) => {
//   if (!req.file) {
//      next();
//   }
//   const photoName = `user-58-${Date.now()}`;
//   req.file.buffer = await sharp(req.file.buffer).resize(500, 500).toBuffer();
//   req.body.photo = photoName;
//   next();
// };

// exports.sendUserPhoto = async (req, res, next) => {
//   if (!req.file) {
//     next();
//   }
//   const params = {
//     Bucket: bucketName,
//     Key: `users-photos/${req.body.photo}`,
//     body: req.file.buffer,
//     ContentType: req.file.mimetype,
//   };
//   const command = new PutObjectCommand(params);
//   await s3.send(command);
//   next();
// };


const multer = require("multer");
const sharp = require("sharp");
const {
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const storage = multer.memoryStorage();
const upload = multer({ storage });

const bucketName = process.env.BUCKET_NAME;
const s3 = require("../utils/s3Bucket");

exports.uploadUserPhoto = upload.single("photo");

exports.resizeUserImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }
  const photoName = `user-78-${Date.now()}`;
  req.file.buffer = await sharp(req.file.buffer).resize(500, 500).toBuffer();
  req.body.photo = photoName;
  next();
};

exports.sendUserPhoto = async (req, res, next) => {
  if (!req.file) {
    return next();
  }
  const params = {
    Bucket: bucketName,
    Key: `users-photos/${req.body.photo}`,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  };
  const command = new PutObjectCommand(params);
  await s3.send(command);
  next();
};
