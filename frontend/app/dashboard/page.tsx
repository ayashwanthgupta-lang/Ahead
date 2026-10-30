'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase, API_URL } from '@/lib/supabase';
import { 
  Calendar, 
  FileText, 
  Volume2, 
  ArrowRight, 
  Clock, 
  MapPin, 
  CheckCircle,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [upcomingAppointment, setUpcomingAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const res = await fetch(`${API_URL}/api/v1/appointments`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          const json = await res.json();
          if (json.success && json.data && json.data.length > 0) {
            // Find next requested or confirmed appointment
            const active = json.data.find((a: any) => ['requested', 'confirmed'].includes(a.status));
            setUpcomingAppointment(active || json.data[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  const userName = profile?.preferred_name || profile?.full_name || 'Student';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-10 text-white shadow-md relative overflow-hidden mb-10">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold mb-4 tracking-wide uppercase">
            AHEAD Hub
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Hello, {userName} 👋
          </h1>
          <p className="mt-2 sm:mt-3 text-blue-100 text-sm sm:text-base leading-relaxed">
            Your accessible college services assistant is ready. Book your next visit, simplify instructions, or use your voice tools.
          </p>
        </div>
      </div>

      {/* Primary 3 Workflows */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {/* Book My Way */}
        <Link
          href="/book"
          className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Book My Way
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Find campus offices, choose time slots, and specify your accessibility and communication preferences.
            </p>
          </div>
          <div className="mt-6 flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
            <span>Find a service</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </div>
        </Link>

        {/* My Visit, Made Simple */}
        <Link
          href="/visit-guide"
          className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:border-indigo-500 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <span>My Visit Guide</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Use Gemini AI to simplify appointment instructions into clear steps, checklist items, and things to bring.
            </p>
          </div>
          <div className="mt-6 flex items-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
            <span>Simplify instructions</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </div>
        </Link>

        {/* My Voice */}
        <Link
          href="/my-voice"
          className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:border-teal-500 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Volume2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              My Voice
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Predefined communication cards, text-to-speech speaker, voice-to-text, and AI translation in person.
            </p>
          </div>
          <div className="mt-6 flex items-center text-sm font-semibold text-teal-600 dark:text-teal-400 group-hover:translate-x-1 transition-transform">
            <span>Open communication tool</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </div>
        </Link>
      </div>

      {/* Upcoming Appointment Status */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Next Scheduled Appointment
          </h2>
          <Link href="/appointments" className="text-xs font-semibold text-blue-600 hover:underline">
            View All Appointments
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 animate-pulse text-sm">
            Loading your appointment status...
          </div>
        ) : upcomingAppointment ? (
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200/60 dark:border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  upcomingAppointment.status === 'confirmed' 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : upcomingAppointment.status === 'requested'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {upcomingAppointment.status}
                </span>
                <span className="text-xs text-slate-500">
                  Ref #{upcomingAppointment.id.substring(0, 8)}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {upcomingAppointment.service?.name || 'College Service Appointment'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                {upcomingAppointment.service?.location || 'Campus Center'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/visit-guide?appointmentId=${upcomingAppointment.id}`}
                className="px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Prepare with AI
              </Link>
              <Link
                href={`/appointments`}
                className="px-4 py-2 text-sm font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Details
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              You do not have any upcoming appointments scheduled right now.
            </p>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Book an Appointment
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

