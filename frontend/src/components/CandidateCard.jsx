import { useState } from "react";
import { ChevronDown, GraduationCap, Briefcase, AlertTriangle, Trash2 } from "lucide-react";
import FitGauge from "./FitGauge";
import { parseRequirementSummary } from "../utils/justification";

export default function CandidateCard({ candidate, rank, onDelete }) {
  const [open, setOpen] = useState(false);

  if (candidate.status === "failed") {
    return (
      <div className="bg-panel border border-red/30 rounded-xl px-5 py-4 flex items-center gap-3 animate-rise-in">
        <AlertTriangle size={16} className="text-red shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{candidate.fileName}</p>
          <p className="text-xs text-red/80 font-mono truncate">{candidate.error || "Processing failed"}</p>
        </div>
        {onDelete && (
          <button onClick={onDelete} className="ml-auto text-muted hover:text-red">
            <Trash2 size={14} />
          </button>
        )}
      </div>
    );
  }

  const skills = candidate.extracted?.skills || [];
  const experience = candidate.extracted?.experience || [];
  const education = candidate.extracted?.education || [];
  const suggestions = candidate.suggestions || [];
  const justification = candidate.justification || "No fit justification was returned for this candidate.";
  const requirementSummary = parseRequirementSummary(justification);
  const rawResumeText = candidate.resumeText || "";

  return (
    <div
      className="bg-panel border border-line rounded-xl overflow-hidden animate-rise-in"
      style={{ animationDelay: `${Math.min(rank, 8) * 40}ms` }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-panel-2/40 transition-colors"
      >
        <span className="font-mono text-xs text-muted w-6 shrink-0">
          {String(rank).padStart(2, "0")}
        </span>
        <FitGauge score={candidate.matchScore} size={68} />
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-base truncate">{candidate.candidateName}</p>
          <p className="text-xs text-muted truncate font-mono mt-0.5">{candidate.fileName}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {skills.slice(0, 5).map((s) => (
              <span
                key={s}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal/10 text-teal border border-teal/20"
              >
                {s}
              </span>
            ))}
            {skills.length > 5 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 text-muted">
                +{skills.length - 5} more
              </span>
            )}
            {skills.length === 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 text-muted">
                no skills parsed
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-line space-y-4">
          <div>
            <p className="text-[11px] font-mono text-amber uppercase tracking-wider mb-2">
              Match justification
            </p>

            {requirementSummary ? (
              <div className="space-y-3 text-sm leading-relaxed text-text/90">
                {requirementSummary.requirementMatch && (
                  <p>
                    <span className="font-medium text-text">Requirement match:</span>{" "}
                    {requirementSummary.requirementMatch}
                  </p>
                )}

                {requirementSummary.strongMatches.length > 0 && (
                  <div>
                    <p className="font-medium text-text">Strong matches:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      {requirementSummary.strongMatches.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {requirementSummary.majorGaps.length > 0 && (
                  <div>
                    <p className="font-medium text-text">Major gaps:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      {requirementSummary.majorGaps.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {requirementSummary.recommendation && (
                  <p>
                    <span className="font-medium text-text">Recommendation:</span>{" "}
                    {requirementSummary.recommendation}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-text/90 leading-relaxed">{justification}</p>
            )}
          </div>

          {suggestions.length > 0 && (
            <div>
              <p className="text-[11px] font-mono text-muted uppercase tracking-wider mb-2">
                Suggestions
              </p>
              <ul className="space-y-1.5 list-disc pl-5 text-sm text-text/90 leading-relaxed">
                {suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-[11px] font-mono text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Briefcase size={11} /> Experience
            </p>
            {experience.length > 0 ? (
              <ul className="space-y-2">
                {experience.map((e, i) => (
                  <li key={i} className="text-sm leading-relaxed">
                    <div className="font-medium text-text">{e.role || "Professional Experience"}</div>
                    <div className="text-muted text-xs mt-0.5">
                      {e.company || "Not specified"}
                      {e.duration ? ` • ${e.duration}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No experience details found in the resume.</p>
            )}
          </div>

          <div>
            <p className="text-[11px] font-mono text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <GraduationCap size={11} /> Education
            </p>
            {education.length > 0 ? (
              <ul className="space-y-2">
                {education.map((ed, i) => (
                  <li key={i} className="text-sm leading-relaxed">
                    <div className="font-medium text-text">{ed.degree || "Not specified"}</div>
                    <div className="text-muted text-xs mt-0.5">
                      {ed.institution || "Not specified"}
                      {ed.year ? ` • ${ed.year}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No education details found in the resume.</p>
            )}
          </div>

          {rawResumeText && (
            <div>
              <p className="text-[11px] font-mono text-muted uppercase tracking-wider mb-2">
                Resume snapshot
              </p>
              <div className="max-h-48 overflow-auto rounded-lg border border-line bg-ink/80 p-3 text-xs leading-6 text-text/85 whitespace-pre-wrap">
                {rawResumeText.slice(0, 3000)}
                {rawResumeText.length > 3000 && "..."}
              </div>
            </div>
          )}

          {onDelete && (
            <button
              onClick={onDelete}
              className="text-xs text-muted hover:text-red flex items-center gap-1 font-mono"
            >
              <Trash2 size={12} /> remove candidate
            </button>
          )}
        </div>
      )}
    </div>
  );
}
