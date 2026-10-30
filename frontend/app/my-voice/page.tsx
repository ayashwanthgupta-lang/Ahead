'use client';

import React, { useState, useEffect } from 'react';
import { supabase, API_URL } from '@/lib/supabase';
import { 
  Volume2, 
  Mic, 
  MicOff, 
  Languages, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2, 
  Sparkles,
  Play,
  Square,
  Plus
} from 'lucide-react';

interface PredefinedMessage {
  id: string;
  category: string;
  original_text: string;
  source_language: string;
}

export default function MyVoicePage() {
  const [currentMessage, setCurrentMessage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [translatedMessage, setTranslatedMessage] = useState('');
  const [translating, setTranslating] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const predefinedCards: PredefinedMessage[] = [
    { id: '1', category: 'assistance', original_text: 'I need some assistance, please. Could someone help me?', source_language: 'en' },
    { id: '2', category: 'written_instructions', original_text: 'Could you please give me the instructions in writing? I find it easier to follow written information.', source_language: 'en' },
    { id: '3', category: 'additional_time', original_text: 'I may need a little extra time. Please do not rush me — I am doing my best.', source_language: 'en' },
    { id: '4', category: 'communication_preferences', original_text: 'I prefer written or visual communication. Please write things down for me if possible.', source_language: 'en' },
    { id: '5', category: 'repeat_information', original_text: 'Could you please repeat that? I would like to make sure I have understood correctly.', source_language: 'en' },
    { id: '6', category: 'quiet_environment', original_text: 'I find it easier to concentrate in a quieter environment. Is there somewhere quieter we could speak?', source_language: 'en' },
    { id: '7', category: 'directions', original_text: 'Could you help me find the right place? I am looking for directions.', source_language: 'en' },
    { id: '8', category: 'simple_language', original_text: 'Could you use simpler language, please? Short sentences are easier for me to understand.', source_language: 'en' },
    { id: '9', category: 'appointment_requirement', original_text: 'I have an appointment. I have accessibility requirements that were noted when I booked. Could you check the notes please?', source_language: 'en' },
    { id: '10', category: 'clarification', original_text: 'I am not sure I understood that. Could you clarify, please?', source_language: 'en' },
  ];

  // Text to Speech
  const speak = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  };

  // Speech to Text
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (listening) {
      setListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);
      recognition.onerror = () => setListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCurrentMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.start();
    } catch {
      setListening(false);
    }
  };

  // Translate with Gemini API
  const handleTranslate = async () => {
    if (!currentMessage.trim()) return;
    setTranslating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${API_URL}/api/v1/voice/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          text: currentMessage,
          source_language: 'en',
          target_language: targetLanguage,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setTranslatedMessage(json.data.translated_text);
      }
    } catch (err) {
      console.error('Translation error', err);
    } finally {
      setTranslating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          My Voice
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Express your accessibility needs in person. Use quick communication cards, browser text-to-speech, and Gemini multi-language translation.
        </p>
      </div>

      {/* Fullscreen Mode Display */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 p-8 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              AHEAD Display Mode
            </span>
            <button
              onClick={() => setFullscreen(false)}
              className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <Minimize2 className="w-6 h-6" />
            </button>
          </div>

          <div className="my-auto text-center max-w-4xl mx-auto">
            <p className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white leading-tight">
              {currentMessage || 'No message entered'}
            </p>
            {translatedMessage && (
              <p className="mt-8 text-2xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400">
                {translatedMessage}
              </p>
            )}
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => speak(currentMessage)}
              className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              Speak Aloud
            </button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Predefined Quick Cards */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Quick Communication Cards
          </h2>
          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
            {predefinedCards.map((card) => (
              <button
                key={card.id}
                onClick={() => {
                  setCurrentMessage(card.original_text);
                  setTranslatedMessage('');
                }}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-500 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 text-xs font-medium text-slate-800 dark:text-slate-200 transition-all flex items-start gap-2"
              >
                <span className="text-teal-600 font-bold">•</span>
                <span className="leading-relaxed">{card.original_text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Active Composer & Tools */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Message Composer
              </label>
              <button
                onClick={() => setFullscreen(true)}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                title="Show in full screen mode for easy reading"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Show Full Screen
              </button>
            </div>

            <textarea
              rows={4}
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Type your message or click a quick card on the left..."
              className="w-full p-4 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600"
            />

            {/* Audio & Action Toolbar */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {speaking ? (
                  <button
                    onClick={stopSpeaking}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Square className="w-3.5 h-3.5" />
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={() => speak(currentMessage)}
                    disabled={!currentMessage.trim()}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Speak
                  </button>
                )}

                <button
                  onClick={toggleListening}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors ${
                    listening
                      ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  {listening ? 'Listening...' : 'Voice Input'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(currentMessage)}
                  disabled={!currentMessage.trim()}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-600 dark:text-slate-400"
                  title="Copy message"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Translation Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-teal-600" />
                Gemini Multi-Language Translation
              </h3>

              <div className="flex items-center gap-2">
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="es">Español (Spanish)</option>
                  <option value="fr">Français (French)</option>
                  <option value="de">Deutsch (German)</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="zh">中文 (Chinese)</option>
                  <option value="ar">العربية (Arabic)</option>
                </select>

                <button
                  onClick={handleTranslate}
                  disabled={translating || !currentMessage.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {translating ? 'Translating...' : 'Translate'}
                </button>
              </div>
            </div>

            {translatedMessage && (
              <div className="bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 rounded-xl p-4">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-sm font-semibold text-teal-950 dark:text-teal-200 leading-relaxed">
                    {translatedMessage}
                  </p>
                  <button
                    onClick={() => speak(translatedMessage)}
                    className="p-1.5 rounded-lg bg-teal-200/60 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200"
                    title="Speak translated text"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

