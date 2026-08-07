import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Generates a signed PDF from an HTML document by creating a clean PDF
 * with the signature embedded. For uploaded PDFs, the signature is overlaid.
 *
 * Strategy:
 * - HTML docs: We render the signature on a dedicated page appended to a generated PDF
 * - Uploaded PDFs: We overlay the signature block onto the last page
 */
export async function generateSignedPdf(params: {
  documentTitle: string;
  content: string; // HTML content
  signatureSvg: string; // SVG signature markup
  signerName: string;
  signedAt: string;
  signerIp?: string;
}): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // ── Page 1: Document Cover / Summary ──────────────
  let page = pdfDoc.addPage([612, 792]); // US Letter
  let y = 720;

  function drawLine(text: string, size = 12, bold = false) {
    if (y < 60) {
      page = pdfDoc.addPage([612, 792]);
      y = 750;
    }
    const f = bold ? fontBold : font;
    page.drawText(text, { x: 50, y, size, font: f, color: rgb(0.1, 0.1, 0.2) });
    y -= size + 6;
  }

  function drawSpacer(h = 16) {
    y -= h;
    if (y < 60) {
      page = pdfDoc.addPage([612, 792]);
      y = 750;
    }
  }

  drawLine("Premier Pro Services", 18, true);
  drawLine("Signed Document", 14, true);
  drawSpacer(20);

  drawLine(`Document: ${params.documentTitle}`, 12, true);
  drawSpacer(8);

  drawLine("─".repeat(60), 10);
  drawSpacer(12);

  drawLine(`Signed by: ${params.signerName}`, 13);
  drawLine(`Date: ${params.signedAt}`, 13);
  if (params.signerIp) drawLine(`IP Address: ${params.signerIp}`, 13);
  drawSpacer(20);

  drawLine("Signature:", 12, true);
  drawSpacer(8);

  // ── Render signature as text since we can't easily render SVG in pdf-lib ──
  // In a production system, we'd convert SVG to PNG first, then embed the image
  // For now, embed a stylized signature block
  drawSpacer(10);
  page.drawRectangle({
    x: 50,
    y: y - 60,
    width: 250,
    height: 70,
    borderColor: rgb(0.15, 0.15, 0.3),
    borderWidth: 1,
    color: rgb(0.98, 0.98, 0.99),
  });

  // Render the SVG signature as text (extract path data approximation)
  // For a real implementation, convert SVG -> PNG using a renderer
  const sigText = extractSignatureText(params.signatureSvg);
  if (sigText) {
    page.drawText(sigText, {
      x: 60,
      y: y - 20,
      size: 28,
      font: await pdfDoc.embedFont(StandardFonts.Courier),
      color: rgb(0.1, 0.2, 0.5),
    });
  }

  page.drawText(params.signerName, {
    x: 60,
    y: y - 50,
    size: 11,
    font,
    color: rgb(0.3, 0.3, 0.4),
  });

  drawSpacer(80);

  // ── Document Content (simplified HTML → text extract) ──
  drawLine("─".repeat(60), 10);
  drawSpacer(8);
  drawLine("Document Content:", 12, true);
  drawSpacer(8);

  // Strip HTML tags and render as plain text
  const textContent = stripHtml(params.content);
  const lines = textContent.split("\n").filter(Boolean);
  for (const line of lines.slice(0, 80)) {
    if (line.trim()) drawLine(line.trim(), 10);
  }

  // ── Footer ──
  drawSpacer(20);
  drawLine("─".repeat(60), 10);
  drawLine(`Generated ${params.signedAt} — Electronically signed via Premier Pro Services`, 8);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Overlay signature onto an existing uploaded PDF
 */
export async function overlaySignatureOnPdf(params: {
  pdfBuffer: Buffer;
  signatureSvg: string;
  signerName: string;
  signedAt: string;
  signerIp?: string;
}): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(params.pdfBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  const { height } = lastPage.getSize();

  // Draw signature block at the bottom of the last page
  const sigY = 120;

  lastPage.drawRectangle({
    x: 40,
    y: sigY - 60,
    width: 260,
    height: 80,
    borderColor: rgb(0.15, 0.15, 0.3),
    borderWidth: 1,
    color: rgb(0.98, 0.98, 0.99),
  });

  lastPage.drawText("Electronically Signed:", {
    x: 50,
    y: sigY + 5,
    size: 10,
    font: fontBold,
    color: rgb(0.3, 0.3, 0.4),
  });

  const sigText = extractSignatureText(params.signatureSvg);
  if (sigText) {
    lastPage.drawText(sigText, {
      x: 50,
      y: sigY - 15,
      size: 24,
      font: await pdfDoc.embedFont(StandardFonts.Courier),
      color: rgb(0.1, 0.2, 0.5),
    });
  }

  lastPage.drawText(params.signerName, {
    x: 50,
    y: sigY - 40,
    size: 11,
    font,
    color: rgb(0.3, 0.3, 0.4),
  });

  lastPage.drawText(`Signed: ${params.signedAt}${params.signerIp ? `  |  IP: ${params.signerIp}` : ""}`, {
    x: 50,
    y: sigY - 55,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.6),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// ── Helpers ──────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, "\n")
    .trim();
}

function extractSignatureText(svg: string): string {
  // Extract any text elements from the SVG
  const match = svg.match(/<text[^>]*>([^<]*)<\/text>/);
  return match ? match[1].trim() : "";
}
