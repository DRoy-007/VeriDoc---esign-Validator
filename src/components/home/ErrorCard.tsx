import { XIcon } from "../icons";

export function ErrorCard({ message, onReset }: { message: string; onReset: () => void }) {
  return (
    <section className="mx-auto mt-16 sm:mt-20 max-w-lg px-4 sm:px-0 animate-fade-in-up">
      <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive text-white">
          <XIcon className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-xl">We couldn't verify that file</h2>
        <p className="mt-1 text-sm text-foreground/80">{message}</p>
        <button
          onClick={onReset}
          className="mt-5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </section>
  );
}

