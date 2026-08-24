import { useEffect, useState } from "react";
import { Wand2, Loader2, FileText, X, Lightbulb } from "lucide-react";
import FitGauge from "./FitGauge";
import { askJobFit } from "../api/client";

const DEFAULT_PROMPT =
  "Rate my resume from 1 to 10 for this job. Tell me whether I am a good fit, explain exactly why or why not, and give concrete suggestions on how I can improve my resume for this role.";

export default function SelfCheckPanel({ activeJob }) {
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    setPrompt(activeJob?.instructions || DEFAULT_PROMPT);
  }, [activeJob]);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      setResumeText("");
    }
  }

  async function handleAsk() {
    if (!activeJob || (!resumeText.trim() && !resumeFile)) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await askJobFit(activeJob._id, { resumeText, resumeFile, prompt });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-panel border border-line rounded-xl p-5 mt-6">
      <h2 className="font-display font-semibold text-sm mb-1 flex items-center gap-2">
        <Wand2 size={14} className="text-teal" />
        Check your own fit
      </h2>
      <p className="text-xs text-muted mb-4">
        Paste or upload your resume, ask the model whatever you want, and get a score plus
        concrete suggestions — against {activeJob ? activeJob.title : "the selected role"}.
      </p>

      {!activeJob && (
        <p className="text-xs text-muted font-mono mb-4">
          Select or create a role above first.
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-mono text-muted uppercase tracking-wider">
            Your resume
          </label>

          {resumeFile ? (
            <div className="mt-1 flex items-center justify-between gap-2 bg-ink border border-line rounded-lg px-3 py-2 text-xs">
              <span className="flex items-center gap-2 min-w-0">
                <FileText size={13} className="text-teal shrink-0" />
                <span className="truncate">{resumeFile.name}</span>
              </span>
              <button
                onClick={() => setResumeFile(null)}
                className="text-muted hover:text-red shrink-0"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text here…"
                rows={6}
                disabled={!activeJob}
                className="mt-1 w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm placeholder:text-muted/60 focus:border-amber outline-none resize-none transition-colors disabled:opacity-40"
              />
              <label
                className={`mt-1.5 inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-teal cursor-pointer ${
                  !activeJob ? "opacity-40 pointer-events-none" : ""
                }`}
              >
                <FileText size={12} />
                or upload a PDF instead
                <input type="file" accept="application/pdf" hidden onChange={handleFile} />
              </label>
            </>
          )}
        </div>

        <div>
          <label className="text-[11px] font-mono text-muted uppercase tracking-wider">
            Your prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={6}
            disabled={!activeJob}
            className="mt-1 w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm placeholder:text-muted/60 focus:border-amber outline-none resize-none transition-colors disabled:opacity-40"
          />
        </div>
      </div>

      {error && <p className="text-xs text-red mt-3 font-mono">{error}</p>}

      <button
        onClick={handleAsk}
        disabled={!activeJob || (!resumeText.trim() && !resumeFile) || loading}
        className="mt-4 bg-amber text-ink font-medium text-sm rounded-lg py-2.5 px-5 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Asking Gemini…
          </>
        ) : (
          "Ask"
        )}
      </button>

      {result && (
        <div className="mt-5 pt-5 border-t border-line flex flex-col md:flex-row gap-5">
          <FitGauge score={result.score} size={68} />
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-[11px] font-mono text-amber uppercase tracking-wider mb-1">
                Verdict
              </p>
              <p className="text-sm text-text/90 leading-relaxed">{result.justification}</p>
            </div>
            {result.suggestions?.length > 0 && (
              <div>
                <p className="text-[11px] font-mono text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Lightbulb size={11} /> Suggestions
                </p>
                <ul className="space-y-1.5 list-disc list-inside">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="text-sm text-text/90 leading-relaxed">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
