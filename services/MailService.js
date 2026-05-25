const nodemailer = require("nodemailer");

class Mail {
  constructor() {
    this.driver = process.env.MAIL_DRIVER || "logs";
    console.log(`[MailService] Initializing with driver: ${this.driver}`);

    if (this.driver === "smtp") {
      if (!process.env.SMTP_HOST)
        throw new Error("SMTP_HOST is not defined in environment variables");
      if (!process.env.STARTTLS_PORT)
        throw new Error(
          "STARTTLS_PORT is not defined in environment variables",
        );
      if (!process.env.SMTP_USER)
        throw new Error("SMTP_USER is not defined in environment variables");
      if (!process.env.SMTP_PASS)
        throw new Error("SMTP_PASS is not defined in environment variables");
      if (!process.env.FROM_EMAIL)
        throw new Error("FROM_EMAIL is not defined in environment variables");

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.STARTTLS_PORT,
        secure: false,
        requireTLS: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      console.log(
        `[MailService] SMTP configured for ${process.env.SMTP_HOST}:${process.env.STARTTLS_PORT}`,
      );
    }
  }
  async sendMail({ to, subject, html }) {
    if (this.driver === "smtp") {
      try {
        console.log(`[MailService] Attempting to send email to: ${to}`);
        const mail = await this.transporter.sendMail({
          from: process.env.FROM_EMAIL,
          to,
          subject,
          html,
        });
        console.log(
          `[MailService] ✓ Email sent successfully to ${to}, MessageID: ${mail.messageId}`,
        );
        return { success: true, messageId: mail.messageId };
      } catch (error) {
        console.error(`[MailService] ✗ Failed to send email to ${to}`);
        console.error(`[MailService] Error Code: ${error.code}`);
        console.error(`[MailService] Error Message: ${error.message}`);
        console.error(`[MailService] Full Error:`, error);
        throw error;
      }
    } else if (this.driver === "logs") {
      console.log(`[MAIL LOG] To: ${to}, Subject: ${subject}`);
      console.log(`[MAIL LOG] HTML Content: ${html}`);
      return { success: true, driver: "logs" };
    }
    return { success: false, error: "Unknown mail driver" };
  }
}

module.exports = Mail;
