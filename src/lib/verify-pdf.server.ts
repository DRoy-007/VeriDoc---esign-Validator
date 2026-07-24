// Server function for PDF verification.
// Receives a PDF file via FormData, processes it server-side,
// and returns a VerificationReport to the client.

import { createServerFn } from "@tanstack/react-start";
import {
  verifyPdfSignature,
  type VerificationResult,
} from "./verify-signature.server";
import { reloadTrustStore } from "./trusted-ca-certs.server";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// ---------------------------------------------------------------------------
// Types shared with the client
// ---------------------------------------------------------------------------

export type VerificationStatus =
  | "VERIFIED"
  | "INVALID"
  | "UNTRUSTED"
  | "EXPIRED"
  | "NO_SIGNATURE";

export interface VerificationReport {
  status: VerificationStatus;
  file_name: string;
  file_size_bytes: number;
  page_count: number | null;
  pdf_version: string | null;
  signer: string | null;
  issuer: string | null;
  signed_on: string | null;
  reason: string | null;
  location: string | null;
  algorithm: string | null;
  certificate: "Valid" | "Expired" | "Untrusted" | "Not Applicable";
  integrity: "Verified" | "Modified" | "Not Applicable";
  checked_at: string;
  notes: string[];
  disclaimer: string;
  untrustedCert?: {
    name: string;
    base64: string;
  } | null;
}

const DISCLAIMER =
  "This tool provides an assistive verification result and is not a legally binding certification.";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

// ---------------------------------------------------------------------------
// Convert engine result → client-facing report
// ---------------------------------------------------------------------------
function buildReport(
  fileName: string,
  fileSize: number,
  result: VerificationResult,
): VerificationReport {
  const now = new Date().toISOString();

  // Determine certificate display status
  let certificate: VerificationReport["certificate"] = "Not Applicable";
  if (result.signatureInfo) {
    if (result.status === "EXPIRED") certificate = "Expired";
    else if (result.status === "UNTRUSTED" || !result.isTrusted) certificate = "Untrusted";
    else if (result.certificateValid) certificate = "Valid";
    else certificate = "Expired";
  }

  // Determine integrity display status
  let integrity: VerificationReport["integrity"] = "Not Applicable";
  if (result.signatureInfo) {
    integrity = result.integrityOk ? "Verified" : "Modified";
  }

  // Format signer name
  let signer: string | null = null;
  if (result.signatureInfo) {
    const parts: string[] = [];
    if (result.signatureInfo.signerName) parts.push(result.signatureInfo.signerName);
    if (result.signatureInfo.signerOrg && result.signatureInfo.signerOrg !== result.signatureInfo.signerName) {
      parts.push(result.signatureInfo.signerOrg);
    }
    signer = parts.length > 0 ? parts.join(" — ") : null;
  }

  // Format issuer
  let issuer: string | null = null;
  if (result.caInfo) {
    issuer = result.caInfo.name;
  } else if (result.signatureInfo?.issuerName) {
    issuer = result.signatureInfo.issuerName;
    if (result.signatureInfo.issuerOrg && result.signatureInfo.issuerOrg !== result.signatureInfo.issuerName) {
      issuer += ` (${result.signatureInfo.issuerOrg})`;
    }
  }

  // Format signing date to YYYY.MM.DD HH:mm:ss IST
  let signed_on: string | null = null;
  if (result.signatureInfo?.signingTime) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'short'
    }).formatToParts(result.signatureInfo.signingTime);

    const p: Record<string, string> = {};
    for (const part of parts) {
      p[part.type] = part.value;
    }
    
    let hr = p.hour;
    if (hr === '24') hr = '00';

    signed_on = `${p.year}.${p.month}.${p.day} ${hr}:${p.minute}:${p.second} ${p.timeZoneName || 'IST'}`;
  }

  return {
    status: result.status,
    file_name: fileName,
    file_size_bytes: fileSize,
    page_count: result.pageCount,
    pdf_version: result.pdfVersion,
    signer,
    issuer,
    signed_on,
    reason: result.signatureInfo?.reason ?? null,
    location: result.signatureInfo?.location ?? null,
    algorithm: result.signatureInfo?.algorithm ?? null,
    certificate,
    integrity,
    checked_at: now,
    notes: result.notes,
    disclaimer: DISCLAIMER,
    untrustedCert: result.untrustedCert || null,
  };
}

