// Email sending via Resend (resend.com)
// Set RESEND_API_KEY in .env to enable. Falls back to console.log if not configured.

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_EMAIL = "Premier Pro Services <noreply@gemach.app>";

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[EMAIL] (no API key — would send) To: ${params.to}, Subject: ${params.subject}`);
    return false;
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: params.to,
        subject: params.subject,
        html: params.html,
        reply_to: params.replyTo,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("[EMAIL] Resend error:", err);
      return false;
    }

    console.log(`[EMAIL] Sent to ${Array.isArray(params.to) ? params.to.join(", ") : params.to}: ${params.subject}`);
    return true;
  } catch (err) {
    console.error("[EMAIL] Failed:", err);
    return false;
  }
}

// ── Pre-built Templates ───────────────────────────────

export function orderDispatchedEmail(data: {
  customerName: string;
  orderNumber: string;
  address: string;
  service: string;
  scheduledDate: string;
}) {
  return {
    subject: `Your service has been scheduled — ${data.orderNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#2563eb;">Premier Pro Services</h2>
        <p>Hello ${data.customerName},</p>
        <p>Your service has been scheduled:</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0;">
          <tr><td style="padding:8px;background:#f8fafc;">Order #</td><td style="padding:8px;"><strong>${data.orderNumber}</strong></td></tr>
          <tr><td style="padding:8px;background:#f8fafc;">Service</td><td style="padding:8px;">${data.service}</td></tr>
          <tr><td style="padding:8px;background:#f8fafc;">Address</td><td style="padding:8px;">${data.address}</td></tr>
          <tr><td style="padding:8px;background:#f8fafc;">Date</td><td style="padding:8px;">${data.scheduledDate}</td></tr>
        </table>
        <p>We'll notify you when the technician is on the way.</p>
      </div>
    `,
  };
}

export function invoiceReadyEmail(data: {
  customerName: string;
  invoiceNumber: string;
  total: string;
  dueDate: string;
  portalLink: string;
}) {
  return {
    subject: `Invoice ${data.invoiceNumber} — ${data.total}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#2563eb;">Premier Pro Services</h2>
        <p>Hello ${data.customerName},</p>
        <p>Your invoice is ready:</p>
        <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="font-size:24px;font-weight:bold;margin:0;">${data.total}</p>
          <p style="color:#64748b;margin:4px 0;">Due: ${data.dueDate}</p>
        </div>
        <a href="${data.portalLink}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
          View & Pay Invoice
        </a>
      </div>
    `,
  };
}

export function documentSigningRequestEmail(data: {
  recipientName: string;
  documentTitle: string;
  signLink: string;
}) {
  return {
    subject: `Signature requested: ${data.documentTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#2563eb;">Premier Pro Services</h2>
        <p>Hello ${data.recipientName},</p>
        <p>You have been invited to sign: <strong>${data.documentTitle}</strong></p>
        <a href="${data.signLink}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:12px;">
          Review & Sign
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:16px;">This link expires in 30 days.</p>
      </div>
    `,
  };
}

export function documentSignedConfirmationEmail(data: {
  recipientName: string;
  documentTitle: string;
}) {
  return {
    subject: `Document signed — ${data.documentTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#16a34a;">✓ Document Signed</h2>
        <p>Hello ${data.recipientName},</p>
        <p><strong>${data.documentTitle}</strong> has been signed successfully.</p>
        <p>A copy has been saved. Thank you!</p>
      </div>
    `,
  };
}

export function onMyWayTemplate(data: {
  customerName: string;
  technicianName: string;
  vehicleName: string;
  propertyAddress: string;
  orderNumber: string;
  estimatedArrival: string;
}) {
  return {
    subject: `Technician on the way — ${data.orderNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#2563eb;">🚛 Technician En Route</h2>
        <p>Hello ${data.customerName},</p>
        <p><strong>${data.technicianName}</strong> is on the way to ${data.propertyAddress}.</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0;">
          <tr><td style="padding:8px;background:#f8fafc;">Order #</td><td style="padding:8px;"><strong>${data.orderNumber}</strong></td></tr>
          <tr><td style="padding:8px;background:#f8fafc;">Vehicle</td><td style="padding:8px;">${data.vehicleName}</td></tr>
          <tr><td style="padding:8px;background:#f8fafc;">ETA</td><td style="padding:8px;">${data.estimatedArrival}</td></tr>
        </table>
        <p style="color:#64748b;font-size:13px;">Track your technician in real-time via the customer portal.</p>
      </div>
    `,
  };
}

export function jobCompletedTemplate(data: {
  customerName: string;
  technicianName: string;
  propertyAddress: string;
  orderNumber: string;
  completedAt: string;
}) {
  return {
    subject: `Service completed — ${data.orderNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#16a34a;">✅ Service Complete</h2>
        <p>Hello ${data.customerName},</p>
        <p>Your service at <strong>${data.propertyAddress}</strong> has been completed by <strong>${data.technicianName}</strong>.</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0;">
          <tr><td style="padding:8px;background:#f8fafc;">Order #</td><td style="padding:8px;"><strong>${data.orderNumber}</strong></td></tr>
          <tr><td style="padding:8px;background:#f8fafc;">Completed</td><td style="padding:8px;">${data.completedAt}</td></tr>
        </table>
        <p>An invoice will be generated shortly. Thank you for choosing Premier Pro Services!</p>
      </div>
    `,
  };
}

export function newOrderCustomerTemplate(data: {
  customerName: string;
  orderNumber: string;
  serviceName: string;
  propertyAddress: string;
  scheduledDate?: string;
  portalLink?: string;
}) {
  return {
    subject: `New service order created — ${data.orderNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#2563eb;">Premier Pro Services</h2>
        <p>Hello ${data.customerName},</p>
        <p>A new service order has been created for you:</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0;">
          <tr><td style="padding:8px;background:#f8fafc;">Order #</td><td style="padding:8px;"><strong>${data.orderNumber}</strong></td></tr>
          <tr><td style="padding:8px;background:#f8fafc;">Service</td><td style="padding:8px;">${data.serviceName}</td></tr>
          <tr><td style="padding:8px;background:#f8fafc;">Address</td><td style="padding:8px;">${data.propertyAddress}</td></tr>
          <tr><td style="padding:8px;background:#f8fafc;">Scheduled</td><td style="padding:8px;">${data.scheduledDate || "Not scheduled"}</td></tr>
        </table>
        ${data.portalLink ? `<a href="${data.portalLink}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">View in Customer Portal</a>` : ""}
      </div>
    `,
  };
}

export function newOrderInternalTemplate(data: {
  orderNumber: string;
  customerName: string;
  serviceName: string;
  propertyAddress: string;
  scheduledDate?: string;
}) {
  return {
    subject: `New Order Created — ${data.orderNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#2563eb;">📋 New Order</h2>
        <p>A new work order has been created:</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0;">
          <tr><td style="padding:8px;background:#f8fafc;">Order #</td><td style="padding:8px;"><strong>${data.orderNumber}</strong></td></tr>
          <tr><td style="padding:8px;background:#f8fafc;">Customer</td><td style="padding:8px;">${data.customerName}</td></tr>
          <tr><td style="padding:8px;background:#f8fafc;">Service</td><td style="padding:8px;">${data.serviceName}</td></tr>
          <tr><td style="padding:8px;background:#f8fafc;">Address</td><td style="padding:8px;">${data.propertyAddress}</td></tr>
          <tr><td style="padding:8px;background:#f8fafc;">Schedule</td><td style="padding:8px;">${data.scheduledDate || "Not scheduled"}</td></tr>
        </table>
      </div>
    `,
  };
}

export function reminderTemplate(data: {
  recipientName: string;
  documentTitle: string;
  signingLink: string;
}) {
  return {
    subject: `Reminder: Signature requested for ${data.documentTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#f59e0b;">⏰ Reminder</h2>
        <p>Hello ${data.recipientName},</p>
        <p>You still need to sign: <strong>${data.documentTitle}</strong></p>
        <a href="${data.signingLink}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:12px;">
          Review & Sign Now
        </a>
      </div>
    `,
  };
}

export function sentForSignatureTemplate(data: {
  recipientName: string;
  documentTitle: string;
  signingLink: string;
  expiresAt?: string;
}) {
  return {
    subject: `Signature Request — ${data.documentTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#2563eb;">✍️ Signature Request</h2>
        <p>Hello ${data.recipientName},</p>
        <p><strong>${data.documentTitle}</strong> has been sent for your signature.</p>
        <a href="${data.signingLink}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:12px;">
          Review & Sign
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:16px;">${data.expiresAt ? `This link expires ${data.expiresAt}.` : "This link expires in 30 days."}</p>
      </div>
    `,
  };
}

export function documentSignedTemplate(data: {
  senderName: string;
  recipientName: string;
  documentTitle: string;
  signedAt: string;
  signingIp?: string;
}) {
  return {
    subject: `Signed — ${data.documentTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#16a34a;">✅ Document Signed</h2>
        <p>Hello ${data.senderName},</p>
        <p><strong>${data.recipientName}</strong> signed <strong>${data.documentTitle}</strong> on ${data.signedAt}.</p>
        <p>The signed document is now available in your records.</p>
      </div>
    `,
  };
}

export function signedConfirmationTemplate(data: {
  recipientName: string;
  documentTitle: string;
}) {
  return {
    subject: `Signed Confirmation — ${data.documentTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#16a34a;">✅ Signed Confirmation</h2>
        <p>Hello ${data.recipientName},</p>
        <p>Thank you for signing <strong>${data.documentTitle}</strong>.</p>
        <p>A copy has been saved for your records.</p>
      </div>
    `,
  };
}

export function viewedDocumentTemplate(data: {
  senderName: string;
  recipientName: string;
  documentTitle: string;
  viewedAt: string;
}) {
  return {
    subject: `Document Viewed — ${data.documentTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#2563eb;">👁️ Document Viewed</h2>
        <p>Hello ${data.senderName},</p>
        <p><strong>${data.recipientName}</strong> viewed <strong>${data.documentTitle}</strong> on ${data.viewedAt}.</p>
      </div>
    `,
  };
}
