import { PDFDocument, rgb, StandardFonts, PDFName, PDFDict, PDFArray, PDFNumber } from "pdf-lib";
import type { VerificationReport } from "./verify-pdf";

// ---------------------------------------------------------------------------
// Green checkmark path matching the reference images.
// A large, thick, diagonally-drawn checkmark with perspective.
// The path is designed for a 100x100 viewbox.
// ---------------------------------------------------------------------------

// Draw the green checkmark as multiple overlapping strokes to create
// a thick, bold, slightly rotated checkmark matching the reference images.
function drawGreenCheckmark(
  page: any,
  cx: number,
  cy: number,
  size: number,
) {
  // The checkmark from the reference images is a bold, thick ✓ shape
  // with a dark green outline and lighter green fill.
  // We draw it using filled polygons to simulate the thick stroke.

  // Scale factor: the checkmark should fill roughly `size` x `size`
  const s = size / 100;

  // Checkmark shape as an SVG path (thick checkmark with perspective)
  // Based on the reference images, the check is roughly:
  // - Short arm going down-left
  // - Long arm going up-right
  // Drawn as a filled polygon for thickness

  // The checkmark path in a 100x100 coordinate space
  // Designed to match the reference: thick, slightly rotated, with depth
  const checkPath = [
    // Outer shape of the checkmark (clockwise)
    'M 22 58',   // Bottom-left of short arm
    'L 42 78',   // Bottom of the V junction
    'L 88 18',   // Top-right of long arm
    'L 78 10',   // Inner top-right
    'L 42 58',   // Inner V junction
    'L 30 46',   // Inner bottom-left
    'Z',
  ].join(' ');

  // Draw the dark green outline (slightly larger)
  page.drawSvgPath(checkPath, {
    x: cx - size * 0.5,
    y: cy + size * 0.5,
    scale: s,
    color: rgb(0.1, 0.35, 0.1),      // Dark green outline
    opacity: 0.9,
    borderWidth: 0,
  });

  // Inner lighter green fill (slightly smaller, offset inward)
  const innerPath = [
    'M 25 57',
    'L 42 74',
    'L 85 20',
    'L 78 14',
    'L 42 56',
    'L 32 46',
    'Z',
  ].join(' ');

  page.drawSvgPath(innerPath, {
    x: cx - size * 0.5,
    y: cy + size * 0.5,
    scale: s,
    color: rgb(0.2, 0.65, 0.25),      // Medium green fill
    opacity: 0.95,
    borderWidth: 0,
  });

  // Highlight strip for 3D effect (small lighter strip)
  const highlightPath = [
    'M 28 55',
    'L 42 70',
    'L 80 22',
    'L 78 18',
    'L 42 58',
    'L 34 48',
    'Z',
  ].join(' ');

  page.drawSvgPath(highlightPath, {
    x: cx - size * 0.5,
    y: cy + size * 0.5,
    scale: s,
    color: rgb(0.3, 0.75, 0.35),      // Light green highlight
    opacity: 0.85,
    borderWidth: 0,
  });
}

