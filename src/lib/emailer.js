// emailer.js
const nodemailer = require("nodemailer");

if (!process.env.NEXTAUTH_URL) {
  const transporter = nodemailer.createTransport({
    host: "localhost",
    port: 7777,
    secure: false,
  });
  console.log("mailer, local");

  module.exports = transporter;
} else {
  let transporter = nodemailer.createTransport({
    sendmail: true,
    newline: "unix",
    path: "/usr/sbin/sendmail",
  });
  console.log("mailer, sendmail");

  module.exports = transporter;
}
