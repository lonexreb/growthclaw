const IMAP_HOST = process.env.IMAP_HOST;
const IMAP_USER = process.env.IMAP_USER;
const IMAP_PASS = process.env.IMAP_PASS;

interface IncomingReply {
  from: string;
  subject: string;
  body: string;
  date: string;
}

type Sentiment = "interested" | "declined" | "question";

const INTERESTED_KEYWORDS = [
  "sounds good", "interested", "tell me more", "sign up", "sign me up",
  "let's chat", "love to", "try it", "show me", "demo", "yes",
];

const DECLINED_KEYWORDS = [
  "not interested", "no thanks", "unsubscribe", "stop", "remove me",
  "don't contact", "opt out", "pass",
];

export function classifySentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  if (DECLINED_KEYWORDS.some((kw) => lower.includes(kw))) return "declined";
  if (INTERESTED_KEYWORDS.some((kw) => lower.includes(kw))) return "interested";
  return "question";
}

export async function checkReplies(
  knownEmails: string[]
): Promise<IncomingReply[]> {
  if (!IMAP_HOST || !IMAP_USER || !IMAP_PASS) {
    throw new Error(
      "IMAP not configured. Set IMAP_HOST, IMAP_USER, and IMAP_PASS in .env.local"
    );
  }

  const { ImapFlow } = await import("imapflow");
  const client = new ImapFlow({
    host: IMAP_HOST,
    port: 993,
    secure: true,
    auth: { user: IMAP_USER, pass: IMAP_PASS },
    logger: false,
  });

  await client.connect();

  const lock = await client.getMailboxLock("INBOX");
  const replies: IncomingReply[] = [];

  try {
    // Fetch envelope + text body only (not full source with attachments)
    const messages = client.fetch(
      { seen: false, since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      { envelope: true, bodyParts: ["text"] }
    );

    for await (const msg of messages) {
      const fromAddr = msg.envelope?.from?.[0]?.address || "";
      if (knownEmails.includes(fromAddr.toLowerCase())) {
        // Extract text body part — bounded, no attachments loaded
        let body = "";
        if (msg.bodyParts) {
          for (const [, value] of msg.bodyParts) {
            body = value.toString("utf-8").slice(0, 2000);
            break; // take first text part only
          }
        }
        replies.push({
          from: fromAddr,
          subject: msg.envelope?.subject || "",
          body,
          date: msg.envelope?.date?.toISOString() || new Date().toISOString(),
        });
      }
    }
  } finally {
    lock.release();
  }

  await client.logout();
  return replies;
}
