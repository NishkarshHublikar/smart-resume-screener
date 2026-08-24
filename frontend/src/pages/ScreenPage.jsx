import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import JobPanel from "../components/JobPanel";
import Dropzone from "../components/Dropzone";
import SelfCheckPanel from "../components/SelfCheckPanel";
import { uploadResumes } from "../api/client";

export default function ScreenPage({ jobs, activeJob, onSelectJob, onCreateJob, onDeleteJob, onProcessed, goToResults }) {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
async function handleScreen() {
  if (!activeJob || files.length === 0) return;

  setProcessing(true);
  setError("");
  setProgress(0);

  try {
    console.log("Starting screening...");
    console.log("Job:", activeJob._id);
    console.log("Files:", files.map((f) => f.name));

    const result = await uploadResumes(
      activeJob._id,
      files,
      setProgress
    );

    console.log("SCREENING RESULT:", result);
    console.log("CANDIDATES:", result?.candidates);
    console.log("FAILURES:", result?.failures);

    onProcessed(result);

    setFiles([]);

    goToResults();
  } catch (err) {
    console.error("SCREENING ERROR:", err);

    setError(
      err.response?.data?.error ||
      err.message ||
      "Upload failed"
    );
  } finally {
    setProcessing(false);
  }
}

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Screen candidates</h1>
        <p className="text-sm text-muted mt-1">
          Pick a role, drop in resumes, and let the model score every candidate against it.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <JobPanel
          jobs={jobs}
          activeJob={activeJob}
          onSelect={onSelectJob}
          onCreate={onCreateJob}
          onDelete={onDeleteJob}
        />

        <div className="bg-panel border border-line rounded-xl p-5">
          <h2 className="font-display font-semibold text-sm mb-4 flex items-center gap-2">
            <Sparkles size={14} className="text-teal" />
            Resumes
          </h2>

          {!activeJob && (
            <p className="text-xs text-muted font-mono mb-4">
              Select or create a role on the left before uploading resumes.
            </p>
          )}

          <Dropzone files={files} setFiles={setFiles} disabled={!activeJob || processing} />

          {error && <p className="text-xs text-red mt-3 font-mono">{error}</p>}

          <button
            onClick={handleScreen}
            disabled={!activeJob || files.length === 0 || processing}
            className="w-full mt-4 bg-amber text-ink font-medium text-sm rounded-lg py-2.5 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                {progress < 100 ? `Uploading ${progress}%` : "Scoring with Gemini…"}
              </>
            ) : (
              `Screen ${files.length || ""} resume${files.length === 1 ? "" : "s"}`.trim()
            )}
          </button>
        </div>
      </div>

      <SelfCheckPanel activeJob={activeJob} />
    </div>
  );
}
