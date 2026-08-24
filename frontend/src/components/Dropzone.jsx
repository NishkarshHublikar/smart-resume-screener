import { useRef, useState } from "react";
import { UploadCloud, FileText, X } from "lucide-react";

export default function Dropzone({ files, setFiles, disabled }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  function addFiles(list) {
    const pdfs = Array.from(list).filter((f) => f.type === "application/pdf");
    setFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name + f.size));
      const fresh = pdfs.filter((f) => !existingNames.has(f.name + f.size));
      return [...prev, ...fresh];
    });
  }

  function removeFile(idx) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled) addFiles(e.dataTransfer.files);
        }}
        className={`relative overflow-hidden rounded-xl border-2 border-dashed cursor-pointer transition-colors px-6 py-10 flex flex-col items-center justify-center text-center ${
          dragOver ? "border-amber bg-amber/5" : "border-line hover:border-amber/50"
        } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      >
        {dragOver && (
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-amber/10 to-transparent pointer-events-none">
            <div className="w-full h-px bg-amber/60 animate-scanline" />
          </div>
        )}
        <UploadCloud size={26} className="text-amber mb-3" />
        <p className="text-sm font-medium">Drop resume PDFs here</p>
        <p className="text-xs text-muted mt-1 font-mono">or click to browse — PDF only</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-3 space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin pr-1">
          {files.map((f, i) => (
            <li
              key={f.name + f.size}
              className="flex items-center justify-between gap-2 bg-ink border border-line rounded-lg px-3 py-2 text-xs animate-rise-in"
            >
              <span className="flex items-center gap-2 min-w-0">
                <FileText size={13} className="text-teal shrink-0" />
                <span className="truncate">{f.name}</span>
                <span className="text-muted font-mono shrink-0">{(f.size / 1024).toFixed(0)}kb</span>
              </span>
              {!disabled && (
                <button onClick={() => removeFile(i)} className="text-muted hover:text-red shrink-0">
                  <X size={13} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
