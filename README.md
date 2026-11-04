# HackStack
For student hackathon teams, HackStack turns a 2–3 sentence idea into a working, schema-validated full-stack codebase, live preview, 10-slide pitch deck, and 60-second demo script so that teams spend 100% of their time on their unique feature instead of boilerplate

## Optional Supabase persistence

Copy `.env.example` to `.env.local`, set `GEMINI_API_KEY` from Google AI Studio, and restart the dev server. Gemini 2.5 Flash is the default provider; the API key stays server-side when configured this way. You can also enter a temporary key in the model bar, or use the optional OpenAI/custom endpoint choices. If no provider key is configured, HackStack clearly labels the offline fallback and shows the provider failure reason.

For Supabase, add the URL and publishable key for browser auth, optionally add the server-only service role key, then run `supabase/schema.sql` in the Supabase SQL editor. Email magic-link auth, saved projects, generation history, collaborator invites, and private share links are backed by RLS-protected tables. Recent projects can be loaded back into the workbench, pending invites are accepted after sign-in, and share links render read-only project views by default. The app continues to work in offline/demo mode without these variables.
