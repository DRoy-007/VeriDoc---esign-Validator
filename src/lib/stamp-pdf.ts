import { PDFDocument, rgb, StandardFonts, PDFName, PDFDict, PDFArray, PDFNumber } from "pdf-lib";
import type { VerificationReport } from "./verify-pdf";

// Overlays a compact verification badge on the first page of the uploaded PDF.
// Original content is preserved; only a small watermark is drawn in the top-right.
export async function stampPdf(
  original: ArrayBuffer,
  report: VerificationReport,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(original, { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const small = await pdf.embedFont(StandardFonts.Helvetica);

  const sanitize = (str: string) => str.replace(/[^\x20-\x7E]/g, '');

  let title = "Signature valid";
  let iconPath = "M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"; // Green Tick
  let iconColor = rgb(0.1, 0.7, 0.2);
  
  if (report.status === "INVALID") {
    title = "Signature Invalid";
    iconPath = "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"; // Red Cross
    iconColor = rgb(0.8, 0.1, 0.1);
  } else if (report.status === "UNTRUSTED" || report.status === "EXPIRED" || report.status === "NO_SIGNATURE") {
    title = "Signature Not Verified";
    iconPath = "M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"; // Yellow Question Mark
    iconColor = rgb(0.9, 0.7, 0.1);
  }

  const pages = pdf.getPages();
  if (pages.length > 0) {
    const page = pages[0];
    const { width, height } = page.getSize();
    let boxW = 260;
    let boxH = 95;
    let x = width - boxW - 18;
    let y = height - boxH - 18;

    // Try to find the signature annotation to overlap it
    let foundSignature = false;
    try {
      const annots = page.node.Annots();
      if (annots instanceof PDFArray) {
        // Iterate backwards to safely remove elements
        for (let i = annots.size() - 1; i >= 0; i--) {
          const annot = annots.lookup(i);
          if (annot instanceof PDFDict) {
            const subtype = annot.lookup(PDFName.of("Subtype"));
            const ft = annot.lookup(PDFName.of("FT"));
            
            if (subtype?.toString() === "/Widget" && ft?.toString() === "/Sig") {
              const rect = annot.lookup(PDFName.of("Rect"));
              if (rect instanceof PDFArray && rect.size() >= 4) {
                const r0 = rect.lookup(0);
                const r1 = rect.lookup(1);
                const r2 = rect.lookup(2);
                const r3 = rect.lookup(3);
                
                if (r0 instanceof PDFNumber && r1 instanceof PDFNumber && r2 instanceof PDFNumber && r3 instanceof PDFNumber) {
                  if (!foundSignature) {
                    const llx = r0.asNumber();
                    const lly = r1.asNumber();
                    const urx = r2.asNumber();
                    const ury = r3.asNumber();
                    
                    x = llx;
                    y = lly;
                    boxW = urx - llx;
                    boxH = ury - lly;
                    foundSignature = true;
                  }
                  
                  // REMOVE the signature widget annotation so the PDF viewer stops drawing its own overlay!
                  annots.remove(i);
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn("Could not find signature annotation rect", e);
    }

    // Determine scale for icon based on box size
    // The icon is a 24x24 path. We want it to be large and centered.
    const iconScale = Math.min(boxW, boxH) * 0.75 / 24;
    const iconDim = 24 * iconScale;

    // Draw Icon (Watermark centered)
    page.drawSvgPath(iconPath, {
      x: x + boxW / 2 - iconDim / 2,
      y: y + boxH / 2 + iconDim / 2,
      scale: iconScale,
      color: iconColor,
      opacity: 1,
    });

    // Dynamic text layout
    const pad = Math.max(4, boxW * 0.03);
    
    // Scale font size based on height to fit roughly 6 lines
    const maxLineH = boxH / 6;
    let titleSize = Math.min(24, maxLineH * 1.6);
    let textSize = Math.min(12, maxLineH * 0.7);
    let lineH = textSize * 1.2;
    
    // Fallback constraints
    if (textSize < 7) textSize = 7;
    if (titleSize < 10) titleSize = 10;
    lineH = textSize * 1.2;

    page.drawText(title, {
      x: x + pad, y: y + boxH - titleSize - pad, size: titleSize, font, color: rgb(0, 0, 0),
    });
    
    let curY = y + boxH - titleSize - pad - lineH - 6;
    page.drawText("Digitally Signed.", {
      x: x + pad, y: curY, size: textSize, font: small, color: rgb(0, 0, 0),
    });
    curY -= lineH;
    
    // Helper to wrap text to fit the box width
    const maxWidth = boxW - pad * 2;
    const drawWrappedText = (prefix: string, value: string) => {
       const fullStr = sanitize(`${prefix}${value}`);
       const words = fullStr.split(' ');
       let line = '';
       
       for (const word of words) {
           const testLine = line.length > 0 ? line + ' ' + word : word;
           if (small.widthOfTextAtSize(testLine, textSize) > maxWidth) {
               if (line.length > 0) {
                   page.drawText(line, { x: x + pad, y: curY, size: textSize, font: small, color: rgb(0, 0, 0) });
                   curY -= lineH;
                   line = '  ' + word; // Indent wrapped line
               } else {
                   // Word itself is longer than maxWidth
                   page.drawText(word, { x: x + pad, y: curY, size: textSize, font: small, color: rgb(0, 0, 0) });
                   curY -= lineH;
                   line = '';
               }
           } else {
               line = testLine;
           }
       }
       if (line.length > 0) {
           page.drawText(line, { x: x + pad, y: curY, size: textSize, font: small, color: rgb(0, 0, 0) });
           curY -= lineH;
       }
    };

    if (report.signer && curY >= y + pad) {
      drawWrappedText("Name: ", report.signer);
    }
    
    if (report.signed_on && curY >= y + pad) {
      const d = new Date(report.signed_on);
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const dateStr = `${d.getDate().toString().padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
      drawWrappedText("Date: ", dateStr);
    }
    
    if (report.reason && curY >= y + pad) {
      drawWrappedText("Reason: ", report.reason);
    }
    
    if (report.location && curY >= y + pad) {
      drawWrappedText("Location: ", report.location);
    }

    if (report.algorithm && curY >= y + pad) {
      drawWrappedText("Type: ", report.algorithm);
    }
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
