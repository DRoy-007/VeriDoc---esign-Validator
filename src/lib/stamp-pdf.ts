import { PDFDocument, rgb, StandardFonts, PDFName, PDFDict, PDFArray, PDFNumber } from "pdf-lib";
import type { VerificationReport } from "./verify-pdf";

// ---------------------------------------------------------------------------
// Fetch a PNG image from the public folder and return its bytes.
// Works in both browser (fetch) and SSR environments.
// ---------------------------------------------------------------------------
async function fetchIconBytes(filename: string): Promise<Uint8Array> {
  // In the browser, fetch from the public path
  const url = `/${filename}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch icon: ${filename} (${response.status})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

// ---------------------------------------------------------------------------
// Determine which icon to use based on verification status
// ---------------------------------------------------------------------------
function iconForStatus(status: string): string {
  switch (status) {
    case "VERIFIED":
      return "tick-mark.png";
    case "INVALID":
      return "cross-mark.png";
    case "UNTRUSTED":
    case "EXPIRED":
    case "NO_SIGNATURE":
    default:
      return "question-mark.png";
  }
}

// ---------------------------------------------------------------------------
// Overlays a verification stamp on the PDF matching the reference image.
// - Transparent background (no box/fill drawn)
// - Actual PNG icon (tick/cross/question) centered as watermark background
// - "Signature valid" title in bold
// - Full metadata: Signer, Reason, Location, Date+Time, CA, Algorithm
// - Sized to fit the original signature field
// ---------------------------------------------------------------------------
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

  if (report.status === "INVALID") {
    title = "Signature Invalid";
  } else if (report.status === "UNTRUSTED") {
    title = "Signature Not Verified";
  } else if (report.status === "EXPIRED") {
    title = "Certificate Expired";
  } else if (report.status === "NO_SIGNATURE") {
    title = "No Signature Found";
  }

  // Fetch and embed the appropriate icon image
  let iconImage: Awaited<ReturnType<typeof pdf.embedPng>> | null = null;
  try {
    const iconFilename = iconForStatus(report.status);
    const iconBytes = await fetchIconBytes(iconFilename);
    iconImage = await pdf.embedPng(iconBytes);
  } catch (e) {
    console.warn("Could not embed icon image:", e);
  }

  const pages = pdf.getPages();
  if (pages.length === 0) return pdf.save();

  const page = pages[0];
  const { width, height } = page.getSize();

  // Default stamp position and size (top-right corner)
  // Sized large enough to show all metadata lines
  let stampX = width - 340;
  let stampY = height - 200;
  let stampW = 320;
  let stampH = 180;

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
  // Draw the icon image — positioned on right side, overlapping text like reference
  // ---------------------------------------------------------------------------
  if (iconImage) {
    const iconDims = iconImage.scale(1);
    const iconAspect = iconDims.width / iconDims.height;

    // Icon should fill roughly 75% of the stamp height
    const maxIconH = stampH * 0.75;
    const maxIconW = stampW * 0.50;

    let drawIconW: number;
    let drawIconH: number;

    if (iconAspect > 1) {
      drawIconW = Math.min(maxIconW, maxIconH * iconAspect);
      drawIconH = drawIconW / iconAspect;
    } else {
      drawIconH = Math.min(maxIconH, maxIconW / iconAspect);
      drawIconW = drawIconH * iconAspect;
    }

    // Center the icon in the stamp area
    const iconX = stampX + (stampW - drawIconW) / 2;
    const iconY = stampY + (stampH - drawIconH) / 2;

    page.drawImage(iconImage, {
      x: iconX,
      y: iconY,
      width: drawIconW,
      height: drawIconH,
      opacity: 1.0, // Deeper, more visible watermark
    });
  }

  // ---------------------------------------------------------------------------
  // Build the list of text lines to display — expanded metadata
  // ---------------------------------------------------------------------------
  const pad = Math.max(3, stampW * 0.02);

  const lines: { text: string; bold: boolean }[] = [];
  lines.push({ text: title, bold: true });
  lines.push({ text: "", bold: false }); // spacer

  // Full signer name
  if (report.signer) {
    lines.push({ text: sanitize(`Digitally signed by ${report.signer}`), bold: false });
  } else {
    lines.push({ text: "Digitally Signed.", bold: false });
  }

  // Reason for signing
  if (report.reason) {
    lines.push({ text: sanitize(`Reason: ${report.reason}`), bold: false });
  }

  // Location
  if (report.location) {
    lines.push({ text: sanitize(`Location: ${report.location}`), bold: false });
  }

  // Signed date and time
  if (report.signed_on) {
    lines.push({ text: `Date: ${report.signed_on}`, bold: false });
  }

  // Certificate Authority and Algorithm intentionally omitted to match standard PDF reader visual metadata

  // ---------------------------------------------------------------------------
  // Layout calculations — dynamically scale text to fit the stamp area
  // ---------------------------------------------------------------------------
  const contentLines = lines.filter(l => l.text.length > 0);
  const detailLines = contentLines.length - 1; // exclude title

  // Title size: roughly 18-20% of stamp height, capped
  let titleSize = Math.min(
    Math.max(6, stampH * 0.20),
    Math.max(6, stampW * 0.08),
    28
  );

  // Detail text size: fit remaining lines in remaining height
  const remainingH = stampH - titleSize - pad * 3;
  let textSize = Math.min(
    Math.max(4, remainingH / Math.max(detailLines, 3) * 0.7),
    Math.max(4, stampW * 0.04),
    13
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
        textSize = Math.max(4, textSize * ratio);
      }
    }
  }

  const lineH = textSize * 1.3;
  const titleLineH = titleSize * 1.2;

  // ---------------------------------------------------------------------------
  // Draw text — NO background rectangle for transparent effect
  // ---------------------------------------------------------------------------
  let curY = stampY + stampH - pad - titleSize;

  // Helper to wrap and draw text
  const drawWrapped = (text: string, font: any, size: number, isBold: boolean) => {
    if (text.length === 0) {
      curY -= lineH * 0.25; // small spacer
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
  curY -= lineH * 0.1;

  // Draw detail lines
  for (let i = 1; i < lines.length; i++) {
    if (curY < stampY + pad) break;
    const line = lines[i];
    drawWrapped(line.text, line.bold ? fontBold : fontRegular, line.bold ? titleSize : textSize, line.bold);
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
