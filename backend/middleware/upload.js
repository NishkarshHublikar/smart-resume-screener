import multer from "multer";

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are accepted"), false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 20 }, // 10MB per file, up to 20 files
});

export default upload;
