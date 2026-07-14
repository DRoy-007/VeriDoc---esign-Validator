import { useState } from "react";
import { FeedbackModal } from "@/components/FeedbackModal";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 overflow-hidden place-items-center rounded-lg shadow-sm bg-transparent">
            <img src="/logo.png" alt="VeriDoc Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <div className="font-serif text-base sm:text-lg leading-none">
              VeriDoc <span className="font-sans text-xs sm:text-sm text-muted-foreground">- eSign Validator</span>
            </div>
            <div className="text-xs text-muted-foreground hidden sm:block">Verify Indian digitally signed PDFs</div>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6">
          <a href="#guide" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            User Guide
          </a>
          <a href="#trusted" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Trusted CAs
          </a>
          <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            FAQ
          </a>
          <button
            onClick={() => setFeedbackOpen(true)}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus:outline-none"
          >
            Share Feedback
          </button>
        </nav>

        {/* Mobile hamburger button */}
        <button
          id="mobile-menu-toggle"
          className="sm:hidden grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-foreground transition hover:bg-accent cursor-pointer"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile nav dropdown */}
      {menuOpen && (
        <nav className="sm:hidden border-t border-border/60 bg-background/95 backdrop-blur px-4 py-3 flex flex-col gap-1">
          <a
            href="#guide"
            onClick={() => setMenuOpen(false)}
            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            User Guide
          </a>
          <a
            href="#trusted"
            onClick={() => setMenuOpen(false)}
            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            Trusted CAs
          </a>
          <a
            href="#faq"
            onClick={() => setMenuOpen(false)}
            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            FAQ
          </a>
          <button
            onClick={() => {
              setMenuOpen(false);
              setFeedbackOpen(true);
            }}
            className="text-left block w-full rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer focus:outline-none"
          >
            Share Feedback
          </button>
        </nav>
      )}

      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </header>
  );
}
