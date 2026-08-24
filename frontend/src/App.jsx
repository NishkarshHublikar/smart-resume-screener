import { useEffect, useState } from "react";
import TopBar from "./components/TopBar";
import ScreenPage from "./pages/ScreenPage";
import ResultsPage from "./pages/ResultsPage";
import { listJobs, createJob, deleteJob } from "./api/client";

export default function App() {
  const [view, setView] = useState("screen");
  const [jobs, setJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [processedCandidates, setProcessedCandidates] = useState([]);

  useEffect(() => {
    listJobs()
      .then((data) => {
        setJobs(data);

        if (data.length > 0) {
          setActiveJob(data[0]);
        }
      })
      .catch((err) => {
        console.error("Failed to load jobs:", err);
      });
  }, []);

  async function handleCreateJob(title, description, instructions) {
    const job = await createJob(title, description, instructions);

    setJobs((prev) => [job, ...prev]);
    setActiveJob(job);
    setProcessedCandidates([]);
  }

  async function handleDeleteJob(jobId) {
    await deleteJob(jobId);

    const nextJobs = jobs.filter((job) => job._id !== jobId);

    setJobs(nextJobs);

    if (activeJob?._id === jobId) {
      setActiveJob(nextJobs[0] || null);
      setProcessedCandidates([]);
    }
  }

  function handleProcessed(result) {
    console.log("Processed result:", result);

    const candidates = result?.candidates || [];

    setProcessedCandidates(candidates);
  }

  function handleSelectJob(job) {
    setActiveJob(job);
    setProcessedCandidates([]);
  }

  return (
    <div className="min-h-screen">
      <TopBar view={view} setView={setView} />

      {view === "screen" ? (
        <ScreenPage
          jobs={jobs}
          activeJob={activeJob}
          onSelectJob={handleSelectJob}
          onCreateJob={handleCreateJob}
          onDeleteJob={handleDeleteJob}
          onProcessed={handleProcessed}
          goToResults={() => setView("results")}
        />
      ) : (
        <ResultsPage
          activeJob={activeJob}
          initialCandidates={processedCandidates}
          goToScreen={() => setView("screen")}
        />
      )}
    </div>
  );
}