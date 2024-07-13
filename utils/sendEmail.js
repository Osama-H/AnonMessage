const nodemailer = require("nodemailer");

module.exports = class Email {
  constructor(user, resetToken, req) {
    this.user = user;
    this.from = "Osama Eljamala <osamaeljamala@gmail.com>";
    this.resetToken = resetToken;
    this.protocol = req.protocol;
    this.host = req.host;
  }

  newTransport() {
    const transporter = nodemailer.createTransport({
      service: "SendinBlue",
      auth: {
        user: process.env.SENDGRID_USERNAME,
        pass: process.env.SENDGRID_PASSWORD,
      },
    });

    return transporter;
  }

  async sendResetToken() {
    const resetUrl = `${this.protocol}://${this.host}:3000/api/v1/users/resetPassword/${this.resetToken}`;
    const mailOptions = {
      from: this.from,
      to: this.user.email,
      subject: "Password Reset Request",
      text: `Dear ${this.user.name},

We received a request to reset your password. Please use the following link to reset your password. Note that this link is valid for only 10 minutes:

${resetUrl}

If you did not request a password reset, please ignore this email or contact support if you have any concerns.

Best regards,
Osama Eljamala
`,
    };
    await this.newTransport().sendMail(mailOptions);
  }
};
