export function parseRequirementSummary(justification = "") {
  if (!justification) return null;

  const requirementMatch = (() => {
    const match = justification.match(/Requirement match:\s*([^.;]+(?:\.[^.;]+)*)/i);
    return match ? match[1].trim() : "";
  })();

  const strongMatches = (() => {
    const match = justification.match(/Strong matches:\s*(.*?)(?=\s*(?:Major gaps:|Recommendation:|$))/is);
    if (!match) return [];
    return match[1]
      .split(/[;,]/)
      .map((part) => part.trim())
      .filter(Boolean);
  })();

  const majorGaps = (() => {
    const match = justification.match(/Major gaps:\s*(.*?)(?=\s*(?:Recommendation:|$))/is);
    if (!match) return [];
    return match[1]
      .split(/[;,]/)
      .map((part) => part.trim())
      .filter(Boolean);
  })();

  const recommendation = (() => {
    const match = justification.match(/Recommendation:\s*(.*)$/is);
    return match ? match[1].trim() : "";
  })();

  const hasStructuredData = requirementMatch || strongMatches.length || majorGaps.length || recommendation;
  if (!hasStructuredData) return null;

  return {
    requirementMatch,
    strongMatches,
    majorGaps,
    recommendation,
  };
}