// ---------------------------------------------------------------------------
// Server function: verify a PDF
// ---------------------------------------------------------------------------
export const verifyPdfOnServer = createServerFn({ method: "POST" })
  .validator((formData: unknown) => {
    if (!(formData instanceof FormData)) {
      throw new Error("Expected FormData");
    }
    return formData;
  })
  .handler(async ({ data: formData }) => {
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return buildReport("unknown", 0, {
        status: "INVALID",
        signatureInfo: null,
        caInfo: null,
        pageCount: null,
        pdfVersion: null,
        notes: ["No file was provided for verification."],
        integrityOk: false,
        certificateValid: false,
        isTrusted: false,
      });
    }

    const fileName = file.name;
    const fileSize = file.size;

    // Server-side validations (FR2, FR3)
    if (
      file.type !== "application/pdf" &&
      !fileName.toLowerCase().endsWith(".pdf")
    ) {
      return buildReport(fileName, fileSize, {
        status: "INVALID",
        signatureInfo: null,
        caInfo: null,
        pageCount: null,
        pdfVersion: null,
        notes: ["Only PDF files are supported. The uploaded file is not a PDF."],
        integrityOk: false,
        certificateValid: false,
        isTrusted: false,
      });
    }

    if (fileSize > MAX_FILE_SIZE) {
      return buildReport(fileName, fileSize, {
        status: "INVALID",
        signatureInfo: null,
        caInfo: null,
        pageCount: null,
        pdfVersion: null,
        notes: [`File exceeds the maximum size of ${MAX_FILE_SIZE / (1024 * 1024)} MB.`],
        integrityOk: false,
        certificateValid: false,
        isTrusted: false,
      });
    }

    try {
      // Read file into memory (FR5 — in-memory, no disk)
      const arrayBuffer = await file.arrayBuffer();
      const fileBytes = new Uint8Array(arrayBuffer);

      // Run the verification pipeline
      const result = await verifyPdfSignature(fileBytes);

      return buildReport(fileName, fileSize, result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("PDF verification error:", e);

      return buildReport(fileName, fileSize, {
        status: "INVALID",
        signatureInfo: null,
        caInfo: null,
        pageCount: null,
        pdfVersion: null,
        notes: [
          "An error occurred while processing this PDF.",
          `Details: ${msg}`,
          "The file may be corrupted, password-protected, or use an unsupported format.",
        ],
        integrityOk: false,
        certificateValid: false,
        isTrusted: false,
      });
    }
  });

// ---------------------------------------------------------------------------
// Server function: manually trust a certificate
// ---------------------------------------------------------------------------
export const trustCertificateFn = createServerFn({ method: "POST" })
  .validator((data: { name: string; base64: string }) => {
    if (!data.name || !data.base64) throw new Error("Invalid certificate payload");
    return data;
  })
  .handler(async ({ data }) => {
    try {
      const sanitizedName = data.name.replace(/[^a-z0-9_-]/gi, '_');
      const fileName = `${sanitizedName}_${Date.now()}.cer`;
      
      let rootsDir = path.join(process.cwd(), "src", "lib", "trust-store", "roots");
      let useTmp = false;
      
      try {
        if (!fs.existsSync(rootsDir)) {
          fs.mkdirSync(rootsDir, { recursive: true });
        }
        // Test if the directory is writable. In serverless (e.g. Vercel), it might exist but be read-only.
        fs.accessSync(rootsDir, fs.constants.W_OK);
      } catch (err) {
        useTmp = true;
      }
      
      if (useTmp) {
        rootsDir = path.join(os.tmpdir(), "trust-store", "roots");
        if (!fs.existsSync(rootsDir)) {
          fs.mkdirSync(rootsDir, { recursive: true });
        }
      }
      
      const filePath = path.join(rootsDir, fileName);
      const certBuffer = Buffer.from(data.base64, 'base64');
      fs.writeFileSync(filePath, certBuffer);
      
      reloadTrustStore();
      
      return { success: true };
    } catch (e) {
      console.error("Error trusting certificate:", e);
      return { success: false, error: String(e) };
    }
  });
