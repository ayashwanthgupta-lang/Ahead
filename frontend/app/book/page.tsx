'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, API_URL } from '@/lib/supabase';
import { 
  Building2, 
  MapPin, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  ArrowRight,
  Filter,
  Check,
  AlertCircle
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  department: string;
  location: string;
  contact_information: string;
  accessibility_information: string;
  booking_instructions: string;
}

interface Slot {
  id: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  booked_count: number;
  status: string;
}

export default function BookMyWayPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Accessibility preferences for this booking
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Services' },
    { id: 'academic_administration', label: 'Academic Admin' },
    { id: 'examination_services', label: 'Examinations' },
    { id: 'student_support', label: 'Student Support' },
    { id: 'disability_support', label: 'Disability Support' },
    { id: 'financial_assistance', label: 'Financial Aid' },
    { id: 'counselling_services', label: 'Counselling' },
  ];

  const accessibilityOptions = [
    { id: 'written_communication', label: 'Written communication preferred' },
    { id: 'additional_time', label: 'Additional time required' },
    { id: 'quiet_environment', label: 'Quiet environment preferred' },
    { id: 'step_by_step_instructions', label: 'Step-by-step instructions required' },
    { id: 'clear_simple_language', label: 'Clear and simple language preferred' },
    { id: 'navigation_assistance', label: 'Assistance with navigation requested' },
    { id: 'speech_not_preferred', label: 'Speech-based communication not preferred' },
  ];

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const url = selectedCategory === 'all' 
          ? `${API_URL}/api/v1/services`
          : `${API_URL}/api/v1/services?category=${selectedCategory}`;

        const res = await fetch(url);
        const json = await res.json();
        if (json.success) {
          setServices(json.data || []);
        } else {
          // Fallback dummy services if DB not seeded yet
          setServices([
            {
              id: 'a1b2c3d4-0001-0001-0001-000000000001',
              name: 'Academic Administration Office',
              slug: 'academic-admin',
              category: 'academic_administration',
              description: 'Handles enrollment, course registration, academic records and general academic administration requests.',
              department: 'Academic Affairs',
              location: 'Main Building, Room 101',
              contact_information: 'academic@college.edu',
              accessibility_information: 'Wheelchair accessible entrance. Written communication supported.',
              booking_instructions: 'Please bring your student ID and notes.'
            },
            {
              id: 'a1b2c3d4-0001-0001-0001-000000000004',
              name: 'Disability Support Office',
              slug: 'disability-support',
              category: 'disability_support',
              description: 'Coordinates reasonable adjustments, support plans and specialist support for students.',
              department: 'Disability Services',
              location: 'Building C, Room 205',
              contact_information: 'disability@college.edu',
              accessibility_information: 'Step-free access. BSL interpreter available on request.',
              booking_instructions: 'No diagnosis disclosure required.'
            }
          ]);
        }
      } catch {
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, [selectedCategory]);

  const handleSelectService = async (service: Service) => {
    setSelectedService(service);
    setSelectedSlot(null);
    setLoadingSlots(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/services/${service.id}/slots`);
      const json = await res.json();
      if (json.success && json.data && json.data.length > 0) {
        setSlots(json.data);
      } else {
        // Fallback slots
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);

        const slot2 = new Date();
        slot2.setDate(slot2.getDate() + 1);
        slot2.setHours(14, 0, 0, 0);

        setSlots([
          {
            id: 'b1b2c3d4-0001-0001-0001-000000000001',
            starts_at: tomorrow.toISOString(),
            ends_at: new Date(tomorrow.getTime() + 30 * 60000).toISOString(),
            capacity: 1,
            booked_count: 0,
            status: 'available',
          },
          {
            id: 'b1b2c3d4-0001-0001-0001-000000000002',
            starts_at: slot2.toISOString(),
            ends_at: new Date(slot2.getTime() + 30 * 60000).toISOString(),
            capacity: 1,
            booked_count: 0,
            status: 'available',
          }
        ]);
      }
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const togglePreference = (prefId: string) => {
    if (selectedPreferences.includes(prefId)) {
      setSelectedPreferences(selectedPreferences.filter((p) => p !== prefId));
    } else {
      setSelectedPreferences([...selectedPreferences, prefId]);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedSlot) return;

    setSubmitting(true);
    setBookingError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${API_URL}/api/v1/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          service_id: selectedService.id,
          slot_id: selectedSlot,
          accessibility_requirements: selectedPreferences,
          additional_instructions: additionalInstructions,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setBookingSuccess(json.data);
      } else {
        setBookingError(json.error?.message || 'Could not complete booking request.');
      }
    } catch (err: any) {
      setBookingError(err.message || 'Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Book My Way
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Discover services and communicate your accessibility requirements before your visit.
        </p>
      </div>

      {bookingSuccess ? (
        <div className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            Status: {bookingSuccess.status || 'Requested'}
          </span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Appointment Request Submitted
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Your appointment has been recorded with your specified accessibility preferences.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push(`/visit-guide?appointmentId=${bookingSuccess.id}`)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Prepare Visit Guide with Gemini AI
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-sm font-semibold"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column: Service Selector */}
          <div className="lg:col-span-7 space-y-6">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === c.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Service Cards */}
            {loadingServices ? (
              <div className="p-8 text-center text-slate-500 animate-pulse text-sm">
                Loading campus services...
              </div>
            ) : services.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
                No services found in this category.
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  return (
                    <div
                      key={service.id}
                      onClick={() => handleSelectService(service)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            {service.department || 'Department'}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                            {service.name}
                          </h3>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                        {service.description}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {service.location || 'Campus'}
                        </span>
                        {service.accessibility_information && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            ✓ {service.accessibility_information.substring(0, 40)}...
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Time Slot & Accessibility Preferences Form */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sticky top-20 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                {selectedService ? `Book: ${selectedService.name}` : 'Select a Service'}
              </h2>

              {!selectedService ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Please choose a service on the left to see available appointment slots and accessibility options.
                </div>
              ) : (
                <form onSubmit={handleBook} className="space-y-6">
                  {bookingError && (
                    <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  {/* 1. Time Slot Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Available Time Slots
                    </label>
                    {loadingSlots ? (
                      <div className="p-4 text-center text-xs text-slate-400 animate-pulse">
                        Loading slots...
                      </div>
                    ) : slots.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                        No available slots for this service.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {slots.map((slot) => {
                          const date = new Date(slot.starts_at);
                          const isSelected = selectedSlot === slot.id;
                          return (
                            <button
                              type="button"
                              key={slot.id}
                              onClick={() => setSelectedSlot(slot.id)}
                              className={`p-2.5 rounded-xl text-left border text-xs transition-colors ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200 font-bold'
                                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="font-semibold">
                                {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </div>
                              <div className="text-[11px] opacity-80">
                                {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 2. Accessibility Preferences */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Accessibility Preferences (Optional)
                    </label>
                    <p className="text-[11px] text-slate-500 mb-2">
                      No medical diagnosis required. Tell staff what helps you be understood.
                    </p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {accessibilityOptions.map((opt) => {
                        const checked = selectedPreferences.includes(opt.id);
                        return (
                          <label
                            key={opt.id}
                            className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                              checked
                                ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-400 text-blue-900 dark:text-blue-200 font-medium'
                                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePreference(opt.id)}
                              className="w-3.5 h-3.5 text-blue-600 rounded"
                            />
                            <span>{opt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Additional Instructions */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Additional Notes
                    </label>
                    <textarea
                      rows={2}
                      value={additionalInstructions}
                      onChange={(e) => setAdditionalInstructions(e.target.value)}
                      placeholder="e.g. Please speak at a moderate pace, or I will bring an advocate."
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedSlot || submitting}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Submitting Request...' : 'Confirm Appointment Request'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

