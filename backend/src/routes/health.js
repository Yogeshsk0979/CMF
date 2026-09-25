import { Router } from "express";
import { supabase } from "../config/supabaseClient.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({ status: "ok", message: "CMF backend is running" });
});

router.get("/supabase", async (req, res) => {
  try {
    const { error } = await supabase.from("_health_check_").select("*").limit(1);
    if (error && error.code !== "PGRST205" && error.code !== "42P01") {
      throw error;
    }
    res.json({ status: "ok", message: "Supabase client is configured and reachable" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

export default router;
