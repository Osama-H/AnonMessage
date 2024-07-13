const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const xss = require("xss-clean");

require("dotenv").config();

const AppError = require("./utils/AppError");
const swaggerDocument = require("./swagger.json");

const app = express();

const globalErrorHandler = require("./controllers/errorController");

const messageRouter = require("./routes/messageRouter");
const userRouter = require("./routes/userRouter");
const authRouter = require("./routes/authRouter");

require("./config/database");

app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(helmet());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(xss());
const limiter = rateLimit({
  // allow 100 requests from the same IP in one hour.
  max: 50,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour",
});

if (process.env.NODE_ENV === "production") {
  app.use("/api", limiter);
}

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/v1/messages", messageRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/auth", authRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} in this server !`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
