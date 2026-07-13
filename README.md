# VeriDoc eSign Validator

VeriDoc eSign Validator is a web app for verifying digitally signed PDF documents, especially Indian government and institutional eSigned files. It helps users quickly determine whether a PDF is authentic, intact, and trusted by checking the signature, certificate chain, and document integrity.

## What it does

- Upload a PDF directly or import it from a public link
- Detect whether the document contains a digital signature
- Verify cryptographic signature validity
- Check certificate trust against known Indian Certifying Authorities
- Detect whether the document was modified after signing
- Generate a stamped output PDF and a structured verification report

## Key features

- Simple, user-friendly verification flow
- Private-by-default processing for uploaded files
- Support for PDF-only documents up to 20 MB
- Clear verdicts such as Verified, Invalid, Untrusted, Expired, or No Signature
- Downloadable proof output for sharing and recordkeeping

## Tech stack

- React + TypeScript
- TanStack Start + Vite
- Tailwind CSS
- PDF.js-style PDF handling via pdf-lib and PKIJS-based signature verification
- Shadcn UI components

## Getting started

### Prerequisites

- Node.js 20+
- Bun (recommended) or npm

### Install dependencies

```bash
bun install
```

### Run locally

```bash
git clone <your-repo-url>
cd VeriDoc-eSign-Validator
bun install
bun run dev
```

Then open the local development URL shown in the terminal.

### Build for production

```bash
bun run build
```

### Lint the project

```bash
bun run lint
```

## Usage

1. Open the app in your browser.
2. Upload a signed PDF or paste a direct download link.
3. Wait for the verification pipeline to complete.
4. Review the result and download the stamped PDF or report.

## Notes

This tool is intended as an assistive verification solution. It is not a legally binding certification service. For official verification, use the signature panel in Adobe Acrobat or the relevant Certifying Authority utility.

## Project structure

- src/components: UI pages and reusable interface components
- src/lib: verification logic, PDF stamping, trust-store handling, and server helpers
- src/routes: TanStack route-based application structure

## Contributing

Contributions are welcome. If you want to improve the validator, add new features, or improve trust handling, feel free to open an issue or submit a pull request.
