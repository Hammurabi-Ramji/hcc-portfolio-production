"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sendWelcomeEmail = exports.sendPasswordResetEmail = exports.sendEmail = void 0;
var nodemailer = _interopRequireWildcard(require("nodemailer"));
var _logger = require("../utils/logger.js");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
// Create transporter (for development, we'll use a mock)
const createTransporter = () => {
  // In development, we'll just log emails instead of sending them
  if (process.env.NODE_ENV === "development") {
    return {
      sendMail: async mailOptions => {
        var _mailOptions$text;
        _logger.logger.info("📧 [DEV MODE] Email would be sent:", {
          to: mailOptions.to,
          subject: mailOptions.subject,
          text: ((_mailOptions$text = mailOptions.text) === null || _mailOptions$text === void 0 ? void 0 : _mailOptions$text.substring(0, 100)) + "..."
        });
        return {
          messageId: "dev-mode-" + Date.now()
        };
      }
    };
  }

  // Production configuration would go here
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};
const transporter = createTransporter();

// Send email function
const sendEmail = async (to, subject, text, html = null) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@radixlabs.com",
      to,
      subject,
      text,
      ...(html && {
        html
      })
    };
    const result = await transporter.sendMail(mailOptions);
    _logger.logger.info("✅ Email sent successfully:", {
      to,
      subject,
      messageId: result.messageId
    });
    return result;
  } catch (error) {
    _logger.logger.error("❌ Failed to send email:", error);
    throw error;
  }
};

// Specific email templates
exports.sendEmail = sendEmail;
const sendWelcomeEmail = async user => {
  const subject = "Welcome to Radix Labs ERP System";
  const text = `
    Welcome ${user.firstName} ${user.lastName}!

    Your account has been created successfully.
    Email: ${user.email}
    Role: ${user.role}

    You can now log in to the system at ${process.env.FRONTEND_URL || "http://localhost:3000"}

    Best regards,
    Radix Labs Team
  `;
  return sendEmail(user.email, subject, text);
};
exports.sendWelcomeEmail = sendWelcomeEmail;
const sendPasswordResetEmail = async (user, resetToken) => {
  const subject = "Password Reset Request";
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
  const text = `
    Hello ${user.firstName},

    You requested a password reset for your Radix Labs ERP account.

    Click the link below to reset your password:
    ${resetUrl}

    This link will expire in 1 hour.

    If you didn't request this, please ignore this email.

    Best regards,
    Radix Labs Team
  `;
  return sendEmail(user.email, subject, text);
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;