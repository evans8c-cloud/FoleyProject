import React, { useState } from 'react';
import { Check, Copy, Download, X } from 'lucide-react';
import { generateGoogleSitesHtml } from '../utils/googleSitesTemplate';

interface EmbedExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmbedExportModal: React.FC<EmbedExportModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const htmlCode = generateGoogleSitesHtml();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(htmlCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // Fallback copy if clipboard permission blocked
      const el = document.getElementById('google-sites-code-area') as HTMLTextAreaElement | null;
      if (el) {
        el.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2400);
      }
    }
  };

  const handleDownload = () => {
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'foley-sound-lab-google-sites.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="embed-modal-title"
    >
      <div className="w-full max-w-4xl bg-[#131A26] border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 id="embed-modal-title" className="text-xl font-semibold text-slate-100">
              Google Sites Self-Contained Embed Code
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Zero external dependencies · Includes Teacher Note, Web Audio Foley synthesizer, and classroom controls
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Google Sites embed modal"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800">
              <div className="font-semibold text-amber-400 mb-1">Step 1 · Copy Code</div>
              <p className="text-slate-300 leading-relaxed">
                Click Copy Embed Code below to copy the complete single-file HTML, CSS, and JavaScript block.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800">
              <div className="font-semibold text-amber-400 mb-1">Step 2 · Insert in Google Sites</div>
              <p className="text-slate-300 leading-relaxed">
                In Google Sites, choose Insert → Embed → Embed code, paste the block, and click Next → Insert.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800">
              <div className="font-semibold text-amber-400 mb-1">Step 3 · Resize Frame</div>
              <p className="text-slate-300 leading-relaxed">
                Stretch the embed box to full column width and ~950px height so Chromebooks show the player and reflection prompts cleanly.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-mono-tabular text-slate-400">
              Single-file HTML/CSS/JS · {htmlCode.length.toLocaleString()} characters
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="min-h-[44px] px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 text-sm font-semibold hover:bg-slate-700 inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-4 h-4" />
                Download .html
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="min-h-[44px] px-5 py-2 rounded-lg bg-amber-500 text-slate-950 text-sm font-semibold hover:bg-amber-400 inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied Embed Code' : 'Copy Embed Code'}
              </button>
            </div>
          </div>

          <textarea
            id="google-sites-code-area"
            readOnly
            value={htmlCode}
            aria-label="Self-contained HTML CSS and JavaScript code for Google Sites"
            className="w-full h-72 p-4 rounded-lg bg-[#070A10] border border-slate-800 text-xs font-mono-tabular text-slate-300 leading-relaxed focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
