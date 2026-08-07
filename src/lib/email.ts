import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer; contentType: string }[];
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "noreply@premierproservices.com";

  if (!host || !user || !pass) {
    return null;
  }

  return {
    transporter: nodemailer.createTransport({
      host,
      port: parseInt(port || "587"),
      secure: port === "465",
      auth: { user, pass },
    }),
    from,
  };
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const cfg = getTransporter();

  if (!cfg) {
    // SMTP not configured — log to console in dev
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`[EMAIL] To: ${options.to}`);
    console.log(`[EMAIL] Subject: ${options.subject}`);
    console.log(`[EMAIL] Body: ${options.html.substring(0, 200)}...`);
    if (options.attachments?.length) {
      console.log(`[EMAIL] Attachments: ${options.attachments.length}`);
    }
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    // In dev, treat as success so the app works without SMTP
    return process.env.NODE_ENV === "production" ? false : true;
  }

  try {
    await cfg.transporter.sendMail({
      from: cfg.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });
    return true;
  } catch (error) {
    console.error("[EMAIL] Send failed:", error);
    return false;
  }
}

// ── Email Templates ──────────────────────────────────

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.6; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 24px; }
    .header { text-align: center; padding-bottom: 24px; border-bottom: 2px solid #2563eb; margin-bottom: 32px; }
    .header h1 { font-size: 20px; color: #0f172a; margin: 0; }
    .header .brand { font-size: 13px; color: #2563eb; font-weight: 600; }
    .content { font-size: 14px; }
    .content p { margin-bottom: 14px; }
    .button { display: inline-block; background: #2563eb; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 16px 0; }
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px; }
    .info-box row { display: flex; justify-content: space-between; padding: 4px 0; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">Premier Pro Services</div>
      <h1>HR Document System</h1>
    </div>
    ${content}
    <div class="footer">
      <p>This is an automated message from Premier Pro Services. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;

const baseCustomerTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.6; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 24px; }
    .header { text-align: center; padding-bottom: 24px; border-bottom: 2px solid #2563eb; margin-bottom: 32px; }
    .header h1 { font-size: 20px; color: #0f172a; margin: 0; }
    .header .brand { font-size: 13px; color: #2563eb; font-weight: 600; }
    .content { font-size: 14px; }
    .content p { margin-bottom: 14px; }
    .button { display: inline-block; background: #2563eb; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 16px 0; }
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px; }
    .info-box row { display: flex; justify-content: space-between; padding: 4px 0; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">Premier Pro Services</div>
      <h1>Service Confirmation</h1>
    </div>
    ${content}
    <div class="footer">
      <p>This is an automated message from Premier Pro Services. If you have questions, please call our office.</p>
    </div>
  </div>
</body>
</html>`;

export function sentForSignatureTemplate(params: {
  recipientName: string;
  documentTitle: string;
  signingLink: string;
  expiresAt?: Date;
}) {
  return baseTemplate(`
    <div class="content">
      <p>Dear <strong>${params.recipientName}</strong>,</p>
      <p>A document is ready for your electronic signature: <strong>${params.documentTitle}</strong></p>
      <div class="info-box">
        <row><span>Document:</span><strong>${params.documentTitle}</strong></row>
        <row><span>From:</span><strong>Premier Pro Services</strong></row>
        ${params.expiresAt ? `<row><span>Expires:</span><strong>${params.expiresAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong></row>` : ""}
      </div>
      <p style="text-align:center;">
        <a href="${params.signingLink}" class="button">Review &amp; Sign Document</a>
      </p>
      <p style="font-size:12px; color:#64748b;">This link is unique to you. Do not share it with anyone.</p>
    </div>
  `);
}

export function viewedDocumentTemplate(params: {
  senderName: string;
  recipientName: string;
  documentTitle: string;
  viewedAt: string;
}) {
  return baseTemplate(`
    <div class="content">
      <p>Dear <strong>${params.senderName}</strong>,</p>
      <p><strong>${params.recipientName}</strong> has viewed the document <strong>${params.documentTitle}</strong> on ${params.viewedAt}.</p>
      <p>They can now review and sign at their convenience.</p>
    </div>
  `);
}

export function documentSignedTemplate(params: {
  senderName: string;
  recipientName: string;
  documentTitle: string;
  signedAt: string;
  signingIp?: string;
}) {
  return baseTemplate(`
    <div class="content">
      <p>Dear <strong>${params.senderName}</strong>,</p>
      <p><strong>${params.recipientName}</strong> has signed <strong>${params.documentTitle}</strong>.</p>
      <div class="info-box">
        <row><span>Signed at:</span><strong>${params.signedAt}</strong></row>
        ${params.signingIp ? `<row><span>IP Address:</span><strong>${params.signingIp}</strong></row>` : ""}
      </div>
      <p>The signed document is now available in the HR dashboard.</p>
    </div>
  `);
}

export function signedConfirmationTemplate(params: {
  recipientName: string;
  documentTitle: string;
}) {
  return baseTemplate(`
    <div class="content">
      <p>Dear <strong>${params.recipientName}</strong>,</p>
      <p>Thank you! You have successfully signed <strong>${params.documentTitle}</strong>.</p>
      <p>A copy has been sent to Premier Pro Services. If you have any questions, please contact HR.</p>
    </div>
  `);
}

export function declinedDocumentTemplate(params: {
  senderName: string;
  recipientName: string;
  documentTitle: string;
  declinedAt: string;
}) {
  return baseTemplate(`
    <div class="content">
      <p>Dear <strong>${params.senderName}</strong>,</p>
      <p><strong>${params.recipientName}</strong> has <strong>declined</strong> to sign <strong>${params.documentTitle}</strong> on ${params.declinedAt}.</p>
      <p>Please follow up directly with the recipient.</p>
    </div>
  `);
}

// ── Customer Notifications ──────────────────────────

export function onMyWayTemplate(params: {
  customerName: string;
  technicianName: string;
  vehicleName: string;
  propertyAddress: string;
  orderNumber: string;
  estimatedArrival: string;
}) {
  return baseCustomerTemplate(`
    <div class="content">
      <p>Dear <strong>${params.customerName}</strong>,</p>
      <p>Great news! <strong>${params.technicianName}</strong> is on the way to your property in <strong>${params.vehicleName}</strong>.</p>
      <div class="info-box">
        <row><span>Order:</span><strong>${params.orderNumber}</strong></row>
        <row><span>Location:</span><strong>${params.propertyAddress}</strong></row>
        <row><span>ETA:</span><strong>${params.estimatedArrival}</strong></row>
      </div>
      <p>If you need to reach us, please call the office or reply to this email.</p>
    </div>
  `);
}

export function jobCompletedTemplate(params: {
  customerName: string;
  technicianName: string;
  propertyAddress: string;
  orderNumber: string;
  completedAt: string;
}) {
  return baseCustomerTemplate(`
    <div class="content">
      <p>Dear <strong>${params.customerName}</strong>,</p>
      <p>Your service at <strong>${params.propertyAddress}</strong> has been completed by <strong>${params.technicianName}</strong>.</p>
      <div class="info-box">
        <row><span>Order:</span><strong>${params.orderNumber}</strong></row>
        <row><span>Completed:</span><strong>${params.completedAt}</strong></row>
      </div>
      <p>An invoice will be sent shortly. Thank you for choosing Premier Pro Services!</p>
    </div>
  `);
}

export function reminderTemplate(params: {
  recipientName: string;
  documentTitle: string;
  signingLink: string;
}) {
  return baseTemplate(`
    <div class="content">
      <p>Dear <strong>${params.recipientName}</strong>,</p>
      <p>This is a friendly reminder that <strong>${params.documentTitle}</strong> is still awaiting your signature.</p>
      <p style="text-align:center;">
        <a href="${params.signingLink}" class="button">Review &amp; Sign Now</a>
      </p>
      <p style="font-size:12px; color:#64748b;">If you have already signed this document, please disregard this message.</p>
    </div>
  `);
}

// ── Order Notifications ─────────────────────────────

export function newOrderCustomerTemplate(params: {
  customerName: string;
  orderNumber: string;
  propertyAddress: string;
  serviceName: string;
  scheduledDate?: string;
}) {
  return baseCustomerTemplate(`
    <div class="content">
      <p>Dear <strong>${params.customerName}</strong>,</p>
      <p>Thank you for placing your service order with Premier Pro Services! We've received your request and our team will review it shortly.</p>
      <div class="info-box">
        <row><span>Order:</span><strong>${params.orderNumber}</strong></row>
        <row><span>Service:</span><strong>${params.serviceName}</strong></row>
        <row><span>Location:</span><strong>${params.propertyAddress}</strong></row>
        ${params.scheduledDate ? `<row><span>Requested Date:</span><strong>${params.scheduledDate}</strong></row>` : ""}
      </div>
      <p>We'll contact you to confirm scheduling. You can track your order status anytime in your <a href="https://premier-pro-services.vercel.app/portal">customer portal</a>.</p>
    </div>
  `);
}

export function newOrderInternalTemplate(params: {
  customerName: string;
  orderNumber: string;
  propertyAddress: string;
  serviceName: string;
  scheduledDate?: string;
}) {
  return baseTemplate(`
    <div class="content">
      <div class="header" style="padding-bottom:16px; border-bottom:1px solid #e2e8f0; margin-bottom:20px;">
        <div class="brand">Premier Pro Services</div>
        <h1>New Order Received</h1>
      </div>
      <p>A new service order has been placed via the customer portal.</p>
      <div class="info-box">
        <row><span>Order:</span><strong>${params.orderNumber}</strong></row>
        <row><span>Customer:</span><strong>${params.customerName}</strong></row>
        <row><span>Service:</span><strong>${params.serviceName}</strong></row>
        <row><span>Location:</span><strong>${params.propertyAddress}</strong></row>
        ${params.scheduledDate ? `<row><span>Requested Date:</span><strong>${params.scheduledDate}</strong></row>` : ""}
      </div>
      <p style="text-align:center;">
        <a href="https://premier-pro-services.vercel.app/orders" class="button">View in Dashboard</a>
      </p>
    </div>
  `);
}
