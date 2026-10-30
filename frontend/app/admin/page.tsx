'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase, API_URL } from '@/lib/supabase';
import { Shield, CheckCircle, XCircle, Clock, Calendar, AlertCircle } from 'lucide-react';

export default function AdminPage() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminAppointments = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API_URL}/api/v1/admin/appointments`, {
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
    fetchAdminAppointments();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API_URL}/api/v1/admin/appointments/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        fetchAdminAppointments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (profile && !['admin', 'staff'].includes(profile.role)) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center">
        <Shield className="w-12 h-12 text-rose-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Access Restricted</h1>
        <p className="text-sm text-slate-500 mt-2">
          Administrative role required to view appointment queue and manage service slots.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-bold mb-3">
          <Shield className="w-3.5 h-3.5" />
          Administrative Portal
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Appointment Management
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Review incoming student appointment requests and accessibility accommodations.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 animate-pulse text-sm">
          Loading appointment requests...
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
          No appointments recorded in the system.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Service</th>
                  <th className="p-4">Date/Time</th>
                  <th className="p-4">Accommodations</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {appointments.map((appt) => {
                  const date = appt.slot?.starts_at ? new Date(appt.slot.starts_at) : null;
                  return (
                    <tr key={appt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="p-4 font-semibold text-slate-900 dark:text-white">
                        {appt.user?.full_name || 'Student'}
                      </td>
                      <td className="p-4">
                        {appt.service?.name}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {date ? `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '—'}
                      </td>
                      <td className="p-4 max-w-xs">
                        {appt.accessibility_requirements && appt.accessibility_requirements.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {appt.accessibility_requirements.map((r: string, i: number) => (
                              <span key={i} className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-semibold">
                                {r.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                        {appt.additional_instructions && (
                          <p className="text-[11px] text-slate-500 mt-1 italic">
                            "{appt.additional_instructions}"
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          appt.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : appt.status === 'requested'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {appt.status === 'requested' && (
                          <>
                            <button
                              onClick={() => updateStatus(appt.id, 'confirmed')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => updateStatus(appt.id, 'rejected')}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {appt.status === 'confirmed' && (
                          <button
                            onClick={() => updateStatus(appt.id, 'completed')}
                            className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-semibold text-xs"
                          >
                            Mark Completed
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

