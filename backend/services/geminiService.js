import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

if (!GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is not configured.");
}

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

// Models are tried in this order if one is unavailable.
const SUPPORTED_MODELS = [
  DEFAULT_MODEL,
  "gemini-3.5-flash",
].filter((model, index, arr) => arr.indexOf(model) === index);

/**
 * Extract JSON from Gemini's response.
 */
function parseJsonResponse(text) {
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  let cleaned = text.trim();

  // Remove markdown code fences.
  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Sometimes Gemini puts explanatory text before/after JSON.
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1) {
      const possibleJson = cleaned.slice(firstBrace, lastBrace + 1);

      try {
        return JSON.parse(possibleJson);
      } catch {
        // Continue to the final error below.
      }
    }

    throw new Error(
      `Gemini returned invalid JSON: ${cleaned.slice(0, 500)}`
    );
  }
}

/**
 * Generate a JSON response using Gemini.
 */
export async function generateJson(prompt) {
  let lastError = null;

  for (const model of SUPPORTED_MODELS) {
    try {
      console.log(`Trying Gemini model: ${model}`);

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });

      const text = response.text;

      if (!text) {
        throw new Error(`Gemini returned no text using ${model}`);
      }

      console.log(`Gemini response received using ${model}`);

      return parseJsonResponse(text);
    } catch (err) {
      lastError = err;

      console.error(
        `Gemini model ${model} failed:`,
        err?.message || err
      );
    }
  }

  throw new Error(
    `Gemini request failed for all supported model names. ${
      lastError?.message || ""
    }`
  );
}

/**
 * Extract structured information from a resume.
 */
export async function extractResumeData(resumeText) {
  const prompt = `
You are an expert resume parser.

Extract structured information from the resume below.

IMPORTANT:
- Only extract information actually present in the resume.
- Do not invent skills, companies, degrees, roles, dates, or experience.
- Preserve the meaning of the resume.
- Return ONLY valid JSON.

Return exactly this structure:

{
  "skills": ["skill 1", "skill 2"],
  "experience": [
    {
      "role": "job title",
      "company": "company name",
      "duration": "duration or dates"
    }
  ],
  "education": [
    {
      "degree": "degree",
      "institution": "institution",
      "year": "year or date"
    }
  ]
}

RESUME:
${resumeText}
`;

  const result = await generateJson(prompt);

  return {
    skills: Array.isArray(result.skills) ? result.skills : [],
    experience: Array.isArray(result.experience)
      ? result.experience
      : [],
    education: Array.isArray(result.education)
      ? result.education
      : [],
  };
}

/**
 * Match a resume against a job.
 *
 * Inputs:
 * - resumeText
 * - jobTitle
 * - jobDescription
 * - userInstructions
 *
 * The user's custom prompt controls WHAT the analysis emphasizes,
 * while the system instructions guarantee a consistent structured result.
 */
