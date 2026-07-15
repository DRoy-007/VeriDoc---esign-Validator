import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Star,
  Loader2,
  CheckCircle2,
  MessageSquare,
  AlertCircle,
  Bug,
  Lightbulb,
  ThumbsUp,
  Mail,
  Clock,
  User,
  ListFilter,
} from "lucide-react";
import { submitFeedbackFn, listFeedbackFn, type FeedbackRecord } from "@/lib/feedback.server";
import { cn } from "@/lib/utils";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = [
  { value: "bug", label: "Bug Report", icon: Bug },
  { value: "suggestion", label: "Suggestion", icon: Lightbulb },
  { value: "praise", label: "Appreciation", icon: ThumbsUp },
  { value: "other", label: "General", icon: Mail },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  bug: "Bug Report",
  suggestion: "Suggestion",
  praise: "Appreciation",
  other: "General",
};

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-3.5 w-3.5",
            star <= rating
              ? "fill-amber-400 text-amber-500"
              : "text-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const label = CATEGORY_LABELS[category] ?? category;
  const colorMap: Record<string, string> = {
    bug: "bg-destructive/10 text-destructive border-destructive/20",
    suggestion: "bg-primary/10 text-primary border-primary/20",
    praise: "bg-success/10 text-success border-success/20",
    other: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        colorMap[category] ?? colorMap.other,
      )}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Feedback list view
// ---------------------------------------------------------------------------
function FeedbackList() {
  const [entries, setEntries] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listFeedbackFn();
        if (!cancelled) setEntries(res.data);
      } catch {
        // silently fail – empty state will show
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm">Loading feedback...</span>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
        <MessageSquare className="h-10 w-10 opacity-40" />
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground/80">No feedback yet</p>
          <p className="text-xs">Be the first to share your experience with VeriDoc.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 -mr-1">
      {entries.map((entry, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card p-4 space-y-2.5 transition-colors hover:bg-accent/30"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <CategoryBadge category={entry.category} />
              <StarRating rating={entry.rating} />
            </div>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
              <Clock className="h-3 w-3" />
              {formatDate(entry.submittedAt)}
            </span>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">{entry.comments}</p>
          {entry.name && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
              <User className="h-3 w-3" />
              <span>{entry.name}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feedback submit form
// ---------------------------------------------------------------------------
function FeedbackForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [category, setCategory] = useState<"bug" | "suggestion" | "praise" | "other">("suggestion");
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comments, setComments] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Please select a rating", {
        description: "Your rating helps us gauge your experience.",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />,
      });
      return;
    }

    if (!comments.trim()) {
      toast.error("Please enter your comments", {
        description: "Let us know details about your experience.",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />,
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitFeedbackFn({
        data: {
          category,
          rating,
          comments,
          name: name.trim() || undefined,
          email: email.trim() || undefined,
        },
      });

      if (res.success) {
        toast.success("Feedback submitted", {
          description: "Thank you for helping us improve VeriDoc.",
          icon: <CheckCircle2 className="h-5 w-5 text-success" />,
        });
        setCategory("suggestion");
        setRating(0);
        setHoveredRating(0);
        setComments("");
        setName("");
        setEmail("");
        onSubmitted();
      } else {
        throw new Error(res.error || "Submission failed");
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
      toast.error("Failed to submit feedback", {
        description: err instanceof Error ? err.message : "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Category selection */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Category
        </Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.value;
            const Icon = cat.icon;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-medium cursor-pointer transition-all duration-200",
                  isActive
                    ? "border-primary bg-primary/5 text-primary scale-[1.02] shadow-sm"
                    : "border-border/60 hover:border-border hover:bg-muted/30 text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Star rating selector */}
      <div className="space-y-2 text-center py-3 bg-muted/20 rounded-2xl border border-border/40">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
          How would you rate this tool?
        </Label>
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {[1, 2, 3, 4, 5].map((star) => {
            const isHighlighted = hoveredRating >= star || (!hoveredRating && rating >= star);
            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="p-1 cursor-pointer transition-transform duration-100 hover:scale-125 focus:outline-none"
              >
                <Star
                  className={cn(
                    "h-7 w-7 transition-colors duration-150",
                    isHighlighted
                      ? "fill-amber-400 text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.2)]"
                      : "text-muted-foreground/40 hover:text-amber-300",
                  )}
                />
              </button>
            );
          })}
        </div>
        <div className="h-5 mt-1 text-sm font-medium text-foreground transition-all duration-150">
          {RATING_LABELS[hoveredRating || rating] || <span className="text-muted-foreground/60 text-xs">Select your rating</span>}
        </div>
      </div>

      {/* Comments input */}
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <Label htmlFor="feedback-comments" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your Comments
          </Label>
          <span className="text-[10px] text-muted-foreground/80">Required</span>
        </div>
        <Textarea
          id="feedback-comments"
          placeholder={
            category === "bug"
              ? "Describe the issue you encountered, including any error messages or steps to reproduce."
              : category === "suggestion"
                ? "What features or improvements would you like to see?"
                : "Write your message here..."
          }
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className="min-h-[90px] resize-none rounded-xl bg-background border-border/80 focus-visible:ring-primary"
        />
      </div>

      {/* Contact details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="feedback-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Name <span className="text-[10px] text-muted-foreground/60">(Optional)</span>
          </Label>
          <Input
            id="feedback-name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl bg-background border-border/80 focus-visible:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="feedback-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Email <span className="text-[10px] text-muted-foreground/60">(Optional)</span>
          </Label>
          <Input
            id="feedback-email"
            type="email"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl bg-background border-border/80 focus-visible:ring-primary"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/95 transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Feedback"
        )}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------
export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const [activeTab, setActiveTab] = useState("view");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => setActiveTab("view"), 200);
  };

  const handleSubmitted = () => {
    // Switch to the list view and force refresh
    setRefreshKey((k) => k + 1);
    setActiveTab("view");
  };

  return (
    <Dialog open={open} onOpenChange={(val) => (val ? onOpenChange(true) : handleClose())}>
      <DialogContent className="max-w-lg w-[95vw] rounded-2xl p-6 sm:p-8 overflow-hidden backdrop-blur-md bg-background/95 shadow-2xl border-border/80 max-h-[90vh] flex flex-col">
        <DialogHeader className="space-y-2 text-left shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <MessageSquare className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-serif">Feedback</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            View what others have shared or submit your own feedback to help us improve VeriDoc.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-1 flex flex-col min-h-0 flex-1">
          <TabsList className="w-full grid grid-cols-2 shrink-0">
            <TabsTrigger value="view" className="gap-1.5">
              <ListFilter className="h-3.5 w-3.5" />
              Recent Feedback
            </TabsTrigger>
            <TabsTrigger value="submit" className="gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Submit Feedback
            </TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="mt-4 min-h-0 overflow-y-auto flex-1">
            <FeedbackList key={refreshKey} />
          </TabsContent>

          <TabsContent value="submit" className="mt-4 min-h-0 overflow-y-auto flex-1">
            <FeedbackForm onSubmitted={handleSubmitted} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
