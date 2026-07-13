# Product Requirements Document (PRD)
## PDF eSign Validator — Web Application

**Version:** 1.0
**Status:** Draft
**Last Updated:** July 13, 2026

---

## 1. Purpose & Background

Digitally signed government documents (income certificates, land records, mark sheets, affidavits, etc.) are increasingly issued as eSigned PDFs in India. However, ordinary users have no simple way to check whether such a PDF is genuinely signed, untampered, and issued by a certificate that chains to a trusted Indian Certifying Authority (CA).

This product lets any user upload a signed PDF and, without needing technical knowledge, instantly know whether the document is **Verified**, **Invalid**, **Untrusted**, **Expired**, or **Unsigned** — and download a visually marked copy plus a machine-readable report.

## 2. Problem Statement

- Citizens and organizations receive eSigned PDFs but have no easy, trustworthy way to validate them without specialized tools (e.g., Adobe Acrobat's built-in validator, DSC utilities).
- Manual verification requires understanding PKCS#7 signatures, certificate chains, and CA trust stores — well beyond a typical user's technical ability.
- There is no simple visual indicator on the document itself that confirms a completed verification pass.

## 3. Goals

| Goal | Description |
|---|---|
| G1 | Let a non-technical user upload a PDF and get a clear verification verdict in seconds. |
| G2 | Validate signature authenticity, document integrity, and certificate trust against Indian licensed CAs. |
| G3 | Produce a downloadable, visually annotated PDF without altering the original content, layout, or formatting. |
| G4 | Produce a structured verification report (JSON/PDF) for recordkeeping or downstream integration. |
| G5 | Ensure uploaded documents are handled securely and not retained beyond processing. |

## 4. Non-Goals (Out of Scope for v1)

- Signing or co-signing documents (this is a *verifier*, not a signer).
- Editing document content/text.
- Support for non-PDF file formats.
- Organization-level dashboards, user accounts, or verification history (deferred to future enhancements).
- Guaranteed real-time revocation checking if CRL/OCSP endpoints are unreachable (best-effort only in v1).

## 5. Target Users

- **Individual citizens** verifying certificates, mark sheets, or government-issued documents.
- **Businesses/HR teams** verifying signed offer letters, KYC documents, or vendor contracts.
- **Government or para-government offices** doing bulk citizen-facing document checks.
- **Developers/organizations** (future) integrating verification via API.

## 6. User Stories

1. As a user, I want to upload a PDF by clicking or drag-and-drop, so that I can quickly start verification.
2. As a user, I want to see step-by-step progress (uploading → verifying → checking certificate → generating PDF), so I understand what's happening and trust the result.
3. As a user, I want a clear final verdict (Verified / Invalid / Untrusted / Expired / No Signature), so I don't need to interpret technical certificate data myself.
4. As a user, I want to download a copy of my PDF with a visible verification stamp (✔/❌) in the signature area, so I can share proof of verification.
5. As a user, I want a detailed report (signer, issuer, signed date, algorithm) I can save or forward, so I have an audit trail.
6. As a user, I want assurance that my uploaded document is deleted after processing, so I trust the platform with sensitive documents.

## 7. High-Level Workflow

```
Upload PDF → Temporary Storage → Parse PDF → Signature Present?
   ├─ No  → Return "NO_SIGNATURE"
   └─ Yes → Extract Signature → Verify Cryptographic Signature
             → Verify Hash Integrity → Build Certificate Chain
             → Verify Trusted Indian Root CA → Check Certificate Validity
             → Check Revocation Status (optional) → Determine Final Result
             → Generate Verification Report → Overlay Signature Appearance
             → Generate Downloadable PDF → Download
```

## 8. Functional Requirements

### 8.1 Upload & Intake
- FR1: Accept PDF uploads via file picker or drag-and-drop.
- FR2: Enforce PDF-only MIME type validation.
- FR3: Enforce a maximum file size (e.g., 20 MB), configurable.
- FR4: (Optional) Malware/content scan prior to processing.
- FR5: Store uploaded file temporarily (e.g., `/tmp/uploads/{uuid}.pdf`) and auto-delete after processing completes or times out.

### 8.2 PDF Parsing
- FR6: Extract page count, PDF version, AcroForm presence, and signature field(s).
- FR7: If no signature field exists, return `NO_SIGNATURE` immediately without generating an output PDF.

### 8.3 Signature Extraction
- FR8: Locate the `/Sig` dictionary and extract PKCS#7 data, signer certificate, signer name, signing time, reason, location, and contact info.

### 8.4 Cryptographic & Integrity Verification
- FR9: Verify the PKCS#7 signature is mathematically valid; if not, return `INVALID_SIGNATURE`.
- FR10: Compute SHA-256 (or SHA-384) hash of the signed content and compare against the embedded message digest; mismatch → `INVALID` (document modified after signing).

### 8.5 Certificate Chain & Trust
- FR11: Build the certificate chain (Signer → Intermediate CA → Root CA).
- FR12: Validate the chain terminates at a trusted Indian licensed CA root (e.g., eMudhra, CDAC, Capricorn, SafeScrypt, Pantasign, NIC). If not, return `UNTRUSTED_CERTIFICATE`.
- FR13: Validate certificate properties: expiry, not-yet-valid window, revocation, self-signed status, algorithm strength, and key length.
- FR14: (Optional) Perform revocation checks via CRL/OCSP, returning `VALID`, `REVOKED`, or `UNKNOWN`.

### 8.6 Decision Engine
- FR15: Combine all checks (signature validity, hash match, trust, certificate validity, revocation) into one final status:
  - `VERIFIED` — all checks pass
  - `INVALID` — signature or hash failure
  - `UNTRUSTED` — certificate not in trusted chain
  - `EXPIRED` — certificate expired
  - `NO_SIGNATURE` — unsigned document

### 8.7 Verification Report
- FR16: Generate a structured report containing status, signer, issuer, signed date, algorithm, certificate validity, and integrity result.
- FR17: Offer the report as downloadable JSON and/or PDF.

### 8.8 Output PDF Generation
- FR18: Preserve all original content — text, images, margins, fonts, layout, and page size — unchanged.
- FR19: Modify only the visible signature appearance region (using the signature widget's coordinates/dimensions).
- FR20: Overlay a verification indicator: green "✔ Verified" for verified signatures, red "❌ Invalid" for failed verification.

### 8.9 Download
- FR21: Allow download of the annotated `verified_document.pdf`.
- FR22: Allow download of `verification_report.json` or `verification_report.pdf`.

### 8.10 Frontend Experience
- FR23: Display step-by-step progress: Uploading → Verifying Signature → Checking Certificate → Checking Integrity → Generating PDF → Ready → Download.

### 8.11 Error Handling
- FR24: Handle and clearly message the following cases:
  - No Signature → "No Digital Signature Found"
  - Fake Signature → "Invalid Digital Signature"
  - Edited Document → "Document Modified After Signing"
  - Expired Certificate → "Certificate Expired"
  - Unsupported PDF → "Unsupported PDF Format"
  - Corrupted PDF → "Unable to Read PDF"

## 9. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Security | HTTPS enforced for all traffic; uploaded files stored only temporarily and deleted immediately post-processing; original document never retained unless explicitly requested by the user. |
| Performance | Verification and PDF generation should complete within a few seconds for typical government-issued PDFs (a few MB, single signature). |
| Reliability | Graceful handling of corrupted, malformed, or non-standard PDFs without crashing the service. |
| Scalability | Backend should support concurrent verification requests (stateless processing per upload). |
| Privacy | No document content is logged; only verification metadata (status, signer, issuer) is retained if reporting/analytics are enabled. |
| Compliance | Trusted CA list should reflect current Controller of Certifying Authorities (CCA), India licensed CAs, and be updatable as the list changes. |

## 10. Success Metrics

- % of uploaded PDFs successfully parsed without error.
- Average end-to-end verification time.
- Accuracy of trust determination against known-good/known-bad test certificates.
- User drop-off rate during the verification flow.
- Volume of verification report downloads (proxy for perceived usefulness).

## 11. Risks & Open Questions

- **Trusted CA list maintenance:** Needs a process to keep the Indian CA root/intermediate list current as CCA India updates licensing.
- **Revocation availability:** CRL/OCSP endpoints for some Indian CAs may be slow or unavailable — needs a defined fallback (e.g., mark as `UNKNOWN` rather than blocking the flow).
- **Multiple signatures per document:** v1 assumes a single signature; multi-signature documents are a future enhancement (see below).
- **Legal disclaimer:** Should the app include a disclaimer that this is an assistive tool and not a legally binding verification service?

## 12. Future Enhancements

- Batch verification of multiple PDFs at once.
- QR code embedded in the output PDF linking to an online verification report.
- Public verification page: re-upload a previously verified PDF to confirm its result.
- Support for documents with multiple signatures.
- Verification logs/history for organizations.
- API access for third-party/system integration.
- Email delivery of the verification report.

## 13. Appendix: Sample Verification Report Schema

```json
{
  "status": "VERIFIED",
  "signer": "ABC XYZ",
  "issuer": "eMudhra",
  "signed_on": "2026-07-12",
  "algorithm": "SHA256",
  "certificate": "Valid",
  "integrity": "Verified"
}
```