export async function matchResumeToJob(
  resumeText,
  jobTitle,
  jobDescription,
  userInstructions
) {
  const customInstructions =
    userInstructions?.trim() ||
    `
Compare the resume against the job description.
Give a score from 1 to 10.
Identify the strongest matches, missing requirements,
major gaps, and practical improvements.
`;

  const prompt = `
You are an expert technical recruiter and resume screening system.

Your job is to evaluate ONE candidate resume against ONE job.

You have FOUR inputs:

1. JOB TITLE
2. JOB DESCRIPTION
3. CANDIDATE RESUME
4. USER'S ANALYSIS INSTRUCTION

You MUST use all four inputs.

==================================================
JOB TITLE
==================================================

${jobTitle || "Not specified"}

==================================================
JOB DESCRIPTION
==================================================

${jobDescription || "Not specified"}

==================================================
CANDIDATE RESUME
==================================================

${resumeText}

==================================================
USER'S ANALYSIS INSTRUCTION
==================================================

${customInstructions}

==================================================
IMPORTANT ANALYSIS RULES
==================================================

The user's instruction tells you what they want to know.

Follow it carefully.

However, the final response MUST always contain:

1. A numeric score from 1 to 10.
2. A clear explanation of why that score was given.
3. The strongest matches between the resume and JD.
4. The important missing requirements or gaps.
5. Practical recommendations.

If the user's prompt specifically asks about:

- skills:
  Focus heavily on skill-by-skill matching.

- experience:
  Compare the candidate's actual experience against the required experience.

- qualifications:
  Compare education, certifications, and stated qualifications.

- improvement:
  Give concrete changes the candidate can make to the resume.

- ATS:
  Focus on keywords, skills, terminology, and missing JD language.

- leadership:
  Look specifically for evidence of ownership, leadership, mentoring, impact,
  decision-making, and responsibility.

- a simple comparison:
  Keep the explanation concise but still provide the required score,
  matches, gaps, and recommendation.

Do NOT give generic career advice unrelated to this particular JD and resume.

Do NOT reward a candidate for a skill merely because it is common in the industry.

Only treat something as a match when the resume provides evidence for it.

If the JD requires something that is not present in the resume,
consider it a gap.

If something is unclear or cannot be verified from the resume,
say that it is unclear rather than assuming it exists.

==================================================
SCORING
==================================================

Give a STRICT score from 1 to 10.

Use this general interpretation:

9-10 = Exceptional fit. Meets nearly all important requirements.
7-8  = Strong fit. Meets most important requirements with some gaps.
5-6  = Moderate fit. Several relevant matches but meaningful gaps exist.
3-4  = Weak fit. Major requirements are missing.
1-2  = Very poor fit. Little meaningful alignment.

The score must reflect the actual JD requirements.

Do not automatically give high scores.

==================================================
OUTPUT
==================================================

Return ONLY valid JSON.

Use exactly this structure:

{
  "score": 8,
  "requirementMatch": "7/9",
  "strongMatches": [
    "The candidate has ...",
    "The candidate demonstrates ..."
  ],
  "majorGaps": [
    "The JD requires ... but the resume does not show it.",
    "The candidate lacks clear evidence of ..."
  ],
  "recommendation": "A concise recruiter-style recommendation specific to this candidate and role.",
  "justification": "A concise but specific explanation of why the candidate received this score.",
  "suggestions": [
    "Add or strengthen ...",
    "Highlight ...",
    "Quantify ...",
    "Include relevant evidence of ..."
  ]
}

==================================================
QUALITY REQUIREMENTS
==================================================

The output must be specific to THIS resume and THIS job.

Avoid generic statements such as:
- "Improve your skills."
- "Gain more experience."
- "Make your resume better."
- "Learn relevant technologies."

Instead say exactly what is missing and what should be changed.

For example:

BAD:
"Improve your technical skills."

GOOD:
"The JD requires Java and Spring Boot, but the resume does not show either. Add relevant project or internship experience if genuinely available."

BAD:
"The candidate has good experience."

GOOD:
"The resume shows a Deloitte internship involving data analysis and ETL, which aligns with the JD's requirement for data-driven process improvement."

Remember:
Do not invent information.
Do not assume experience.
Do not hallucinate missing technologies.
Do not mention information that is not supported by the resume.
`;

  const result = await generateJson(prompt);

  // Normalize Gemini's response so MongoDB always receives
  // the structure expected by Candidate.js.
  const score = Number(result.score);

  return {
    score:
      Number.isFinite(score)
        ? Math.max(1, Math.min(10, score))
        : 1,

    requirementMatch:
      typeof result.requirementMatch === "string"
        ? result.requirementMatch
        : "",

    strongMatches: Array.isArray(result.strongMatches)
      ? result.strongMatches
      : [],

    majorGaps: Array.isArray(result.majorGaps)
      ? result.majorGaps
      : [],

    recommendation:
      typeof result.recommendation === "string"
        ? result.recommendation
        : "",

    justification:
      typeof result.justification === "string"
        ? result.justification
        : "",

    suggestions: Array.isArray(result.suggestions)
      ? result.suggestions
      : [],
  };
}

export async function checkResumeFit(
  resumeText,
  jobDescription,
  userPrompt = ""
) {
  const instructions =
    userPrompt?.trim() ||
    "Compare the resume with the job description and give a strict fit score from 1 to 10.";

  const prompt = `
You are an expert resume screening system.

Analyze the candidate resume against the job description.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE RESUME:
${resumeText}

USER REQUEST:
${instructions}

Return ONLY valid JSON:

{
  "score": 8,
  "justification": "Specific explanation based only on the resume and job description.",
  "suggestions": [
    "Specific improvement 1",
    "Specific improvement 2"
  ]
}

Rules:
- Score strictly from 1 to 10.
- Base the score only on evidence in the resume.
- Do not invent skills or experience.
- Make the explanation specific to this candidate and JD.
- Give practical improvements.
`;

  const result = await generateJson(prompt);

  const score = Number(result.score);

  return {
    score: Number.isFinite(score)
      ? Math.max(1, Math.min(10, score))
      : 1,

    justification:
      typeof result.justification === "string"
        ? result.justification
        : "",

    suggestions: Array.isArray(result.suggestions)
      ? result.suggestions
      : [],
  };
}