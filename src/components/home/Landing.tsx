import React, { useState } from "react";
import { UploadIcon, LockIcon, StampIcon, ReportIcon, ShieldAlertIcon, XIcon, ClockIcon, CheckIcon } from "../icons";
import { TRUSTED_INDIAN_CAS } from "@/lib/trusted-cas";
import { FAQ } from "@/components/home/FAQ";

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-primary">{icon}</div>
      <div className="mt-3 font-medium">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{body}</div>
    </div>
  );
}

function CloudHint({ label, href, color }: { label: string; href: string; color: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-2.5 py-1 text-foreground/80 transition hover:bg-accent justify-center"
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </a>
  );
}

function FaqItem({ icon, question, children }: { icon: React.ReactNode; question: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-all">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 p-4 sm:p-5 text-left hover:bg-accent/50 transition"
      >
        <div className="shrink-0">{icon}</div>
        <span className="flex-1 font-medium text-sm sm:text-base">{question}</span>
        <svg
          viewBox="0 0 24 24"
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 text-sm text-foreground/80 border-t border-border/50">
          <div className="pt-3">{children}</div>
        </div>
      )}
    </div>
  );
}

export function Landing({
  dragOver,
  setDragOver,
  onFiles,
  openPicker,
  onImportUrl,
}: {
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onFiles: (files: FileList | null) => void;
  openPicker: () => void;
  onImportUrl: (url: string) => void;
}) {
  const [mode, setMode] = useState<"file" | "url">("file");
  const [url, setUrl] = useState("");

  return (
    <>
      <section className="mx-auto mt-10 sm:mt-20 max-w-3xl text-center px-2">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl">Verify any Indian eSign.</h1>
        <p className="mx-auto mt-3 sm:mt-4 max-w-xl text-base sm:text-lg text-muted-foreground">
          Instantly validate digitally signed PDFs against all official
          Certifying Authorities. Secure server verification — your document is{" "}
          <strong>never stored or shared</strong>.
        </p>

        <div className="mx-auto mt-6 sm:mt-10 max-w-lg">
          <div className="flex justify-center gap-2 sm:gap-4 mb-4">
            <button
              onClick={() => setMode("file")}
              className={`text-sm font-medium px-3 sm:px-4 py-1.5 rounded-full transition ${mode === "file" ? "bg-primary text-primary-foreground" : "bg-card border hover:bg-accent"}`}
            >
              Upload PDF
            </button>
            <button
              onClick={() => setMode("url")}
              className={`text-sm font-medium px-3 sm:px-4 py-1.5 rounded-full transition ${mode === "url" ? "bg-primary text-primary-foreground" : "bg-card border hover:bg-accent"}`}
            >
              Import from Link
            </button>
          </div>

          {mode === "file" ? (
            <div
              role="button"
              tabIndex={0}
              aria-label="Click or drag a PDF file here to upload and verify"
              className={[
                "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-background/50 p-8 sm:p-12 text-center transition-all",
                dragOver
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : "border-border hover:border-primary/50 hover:bg-card/50",
              ].join(" ")}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                onFiles(e.dataTransfer.files);
              }}
              onClick={openPicker}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openPicker(); }}
            >
              <div className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110 group-hover:bg-primary/20">
                <UploadIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="mt-4 sm:mt-5 text-base sm:text-lg font-medium">Click or drag PDF to verify</h3>
              <div className="mt-1 text-xs sm:text-sm text-muted-foreground">
                PDF only · up to 100 MB · processed locally
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); openPicker(); }}
                className="mt-5 sm:mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                Choose PDF
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-background/50 p-6 text-left">
              <label className="text-sm font-medium">
                Paste a direct link to a PDF
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                Works with Google Drive, OneDrive, Dropbox, DigiLocker or any
                hosted PDF. Use the file's <b>direct download</b> URL.
              </p>
              <form
                className="mt-3 flex flex-col sm:flex-row gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  onImportUrl(url);
                }}
              >
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://drive.google.com/uc?export=download&id=…"
                  className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
                >
                  Fetch
                </button>
              </form>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <CloudHint
                  label="Google Drive"
                  href="https://drive.google.com"
                  color="#1a73e8"
                />
                <CloudHint
                  label="OneDrive"
                  href="https://onedrive.live.com"
                  color="#0364b8"
                />
                <CloudHint
                  label="Dropbox"
                  href="https://www.dropbox.com"
                  color="#0061ff"
                />
                <CloudHint
                  label="DigiLocker"
                  href="https://www.digilocker.gov.in"
                  color="#138808"
                />
              </div>
            </div>
          )}
        </div>
      </section>


      <section id="privacy" className="mt-10 sm:mt-16 grid gap-4 sm:grid-cols-3">
        <FeatureCard
          icon={<LockIcon className="h-5 w-5" />}
          title="Private by default"
          body="Your document is processed server-side in memory and never stored. It is deleted immediately after verification."
        />
        <FeatureCard
          icon={<StampIcon className="h-5 w-5" />}
          title="Stamped output PDF"
          body="Download a copy with a visible ✔ Verified / ✖ Invalid badge — original content preserved."
        />
        <FeatureCard
          icon={<ReportIcon className="h-5 w-5" />}
          title="Structured report"
          body="Machine-readable JSON with signer, issuer, date, and integrity result for your records."
        />
      </section>

      <section id="trusted" className="mt-10 sm:mt-16 scroll-mt-20">
        <h2 className="text-xl sm:text-2xl">Trusted Indian Certifying Authorities</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We match against roots issued by CCA India licensed CAs.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {TRUSTED_INDIAN_CAS.map((ca) => (
            <a
              key={ca.shortName}
              href={ca.website}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground/80 transition hover:bg-accent hover:border-primary/40 hover:text-foreground"
              title={ca.name}
            >
              {ca.shortName}
            </a>
          ))}
        </div>
      </section>

      <FAQ />
      <section id="faq" className="mt-10 sm:mt-16 scroll-mt-20 border-t border-border/60 pt-10 sm:pt-16">
        <h2 className="text-xl sm:text-2xl">Frequently Asked Questions</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
          Common questions about eSign verification and what to do when things don't go as expected.
        </p>

        <div className="mt-6 sm:mt-8 space-y-3">
          <FaqItem
            icon={<ShieldAlertIcon className="h-5 w-5 text-warning" />}
            question="My eSign shows 'Untrusted' — what should I do?"
          >
            <p>
              An <strong>Untrusted</strong> result means the signature is mathematically valid, but the signing certificate's issuer is not in our local trust store of licensed Indian Certifying Authorities (CAs).
            </p>
            <p className="mt-2">This can happen when:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>The document was signed by a sub-CA or intermediate CA not yet in our store.</li>
              <li>The signer used a private or enterprise certificate not issued by a CCA-licensed CA.</li>
              <li>A newly licensed CA root has not been added to our trust store yet.</li>
            </ul>
            <p className="mt-3 font-medium">What you can do:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Use the <strong>"Add to Trusted CAs"</strong> button on the report to manually trust the issuer certificate if you know and trust the issuer.</li>
              <li>Verify the document using <strong>Adobe Acrobat's signature panel</strong> or your CA's official verification tool as a second opinion.</li>
              <li>Contact us if you believe a legitimate Indian CA is missing from our trust store.</li>
            </ul>
          </FaqItem>

          <FaqItem
            icon={<ClockIcon className="h-5 w-5 text-primary" />}
            question="The signing certificate is expired — is my document still valid?"
          >
            <p>
              <strong>Yes, most likely.</strong> Certificate expiry means the signer's digital certificate has passed its validity period. However, this does <strong>not</strong> mean the signature was invalid at the time of signing.
            </p>
            <p className="mt-2">
              VeriDoc automatically validates signatures even when the certificate has expired. If the signature is cryptographically intact and the certificate chains to a trusted CA, the result will show as <strong>Verified</strong> with a disclaimer noting the certificate expiry date.
            </p>
            <p className="mt-2">In practice:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Indian government documents (Aadhaar, PAN, DigiLocker) use certificates that may expire after 2–3 years, but the documents remain valid.</li>
              <li>The signature proves the document was authentic <em>at the time it was signed</em>.</li>
              <li>Look at the <strong>"Signed on"</strong> date in the report — if it falls within the certificate's validity period, the document is genuine.</li>
            </ul>
          </FaqItem>

          <FaqItem
            icon={<ShieldAlertIcon className="h-5 w-5 text-warning" />}
            question="The CA (Certifying Authority) is not added — how do I fix this?"
          >
            <p>
              Our trust store contains roots from all major CCA-licensed Indian Certifying Authorities. However, some sub-CAs, intermediate certificates, or very new CAs might not be included yet.
            </p>
            <p className="mt-2 font-medium">To resolve this:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li><strong>Use the "Add to Trusted CAs" button</strong> — if the signer's certificate is embedded in the PDF, you'll see this option on the verification report. Click it to add the issuer's certificate to your local trust store.</li>
              <li><strong>Re-verify after adding</strong> — once added, click "Verify another PDF" and upload the same file again. It should now show as Verified.</li>
              <li><strong>Download the CA root certificate</strong> from the CA's official website and manually add it if the embedded certificate isn't available.</li>
            </ul>
            <p className="mt-3 text-muted-foreground text-xs">
              Note: Manually trusted certificates are stored in your session. Official root certificates from CCA-licensed CAs are built into VeriDoc permanently.
            </p>
          </FaqItem>

          <FaqItem
            icon={<XIcon className="h-5 w-5 text-destructive" />}
            question="My PDF shows 'Invalid Signature' — why?"
          >
            <p>
              An <strong>Invalid</strong> result means the document's content has been modified after the digital signature was applied. The cryptographic hash no longer matches.
            </p>
            <p className="mt-2">Common causes:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>The PDF was edited, annotated, or had a watermark added after signing.</li>
              <li>The file was merged with another PDF or pages were rearranged.</li>
              <li>The file was compressed, resized, or "flattened" by a PDF tool.</li>
              <li>The file was re-saved by a PDF viewer that modified its internal structure.</li>
            </ul>
            <p className="mt-3 font-medium">
              Solution: Always upload the original, untouched PDF exactly as downloaded from the source (DigiLocker, UMANG, e-Courts, etc.).
            </p>
          </FaqItem>

          <FaqItem
            icon={<CheckIcon className="h-5 w-5 text-success" />}
            question="What does 'Verified' mean exactly?"
          >
            <p>
              A <strong>Verified</strong> result means three things have been confirmed:
            </p>
            <ol className="mt-2 list-decimal list-inside space-y-1">
              <li><strong>Integrity</strong> — The document has not been modified since it was signed. The cryptographic hash matches perfectly.</li>
              <li><strong>Trust</strong> — The signing certificate chains to a trusted root CA licensed by CCA India.</li>
              <li><strong>Authenticity</strong> — The signature was produced by the stated signer using their private key.</li>
            </ol>
            <p className="mt-3 text-muted-foreground">
              If the certificate was expired at the time of verification (but valid when the document was signed), you'll see a disclaimer note — the document is still considered genuine.
            </p>
          </FaqItem>
        </div>
      </section>
    </>
  );
}
