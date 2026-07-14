import React, { useState } from "react";
import { UploadIcon, LockIcon, StampIcon, ReportIcon, ShieldAlertIcon, XIcon } from "../icons";
import { TRUSTED_INDIAN_CAS } from "@/lib/trusted-cas";

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
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-2.5 py-1 text-foreground/80 transition hover:bg-accent"
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      Open {label}
    </a>
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
      <section className="mx-auto mt-20 max-w-3xl text-center">
        <h1 className="text-4xl sm:text-5xl">Verify any Indian eSign.</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Instantly validate digitally signed PDFs against all official
          Certifying Authorities. Fully private, browser-based processing.
        </p>

        <div className="mx-auto mt-10 max-w-lg">
          <div className="flex justify-center gap-4 mb-4">
            <button
              onClick={() => setMode("file")}
              className={`text-sm font-medium px-4 py-1.5 rounded-full transition ${mode === "file" ? "bg-primary text-primary-foreground" : "bg-card border hover:bg-accent"}`}
            >
              Upload PDF
            </button>
            <button
              onClick={() => setMode("url")}
              className={`text-sm font-medium px-4 py-1.5 rounded-full transition ${mode === "url" ? "bg-primary text-primary-foreground" : "bg-card border hover:bg-accent"}`}
            >
              Import from Link
            </button>
          </div>

          {mode === "file" ? (
            <div
              className={[
                "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-background/50 p-12 text-center transition-all",
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
            >
              <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110 group-hover:bg-primary/20">
                <UploadIcon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-medium">Click or drag PDF to verify</h3>
              <div className="mt-1 text-sm text-muted-foreground">
                PDF only · up to 20 MB · processed locally
              </div>
              <button
                type="button"
                className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
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
                className="mt-3 flex gap-2"
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
                  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
                >
                  Fetch
                </button>
              </form>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
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


      <section id="privacy" className="mt-16 grid gap-4 sm:grid-cols-3">
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

      <section id="trusted" className="mt-16">
        <h2 className="text-2xl">Trusted Indian Certifying Authorities</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We match against roots issued by CCA India licensed CAs.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {TRUSTED_INDIAN_CAS.map((ca) => (
            <span
              key={ca.shortName}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground/80"
              title={ca.name}
            >
              {ca.shortName}
            </span>
          ))}
        </div>
      </section>

      <section id="guide" className="mt-16 border-t border-border/60 pt-16">
        <h2 className="text-2xl">Understanding Verification Results</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
          Digital signatures depend on strict cryptographic math and trust chains. If your document fails verification, it is usually for one of the following reasons:
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 text-left">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-medium text-destructive flex items-center gap-2">
              <XIcon className="h-5 w-5" /> Why is my PDF Invalid?
            </h3>
            <p className="mt-3 text-sm text-foreground/80">
              An <strong>Invalid</strong> result means the cryptographic hash of the document no longer matches the signature. This happens if the PDF was <strong>modified after it was signed</strong>.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
              <li>Did you add a watermark or stamp?</li>
              <li>Did you merge it with another PDF?</li>
              <li>Did you compress, resize, or "flatten" the file?</li>
            </ul>
            <p className="mt-4 text-sm font-medium text-foreground">
              Solution: Always upload the pristine, untouched original PDF directly downloaded from the source.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-medium text-warning flex items-center gap-2">
              <ShieldAlertIcon className="h-5 w-5" /> Why is it Untrusted?
            </h3>
            <p className="mt-3 text-sm text-foreground/80">
              An <strong>Untrusted</strong> result means the mathematical signature is perfectly valid and intact, but the certificate issuer is not found in our local trust store of authorized Indian roots.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              We proactively update our trust store, but some sub-CAs might be missing. If the issuer's certificate is embedded in the PDF, you can manually add it to your trust store using the <strong>Add to Trusted CAs</strong> button on the report.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
