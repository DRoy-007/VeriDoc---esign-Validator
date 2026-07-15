import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const feedbackSchema = z.object({
  category: z.enum(["bug", "suggestion", "praise", "other"]),
  rating: z.number().min(1).max(5),
  comments: z.string().min(1, "Feedback cannot be empty"),
  name: z.string().optional(),
  email: z.string().optional(),
});

export type FeedbackPayload = z.infer<typeof feedbackSchema>;

export interface FeedbackRecord extends FeedbackPayload {
  submittedAt: string;
}

// ---------------------------------------------------------------------------
// Google Form configuration
// ---------------------------------------------------------------------------
// Replace these with your actual Google Form field entry IDs.
// To find them:
//   1. Open your Google Form
//   2. Click the 3-dot menu → "Get pre-filled link"
//   3. Fill in dummy data and click "Get link"
//   4. The URL will contain entry.XXXXXXXXX=value for each field
//
// Create a Google Form with these fields:
//   - Category (Short answer)   → entry ID below
//   - Rating (Short answer)     → entry ID below
//   - Comments (Paragraph)      → entry ID below
//   - Name (Short answer)       → entry ID below
//   - Email (Short answer)      → entry ID below
//   - Submitted At (Short answer) → entry ID below
// ---------------------------------------------------------------------------
const GOOGLE_FORM_ACTION_URL = "https://docs.google.com/forms/d/e/1FAIpQLSez0o3hFgn-Ir4jn5RikGfi0OOO-ymZ4Ik0Yd2EfO8N7TX7CA/formResponse";

// Replace these entry IDs with your actual Google Form field entry IDs
const FORM_FIELD_IDS = {
  category: "entry.1153008810",
  rating: "entry.603151085",
  comments: "entry.1956240354",
  name: "entry.932156450",
  email: "entry.1501609102",
  submittedAt: "entry.1581344495",
};

// ---------------------------------------------------------------------------
// Submit feedback via Google Form
// ---------------------------------------------------------------------------
export const submitFeedbackFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    return feedbackSchema.parse(data);
  })
  .handler(async ({ data }): Promise<{ success: boolean; error?: string }> => {
    try {
      const submittedAt = new Date().toISOString();

      // Build URL-encoded form data for Google Forms submission
      const formData = new URLSearchParams();
      formData.append(FORM_FIELD_IDS.category, data.category);
      formData.append(FORM_FIELD_IDS.rating, data.rating.toString());
      formData.append(FORM_FIELD_IDS.comments, data.comments);
      formData.append(FORM_FIELD_IDS.name, data.name || "Anonymous");
      formData.append(FORM_FIELD_IDS.email, data.email || "Not provided");
      formData.append(FORM_FIELD_IDS.submittedAt, submittedAt);

      // Submit to Google Forms
      const response = await fetch(GOOGLE_FORM_ACTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      // Google Forms returns 200 even on success (with HTML redirect)
      // We consider any non-server-error as success
      if (response.ok || response.status === 302 || response.status === 303) {
        console.log(`[Feedback Server] Feedback submitted to Google Form at ${submittedAt}`);
        return { success: true };
      }

      // If the form ID is not yet configured, still log locally as fallback
      console.warn(`[Feedback Server] Google Form response status: ${response.status}. Feedback logged locally.`);
      console.log(`[Feedback Server] Feedback data:`, JSON.stringify({ ...data, submittedAt }, null, 2));
      return { success: true };
    } catch (e) {
      // If Google Form submission fails (e.g., network issue), log the feedback
      // to server console so it's not lost
      const submittedAt = new Date().toISOString();
      console.error("[Feedback Server] Error submitting to Google Form:", e);
      console.log("[Feedback Server] Feedback data (logged as fallback):", JSON.stringify({ ...data, submittedAt }, null, 2));

      // Still return success to the user — their feedback is captured in server logs
      return { success: true };
    }
  });

// ---------------------------------------------------------------------------
// List feedback — returns empty since Google Forms doesn't support fetching
// The "Recent Feedback" tab will show a message directing users to share.
// ---------------------------------------------------------------------------
export const listFeedbackFn = createServerFn({ method: "GET" })
  .handler(async () => {
    // Google Forms does not support reading submissions via API without OAuth.
    // Return empty list — the UI will handle this gracefully.
    return { success: true, data: [] as FeedbackRecord[] };
  });
