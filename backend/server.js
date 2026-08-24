import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import jobRoutes from "./routes/jobs.js";
import candidateRoutes from "./routes/candidates.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", db: mongoose.connection.readyState === 1 });
});

app.use("/api/jobs", jobRoutes);
app.use("/api/jobs/:jobId/candidates", candidateRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
const LOCAL_MONGODB_URI = "mongodb://127.0.0.1:27017/smart_resume_screener";
const MONGODB_URIS = [process.env.MONGODB_URI, LOCAL_MONGODB_URI].filter(Boolean);

async function connectDatabase() {
  let lastError;

  for (const uri of MONGODB_URIS) {
    try {
      await mongoose.connect(uri);
      console.log(`MongoDB connected using ${uri}`);
      return;
    } catch (err) {
      lastError = err;
      console.warn(`MongoDB connection failed for ${uri}:`, err.message);
    }
  }

  try {
    console.warn(
      "No MongoDB server was reachable, starting in-memory fallback database:",
      lastError?.message || "unknown error"
    );
    const memoryServer = await MongoMemoryServer.create({
      instance: { dbName: "smart_resume_screener" },
    });
    await mongoose.connect(memoryServer.getUri());
    console.log("In-memory MongoDB fallback connected");
  } catch (memoryError) {
    console.error("Unable to start fallback database:", memoryError.message);
    throw memoryError;
  }
}

connectDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Database startup error:", err.message);
    process.exit(1);
  });
