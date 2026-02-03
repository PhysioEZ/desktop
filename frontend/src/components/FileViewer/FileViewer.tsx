import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  FileCode,
  File as FileIcon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Printer,
  Loader2,
  Info,
} from "lucide-react";
import { useThemeStore } from "../../store/useThemeStore";

export type FileType = "image" | "pdf" | "text" | "office" | "unknown";

interface FileViewerProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  fileName: string;
  fileType?: FileType;
}

const FileViewer: React.FC<FileViewerProps> = ({
  isOpen,
  onClose,
  url,
  fileName,
  fileType: providedType,
}) => {
  const { isDark } = useThemeStore();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect file type if not provided
  const detectedType = useMemo(() => {
    if (providedType) return providedType;
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (!ext) return "unknown";

    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext))
      return "image";
    if (ext === "pdf") return "pdf";
    if (
      [
        "txt",
        "json",
        "log",
        "md",
        "csv",
        "xml",
        "js",
        "ts",
        "html",
        "css",
      ].includes(ext)
    )
      return "text";
    if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext))
      return "office";
    return "unknown";
  }, [fileName, providedType]);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    setError(null);
    setTextContent(null);
    setZoom(1);
    setRotation(0);

    if (detectedType === "text") {
      fetchTextContent();
    } else {
      setIsLoading(false);
    }
  }, [isOpen, url, detectedType]);

  const fetchTextContent = async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to load text content");
      const text = await response.text();
      setTextContent(text);
    } catch (err) {
      setError("Unable to read text file. It might be binary or inaccessible.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open(url, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[20000] flex items-center justify-center p-0 md:p-10 pointer-events-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-xl pointer-events-auto"
        />

        {/* Viewer Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className={`w-full h-full max-w-7xl flex flex-col relative overflow-hidden pointer-events-auto transition-colors duration-500 ${
            isDark
              ? "bg-[#0A0A0A] border border-white/5"
              : "bg-white border border-slate-200"
          } rounded-none md:rounded-[40px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]`}
        >
          {/* Top Bar */}
          <div
            className={`h-20 shrink-0 border-b flex items-center justify-between px-6 md:px-10 z-10 ${
              isDark
                ? "border-white/5 bg-white/[0.02]"
                : "border-slate-100 bg-slate-50/50"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  isDark ? "bg-white/5" : "bg-slate-200/50"
                }`}
              >
                {detectedType === "image" && (
                  <ImageIcon size={20} className="text-emerald-500" />
                )}
                {detectedType === "pdf" && (
                  <FileText size={20} className="text-red-500" />
                )}
                {detectedType === "text" && (
                  <FileCode size={20} className="text-blue-500" />
                )}
                {detectedType === "office" && (
                  <FileIcon size={20} className="text-amber-500" />
                )}
                {detectedType === "unknown" && (
                  <FileIcon size={20} className="text-slate-400" />
                )}
              </div>
              <div>
                <h2
                  className={`text-sm font-black tracking-tight truncate max-w-[200px] md:max-w-md ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {fileName}
                </h2>
                <div className="flex items-center gap-2 mt-1 opacity-40">
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    {detectedType}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden md:flex items-center gap-1 border-r border-inherit pr-4 mr-2">
                <button
                  onClick={() => setZoom((prev) => Math.min(prev + 0.2, 3))}
                  className="p-2.5 rounded-xl hover:bg-white/5 transition-all text-current opacity-40 hover:opacity-100"
                >
                  <ZoomIn size={18} />
                </button>
                <button
                  onClick={() => setZoom((prev) => Math.max(prev - 0.2, 0.5))}
                  className="p-2.5 rounded-xl hover:bg-white/5 transition-all text-current opacity-40 hover:opacity-100"
                >
                  <ZoomOut size={18} />
                </button>
                <button
                  onClick={() => setRotation((prev) => prev + 90)}
                  className="p-2.5 rounded-xl hover:bg-white/5 transition-all text-current opacity-40 hover:opacity-100"
                >
                  <RotateCw size={18} />
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrint}
                  className={`p-2.5 rounded-xl transition-all hidden md:flex ${isDark ? "hover:bg-white/5 text-white/40 hover:text-white" : "hover:bg-slate-200 text-slate-400 hover:text-slate-900"}`}
                >
                  <Printer size={18} />
                </button>
                <button
                  onClick={handleDownload}
                  className={`p-2.5 rounded-xl transition-all ${isDark ? "hover:bg-white/5 text-white/40 hover:text-white" : "hover:bg-slate-200 text-slate-400 hover:text-slate-900"}`}
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={onClose}
                  className="ml-2 w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden relative flex items-center justify-center p-4 md:p-12">
            {isLoading && (
              <div className="flex flex-col items-center gap-4 animate-pulse">
                <Loader2
                  size={40}
                  className="animate-spin text-emerald-500 opacity-50"
                />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">
                  Loading...
                </span>
              </div>
            )}

            {error && (
              <div className="text-center max-w-md">
                <div className="w-20 h-20 rounded-[32px] bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6">
                  <Info size={40} />
                </div>
                <h3 className="text-lg font-black mb-2">Error Opening File</h3>
                <p className="text-xs font-bold opacity-40 mb-8 leading-relaxed">
                  {error}
                </p>
                <button
                  onClick={onClose}
                  className="px-8 py-3 rounded-2xl bg-slate-100 dark:bg-white/5 font-black text-[10px] uppercase tracking-widest"
                >
                  Go Back
                </button>
              </div>
            )}

            {!isLoading && !error && (
              <div
                className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.3))",
                }}
              >
                {detectedType === "image" && (
                  <img
                    src={url}
                    alt={fileName}
                    className="max-w-full max-h-full object-contain rounded-2xl"
                    onLoad={() => setIsLoading(false)}
                  />
                )}

                {detectedType === "pdf" && (
                  <iframe
                    src={`${url}#toolbar=0&navpanes=0`}
                    className="w-full h-full border-none rounded-2xl bg-white"
                    onLoad={() => setIsLoading(false)}
                  />
                )}

                {detectedType === "text" && textContent && (
                  <div
                    className={`w-full h-full max-w-5xl rounded-3xl p-8 md:p-12 overflow-y-auto custom-scrollbar font-mono text-[13px] leading-relaxed shadow-inner ${
                      isDark
                        ? "bg-black/40 text-emerald-400/80"
                        : "bg-slate-50 text-slate-700"
                    }`}
                  >
                    <pre className="whitespace-pre-wrap">{textContent}</pre>
                  </div>
                )}

                {detectedType === "office" && (
                  <div className="text-center max-w-lg">
                    <div className="w-24 h-24 rounded-[40px] bg-emerald-500 text-black flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/20">
                      <ExternalLink size={40} />
                    </div>
                    <h3 className="text-2xl font-black mb-3">
                      Open in External App
                    </h3>
                    <p className="text-sm font-bold opacity-40 mb-10 leading-relaxed px-10">
                      This file format cannot be previewed directly. Please open
                      it using the apps installed on your computer.
                    </p>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                      <button
                        onClick={handleDownload}
                        className="w-full md:w-auto px-10 py-4 rounded-2xl bg-emerald-500 text-black font-black text-[11px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
                      >
                        Download & Open
                      </button>
                      <a
                        href={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(new URL(url, window.location.href).href)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full md:w-auto px-10 py-4 rounded-2xl border font-black text-[11px] uppercase tracking-[0.2em] transition-all ${
                          isDark
                            ? "border-white/10 hover:bg-white/5 text-white/60"
                            : "border-slate-200 hover:bg-slate-50 text-slate-500"
                        }`}
                      >
                        Web Preview
                      </a>
                    </div>
                  </div>
                )}

                {detectedType === "unknown" && (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-[32px] bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-6">
                      <FileIcon size={40} className="opacity-20" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest opacity-30">
                      Cannot preview file
                    </p>
                    <button
                      onClick={handleDownload}
                      className="mt-6 px-8 py-3 rounded-2xl bg-emerald-500/10 text-emerald-500 font-black text-[10px] uppercase tracking-widest"
                    >
                      Download File
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className={`h-16 shrink-0 border-t flex items-center justify-center px-8 z-10 ${
              isDark
                ? "border-white/5 bg-black"
                : "border-slate-100 bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-10 opacity-20 pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-black uppercase tracking-[0.3em]">
                  Secure Viewer
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FileViewer;
