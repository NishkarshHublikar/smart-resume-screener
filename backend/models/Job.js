import mongoose from "mongoose";

const defaultInstructions = `Input: PDF/Text resumes + job description
● Extract structured data: skills, experience, education
● Compare the resume against the job requirements requirement by requirement
● Give a strict recruiter-style score, highlight major gaps, and recommend improvements
Example prompt: “Read the job requirements carefully, compare them to the resume, identify the gaps, and rate fit from 1–10. Use the format: Requirement match: X/8. Major gaps: A, B, C. Recommendation: improve A and B.”`;

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    instructions: { type: String, default: defaultInstructions },
  },
  { timestamps: true }
);

export default mongoose.model("Job", jobSchema);
