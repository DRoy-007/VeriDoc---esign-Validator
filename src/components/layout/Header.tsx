export function Header() {
  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 overflow-hidden place-items-center rounded-lg shadow-sm bg-transparent">
            <img src="/logo.png" alt="VeriDoc Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <div className="font-serif text-lg leading-none">VeriDoc <span className="font-sans text-sm text-muted-foreground">- eSign Validator</span></div>
            <div className="text-xs text-muted-foreground">Verify Indian digitally signed PDFs</div>
          </div>
        </div>
        <nav className="hidden sm:flex items-center gap-6">
          <a
            href="#guide"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            User Guide
          </a>
          <a
            href="#trusted"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Trusted CAs
          </a>
        </nav>
      </div>
    </header>
  );
}
