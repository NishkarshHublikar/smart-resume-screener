import { Router } from "express";
import Job from "../models/Job.js";
import Candidate from "../models/Candidate.js";
import upload from "../middleware/upload.js";
import {
  extractTextFromPdf,
  guessCandidateName,
} from "../services/resumeParser.js";
import {
  extractResumeData,
  matchResumeToJob,
} from "../services/geminiService.js";

const router = Router({ mergeParams: true });

/**
 * Runs `worker` over `items` with at most `limit` in flight at once.
 */
async function mapWithConcurrencyLimit(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runNext() {
    const i = nextIndex++;

    if (i >= items.length) return;

    try {
      results[i] = {
        status: "fulfilled",
        value: await worker(items[i], i),
      };
    } catch (err) {
      results[i] = {
        status: "rejected",
        reason: err,
      };
    }

    return runNext();
  }

  await Promise.all(
    Array.from(
      { length: Math.min(limit, items.length) },
      runNext
    )
  );

  return results;
}


// ============================================================
// UPLOAD RESUMES
// ============================================================

router.post(
  "/",
  upload.array("resumes", 20),
  async (req, res) => {
    try {
      console.log("\n==============================");
      console.log("RESUME UPLOAD REQUEST");
      console.log("Job ID:", req.params.jobId);
      console.log(
        "Files:",
        req.files?.map((f) => f.originalname)
      );
      console.log("==============================");

      const job = await Job.findById(req.params.jobId);

      if (!job) {
        return res.status(404).json({
          error: "Job not found",
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: "Upload at least one PDF resume",
        });
      }

      const results = await mapWithConcurrencyLimit(
        req.files,
        2,
        (file) => processResume(file, job)
      );

      const candidates = [];
      const failures = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          candidates.push(result.value);
        } else {
          failures.push({
            fileName: req.files[index].originalname,
            error:
              result.reason?.message ||
              "Processing failed",
          });
        }
      });

      console.log("\nUPLOAD COMPLETE");
      console.log(
        "Successful candidates:",
        candidates.length
      );
      console.log(
        "Failed candidates:",
        failures.length
      );

      return res.status(201).json({
        candidates,
        failures,
      });
    } catch (err) {
      console.error("UPLOAD ROUTE ERROR:", err);

      return res.status(500).json({
        error:
          err.message ||
          "Resume processing failed",
      });
    }
  }
);


// ============================================================
// PROCESS ONE RESUME
// ============================================================

async function processResume(file, job) {
  const fileName = file.originalname;
  let resumeText = "";
  let candidateName = "Unnamed Candidate";

  try {
    console.log(`\nProcessing resume: ${fileName}`);

    resumeText = await extractTextFromPdf(file.buffer);

    console.log(
      `Extracted ${resumeText.length} characters from ${fileName}`
    );

    if (!resumeText || resumeText.length < 20) {
      throw new Error(
        "Could not extract readable text from this PDF"
      );
    }

    candidateName = guessCandidateName(resumeText);

    console.log(
      `Candidate name detected: ${candidateName}`
    );

    const extracted = await extractResumeData(resumeText);

    console.log(
      `Resume extraction completed for ${fileName}`
    );

    const match = await matchResumeToJob(
      resumeText,
      job.title,
      job.description,
      job.instructions
    );

    console.log(
      "AI ANALYSIS:",
      JSON.stringify(match, null, 2)
    );
    console.log(
      `Match completed for ${fileName}: ${match.score}/10`
    );

    const candidate = await Candidate.create({
      job: job._id,

      fileName,

      candidateName,

      // FULL PDF TEXT
      resumeText,

      // STRUCTURED RESUME DATA FROM GEMINI
      extracted: {
        skills: extracted.skills || [],
        experience: extracted.experience || [],
        education: extracted.education || [],
      },

      // LLM SCREENING RESULT
      matchScore: Number(match.score) || 0,

      justification: match.justification || "",

      suggestions: match.suggestions || [],

      screening: {
        requirementMatch: match.requirementMatch || "",
        strongMatches: match.strongMatches || [],
        majorGaps: match.majorGaps || [],
        recommendation: match.recommendation || "",
      },

      // IMPORTANT: save the exact prompt used
      promptUsed: job.instructions || "",

      status: "completed",
    });

    console.log(
      `CANDIDATE SAVED TO MONGODB: ${candidate._id}`
    );

    return candidate;
  } catch (err) {
    console.error(
      `FAILED PROCESSING ${fileName}:`,
      err
    );

    try {
      const failedCandidate = await Candidate.create({
        job: job._id,
        fileName,
        candidateName,
        resumeText: resumeText || "Unable to extract resume text.",
        status: "failed",
        error: err.message,
      });

      console.log(
        `Failed candidate saved: ${failedCandidate._id}`
      );
    } catch (saveError) {
      console.error(
        `COULD NOT SAVE FAILED CANDIDATE:`,
        saveError
      );
    }

    throw err;
  }
}


// ============================================================
// LIST CANDIDATES
// ============================================================

router.get("/", async (req, res) => {
  try {
    const candidates =
      await Candidate.find({
        job: req.params.jobId,
      }).sort({
        matchScore: -1,
        createdAt: 1,
      });

    res.json(candidates);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});


// ============================================================
// DELETE CANDIDATE
// ============================================================

router.delete(
  "/:candidateId",
  async (req, res) => {
    try {
      await Candidate.findByIdAndDelete(
        req.params.candidateId
      );

      res.status(204).end();
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  }
);

export default router;