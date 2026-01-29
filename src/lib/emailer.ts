import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

let transporter;
if (
  !process.env.RESEND_API_KEY
  //  !process.env.NEXTAUTH_URL ||
  //  process.env.NEXTAUTH_URL === "http://localhost:3000"
) {
  //console.log("---- not using resend");
  // emailer.js
  const nodemailer = require("nodemailer");
  transporter = nodemailer.createTransport({
    host: "localhost",
    port: 7777,
    secure: false,
  });
} else {
  const sendMail = (mail: Parameters<typeof resend.emails.send>[0]) => {
    //console.log("---- sendMail");
    return resend.emails.send(mail);
  };
  transporter = {
    sendMail,
  };
}

export default transporter;
