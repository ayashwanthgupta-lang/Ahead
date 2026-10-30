'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Settings as SettingsIcon, Type, Eye, Volume2, Globe, Check } from 'lucide-react';

export default function SettingsPage() {
  const { profile, updateAccessibilitySettings } = useAuth();
  const [textSize, setTextSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>(
    profile?.text_size_preference || 'medium'
  );
  const [reducedMotion, setReducedMotion] = useState<boolean>(
    profile?.reduced_motion || false
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateAccessibilitySettings({ textSize, reducedMotion });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
          <SettingsIcon className="w-7 h-7 text-blue-600" />
          Accessibility & Appearance Settings
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Customize text size, motion, and interaction preferences across AHEAD.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
        {/* Text Size Preference */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Type className="w-4 h-4 text-blue-600" />
            Text Size Preference
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'small', label: 'Small', sample: 'Aa' },
              { id: 'medium', label: 'Medium (Default)', sample: 'Aa' },
              { id: 'large', label: 'Large', sample: 'Aa' },
              { id: 'xlarge', label: 'Extra Large', sample: 'Aa' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTextSize(item.id as any)}
                className={`p-4 rounded-xl border text-center transition-all ${
                  textSize === item.id
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className={`font-serif mb-1 ${
                  item.id === 'small' ? 'text-sm' : item.id === 'medium' ? 'text-lg' : item.id === 'large' ? 'text-2xl' : 'text-3xl'
                }`}>
                  {item.sample}
                </div>
                <div className="text-xs">{item.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Reduced Motion */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-600" />
            Motion & Transitions
          </h2>
          <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Reduced Motion</p>
              <p className="text-xs text-slate-500 mt-0.5">Minimize animations and transition effects throughout the platform.</p>
            </div>
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </label>
        </div>

        {/* Save button */}
        <div className="pt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-sm transition-colors flex items-center gap-2"
          >
            {saved ? <Check className="w-4 h-4" /> : null}
            <span>{saved ? 'Preferences Saved!' : 'Apply Preferences'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

