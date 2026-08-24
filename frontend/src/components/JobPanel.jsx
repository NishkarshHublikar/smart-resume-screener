import { useState } from "react";
import { Briefcase, Plus, ChevronRight, Trash2 } from "lucide-react";

const DEFAULT_INSTRUCTIONS = `Read the job requirements carefully, compare them to the resume requirement by requirement, and identify the main skill and experience gaps.
Give a mandatory numeric score from 1 to 10. Use a strict recruiter-style format such as:
Requirement match: 6/8. Major gaps: X, Y, Z. Recommendation: improve A and B.
Also list the strongest matches, the missing requirements, and practical improvements.`;

export default function JobPanel({ jobs, activeJob, onSelect, onCreate, onDelete }) {
  const [creating, setCreating] = useState(jobs.length === 0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSaving(true);
    try {
      await onCreate(title.trim(), description.trim(), instructions.trim() || DEFAULT_INSTRUCTIONS);
      setTitle("");
      setDescription("");
      setInstructions("");
      setCreating(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-panel border border-line rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase size={15} className="text-amber" />
          <h2 className="font-display font-semibold text-sm">Attempt / section</h2>
        </div>
        {jobs.length > 0 && (
          <button
            onClick={() => setCreating((c) => !c)}
            className="text-xs text-muted hover:text-teal flex items-center gap-1 font-mono"
          >
            <Plus size={12} />
            {creating ? "cancel" : "new attempt"}
          </button>
        )}
      </div>

      {creating ? (
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-[11px] font-mono text-muted uppercase tracking-wider">Role title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              className="mt-1 w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm placeholder:text-muted/60 focus:border-amber outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-muted uppercase tracking-wider">
              Job description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste the full job description here — responsibilities, required skills, experience level..."
              rows={6}
              className="mt-1 w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm placeholder:text-muted/60 focus:border-amber outline-none resize-none transition-colors"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-muted uppercase tracking-wider">
              LLM prompt
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Example: Compare the resume based on skills, experience, domain fit, and leadership potential. Rate the candidate from 1–10 and explain exactly why they match or do not match the role."
              rows={7}
              className="mt-1 w-full bg-ink border border-line rounded-lg px-3 py-2 text-sm placeholder:text-muted/60 focus:border-amber outline-none resize-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !title.trim() || !description.trim()}
            className="w-full bg-amber text-ink font-medium text-sm rounded-lg py-2.5 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
          >
            {saving ? "Saving…" : "Save attempt"}
          </button>
        </form>
      ) : (
        <div className="max-h-72 overflow-y-auto scrollbar-thin">
          {jobs.map((job) => (
            <div
              key={job._id}
              className={`w-full px-5 py-3 border-b border-line last:border-b-0 flex items-center justify-between gap-3 transition-colors ${
                activeJob?._id === job._id ? "bg-panel-2" : "hover:bg-panel-2/50"
              }`}
            >
              <button
                onClick={() => onSelect(job)}
                className="flex-1 text-left min-w-0 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{job.title}</p>
                  <p className="text-xs text-muted truncate font-mono mt-0.5">
                    {job.description.slice(0, 64)}…
                  </p>
                </div>
                <ChevronRight size={14} className="text-muted shrink-0" />
              </button>

              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(job._id);
                  }}
                  className="text-muted hover:text-red transition-colors p-1 shrink-0"
                  aria-label={`Delete attempt ${job.title}`}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
