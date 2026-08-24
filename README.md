# Smart Resume Screener

Parses resumes, extracts structured candidate data, and scores each candidate against a job
description using an LLM — with a ranked, modern dashboard to review results.

## Stack

| Layer     | Tech                                                    |
|-----------|----------------------------------------------------------|
| Backend   | Node.js, Express, MongoDB (Mongoose), Multer, pdf-parse |
| LLM       | Google Gemini (`@google/generative-ai`)                 |
| Frontend  | React (Vite), Tailwind CSS, lucide-react, axios          |
| Storage   | MongoDB — one `Job` per role, many `Candidate`s per job  |

No frameworks or services outside this list are used, per the assignment's package/dependency
guidance ("use only what is strictly required").

## Architecture

```
frontend (React SPA)
  │  axios (multipart upload, REST)
  ▼
backend (Express API)
  ├── routes/jobs.js         → CRUD for job postings
  ├── routes/candidates.js   → upload resumes, orchestrate parsing + scoring, list ranked results
  ├── services/resumeParser.js → pdf-parse: PDF buffer → plain text, name heuristic
  ├── services/geminiService.js → two Gemini calls per resume (extraction, matching)
  └── models/ (Job, Candidate) → Mongoose schemas
  │
  ▼
MongoDB (Job, Candidate collections)
```

### Request flow (upload → score)

1. User picks/creates a **Job** (title + full description) in the UI.
2. User drops one or more resume **PDFs**.
3. Frontend sends them as `multipart/form-data` to `POST /api/jobs/:jobId/candidates`.
4. For each file, the backend:
   - Extracts raw text with `pdf-parse`.
   - Calls Gemini once to **extract** structured skills / experience / education (JSON).
   - Calls Gemini a second time to **score fit 1–10 with justification** (JSON), using the
     exact prompt style specified in the assignment brief.
   - Saves a `Candidate` document (or a `failed` record with the error, so one bad PDF never
     blocks the rest of the batch — `Promise.allSettled` is used across the batch).
5. `GET /api/jobs/:jobId/candidates` returns candidates sorted by `matchScore` descending.
6. The Results dashboard renders them as a ranked list with a radial fit-score gauge, extracted
   skill tags, and an expandable panel with the LLM's justification, experience, and education.

## LLM prompts used

Both live in `backend/services/geminiService.js`.

**1. Structured extraction** — pulls skills / experience / education out of resume text:

```
You are a resume parsing engine.
Extract structured data from the resume text below.

Return ONLY valid JSON in exactly this shape, with no markdown formatting and no text outside the JSON object:
{
  "skills": string[],
  "experience": [{ "role": string, "company": string, "duration": string }],
  "education": [{ "degree": string, "institution": string, "year": string }]
}

If a field cannot be found, return an empty array for it. Do not invent data that is not present in the resume.

Resume:
"""
<resume text>
"""
```

**2. Match scoring** — mirrors the assignment's example prompt verbatim, with a JSON-only
response constraint added so the score/justification can be parsed and stored:

```
Compare the following resume with this job description and rate fit on 1-10 with justification.

Return ONLY valid JSON in exactly this shape, with no markdown formatting and no text outside the JSON object:
{
  "score": number,
  "justification": string
}

Resume:
"""
<resume text>
"""

Job Description:
"""
<job description>
"""
```

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env     # fill in MONGODB_URI and GEMINI_API_KEY
npm install
npm start                 # or: npm run dev
```

Get a Gemini API key at https://aistudio.google.com/apikey. Default model is
`gemini-2.0-flash` (override with `GEMINI_MODEL` in `.env`).

MongoDB: either run one locally (`mongodb://127.0.0.1:27017/smart_resume_screener` is the
default) or point `MONGODB_URI` at a MongoDB Atlas cluster.

### 2. Frontend

```bash
cd frontend
cp .env.example .env      # only needed if the backend isn't on localhost:5000
npm install
npm run dev
```

Open the printed local URL. Create a role, drop in a few resume PDFs, and hit **Screen** —
results land on the **Results** tab, ranked by fit score.

## API reference

| Method | Route                                  | Purpose                                   |
|--------|-----------------------------------------|--------------------------------------------|
| POST   | `/api/jobs`                            | Create a job `{ title, description }`     |
| GET    | `/api/jobs`                            | List jobs                                 |
| GET    | `/api/jobs/:id`                        | Get one job                               |
| DELETE | `/api/jobs/:id`                        | Delete a job + its candidates             |
| POST   | `/api/jobs/:jobId/candidates`          | Upload resumes (`multipart`, field `resumes`, up to 20 PDFs, 10MB each) |
| GET    | `/api/jobs/:jobId/candidates`          | List candidates, ranked by `matchScore` desc |
| DELETE | `/api/jobs/:jobId/candidates/:id`      | Remove a candidate                        |

## Notes on evaluation focus

- **Code quality & structure** — routes / models / services are separated; PDF parsing and
  LLM calls are isolated in `services/`, so either can be swapped without touching route logic.
- **Data extraction** — handled by a dedicated Gemini extraction prompt, stored as structured
  sub-documents on `Candidate.extracted`.
- **LLM prompt quality** — the matching prompt reuses the assignment's own example prompt
  verbatim, with a minimal JSON-output constraint layered on for parseability.
- **Output clarity** — the Results dashboard ranks candidates, shows the score as a gauge,
  and surfaces the justification directly instead of raw LLM output.

## Demo video

Not included in this package — record a 2–3 min walkthrough (create a role → upload a couple
of resumes → show the ranked results + an expanded justification) before submitting, per the
assignment's deliverables list.
