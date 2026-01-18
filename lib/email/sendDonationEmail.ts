// Email notification service for donation receipts
import nodemailer from "nodemailer";

type DonationEmailParams = {
  to: string;
  amount: number;
  charityName?: string;
  transactionId?: string;
};

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 0);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error("Missing SMTP configuration");
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });

  return cachedTransporter;
}

export async function sendDonationEmail({
  to,
  amount,
  charityName,
  transactionId,
}: DonationEmailParams): Promise<void> {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!from) {
    throw new Error("Missing SMTP_FROM");
  }

  const formattedAmount = amount.toFixed(2);
  const subject = `Congrats! You reached your goal`;
  const charityLine = charityName ? `to ${charityName}` : "to your charity";
  const transactionLine = transactionId
    ? `Transaction ID: ${transactionId}`
    : "";

  const text = [
    `Congrats! You have reached your goal of $${formattedAmount} ${charityLine}.`,
    `Thank you for making a real impact.`,
    transactionLine,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <h2 style="margin: 0 0 8px;">Congrats! You reached your goal </h2>
      <p style="margin: 0 0 12px;">
        You have reached your goal of <strong>$${formattedAmount}</strong> ${charityLine}.
      </p>
      <p style="margin: 0 0 12px;">Thank you for making a real impact.</p>
      ${transactionId ? `<p style="margin: 0; color: #666;">Transaction ID: ${transactionId}</p>` : ""}
    </div>
  `;

  await getTransporter().sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}
