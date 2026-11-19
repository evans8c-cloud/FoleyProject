import React, { useState } from 'react';
import { Check, ClipboardCopy, RotateCcw } from 'lucide-react';
import { REFLECTION_PROMPTS, TimelineCue } from '../data/foleyPresets';

interface ReflectionSectionProps {
  answers: Record<string, string>;
  onChangeAnswer: (id: string, value: string) => void;
  onResetAnswers: () => void;
  cues: TimelineCue[];
}

function formatTimeShort(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1).padStart(4, '0');
  return `${String(m).padStart(2, '0')}:${s}`;
}

export const ReflectionSection: React.FC<ReflectionSectionProps> = ({
  answers,
  onChangeAnswer,
  onResetAnswers,
  cues,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopySummary = async () => {
    const sortedCues = [...cues].sort((a, b) => a.time - b.time);
    const cueSummary =
      sortedCues.length > 0
        ? sortedCues.map((c) => `- ${c.label} @ ${formatTimeShort(c.time)}`).join('\n')
        : 'No Foley cues placed yet.';

    const text = [
      'FOLEY SOUND LAB — GRADE 12 STUDENT REFLECTION',
      '',
      'PLACED FOLEY TIMELINE CUES:',
      cueSummary,
      '',
      ...REFLECTION_PROMPTS.map(
        (prompt) =>
          `${prompt.number}. ${prompt.title} (${prompt.dokLevel})\nQuestion: ${prompt.question}\nResponse: ${
            answers[prompt.id]?.trim() || '[No response entered]'
          }`
      ),
    ].join('\n\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      id="reflect"
      aria-labelledby="reflection-heading"
      className="mt-8 bg-[#131A26] border border-slate-800 rounded-xl p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="text-xs text-slate-400 mb-1">
            Grade 12 Media Analysis · Depth of Knowledge 2–3 · Auto-saved locally
          </div>
          <h2 id="reflection-heading" className="text-2xl font-semibold text-slate-100">
            Guided Critical Reflection
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onResetAnswers}
            className="min-h-[44px] px-4 py-2 rounded-lg border border-slate-700 bg-[#0B0F17] text-slate-300 text-sm font-medium hover:bg-slate-800 hover:text-white inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            Clear Notes
          </button>
          <button
            type="button"
            onClick={handleCopySummary}
            className="min-h-[44px] px-5 py-2 rounded-lg bg-amber-500 text-slate-950 text-sm font-semibold hover:bg-amber-400 inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />}
            {copied ? 'Copied Reflection & Cue Log' : 'Copy Reflection & Cue Log'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {REFLECTION_PROMPTS.map((prompt) => (
          <div key={prompt.id} className="flex flex-col bg-[#0B0F17] border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-amber-400">Prompt {prompt.number}</span>
              <span>{prompt.dokLevel}</span>
            </div>
            <h3 className="text-base font-semibold text-slate-100 mb-2">{prompt.title}</h3>
            <label htmlFor={`reflection-${prompt.id}`} className="text-sm text-slate-300 leading-relaxed mb-4">
              {prompt.question}
            </label>
            <textarea
              id={`reflection-${prompt.id}`}
              value={answers[prompt.id] || ''}
              onChange={(e) => onChangeAnswer(prompt.id, e.target.value)}
              placeholder={prompt.placeholder}
              rows={5}
              className="mt-auto w-full rounded-lg bg-[#131A26] border border-slate-700 p-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500 resize-y"
            />
          </div>
        ))}
      </div>
    </section>
  );
};
