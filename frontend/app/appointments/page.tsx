'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, API_URL } from '@/lib/supabase';
import { Calendar, Clock, MapPin, XCircle, FileText, ArrowRight, Sparkles } from 'lucide-react';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API_URL}/api/v1/appointments`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (json.success) {
        setAppointments(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment request?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API_URL}/api/v1/appointments/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ cancellation_reason: 'Cancelled by user from portal' }),
      });

      const json = await res.json();
      if (json.success) {
        fetchAppointments();
      } else {
        alert(json.error?.message || 'Could not cancel appointment');
      }
    } catch {
      alert('Network error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            My Appointments
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Track status, view accessibility notes, or prepare visit guides with Gemini.
          </p>
        </div>
        <Link
          href="/book"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm flex items-center gap-2 self-start sm:self-auto transition-colors"
        >
          <Calendar className="w-4 h-4" />
          Book Another Visit
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 animate-pulse text-sm">
          Loading appointments...
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500">
          <Calendar className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300">No appointments found</h3>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            You haven't requested any appointments yet.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white font-semibold rounded-xl text-sm"
          >
            Book My Way
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => {
            const date = appt.slot?.starts_at ? new Date(appt.slot.starts_at) : null;
            return (
              <div
                key={appt.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      appt.status === 'confirmed'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : appt.status === 'requested'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {appt.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      ID: #{appt.id.substring(0, 8)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {appt.service?.name || 'College Service'}
                  </h3>

                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    {date && (
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {appt.service?.location || 'Campus Center'}
                    </span>
                  </div>

                  {appt.accessibility_requirements && appt.accessibility_requirements.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {appt.accessibility_requirements.map((req: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[11px] font-medium">
                          {req.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <Link
                    href={`/visit-guide?appointmentId=${appt.id}`}
                    className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Visit Guide
                  </Link>

                  {['requested', 'confirmed'].includes(appt.status) && (
                    <button
                      onClick={() => handleCancel(appt.id)}
                      className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

