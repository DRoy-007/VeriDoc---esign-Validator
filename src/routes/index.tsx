import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { verifyPdf, type VerificationReport } from "@/lib/verify-pdf";
import { IndiaBackdrop } from "@/components/IndiaBackdrop";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Landing } from "@/components/home/Landing";
import { Processing, STEPS } from "@/components/home/Processing";
import { Result } from "@/components/home/Result";
import { ErrorCard } from "@/components/home/ErrorCard";

export const Route = createFileRoute("/")({
  component: Home,
});

const MAX_BYTES = 100 * 1024 * 1024;

type Phase = "idle" | "processing" | "done" | "error";

function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [fileBuf, setFileBuf] = useState<ArrayBuffer | null>(null);
  const [step, setStep] = useState(0);
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPhase("idle");
    setFile(null);
    setFileBuf(null);
    setStep(0);
    setReport(null);
    setError(null);
  };

  const start = useCallback(async (f: File) => {
    setError(null);
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      setPhase("error");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("File exceeds the 100 MB limit.");
      setPhase("error");
      return;
    }
    setFile(f);
    setPhase("processing");
    setStep(0);

    try {
      // Read buffer for stamping later (client-side)
      const buf = await f.arrayBuffer();
      setFileBuf(buf);

      // Run server verification in parallel with progress animation.
      // The progress steps animate for UX trust while the real work
      // happens on the server.
      const verifyPromise = verifyPdf(f);

      // Animate through steps while server processes
      for (let i = 0; i < STEPS.length - 1; i++) {
        setStep(i);
        await new Promise((r) => setTimeout(r, 380 + Math.random() * 220));
      }
      setStep(STEPS.length - 1);

      // Wait for server response (may already be done)
      const rep = await verifyPromise;
      setReport(rep);
      setPhase("done");
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Unknown error";
      if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed")) {
        setError("Network error — couldn't reach the verification server. Please check your connection and try again.");
      } else {
        setError("We couldn't verify this PDF. It may be corrupted, password-protected, or in an unsupported format.");
      }
      setPhase("error");
    }
  }, []);

  const onFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    start(files[0]);
  };

  const importFromUrl = useCallback(
    async (rawUrl: string) => {
      const url = rawUrl.trim();
      if (!url) return;
      setError(null);
      setPhase("processing");
      setStep(0);
      try {
        const res = await fetch(url, { mode: "cors" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const name =
          url.split("/").pop()?.split("?")[0] || "document.pdf";
        const f = new File([blob], name.endsWith(".pdf") ? name : `${name}.pdf`, {
          type: "application/pdf",
        });
        setPhase("idle");
        await start(f);
      } catch (e) {
        console.error(e);
        setError(
          "Couldn't fetch that PDF. Make sure the link is a direct PDF URL and the host allows cross-origin downloads.",
        );
        setPhase("error");
      }
    },
    [start],
  );

  return (
    <div className="relative min-h-screen text-foreground">
      <IndiaBackdrop />
      <Header />

      <main className="relative mx-auto max-w-5xl px-4 sm:px-6 pb-16 sm:pb-24">
        {phase === "idle" && (
          <Landing
            dragOver={dragOver}
            setDragOver={setDragOver}
            onFiles={onFiles}
            openPicker={() => inputRef.current?.click()}
            onImportUrl={importFromUrl}
          />
        )}

        {phase === "processing" && file && (
          <Processing file={file} step={step} />
        )}

        {phase === "error" && (
          <ErrorCard message={error ?? "Something went wrong."} onReset={reset} />
        )}

        {phase === "done" && report && fileBuf && (
          <Result
            report={report}
            fileBuf={fileBuf}
            onReset={reset}
            onReverify={() => start(file!)}
          />
        )}

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </main>

      <Footer />
    </div>
  );
}
