import Link from "next/link";
import { Calendar, FileText, Volume2, ShieldCheck, HeartHandshake, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 bg-gradient-to-b from-blue-50/50 via-white to-white dark:from-slate-900/50 dark:via-slate-950 dark:to-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-sm font-semibold mb-6">
            <HeartHandshake className="w-4 h-4" />
            Empowering Independent Access
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-950 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Feel ready. Be understood. <br />
            <span className="text-blue-600 dark:text-blue-400">Go independently.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            AHEAD removes the barriers to accessing campus and community services. 
            Request appointments with your accessibility needs upfront, understand complex procedures with Gemini AI, and communicate seamlessly in person.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-all"
            >
              Sign In to Your Account
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>WCAG 2.2 AA Accessible</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Google Gemini AI Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Confidential & Safe</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core 3 Pillars */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Three Integrated Features. One Unified Journey.
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              Technology should adapt to people, not force people to adapt to technology.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-blue-500/50 transition-colors">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-6">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  1. Book My Way
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                  Discover college offices and book slots while declaring requirements like written communication, additional time, or quiet environments without invasive medical disclosure.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
                <li className="flex items-center gap-2">✓ Verified slot capacity</li>
                <li className="flex items-center gap-2">✓ Customizable accessibility flags</li>
                <li className="flex items-center gap-2">✓ Status tracking & cancellations</li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-blue-500/50 transition-colors">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-6">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  2. My Visit, Made Simple
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                  Paste complicated instructions or appointment letters. Gemini AI transforms them into easy-to-read summaries, numbered steps, and a personalized preparation checklist.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
                <li className="flex items-center gap-2">✓ Powered by Gemini 3.8 Flash</li>
                <li className="flex items-center gap-2">✓ Actionable "Things to bring"</li>
                <li className="flex items-center gap-2">✓ Preserves factual accuracy</li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-blue-500/50 transition-colors">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center mb-6">
                  <Volume2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  3. My Voice
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                  Communicate in the moment. Ready-made cards for requesting time or written notes, browser text-to-speech, speech-to-text, and instant Gemini translation.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
                <li className="flex items-center gap-2">✓ Browser native Speech Synthesis</li>
                <li className="flex items-center gap-2">✓ Full-screen show mode</li>
                <li className="flex items-center gap-2">✓ Multi-language AI translation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-10 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">AHEAD</span>
            <span>— Feel ready. Be understood. Go independently.</span>
          </div>
          <div className="text-xs">
            College & Student Services Edition • Production Ready
          </div>
        </div>
      </footer>
    </div>
  );
}
