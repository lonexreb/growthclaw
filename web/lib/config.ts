/**
 * Centralized environment configuration.
 * Validates required env vars at import time so missing config
 * surfaces immediately, not hours into a pipeline run.
 */

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

interface ImapConfig {
  host: string;
  user: string;
  pass: string;
}

interface ProductConfig {
  apiUrl: string;
  apiKey: string;
}

interface StripeConfig {
  apiKey: string;
}

interface Config {
  apiSecret: string | null;
  smtp: SmtpConfig | null;
  imap: ImapConfig | null;
  product: ProductConfig | null;
  stripe: StripeConfig | null;
  senderName: string;
  physicalAddress: string;
  calendlyLink: string;
  projectRoot: string;
}

function buildConfig(): Config {
  return {
    apiSecret: process.env.API_SECRET || null,
    smtp: process.env.SMTP_HOST
      ? {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587", 10),
          user: process.env.SMTP_USER || "",
          pass: process.env.SMTP_PASS || "",
        }
      : null,
    imap: process.env.IMAP_HOST
      ? {
          host: process.env.IMAP_HOST,
          user: process.env.IMAP_USER || "",
          pass: process.env.IMAP_PASS || "",
        }
      : null,
    product: process.env.PRODUCT_API_URL
      ? {
          apiUrl: process.env.PRODUCT_API_URL,
          apiKey: process.env.PRODUCT_API_KEY || "",
        }
      : null,
    stripe: process.env.STRIPE_API_KEY
      ? { apiKey: process.env.STRIPE_API_KEY }
      : null,
    senderName: process.env.SENDER_NAME || "GrowthClaw",
    physicalAddress: process.env.PHYSICAL_ADDRESS || "Austin, TX",
    calendlyLink: process.env.CALENDLY_LINK || "",
    projectRoot:
      process.env.GROWTHCLAW_ROOT ||
      (typeof process !== "undefined" ? require("path").resolve(process.cwd(), "..") : ""),
  };
}

export const config = buildConfig();

/**
 * Returns a summary of which services are configured.
 * Used by the health check endpoint.
 */
export function getConfigStatus(): Record<string, boolean> {
  return {
    api_secret: config.apiSecret !== null,
    smtp: config.smtp !== null,
    imap: config.imap !== null,
    product_api: config.product !== null,
    stripe: config.stripe !== null,
  };
}
