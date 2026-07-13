// Client-side PDF verification module.
// Delegates the actual verification to the server via a server function.
// Keeps type definitions and display helpers that the UI depends on.

import { verifyPdfOnServer, trustCertificateFn } from "./verify-pdf.server";

// Re-export types so the UI import path doesn't change
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

/**
 * Upload a PDF to the server for verification.
 * Returns a structured VerificationReport.
 */
export async function verifyPdf(file: File): Promise<VerificationReport> {
  const formData = new FormData();
  formData.append("file", file);

  const report = await verifyPdfOnServer({ data: formData });
  return report as VerificationReport;
}

export async function trustCertificate(name: string, base64: string): Promise<{ success: boolean; error?: string }> {
  return await trustCertificateFn({ data: { name, base64 } });
}

export function statusLabel(s: VerificationStatus): string {
  switch (s) {
    case "VERIFIED": return "Verified";
    case "INVALID": return "Invalid Signature";
    case "UNTRUSTED": return "Untrusted Certificate";
    case "EXPIRED": return "Certificate Expired";
    case "NO_SIGNATURE": return "No Digital Signature Found";
  }
}

export function statusMessage(s: VerificationStatus): string {
  switch (s) {
    case "VERIFIED":
      return "This document is digitally signed and untampered. The signing certificate chains to a trusted Indian Certifying Authority.";
    case "INVALID":
      return "The signature does not match the document contents. The document may have been modified after signing.";
    case "UNTRUSTED":
      return "The document is signed but the certificate is not issued by a trusted Indian licensed CA.";
    case "EXPIRED":
      return "The signing certificate is no longer valid (expired). The signature may still have been valid at signing time.";
    case "NO_SIGNATURE":
      return "This PDF does not contain any digital signature to verify.";
  }
}
