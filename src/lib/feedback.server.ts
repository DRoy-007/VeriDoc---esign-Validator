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
// Google Sheet CSV URL (Published for web)
// ---------------------------------------------------------------------------
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTXwZz3_v8Vf8XRkfVjzDvw8JtP-EWT7RUzaAnhMffO1M8BtdBfOLAbgQhoowquwPIPTNPiE9I-bksT/pub?gid=832091623&single=true&output=csv";

// Helper to parse CSV strings (handles basic quoted values with commas/newlines)
function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < csv.length && csv[i + 1] === '"') {
          current += '"'; // Escaped quote
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(current);
        current = '';
      } else if (char === '\n' || char === '\r') {
        row.push(current);
        current = '';
        if (row.length > 0 && row.some(c => c.trim() !== '')) rows.push(row);
        row = [];
        if (char === '\r' && i + 1 < csv.length && csv[i + 1] === '\n') {
          i++; // skip \n after \r
        }
      } else {
        current += char;
      }
    }
  }
  if (current || row.length > 0) {
    row.push(current);
    if (row.length > 0 && row.some(c => c.trim() !== '')) rows.push(row);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// List feedback from published Google Sheet CSV
// ---------------------------------------------------------------------------
export const listFeedbackFn = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const res = await fetch(GOOGLE_SHEET_CSV_URL);
      if (!res.ok) {
        return { success: false, data: [] as FeedbackRecord[], error: "Failed to fetch CSV" };
      }
      const csvText = await res.text();
      const rows = parseCSV(csvText);
      if (rows.length <= 1) {
        return { success: true, data: [] }; // Only header or empty
      }
      
      const headers = rows[0].map(h => h.toLowerCase().trim());
      // Find indexes dynamically in case column order changes
      const catIdx = headers.findIndex(h => h.includes("category"));
      const ratIdx = headers.findIndex(h => h.includes("rating"));
      const comIdx = headers.findIndex(h => h.includes("comments"));
      const nameIdx = headers.findIndex(h => h.includes("name"));
      const emailIdx = headers.findIndex(h => h.includes("email"));
      const subIdx = headers.findIndex(h => h.includes("submitted at"));
      const timeIdx = headers.findIndex(h => h.includes("timestamp")); // Google forms default
      
      const records: FeedbackRecord[] = [];
      
      // Skip header row
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 2) continue; // Skip empty/malformed rows
        
        const categoryRaw = catIdx >= 0 && row[catIdx] ? row[catIdx] : "";
        let category: "bug" | "suggestion" | "praise" | "other" = "other";
        const lowerCat = categoryRaw.toLowerCase();
        if (lowerCat.includes("bug")) category = "bug";
        else if (lowerCat.includes("suggestion")) category = "suggestion";
        else if (lowerCat.includes("praise") || lowerCat.includes("appreciation")) category = "praise";
        
        const ratingStr = ratIdx >= 0 && row[ratIdx] ? row[ratIdx] : "5";
        const rating = parseInt(ratingStr, 10) || 5;
        
        const comments = comIdx >= 0 && row[comIdx] ? row[comIdx].trim() : "";
        if (!comments) continue; // Skip entries without comments
        
        const name = nameIdx >= 0 && row[nameIdx] ? row[nameIdx].trim() : "";
        const email = emailIdx >= 0 && row[emailIdx] ? row[emailIdx].trim() : "";
        
        let submittedAt = subIdx >= 0 && row[subIdx] ? row[subIdx].trim() : "";
        if (!submittedAt && timeIdx >= 0 && row[timeIdx]) submittedAt = row[timeIdx].trim();
        if (!submittedAt) submittedAt = new Date().toISOString(); // Fallback
        
        records.push({
          category,
          rating,
          comments,
          name,
          email,
          submittedAt
        });
      }
      
      // Reverse to get newest first (Google Forms appends to bottom)
      records.reverse();
      
      // Return only top 5 newest
      return { success: true, data: records.slice(0, 5) };
    } catch (e) {
      console.error("[Feedback Server] Error parsing Google Sheet CSV:", e);
      return { success: false, data: [] as FeedbackRecord[], error: String(e) };
    }
  });
