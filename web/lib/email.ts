import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

const CAN_SPAM_FOOTER = `\n\n—\nCrowdstake AI | Austin, TX\nReply "stop" to unsubscribe from future emails.`;

const isConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
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
  method: "smtp" | "logged";
  messageId?: string;
  error?: string;
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<SendResult> {
  const fullBody = body + CAN_SPAM_FOOTER;

  if (!isConfigured) {
    // Fallback: log the email instead of sending
    const logEntry = {
      to,
      subject,
      body: fullBody,
      timestamp: new Date().toISOString(),
      method: "logged" as const,
    };
    console.info("[email] SMTP not configured, logging:", logEntry.to, logEntry.subject);
    return { success: true, method: "logged" };
  }

  try {
    const info = await getTransporter().sendMail({
      from: SMTP_USER,
      to,
      subject,
      text: fullBody,
    });
    return { success: true, method: "smtp", messageId: info.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, method: "smtp", error: message };
  }
}

export function isEmailConfigured(): boolean {
  return isConfigured;
}
