import { useState } from "react";
import { FeedbackModal } from "@/components/FeedbackModal";

export function Footer() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <footer id="privacy-notice" className="border-t border-border/60">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 text-xs text-muted-foreground">
        {/* Inline privacy & disclaimer notice */}
        <p className="mb-4 rounded-xl border border-border bg-card/50 px-4 py-3 leading-relaxed">
          <strong className="text-foreground">Privacy Notice:</strong> Uploaded PDFs are sent to the server solely to perform signature verification. They are processed entirely in memory and are{" "}
          <strong>never stored, logged, or shared</strong>. No account or personal data is collected.{" "}
          <strong>Terms of Use:</strong> This tool is provided as-is for informational purposes. Results should not be used as a sole basis for legal decisions.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="leading-relaxed">
            Not affiliated with the Controller of Certifying Authorities (CCA) or the Government of India.
          </span>
          <span className="flex items-center gap-4 shrink-0">
            <a href="#privacy-notice" className="hover:text-foreground transition-colors">Privacy & Terms</a>
            <button
              onClick={() => setFeedbackOpen(true)}
              className="hover:text-foreground transition-colors cursor-pointer focus:outline-none"
            >
              Feedback
            </button>
            <a href="https://github.com/DRoy-007/PDFVerify" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Open Source</a>
          </span>
        </div>
      </div>

      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </footer>
  );
}

