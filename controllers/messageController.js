const { Op } = require("sequelize");
const { subDays } = require("date-fns");

const Message = require("../models/messageModel");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const sendMessageSchema = require("./../validators/message/send-message-schema");

exports.sendMessage = catchAsync(async (req, res, next) => {
  const sender_id = req.user?.id || 58;

  const result = await sendMessageSchema.validateAsync(req.body);
  const { text, recipient_id, asAnonymousSender } = result;

  if (recipient_id == sender_id) {
    return next(new AppError("You can't send message to yourself", 400));
  }

  const recipientUser = await User.findByPk(recipient_id);
  if (!recipientUser) return next(new AppError("User not found", 404));

  const twentyFourHoursAgo = subDays(new Date(), 1);

  const countSentMessages = await Message.count({
    where: {
      sender_id,
      createdAt: {
        [Op.between]: [twentyFourHoursAgo, new Date()],
      },
    },
  });

  if (countSentMessages >= 3) {
    return next(
      new AppError("You have reached the limit of 3 messages per 24 hours", 400)
    );
  }

  await Message.create({ text, sender_id, recipient_id, asAnonymousSender });
  res.status(201).json({
    status: "success",
    message: "Message sent successfully",
  });
});

// exports.getMyReceivedMessages = catchAsync(async (req, res, next) => {
//   const userId = req.user.id;

//   const user = await User.findByPk(userId);

//   const messages = await user.getReceivedMessages({
//     attributes: {
//       exclude: ["recipient_id", "updatedAt"],
//     },
//     order: [["createdAt", "DESC"]],
//   });
//   if (!messages) return next(new AppError("No Message Found", 404));

//   const finalMessages = messages.map((message) => {
//     if (message.asAnonymousSender) {
//       return {
//         id: message.id,
//         text: message.text,
//         sentSince: message.createdAt,
//       };
//     } else {
//       const { createdAt, ...otherProps } = message.toJSON();
//       const newObj = { ...otherProps, sentSince: createdAt };

//       return newObj;
//     }
//   });

//   res.status(200).json({
//     status: "success",
//     numOfMessages: messages.length,
//     messages: finalMessages,
//   });
// });
////////////////////
// const User = require("../models/userModel"); // Import your User model
const { Readable } = require("stream");
// const { Op } = require("sequelize");
// const { Op } = require("sequelize");

exports.getMyReceivedMessages = catchAsync(async (req, res, next) => {
  // const userId = req.user.id;

  const user = await User.findByPk(60);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent({ message: "Connection established" });

  let lastSentTimestamp = new Date(0);

  try {
    const existingMessages = await user.getReceivedMessages({
      attributes: {
        exclude: ["recipient_id", "updatedAt"],
      },
      order: [["createdAt", "ASC"]],
    });

    if (existingMessages && existingMessages.length > 0) {
      existingMessages.forEach((message) => {
        const formattedMessage = message.asAnonymousSender
          ? { id: message.id, text: message.text, sentSince: message.createdAt }
          : { ...message.toJSON(), sentSince: message.createdAt };

        sendEvent(formattedMessage);
      });

      lastSentTimestamp =
        existingMessages[existingMessages.length - 1].createdAt;
    }
  } catch (error) {
    console.error("Error fetching existing messages:", error);
    res.end();
    return;
  }

  const intervalId = setInterval(async () => {
    try {
      console.log(`Checking for new messages since ${lastSentTimestamp}`);

      const newMessages = await user.getReceivedMessages({
        attributes: {
          exclude: ["recipient_id", "updatedAt"],
        },
        where: {
          createdAt: {
            [Op.gt]: lastSentTimestamp,
          },
        },
        order: [["createdAt", "ASC"]],
      });

      if (newMessages && newMessages.length > 0) {
        console.log(`Found ${newMessages.length} new message(s)`);

        newMessages.forEach((message) => {
          const formattedMessage = message.asAnonymousSender
            ? {
                id: message.id,
                text: message.text,
                sentSince: message.createdAt,
              }
            : { ...message.toJSON(), sentSince: message.createdAt };

          sendEvent(formattedMessage);
        });

        lastSentTimestamp = newMessages[newMessages.length - 1].createdAt;
      } else {
        console.log("No new messages found");
      }
    } catch (error) {
      console.error("Error fetching new messages:", error);
      clearInterval(intervalId);
      res.end();
    }
  }, 1000);

  res.on("close", () => {
    console.log("Client connection closed");
    clearInterval(intervalId);
    res.end();
  });
});

