import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

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

const FEEDBACK_DIR = () => path.join(process.cwd(), "data", "feedback");

// ---------------------------------------------------------------------------
// Submit feedback
// ---------------------------------------------------------------------------
export const submitFeedbackFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    return feedbackSchema.parse(data);
  })
  .handler(async ({ data }) => {
    try {
      const feedbackDir = FEEDBACK_DIR();
      if (!fs.existsSync(feedbackDir)) {
        fs.mkdirSync(feedbackDir, { recursive: true });
      }

      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000000);
      const filename = `feedback-${timestamp}-${random}.json`;
      const filePath = path.join(feedbackDir, filename);

      const record: FeedbackRecord = {
        ...data,
        submittedAt: new Date().toISOString(),
      };

      fs.writeFileSync(filePath, JSON.stringify(record, null, 2), "utf8");

      console.log(`[Feedback Server] Feedback saved to ${filePath}`);
      return { success: true };
    } catch (e) {
      console.error("[Feedback Server] Error saving feedback:", e);
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  });

// ---------------------------------------------------------------------------
// List all feedback (newest first)
// ---------------------------------------------------------------------------
export const listFeedbackFn = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const feedbackDir = FEEDBACK_DIR();
      if (!fs.existsSync(feedbackDir)) {
        return { success: true, data: [] as FeedbackRecord[] };
      }

      const files = fs
        .readdirSync(feedbackDir)
        .filter((f) => f.endsWith(".json"))
        .sort()
        .reverse(); // newest first

      const records: FeedbackRecord[] = [];
      for (const file of files) {
        try {
          const raw = fs.readFileSync(path.join(feedbackDir, file), "utf8");
          records.push(JSON.parse(raw) as FeedbackRecord);
        } catch {
          // skip malformed files silently
        }
      }

      return { success: true, data: records };
    } catch (e) {
      console.error("[Feedback Server] Error listing feedback:", e);
      return { success: false, data: [] as FeedbackRecord[], error: e instanceof Error ? e.message : String(e) };
    }
  });
