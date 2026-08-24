import { useEffect, useState, useCallback } from "react";
import { Inbox, RefreshCw } from "lucide-react";
import CandidateCard from "../components/CandidateCard";
import { listCandidates, deleteCandidate } from "../api/client";

export default function ResultsPage({ activeJob, goToScreen }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  const jobId = activeJob?._id;

  const load = useCallback(async () => {
    if (!jobId) {
      setCandidates([]);
      return;
    }

    setLoading(true);

    try {
      console.log("Loading candidates for job:", jobId);

      const data = await listCandidates(jobId);

      console.log("Candidates loaded from MongoDB:", data);

      setCandidates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(
        "Failed to load candidates:",
        err?.response?.data || err.message
      );
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  // Load saved candidates every time the selected job changes.
  // This also runs when the browser is refreshed.
  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(candidateId) {
    if (!candidateId || !jobId) return;

    try {
      await deleteCandidate(jobId, candidateId);

      setCandidates((prev) =>
        prev.filter((candidate) => candidate._id !== candidateId)
      );
    } catch (err) {
      console.error(
        "Failed to delete candidate:",
        err?.response?.data || err.message
      );
    }
  }

  if (!activeJob) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <Inbox size={28} className="text-muted mx-auto mb-3" />

        <p className="text-sm text-muted">
          No role selected yet.
        </p>

        <button
          onClick={goToScreen}
          className="mt-4 text-sm text-amber font-medium"
        >
          Go set one up →
        </button>
      </div>
    );
  }

  const completed = candidates.filter(
    (candidate) => candidate.status === "completed"
  );

  const failed = candidates.filter(
    (candidate) => candidate.status === "failed"
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {activeJob.title}
          </h1>

          <p className="text-sm text-muted mt-1">
            {completed.length} candidate
            {completed.length === 1 ? "" : "s"} ranked by fit score
          </p>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="shrink-0 flex items-center gap-1.5 text-xs font-mono text-muted hover:text-text border border-line rounded-lg px-3 py-2 disabled:opacity-50"
        >
          <RefreshCw
            size={12}
            className={loading ? "animate-spin" : ""}
          />
          refresh
        </button>
      </div>

      {loading && candidates.length === 0 && (
        <div className="text-center py-20">
          <RefreshCw
            size={24}
            className="text-muted mx-auto mb-3 animate-spin"
          />

          <p className="text-sm text-muted">
            Loading saved candidates...
          </p>
        </div>
      )}

      {!loading && candidates.length === 0 && (
        <div className="text-center py-20">
          <Inbox
            size={28}
            className="text-muted mx-auto mb-3"
          />

          <p className="text-sm text-muted">
            No candidates screened for this role yet.
          </p>

          <button
            onClick={goToScreen}
            className="mt-4 text-sm text-amber font-medium"
          >
            Upload resumes →
          </button>
        </div>
      )}

      <div className="space-y-3">
        {completed.map((candidate, index) => (
          <CandidateCard
            key={candidate._id}
            candidate={candidate}
            rank={index + 1}
            onDelete={() => handleDelete(candidate._id)}
          />
        ))}

        {failed.map((candidate) => (
          <CandidateCard
            key={candidate._id}
            candidate={candidate}
            rank={0}
            onDelete={() => handleDelete(candidate._id)}
          />
        ))}
      </div>
    </div>
  );
}