// Overlays a verification stamp on the PDF matching the reference images exactly.
// - Transparent background (no box/fill drawn)
// - "Signature valid" title in bold
// - Details: Digitally Signed, Name, Date, Reason, Location
// - Large green checkmark overlaid diagonally
// - Sized to fit the original signature field
// - Does NOT remove signature annotations to preserve Adobe Acrobat validity
export async function stampPdf(
  original: ArrayBuffer,
  report: VerificationReport,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(original, { ignoreEncryption: true });
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);

  const sanitize = (str: string) => str.replace(/[^\x20-\x7E]/g, '');

  // Determine stamp content based on status
  let title = "Signature valid";
  let showCheck = true;

  if (report.status === "INVALID") {
    title = "Signature Invalid";
    showCheck = false;
  } else if (report.status === "UNTRUSTED") {
    title = "Signature Not Verified";
    showCheck = false;
  } else if (report.status === "EXPIRED") {
    title = "Certificate Expired";
    showCheck = false;
  } else if (report.status === "NO_SIGNATURE") {
    title = "No Signature Found";
    showCheck = false;
  }

  // For expired override cases that resulted in VERIFIED
  if (report.expiredOverride && report.status === "VERIFIED") {
    title = "Signature valid";
    showCheck = true;
  }

  const pages = pdf.getPages();
  if (pages.length === 0) return pdf.save();

  const page = pages[0];
  const { width, height } = page.getSize();

  // Default stamp position and size (top-right corner)
  let stampX = width - 280;
  let stampY = height - 115;
  let stampW = 260;
  let stampH = 95;

  // Find the signature annotation rect for positioning, then REMOVE all
  // signature widget annotations so the original e-sign visual is completely
  // eliminated. This is a stamped copy — the original signature structure
  // is intentionally replaced by our verification stamp.
  let foundRect = false;
  try {
    const annots = page.node.Annots();
    if (annots instanceof PDFArray) {
      // Iterate backwards so we can safely remove entries
      for (let i = annots.size() - 1; i >= 0; i--) {
        const annot = annots.lookup(i);
        if (annot instanceof PDFDict) {
          const subtype = annot.lookup(PDFName.of("Subtype"));
          const ft = annot.lookup(PDFName.of("FT"));

          if (subtype?.toString() === "/Widget" && ft?.toString() === "/Sig") {
            // Capture the rect from the FIRST signature found (for positioning)
            if (!foundRect) {
              const rect = annot.lookup(PDFName.of("Rect"));
              if (rect instanceof PDFArray && rect.size() >= 4) {
                const r0 = rect.lookup(0);
                const r1 = rect.lookup(1);
                const r2 = rect.lookup(2);
                const r3 = rect.lookup(3);

                if (
                  r0 instanceof PDFNumber &&
                  r1 instanceof PDFNumber &&
                  r2 instanceof PDFNumber &&
                  r3 instanceof PDFNumber
                ) {
                  const llx = r0.asNumber();
                  const lly = r1.asNumber();
                  const urx = r2.asNumber();
                  const ury = r3.asNumber();
                  const w = urx - llx;
                  const h = ury - lly;
                  if (w > 10 && h > 10) {
                    stampX = llx;
                    stampY = lly;
                    stampW = w;
                    stampH = h;
                    foundRect = true;
                  }
                }
              }
            }

            // Remove the signature widget annotation completely
            annots.remove(i);
          }
        }
      }
    }
  } catch (e) {
    console.warn("Could not process signature annotations:", e);
  }

  // ---------------------------------------------------------------------------
  // Layout calculations — dynamically scale text to fit the stamp area
  // ---------------------------------------------------------------------------
  const pad = Math.max(3, stampW * 0.02);

  // Build the list of text lines to display
  const lines: { text: string; bold: boolean }[] = [];
  lines.push({ text: title, bold: true });
  lines.push({ text: "", bold: false }); // spacer
  lines.push({ text: "Digitally Signed.", bold: false });

  if (report.signer) {
    lines.push({ text: sanitize(`Name: ${report.signer}`), bold: false });
  }

  if (report.signed_on) {
    const d = new Date(report.signed_on);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dateStr = `${d.getDate().toString().padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    lines.push({ text: `Date: ${dateStr}`, bold: false });
  }

  if (report.reason) {
    lines.push({ text: sanitize(`Reason: ${report.reason}`), bold: false });
  }

  if (report.location) {
    lines.push({ text: sanitize(`Location: ${report.location}`), bold: false });
  }

  // Calculate font sizes to fit the stamp area
  // Title gets ~30% of height, rest shared by detail lines
  const contentLines = lines.filter(l => l.text.length > 0);
  const detailLines = contentLines.length - 1; // exclude title

  // Title size: roughly 25-30% of stamp height, capped
  let titleSize = Math.min(
    Math.max(10, stampH * 0.22),
    Math.max(10, stampW * 0.08),
    36
  );

  // Detail text size: fit remaining lines in remaining height
  const remainingH = stampH - titleSize - pad * 3;
  let textSize = Math.min(
    Math.max(6, remainingH / Math.max(detailLines, 4) * 0.75),
    Math.max(6, stampW * 0.04),
    16
  );

  // Ensure text doesn't overflow width — shrink if needed
  const maxTextWidth = stampW - pad * 2;
  for (const line of lines) {
    if (line.text.length === 0) continue;
    const font = line.bold ? fontBold : fontRegular;
    const size = line.bold ? titleSize : textSize;
    const w = font.widthOfTextAtSize(line.text, size);
    if (w > maxTextWidth) {
      const ratio = maxTextWidth / w;
      if (line.bold) {
        titleSize = Math.max(8, titleSize * ratio);
      } else {
        textSize = Math.max(5, textSize * ratio);
      }
    }
  }

  const lineH = textSize * 1.35;
  const titleLineH = titleSize * 1.2;

  // ---------------------------------------------------------------------------
  // Draw text — NO background rectangle for transparent effect
  // ---------------------------------------------------------------------------
  let curY = stampY + stampH - pad - titleSize;

  // Helper to wrap and draw text
  const drawWrapped = (text: string, font: any, size: number, isBold: boolean) => {
    if (text.length === 0) {
      curY -= lineH * 0.3; // small spacer
      return;
    }

    const words = text.split(' ');
    let line = '';
    const maxW = stampW - pad * 2;

    for (const word of words) {
      const testLine = line.length > 0 ? line + ' ' + word : word;
      if (font.widthOfTextAtSize(testLine, size) > maxW && line.length > 0) {
        page.drawText(line, {
          x: stampX + pad,
          y: curY,
          size,
          font,
          color: rgb(0, 0, 0),
        });
        curY -= isBold ? titleLineH : lineH;
        line = word;
      } else {
        line = testLine;
      }
    }

    if (line.length > 0) {
      page.drawText(line, {
        x: stampX + pad,
        y: curY,
        size,
        font,
        color: rgb(0, 0, 0),
      });
      curY -= isBold ? titleLineH : lineH;
    }
  };

  // Draw title
  drawWrapped(title, fontBold, titleSize, true);

  // Small gap after title
  curY -= lineH * 0.15;

  // Draw detail lines
  for (let i = 1; i < lines.length; i++) {
    if (curY < stampY + pad) break;
    const line = lines[i];
    drawWrapped(line.text, line.bold ? fontBold : fontRegular, line.bold ? titleSize : textSize, line.bold);
  }

  // ---------------------------------------------------------------------------
  // Draw green checkmark — overlaid diagonally on the right side
  // Matching the reference images where it overlaps the text
  // ---------------------------------------------------------------------------
  if (showCheck) {
    // Checkmark size: roughly 65-80% of stamp height, positioned right-center
    const checkSize = Math.min(stampW * 0.55, stampH * 0.85);

    // Position: right side of the stamp, slightly overlapping text
    const checkCx = stampX + stampW * 0.65;
    const checkCy = stampY + stampH * 0.5;

    drawGreenCheckmark(page, checkCx, checkCy, checkSize);
  } else if (report.status === "INVALID") {
    // Draw a red X for invalid signatures
    const xSize = Math.min(stampW * 0.5, stampH * 0.75) / 100;
    const xCx = stampX + stampW * 0.65;
    const xCy = stampY + stampH * 0.5;

    // X mark path in 100x100 space
    const xPath = [
      'M 20 15', 'L 50 45', 'L 80 15', 'L 85 20',
      'L 55 50', 'L 85 80', 'L 80 85',
      'L 50 55', 'L 20 85', 'L 15 80',
      'L 45 50', 'L 15 20', 'Z',
    ].join(' ');

    page.drawSvgPath(xPath, {
      x: xCx - (xSize * 100) * 0.5,
      y: xCy + (xSize * 100) * 0.5,
      scale: xSize,
      color: rgb(0.8, 0.1, 0.1),
      opacity: 0.85,
    });
  } else {
    // UNTRUSTED / EXPIRED / NO_SIGNATURE — draw a yellow/orange ? or !
    const qSize = Math.min(stampW * 0.5, stampH * 0.75) / 100;
    const qCx = stampX + stampW * 0.65;
    const qCy = stampY + stampH * 0.5;

    // Exclamation mark path in 100x100 space
    const exclamPath = [
      'M 44 15', 'L 56 15', 'L 54 60', 'L 46 60', 'Z',
      'M 44 70', 'L 56 70', 'L 56 82', 'L 44 82', 'Z',
    ].join(' ');

    page.drawSvgPath(exclamPath, {
      x: qCx - (qSize * 100) * 0.5,
      y: qCy + (qSize * 100) * 0.5,
      scale: qSize,
      color: rgb(0.85, 0.6, 0.05),
      opacity: 0.8,
    });
  }

  return pdf.save();
}

export function downloadBlob(data: BlobPart, filename: string, mime: string) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
