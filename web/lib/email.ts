import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SENDER_NAME = process.env.SENDER_NAME || "GrowthClaw";
const PHYSICAL_ADDRESS = process.env.PHYSICAL_ADDRESS || "Austin, TX";

const CAN_SPAM_FOOTER = `\n\n—\n${SENDER_NAME} | ${PHYSICAL_ADDRESS}\nReply "stop" to unsubscribe from future emails.`;

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "SMTP not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env.local"
    );
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

interface SendResult {
  success: boolean;
  messageId: string;
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<SendResult> {
  const fullBody = body + CAN_SPAM_FOOTER;

  const info = await getTransporter().sendMail({
    from: `"${SENDER_NAME}" <${SMTP_USER}>`,
    to,
    subject,
    text: fullBody,
  });

  return { success: true, messageId: info.messageId };
}