// exports.getMyReceivedMessages = catchAsync(async (req, res, next) => {
//   // const userId = req.user.id;

//   const user = await User.findByPk(60);

//   res.setHeader("Content-Type", "text/event-stream");
//   res.setHeader("Cache-Control", "no-cache");
//   res.setHeader("Connection", "keep-alive");

//   const sendEvent = (data) => {
//     res.write(`data: ${JSON.stringify(data)}\n\n`);
//   };

//   sendEvent({ message: "Connection established" });

//   let lastSentTimestamp = new Date();

//   const intervalId = setInterval(async () => {
//     try {
//       // console.log(`Checking for new messages since ${lastSentTimestamp}`);

//       const messages = await user.getReceivedMessages({
//         attributes: {
//           exclude: ["recipient_id", "updatedAt"],
//         },
//         where: {
//           createdAt: {
//             [Op.gt]: lastSentTimestamp
//           }
//         },
//         order: [["createdAt", "ASC"]],
//       });

//       if (messages && messages.length > 0) {
//         console.log(`Found ${messages.length} new message(s)`);

//         messages.forEach((message) => {
//           const formattedMessage = message.asAnonymousSender
//             ? { id: message.id, text: message.text, sentSince: message.createdAt }
//             : { ...message.toJSON(), sentSince: message.createdAt };

//           sendEvent(formattedMessage);
//         });

//         // Update the lastSentTimestamp to the most recent message's createdAt
//         lastSentTimestamp = messages[messages.length - 1].createdAt;
//       } else {
//         console.log("No new messages found");
//       }
//     } catch (error) {
//       console.error("Error fetching messages:", error);
//       clearInterval(intervalId);
//       res.end();
//     }
//   }, 1000);

//   res.on("close", () => {
//     console.log("Client connection closed");
//     clearInterval(intervalId);
//     res.end();
//   });
// });

// exports.getMyReceivedMessages = catchAsync(async (req, res, next) => {
//   // const userId = req.user.id;

//   const user = await User.findByPk(60);

//   res.setHeader("Content-Type", "text/event-stream");
//   res.setHeader("Cache-Control", "no-cache");
//   res.setHeader("Connection", "keep-alive");

//   const sendEvent = (data) => {
//     res.write(`data: ${JSON.stringify(data)}\n\n`);
//   };

//   sendEvent({ message: "Connection established" });

//   setInterval(async () => {
//     const messages = await user.getReceivedMessages({
//       attributes: {
//         exclude: ["recipient_id", "updatedAt"],
//       },
//       order: [["createdAt", "DESC"]],
//     });

//     if (!messages || messages.length === 0) {
//       return next(new AppError("No messages found", 404));
//     }

//     messages.forEach((message) => {
//       const formattedMessage = message.asAnonymousSender
//         ? { id: message.id, text: message.text, sentSince: message.createdAt }
//         : { ...message.toJSON(), sentSince: message.createdAt };

//       sendEvent(formattedMessage);
//     });

//     res.end();
//   }, 1000);

//   res.on("error", (err) => {
//     console.error("SSE stream error:", err);
//     res.end();
//   });

//   req.on("close", () => {
//     console.log("Client connection closed");
//     res.end();
//   });
// });

// exports.getMyReceivedMessages = catchAsync(async (req, res, next) => {
//   // Fetch user or use req.user.id as needed
//   const user = await User.findByPk(60); // Example: Fetch user with ID 60

//   // Set headers for SSE
//   res.setHeader("Content-Type", "text/event-stream");
//   res.setHeader("Cache-Control", "no-cache");
//   res.setHeader("Connection", "keep-alive");

//   // Function to send SSE events
//   const sendEvent = (data) => {
//     res.write(`data: ${JSON.stringify(data)}\n\n`);
//   };

