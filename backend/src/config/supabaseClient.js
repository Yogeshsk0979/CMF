import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const rawUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "placeholder-key";

const isValidUrl = (value) => {
  try {
    return Boolean(value) && /^https?:\/\//i.test(value) && Boolean(new URL(value));
  } catch {
    return false;
  }
};

const supabaseUrl = isValidUrl(rawUrl) ? rawUrl : "https://placeholder.supabase.co";

if (!isValidUrl(rawUrl)) {
  console.warn(
    "[supabase] SUPABASE_URL is missing or invalid. Set real values in backend/.env — Supabase calls will fail until then."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
