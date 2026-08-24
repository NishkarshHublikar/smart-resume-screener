import pdfParse from "pdf-parse/lib/pdf-parse.js";

/**
 * Extracts raw text from a PDF file buffer.
 * @param {Buffer} buffer - the uploaded PDF file buffer
 * @returns {Promise<string>} extracted plain text
 */
export async function extractTextFromPdf(buffer) {
  const data = await pdfParse(buffer);
  return (data.text || "").trim();
}

/**
 * Best-effort guess of a candidate's name from resume text.
 * Falls back to "Unnamed Candidate" if nothing plausible is found.
 * Looks at the first few non-empty lines, skipping obvious headers/emails.
 */
export function guessCandidateName(resumeText) {
  const lines = resumeText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 8);

  for (const line of lines) {
    const looksLikeContact =
      /@/.test(line) || /\d{3,}/.test(line) || line.length > 60;
    const wordCount = line.split(/\s+/).length;
    if (!looksLikeContact && wordCount >= 2 && wordCount <= 5) {
      return line;
    }
  }
  return "Unnamed Candidate";
}
