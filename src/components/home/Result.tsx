import React, { useState } from "react";
import { 
  verifyPdf,
  statusLabel,
  statusMessage,
  trustCertificate,
  type VerificationReport,
  type VerificationStatus 
} from "@/lib/verify-pdf";
import { stampPdf, downloadBlob } from "@/lib/stamp-pdf";
import { CheckIcon, XIcon, ShieldAlertIcon, ClockIcon, FileIcon } from "../icons";

export function toneFor(s: VerificationStatus) {
  switch (s) {
    case "VERIFIED":
      return {
        border: "border-success/40", bg: "bg-success/5", label: "text-success",
        iconBg: "bg-success", icon: <CheckIcon className="h-7 w-7" />,
      };
    case "INVALID":
      return {
        border: "border-destructive/40", bg: "bg-destructive/5", label: "text-destructive",
        iconBg: "bg-destructive", icon: <XIcon className="h-7 w-7" />,
      };
    case "UNTRUSTED":
      return {
        border: "border-warning/50", bg: "bg-warning/10", label: "text-warning",
        iconBg: "bg-warning", icon: <ShieldAlertIcon className="h-7 w-7" />,
      };
    case "EXPIRED":
      return {
        border: "border-warning/50", bg: "bg-warning/10", label: "text-warning",
        iconBg: "bg-warning", icon: <ClockIcon className="h-7 w-7" />,
      };
    case "NO_SIGNATURE":
      return {
        border: "border-border", bg: "bg-muted/40", label: "text-muted-foreground",
        iconBg: "bg-muted-foreground", icon: <FileIcon className="h-7 w-7" />,
      };
  }
}

export function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:gap-4 gap-1 text-sm">
      <span className="text-muted-foreground shrink-0">{k}</span>
      <span className="max-w-full sm:max-w-[65%] break-all sm:text-right font-medium" title={v}>{v}</span>
    </div>
  );
}

