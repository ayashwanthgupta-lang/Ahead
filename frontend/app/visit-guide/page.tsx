'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase, API_URL } from '@/lib/supabase';
import { 
  Sparkles, 
  FileText, 
  CheckSquare, 
  HelpCircle, 
  Briefcase, 
  AlertTriangle,
  Send,
  Loader2,
  Calendar,
  Languages
} from 'lucide-react';

export default function VisitGuidePage() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');

  const [instructions, setInstructions] = useState('');
  const [outputLanguage, setOutputLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [guide, setGuide] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // If appointmentId is provided, pre-fill sample context
  useEffect(() => {
    if (appointmentId) {
      setInstructions(
        `Appointment Confirmation #${appointmentId.substring(0, 8)}:\n` +
        `Location: Campus Student Services Hub, Room 204\n` +
        `Required to bring: Government Photo ID or College Student ID Card, Enrolment Letter for 2026, and any medical certificates if applying for exam accommodations.\n` +
        `Important note: Please arrive 10 minutes before the scheduled time. If you need step-free access, enter via the North Ramp adjacent to the library.`
      );
    }
  }, [appointmentId]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instructions.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${API_URL}/api/v1/visit-guides/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          source_text: instructions,
          appointment_id: appointmentId || undefined,
          output_language: outputLanguage,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setGuide(json.data.guide || json.data);
      } else {
        setError(json.error?.message || 'Gemini AI was unable to generate the visit guide.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by Google Gemini 3.8 Flash
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          My Visit, Made Simple
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Paste any confusing appointment letter or instructions. Gemini AI breaks them down into plain-language steps, a preparation checklist, and things to bring.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-5">
          <form onSubmit={handleGenerate} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Source Instructions
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Paste appointment emails, notices, or requirements:
              </label>
              <textarea
                rows={8}
                required
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Paste confusing instructions here..."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5" />
                Output Language
              </label>
              <select
                value={outputLanguage}
                onChange={(e) => setOutputLanguage(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="en">English (Plain Language)</option>
                <option value="es">Español (Spanish)</option>
                <option value="fr">Français (French)</option>
                <option value="de">Deutsch (German)</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="zh">中文 (Chinese)</option>
                <option value="ar">العربية (Arabic)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !instructions.trim()}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-xl text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gemini is analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Visit Guide</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Presentation */}
        <div className="lg:col-span-7">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-6">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!guide && !loading && !error && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <Sparkles className="w-10 h-10 mx-auto text-indigo-400 opacity-60 mb-3" />
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                No guide generated yet
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Paste your instructions on the left and click "Generate Visit Guide" to receive plain-language steps and checklists.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mx-auto text-indigo-600 animate-pulse">
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                Gemini 3.8 Flash is processing your visit guide
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Extracting facts, organizing chronological steps, and compiling your personalized checklist...
              </p>
            </div>
          )}

          {guide && (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Summary
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {guide.title || 'Personalized Visit Summary'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                  {guide.simplified_summary}
                </p>
              </div>

              {/* Steps */}
              {guide.steps && guide.steps.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Step-by-Step Instructions
                  </h3>
                  <div className="space-y-3">
                    {guide.steps.map((s: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
                        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center flex-shrink-0">
                          {s.step_number || idx + 1}
                        </span>
                        <span className="pt-0.5 leading-relaxed">{s.instruction}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Things to Bring & Checklist */}
              <div className="grid sm:grid-cols-2 gap-4">
                {guide.things_to_bring && guide.things_to_bring.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-amber-600" />
                      Things to Bring
                    </h3>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                      {guide.things_to_bring.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {guide.questions_to_ask && guide.questions_to_ask.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-emerald-600" />
                      Helpful Questions to Ask
                    </h3>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                      {guide.questions_to_ask.map((q: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Preparation Checklist */}
              {guide.preparation_checklist && guide.preparation_checklist.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-teal-600" />
                    Preparation Checklist
                  </h3>
                  <div className="space-y-2">
                    {guide.preparation_checklist.map((task: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-xs">
                        <input type="checkbox" className="mt-0.5 w-4 h-4 rounded text-blue-600" />
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{task.task}</p>
                          {task.reason && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{task.reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

