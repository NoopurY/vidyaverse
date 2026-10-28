/** pdf-lib generators: signed student record, sample degree certificate, tabular report export. */
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";

const NAVY = rgb(11 / 255, 61 / 255, 145 / 255);
const SAFFRON = rgb(1, 0.6, 0.2);
const GREEN = rgb(19 / 255, 136 / 255, 8 / 255);
const MUTED = rgb(0.37, 0.42, 0.48);
const INK = rgb(0.1, 0.1, 0.1);

// Standard fonts are WinAnsi-only: strip anything they cannot encode (e.g. Devanagari, ₹)
const safe = (s: unknown) =>
  String(s ?? "")
    .replace(/₹/g, "Rs.")
    .replace(/[^\x20-\x7E -ÿ]/g, "");

function tricolour(page: PDFPage) {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: height - 4, width: width / 3, height: 4, color: SAFFRON });
  page.drawRectangle({ x: width / 3, y: height - 4, width: width / 3, height: 4, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: (2 * width) / 3, y: height - 4, width: width / 3, height: 4, color: GREEN });
}

function header(page: PDFPage, bold: PDFFont, font: PDFFont, title: string) {
  const { width, height } = page.getSize();
  tricolour(page);
  page.drawText("All India Council for Technical Education", { x: 40, y: height - 36, size: 10, font, color: MUTED });
  page.drawText("APAAR Student Data & Verification Portal", { x: 40, y: height - 54, size: 14, font: bold, color: NAVY });
  page.drawText(safe(title), { x: 40, y: height - 80, size: 12, font: bold, color: INK });
  page.drawLine({ start: { x: 40, y: height - 90 }, end: { x: width - 40, y: height - 90 }, thickness: 1, color: rgb(0.87, 0.89, 0.92) });
}

async function qrPng(text: string) {
  const dataUrl = await QRCode.toDataURL(text, { errorCorrectionLevel: "L", margin: 1, width: 360 });
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const out: string[] = [];
  let line = "";
  for (const ch of safe(text)) {
    if (font.widthOfTextAtSize(line + ch, size) > maxWidth) {
      out.push(line);
      line = ch;
    } else line += ch;
  }
  if (line) out.push(line);
  return out;
}

export async function signedRecordPdf(p: {
  fields: [string, string][];
  qrText: string;
  credentialId: string;
  issuer: string;
  issuedAt: string;
  signature: string;
}) {
  const doc = await PDFDocument.create();
  doc.setTitle("AICTE Verified Student Record");
  doc.setAuthor("AICTE");
  doc.setSubject(`W3C Verifiable Credential ${p.credentialId}`);
  doc.setKeywords(["APAAR", "verifiable credential", p.credentialId]);
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  header(page, bold, font, "Verified Student Record (W3C Verifiable Credential)");
  let y = 720;
  for (const [k, v] of p.fields) {
    page.drawText(safe(k), { x: 40, y, size: 10, font, color: MUTED });
    page.drawText(safe(v), { x: 180, y, size: 11, font: bold, color: INK });
    y -= 24;
  }
  const png = await doc.embedPng(await qrPng(p.qrText));
  page.drawImage(png, { x: 395, y: 560, width: 160, height: 160 });
  page.drawText("Scan to verify", { x: 440, y: 548, size: 9, font, color: MUTED });

  y -= 16;
  page.drawRectangle({ x: 40, y: y - 150, width: 515, height: 160, borderColor: rgb(0.87, 0.89, 0.92), borderWidth: 1 });
  page.drawText("Digital signature", { x: 52, y: y - 10, size: 11, font: bold, color: NAVY });
  const meta = [
    `Credential ID: ${p.credentialId}`,
    `Issuer: ${p.issuer}`,
    `Issued: ${p.issuedAt}`,
    "Algorithm: Ed25519 (EdDSA), format: vc+sd-jwt (W3C VC Data Model 2.0)",
  ];
  meta.forEach((m, i) => page.drawText(safe(m), { x: 52, y: y - 30 - i * 15, size: 9, font, color: INK }));
  wrap(`Signature: ${p.signature}`, font, 7, 490)
    .slice(0, 4)
    .forEach((l, i) => page.drawText(l, { x: 52, y: y - 96 - i * 10, size: 7, font, color: MUTED }));
  page.drawText("Verify at the AICTE portal /verify or by scanning the QR code. Revoked credentials fail verification.", {
    x: 40,
    y: 60,
    size: 8,
    font,
    color: MUTED,
  });
  return doc.save();
}

