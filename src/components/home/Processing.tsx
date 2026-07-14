import { FileIcon, CheckIcon } from "../icons";

export const STEPS = [
  "Uploading to server",
  "Parsing PDF structure",
  "Verifying PKCS#7 signature",
  "Checking certificate chain",
  "Validating CA trust",
  "Generating report",
] as const;

export function Processing({ file, step }: { file: File; step: number }) {
  return (
    <section className="mx-auto mt-16 max-w-2xl px-4 sm:px-0 animate-fade-in-up">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <FileIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium">{file.name}</div>
            <div className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </div>
          </div>
        </div>

        <ol className="mt-6 space-y-3">
          {STEPS.map((label, i) => {
            const state =
              i < step ? "done" : i === step ? "active" : "pending";
            return (
              <li key={label} className="flex items-center gap-3">
                <StepDot state={state} />
                <span
                  className={
                    state === "pending"
                      ? "text-muted-foreground"
                      : state === "active"
                        ? "font-medium text-foreground"
                        : "text-foreground/80"
                  }
                >
                  {label}
                  {state === "active" && <span className="ml-1 animate-pulse">…</span>}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function StepDot({ state }: { state: "done" | "active" | "pending" }) {
  if (state === "done") {
    return (
      <span className="grid h-6 w-6 place-items-center rounded-full bg-success text-success-foreground">
        <CheckIcon className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-primary">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
      </span>
    );
  }
  return <span className="h-6 w-6 rounded-full border border-border" />;
}
