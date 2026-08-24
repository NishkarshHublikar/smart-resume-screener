# Smart Resume Screener

An AI-powered resume screening application that parses resumes, extracts structured candidate information, and evaluates each candidate against a job description using Google Gemini. Results are ranked in a modern dashboard for quick candidate review.

## Features

- Create and manage job postings
- Upload multiple resume PDFs for a selected role
- Extract candidate skills, experience, and education using an LLM
- Score candidate-job fit on a 1–10 scale
- Generate an LLM-based justification for each match score
- Rank candidates by match score
- View structured candidate information in an expandable results dashboard
- Handle individual resume-processing failures without interrupting the rest of the batch

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Resume Processing | Multer, pdf-parse |
| LLM | Google Gemini (`@google/generative-ai`) |
| Frontend | React, Vite |
| Styling | Tailwind CSS |
| Icons | lucide-react |
| HTTP Client | Axios |

## Architecture

```text
frontend (React SPA)
        │
        │ Axios
        │ REST API / multipart upload
        ▼
backend (Express API)
        │
        ├── routes/jobs.js
        │      └── Job CRUD operations
        │
        ├── routes/candidates.js
        │      └── Resume upload, processing & ranking
        │
        ├── services/resumeParser.js
        │      └── PDF → plain text
        │
        ├── services/geminiService.js
        │      └── Resume extraction & candidate matching
        │
        └── models/
               ├── Job.js
               └── Candidate.js
        │
        ▼
MongoDB
   ├── Jobs
   └── Candidates
```

### Data Model

A single `Job` represents a role, while multiple `Candidate` documents are associated with that job.

```text
Job
 └── Candidates
      ├── Candidate 1
      ├── Candidate 2
      ├── Candidate 3
      └── ...
```

## Request Flow

### Resume Upload → Candidate Ranking

1. The user creates or selects a **Job** containing a title and full job description.
2. The user uploads one or more resume PDFs.
3. The frontend sends the files as `multipart/form-data` to `POST /api/jobs/:jobId/candidates`.
4. For each resume, the backend:
   - Extracts text from the PDF using `pdf-parse`.
   - Uses Gemini to extract structured skills, experience, and education.
   - Uses Gemini again to evaluate the candidate's fit against the job description.
   - Stores the candidate and scoring results in MongoDB.
5. Candidate processing is performed independently using `Promise.allSettled`, so a failed resume does not prevent other resumes in the batch from being processed.
6. The results endpoint returns candidates ranked by match score.
7. The frontend displays the ranked candidates with their fit score, skills, experience, education, and LLM-generated justification.

## LLM Processing

The application uses two Gemini calls for each resume.

### 1. Structured Resume Extraction

The first call converts unstructured resume text into structured candidate data.

```text
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

### 2. Candidate Matching

The second call evaluates the candidate against the selected job description and returns a numerical fit score with an explanation.

```text
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

## Project Structure

```text
smart-resume-screener/
│
├── backend/
│   ├── middleware/
│   │   └── upload.js
│   │
│   ├── models/
│   │   ├── Candidate.js
│   │   └── Job.js
│   │
│   ├── routes/
│   │   ├── candidates.js
│   │   └── jobs.js
│   │
│   ├── services/
│   │   ├── geminiService.js
│   │   └── resumeParser.js
│   │
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── LICENSE
└── README.md
```

## Setup

### Prerequisites

- Node.js
- MongoDB
- Google Gemini API key

### 1. Clone the Repository

```bash
git clone <repository-url>
cd smart-resume-screener
```

### 2. Configure the Backend

```bash
cd backend
cp .env.example .env
npm install
```

Add the required environment variables to `.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/smart_resume_screener
GEMINI_API_KEY=your_gemini_api_key
```

Optionally, configure the Gemini model:

```env
GEMINI_MODEL=gemini-2.0-flash
```

Start the backend:

```bash
npm start
```

For development:

```bash
npm run dev
```

### 3. Configure the Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

If the backend is running on the default `localhost:5000`, no additional configuration is required.

Open the local frontend URL displayed by Vite.

### 4. MongoDB

The application supports either:

- A local MongoDB instance using the default connection:
  `mongodb://127.0.0.1:27017/smart_resume_screener`
- A MongoDB Atlas connection configured through `MONGODB_URI`

### 5. Gemini API Key

A Gemini API key can be obtained from Google AI Studio.

The application uses `gemini-2.0-flash` by default. The model can be overridden through the `GEMINI_MODEL` environment variable.

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/jobs` | Create a new job |
| `GET` | `/api/jobs` | List all jobs |
| `GET` | `/api/jobs/:id` | Retrieve a job |
| `DELETE` | `/api/jobs/:id` | Delete a job and its candidates |
| `POST` | `/api/jobs/:jobId/candidates` | Upload and screen resumes |
| `GET` | `/api/jobs/:jobId/candidates` | Retrieve ranked candidates |
| `DELETE` | `/api/jobs/:jobId/candidates/:id` | Remove a candidate |

### Create Job

```http
POST /api/jobs
Content-Type: application/json
```

```json
{
  "title": "Software Engineer",
  "description": "Full job description..."
}
```

### Upload Resumes

```http
POST /api/jobs/:jobId/candidates
Content-Type: multipart/form-data
```

Upload resumes using the `resumes` field.

- Maximum files per request: **20**
- Maximum file size: **10 MB**
- Supported format: **PDF**

## Results Dashboard

The Results dashboard provides a ranked view of screened candidates.

Each candidate displays:

- Overall fit score
- Extracted skills
- Experience
- Education
- LLM-generated match justification

Candidates are automatically sorted by match score in descending order, allowing recruiters to quickly identify the strongest matches.

## Error Handling

Resume processing is isolated per candidate. If an individual PDF fails during parsing, extraction, or scoring, the candidate is recorded as failed while the remaining resumes continue processing.

This prevents a single malformed or unsupported resume from interrupting an entire screening batch.

## Demo Video

The demo provides a short end-to-end walkthrough of the application: 
https://drive.google.com/file/d/1JW6nKeZUt_dfEqgjzZ7IlaYGO90OzyN8/view?usp=sharing

1. Create a job posting.
2. Upload multiple resume PDFs.
3. Run the screening process.
4. View the ranked candidate results.
5. Expand a candidate to review the extracted information and LLM-generated justification.

The walkthrough demonstrates the complete workflow from job creation and resume upload to candidate ranking and review.

## Evaluation Focus

### Code Quality & Architecture

Routes, models, middleware, and services are separated by responsibility. PDF parsing and LLM processing are isolated into dedicated services, making the application easier to maintain and extend.

### Data Extraction

Resume information is converted into structured candidate data containing skills, experience, and education.

### LLM Matching

Candidate-job compatibility is evaluated using a dedicated matching prompt that produces both a numerical fit score and a textual justification.

### Output & Usability

The dashboard presents candidates in ranked order and surfaces the most relevant information without requiring users to inspect raw LLM output.

## Environment & Security

Environment-specific configuration is stored through `.env` files and is not committed to the repository.

Use `.env.example` files as templates for required configuration.

Do not commit API keys, database credentials, or other sensitive configuration.

## License

This project is licensed under the terms specified in the repository's `LICENSE` file.