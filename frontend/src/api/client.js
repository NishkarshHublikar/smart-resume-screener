import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({ baseURL });

export const createJob = (title, description, instructions) =>
  api.post("/jobs", { title, description, instructions }).then((r) => r.data);

export const listJobs = () => api.get("/jobs").then((r) => r.data);

export const getJob = (jobId) => api.get(`/jobs/${jobId}`).then((r) => r.data);

export const deleteJob = (jobId) => api.delete(`/jobs/${jobId}`);

export const uploadResumes = (jobId, files, onProgress) => {
  const form = new FormData();
  files.forEach((f) => form.append("resumes", f));
  return api
    .post(`/jobs/${jobId}/candidates`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      },
    })
    .then((r) => r.data);
};

export const askJobFit = (jobId, { resumeText, resumeFile, prompt }) => {
  const form = new FormData();
  if (resumeFile) form.append("resume", resumeFile);
  if (resumeText) form.append("resumeText", resumeText);
  if (prompt) form.append("prompt", prompt);
  return api.post(`/jobs/${jobId}/ask`, form).then((r) => r.data);
};

export const listCandidates = (jobId) =>
  api.get(`/jobs/${jobId}/candidates`).then((r) => r.data);

export const deleteCandidate = (jobId, candidateId) =>
  api.delete(`/jobs/${jobId}/candidates/${candidateId}`);
