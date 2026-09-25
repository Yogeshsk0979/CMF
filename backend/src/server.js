import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import pkg from "pg";
import healthRouter from "./routes/health.js";

const { Client } = pkg;
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/health", healthRouter);

app.get("/", (req, res) => {
  res.send("CMF backend API");
});

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  if (process.env.DATABASE_URL) {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    try {
      await client.connect();
      console.log("✅ Successfully connected to Supabase Database!");
      await client.end();
    } catch (err) {
      console.error("❌ Failed to connect to Supabase Database:", err.message);
    }
  } else {
    console.warn("⚠️ DATABASE_URL not found in .env");
  }
});