export function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function Result({
  report,
  fileBuf,
  onReset,
  onReverify,
  onVerifyExpired,
}: {
  report: VerificationReport;
  fileBuf: ArrayBuffer;
  onReset: () => void;
  onReverify: () => void;
  onVerifyExpired: () => void;
}) {
  const [stamping, setStamping] = useState(false);
  const [trusting, setTrusting] = useState(false);
  const [verifyingExpired, setVerifyingExpired] = useState(false);
  const s = report.status;
  const tone = toneFor(s);

  const downloadStamped = async () => {
    if (s === "NO_SIGNATURE") return;
    setStamping(true);
    try {
      const bytes = await stampPdf(fileBuf, report);
      const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      downloadBlob(
        ab,
        `verified_${report.file_name.replace(/\.pdf$/i, "")}.pdf`,
        "application/pdf",
      );
    } catch (e) {
      console.error("Failed to stamp PDF:", e);
      alert("Failed to stamp PDF: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setStamping(false);
    }
  };

  const downloadJson = () => {
    downloadBlob(
      JSON.stringify(report, null, 2),
      `verification_report_${report.file_name.replace(/\.pdf$/i, "")}.json`,
      "application/json",
    );
  };

  const handleTrustCertificate = async () => {
    if (!report.untrustedCert) return;
    setTrusting(true);
    try {
      const res = await trustCertificate(report.untrustedCert.name, report.untrustedCert.base64);
      if (res.success) {
        onReverify();
      } else {
        alert("Failed to trust certificate: " + res.error);
      }
    } catch (e) {
      alert("Failed to trust certificate: " + String(e));
    } finally {
      setTrusting(false);
    }
  };

  return (
    <section className="mt-12 space-y-6">
      <div
        className={[
          "overflow-hidden rounded-2xl border shadow-sm",
          tone.border,
          tone.bg,
        ].join(" ")}
      >
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={[
                "grid h-14 w-14 place-items-center rounded-full text-white",
                tone.iconBg,
              ].join(" ")}
            >
              {tone.icon}
            </div>
            <div>
              <div className={["text-xs font-semibold uppercase tracking-wider", tone.label].join(" ")}>
                {s.replace("_", " ")}
              </div>
              <h2 className="mt-0.5 text-2xl">{statusLabel(s)}</h2>
              <p className="mt-1 max-w-xl text-sm text-foreground/80">{statusMessage(s)}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:shrink-0">
            {s !== "NO_SIGNATURE" && (
              <button
                onClick={downloadStamped}
                disabled={stamping}
                className="w-full sm:w-auto rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
              >
                {stamping ? "Preparing…" : "Download stamped PDF"}
              </button>
            )}
            <button
              onClick={downloadJson}
              className="w-full sm:w-auto rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-accent"
            >
              Download JSON report
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DetailCard title="Document">
          <Row k="File" v={report.file_name} />
          <Row k="Size" v={`${(report.file_size_bytes / 1024).toFixed(1)} KB`} />
          <Row k="PDF version" v={report.pdf_version ?? "—"} />
          <Row k="Pages" v={report.page_count?.toString() ?? "—"} />
        </DetailCard>
        <DetailCard title="Signature">
          <Row k="Signer" v={report.signer ?? "—"} />
          <Row k="Issuer" v={report.issuer ?? "—"} />
          <Row k="Signed on" v={report.signed_on ?? "—"} />
          {report.reason && <Row k="Reason" v={report.reason} />}
          {report.location && <Row k="Location" v={report.location} />}
          <Row k="Algorithm" v={report.algorithm ?? "—"} />
          <Row k="Certificate" v={report.certificate} />
          <Row k="Integrity" v={report.integrity} />
        </DetailCard>
      </div>

      {report.status === "UNTRUSTED" && report.untrustedCert && (
        <div className="rounded-xl border border-warning/50 bg-warning/10 p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h3 className="font-medium text-warning-foreground">Untrusted Issuer: {report.untrustedCert.name}</h3>
            <p className="mt-1 text-sm text-foreground/80 max-w-xl">
              This certificate is embedded in the PDF but is not in your local trust store. 
              <strong> Disclaimer: </strong> Only add this certificate to your trust store if you explicitly trust the issuer and are sure the document is authentic.
            </p>
          </div>
          <button
            onClick={handleTrustCertificate}
            disabled={trusting}
            className="shrink-0 rounded-lg bg-warning px-4 py-2 text-sm font-medium text-warning-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
          >
            {trusting ? "Adding..." : "Add to Trusted CAs"}
          </button>
        </div>
      )}

      {report.status === "EXPIRED" && (
        <div className="rounded-xl border border-warning/50 bg-warning/10 p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h3 className="font-medium text-warning-foreground flex items-center gap-2">
              <ClockIcon className="h-5 w-5" /> Expired Certificate
            </h3>
            <p className="mt-1 text-sm text-foreground/80 max-w-xl">
              The signing certificate has expired, but the signature may still have been cryptographically valid at the time of signing.
              You can re-validate the signature while ignoring the certificate expiry date.
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              <strong>Note:</strong> This will still check the signature integrity and trust chain — only the expiry date check is skipped.
            </p>
          </div>
          <button
            onClick={() => {
              setVerifyingExpired(true);
              onVerifyExpired();
            }}
            disabled={verifyingExpired}
            className="shrink-0 rounded-lg bg-warning px-4 py-2 text-sm font-medium text-warning-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
          >
            {verifyingExpired ? "Validating…" : "Validate ignoring expiry"}
          </button>
        </div>
      )}

      {report.expiredOverride && report.status === "VERIFIED" && (
        <div className="rounded-xl border border-success/40 bg-success/5 p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-success text-white shrink-0">
            <CheckIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium text-success">Verified (Expiry Overridden)</h3>
            <p className="mt-1 text-sm text-foreground/80 max-w-xl">
              The signature is cryptographically valid and the certificate chains to a trusted CA.
              The certificate expiry was explicitly overridden by you. The certificate status still shows as "Expired" in the details above.
            </p>
          </div>
        </div>
      )}

      <DetailCard title="Verification notes">
        <ul className="space-y-1.5 text-sm text-foreground/80">
          {report.notes.map((n, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
              <span>{n}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          {report.disclaimer}
        </p>
      </DetailCard>

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <button
          onClick={onReset}
          className="w-full sm:w-auto rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          ↩ Verify another PDF
        </button>
      </div>
    </section>
  );
}