//   // Send initial SSE message to indicate connection established
//   sendEvent({ message: "Connection established" });

//   // Function to periodically send messages
//   const sendMessagesPeriodically = async () => {
//     const messages = await user.getReceivedMessages({
//       attributes: {
//         exclude: ["recipient_id", "updatedAt"],
//       },
//       order: [["createdAt", "DESC"]],
//     });

//     if (!messages || messages.length === 0) {
//       return sendEvent({ message: "No messages found" });
//     }

//     messages.forEach((message) => {
//       const formattedMessage = message.asAnonymousSender
//         ? { id: message.id, text: message.text, sentSince: message.createdAt }
//         : { ...message.toJSON(), sentSince: message.createdAt };

//       sendEvent(formattedMessage);
//     });
//   };

//   // Set interval to send messages periodically (adjust timing as needed)
//   const intervalId = setInterval(sendMessagesPeriodically, 1000);

//   // Handle client disconnect
//   req.on("close", () => {
//     console.log("Client connection closed");
//     clearInterval(intervalId); // Clear interval when client disconnects
//     res.end();
//   });
// });

// const { User, sequelize } = require('../models');

// exports.getMyReceivedMessages = async (req, res, next) => {
//   // const userId = req.user.id;

//   try {
//     // Fetch user
//     const user = await User.findByPk(60);

//     if (!user) {
//       throw new Error('User not found');
//     }

//     // Set headers for SSE
//     res.setHeader('Content-Type', 'text/event-stream');
//     res.setHeader('Cache-Control', 'no-cache');
//     res.setHeader('Connection', 'keep-alive');

//     // Function to send SSE events
//     const sendEvent = (data) => {
//       res.write(`data: ${JSON.stringify(data)}\n\n`);
//     };

//     // Send initial SSE message to indicate connection established
//     sendEvent({ message: 'Connection established' });

//     // Function to fetch and send messages
//     const sendMessages = async () => {
//       const messages = await user.getReceivedMessages({
//         attributes: {
//           exclude: ['recipient_id', 'updatedAt'],
//         },
//         order: [['createdAt', 'DESC']],
//       });

//       if (!messages || messages.length === 0) {
//         return sendEvent({ message: 'No messages found' });
//       }

//       messages.forEach((message) => {
//         const formattedMessage = message.asAnonymousSender
//           ? { id: message.id, text: message.text, sentSince: message.createdAt }
//           : { ...message.toJSON(), sentSince: message.createdAt };

//         sendEvent(formattedMessage);
//       });
//     };

//     // Fetch and send messages initially
//     await sendMessages();

//     // Set interval to fetch and send messages periodically
//     const intervalId = setInterval(sendMessages, 1000);

//     // Handle client disconnect
//     req.on('close', () => {
//       console.log('Client connection closed');
//       clearInterval(intervalId); // Clear interval when client disconnects
//       res.end();
//     });
//   } catch (err) {
//     console.error('Error in SSE controller:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// const User = require("../models/userModel"); // Make sure to import your User model

// exports.getMyReceivedMessages = async (req, res) => {
//   const userId = req.user.id;

//   const user = await User.findByPk(userId);

//   const messages = await user.getReceivedMessages({
//     attributes: {
//       exclude: ["recipient_id", "updatedAt"],
//       include: [
//         [
//           Sequelize.literal(
//             `CASE WHEN asAnonymousSender THEN NULL ELSE sender_id END`
//           ),
//           "sender_id",
//         ],
//       ],
//     },
//   });

//   res.send(messages);
// };

// const User = require('../models/userModel'); // Make sure to import your User model
// const { Sequelize, User, Message } = require('../models'); // Adjust this import based on your actual setup

exports.getMySentMessages = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const user = await User.findByPk(userId);

  const messages = await user.getSendMessages({
    attributes: {
      exclude: ["sender_id", "updatedAt"],
    },
    order: [["createdAt", "DESC"]],
  });
  if (!messages.length) return next(new AppError("No Message Found", 404));
  res.status(200).json({
    status: "success",
    numOfMessages: messages.length,
    messages,
  });
});