export async function certificatePdf(p: {
  studentName: string;
  apaarId: string;
  studentId: string;
  program: string;
  institution: string;
  year: string;
  qrText: string;
}) {
  const doc = await PDFDocument.create();
  doc.setTitle("Sample Degree Certificate (Preview)");
  const page = doc.addPage([842, 595]);
  const { width, height } = page.getSize();
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, borderColor: NAVY, borderWidth: 3 });
  page.drawRectangle({ x: 28, y: 28, width: width - 56, height: height - 56, borderColor: SAFFRON, borderWidth: 1 });
  const center = (t: string, y: number, size: number, f: PDFFont, color = INK) => {
    const s = safe(t);
    page.drawText(s, { x: (width - f.widthOfTextAtSize(s, size)) / 2, y, size, font: f, color });
  };
  center(p.institution, height - 90, 22, bold, NAVY);
  center("SAMPLE - NOT A VALID DEGREE - PREVIEW ONLY", height - 115, 10, sans, rgb(0.78, 0.16, 0.16));
  center("This is to certify that", height - 170, 14, font);
  center(p.studentName, height - 210, 28, bold);
  center(`has been awarded the degree of ${p.program}`, height - 250, 14, font);
  center(`Academic year of admission: ${p.year}`, height - 275, 12, font, MUTED);
  page.drawText(safe(`APAAR ID: ${p.apaarId}`), { x: 70, y: 120, size: 12, font: bold });
  page.drawText(safe(`Institution Student ID: ${p.studentId}`), { x: 70, y: 100, size: 12, font: bold });
  page.drawText("Verify authenticity by scanning the QR code (AICTE VidyaVerse).", { x: 70, y: 70, size: 9, font: sans, color: MUTED });
  const png = await doc.embedPng(await qrPng(p.qrText));
  page.drawImage(png, { x: width - 200, y: 60, width: 130, height: 130 });
  return doc.save();
}

export async function tablePdf(title: string, columns: { key: string; label: string }[], rows: Record<string, unknown>[], filtersText: string) {
  const doc = await PDFDocument.create();
  doc.setTitle(title);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const W = 842;
  const H = 595;
  const usable = W - 80;
  const colW = usable / columns.length;
  const size = columns.length > 8 ? 7 : 8;
  const cell = (s: unknown) => {
    let t = safe(s);
    while (t.length > 1 && font.widthOfTextAtSize(t, size) > colW - 6) t = t.slice(0, -2) + "…".replace("…", ".");
    return t;
  };
  let page = doc.addPage([W, H]);
  header(page, bold, font, title);
  page.drawText(safe(filtersText), { x: 40, y: H - 104, size: 8, font, color: MUTED });
  let y = H - 125;
  const drawHead = () => {
    page.drawRectangle({ x: 40, y: y - 4, width: usable, height: 16, color: rgb(232 / 255, 238 / 255, 249 / 255) });
    columns.forEach((c, i) => page.drawText(cell(c.label), { x: 43 + i * colW, y, size, font: bold, color: NAVY }));
    y -= 18;
  };
  drawHead();
  for (const r of rows) {
    if (y < 40) {
      page = doc.addPage([W, H]);
      tricolour(page);
      y = H - 40;
      drawHead();
    }
    columns.forEach((c, i) => page.drawText(cell(r[c.key]), { x: 43 + i * colW, y, size, font, color: INK }));
    y -= 14;
  }
  page.drawText(`Generated ${new Date().toISOString()} - Content owned by AICTE`, { x: 40, y: 20, size: 7, font, color: MUTED });
  return doc.save();
}
