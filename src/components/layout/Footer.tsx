export function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto max-w-5xl px-6 py-8 text-xs text-muted-foreground">
        <p className="flex justify-between items-center">
          <span>
            Not affiliated with the Controller of Certifying Authorities (CCA) or the Government of India.
          </span>
          <span className="flex gap-4">
            <a href="#privacy" className="hover:text-foreground">Privacy</a>
            <a href="#privacy" className="hover:text-foreground">Terms</a>
            <a href="https://github.com/DRoy-007/VeriDoc---esign-Validator" target="_blank" rel="noreferrer" className="hover:text-foreground">Open Source</a>
          </span>
        </p>
      </div>
    </footer>
  );
}
