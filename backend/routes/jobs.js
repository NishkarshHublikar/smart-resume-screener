import { Router } from "express";
import Job from "../models/Job.js";
import Candidate from "../models/Candidate.js";
import upload from "../middleware/upload.js";
import { extractTextFromPdf } from "../services/resumeParser.js";
import { checkResumeFit } from "../services/geminiService.js";

const router = Router();
const DEFAULT_INSTRUCTIONS = `Input: PDF/Text resumes + job description
● Extract structured data: skills, experience, education
● Compare the resume against the job requirements requirement by requirement
● Give a strict recruiter-style score, highlight major gaps, and recommend improvements
Example prompt: “Read the job requirements carefully, compare them to the resume, identify the gaps, and rate fit from 1–10. Use the format: Requirement match: X/8. Major gaps: A, B, C. Recommendation: improve A and B.”`;

// Create a new job posting
router.post("/", async (req, res) => {
  try {
    const { title, description, instructions } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "title and description are required" });
    }
    const job = await Job.create({
      title,
      description,
      instructions: (instructions || DEFAULT_INSTRUCTIONS).trim(),
    });
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all job postings, most recent first
router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single job posting
router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a job posting and its candidates
router.delete("/:id", async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    await Candidate.deleteMany({ job: req.params.id });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Self-check: a candidate pastes/uploads their own resume against this job
// and asks a (free-form, editable) prompt — returns score + justification
// + concrete suggestions. Separate from the hirer-side bulk screening flow.
router.post("/:id/ask", upload.single("resume"), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });

    let resumeText = (req.body.resumeText || "").trim();
    if (!resumeText && req.file) {
      resumeText = await extractTextFromPdf(req.file.buffer);
    }
    if (!resumeText || resumeText.length < 20) {
      return res
        .status(400)
        .json({ error: "Paste your resume text or upload a PDF with readable text" });
    }

    const result = await checkResumeFit(resumeText, job.description, req.body.prompt);

    await Candidate.create({
      job: job._id,
      fileName: "self-check",
      candidateName: "Self Check",
      resumeText,
      extracted: { skills: [], experience: [], education: [] },
      matchScore: result.score,
      justification: result.justification,
      suggestions: result.suggestions || [],
      status: "completed",
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
