import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic, Square, Play, Pause, RotateCcw, Upload, CheckCircle,
  AlertCircle, Volume2, Loader2, MapPin, Tag, Zap, Info
} from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { IncidentExtraction, IncidentCategory, SeverityLevel } from '../types';
import api from '../services/api';

type Step = 'record' | 'transcript' | 'analysis' | 'verify' | 'confirmed';

const CATEGORIES: IncidentCategory[] = [
  'Water Leakage', 'Road Damage', 'Electrical Hazard', 'Waste Management',
  'Drainage Problem', 'Public Safety', 'Infrastructure Damage', 'Other',
];
const SEVERITIES: SeverityLevel[] = ['Low', 'Medium', 'High', 'Critical'];

export default function VoiceReport() {
  const navigate = useNavigate();
  const recorder = useVoiceRecorder();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [step, setStep] = useState<Step>('record');
  const [language, setLanguage] = useState('hi-IN');
  const [transcript, setTranscript] = useState('');
  const [correctedTranscript, setCorrectedTranscript] = useState('');
  const [analysis, setAnalysis] = useState<IncidentExtraction | null>(null);
  const [editedAnalysis, setEditedAnalysis] = useState<IncidentExtraction | null>(null);
  const [confirmedIncidentId, setConfirmedIncidentId] = useState('');
  const [confirmationAudioUrl, setConfirmationAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // --- Step 1: Transcribe ---
  const handleTranscribe = async () => {
    if (!recorder.audioBlob) return;
    setProcessing(true);
    setError('');
    try {
      const formData = new FormData();

      // Browser records webm — server maps it to ogg for Gnani Prisma
      const mimeType = recorder.audioBlob.type || 'audio/webm';
      const ext = mimeType.includes('ogg') ? 'ogg' : 'webm';
      formData.append('audio', recorder.audioBlob, `recording.${ext}`);
      formData.append('language', language);

      const res = await api.post('/voice/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 35000,
      });
      const t = res.data.data.transcript as string;
      setTranscript(t);
      setCorrectedTranscript(t);
      setStep('transcript');
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'Transcription failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // --- Step 2: Analyze with Evon ---
  const handleAnalyze = async () => {
    setProcessing(true);
    setError('');
    try {
      const res = await api.post('/ai/analyze', {
        transcript: correctedTranscript || transcript,
        language,
      });
      const result = res.data.data as IncidentExtraction;
      setAnalysis(result);
      setEditedAnalysis({ ...result });
      setStep('analysis');
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'AI analysis failed. Evon may be unavailable.');
    } finally {
      setProcessing(false);
    }
  };

  // --- Step 3: Submit verified incident ---
  const handleSubmit = async () => {
    if (!editedAnalysis) return;
    setProcessing(true);
    setError('');
    try {
      const res = await api.post('/incidents', {
        ...editedAnalysis,
        originalTranscript: transcript,
        correctedTranscript: correctedTranscript !== transcript ? correctedTranscript : undefined,
        language,
        confidence: analysis?.confidence,
      });
      const incident = res.data.data.incident;
      setConfirmedIncidentId(incident.incidentId);

      // Generate Timbre confirmation
      try {
        const audioRes = await api.post('/voice/speak', {
          text: `placeholder`,
          incidentId: incident.incidentId,
          category: incident.category,
          language,
        }, { responseType: 'arraybuffer' });
        const blob = new Blob([audioRes.data], { type: 'audio/mpeg' });
        setConfirmationAudioUrl(URL.createObjectURL(blob));
      } catch {
        // Timbre optional — continue without audio
      }

      setStep('confirmed');
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'Failed to submit incident.');
    } finally {
      setProcessing(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  const severityColor: Record<SeverityLevel, string> = {
    Critical: 'border-red-500/30 bg-red-500/5',
    High: 'border-orange-500/30 bg-orange-500/5',
    Medium: 'border-yellow-500/30 bg-yellow-500/5',
    Low: 'border-green-500/30 bg-green-500/5',
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Report an Incident</h1>
          <p className="text-gray-500 text-sm mt-1">Speak naturally in Hindi or Hinglish</p>
        </div>

        {/* Progress steps */}
        {step !== 'confirmed' && (
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
            {(['record', 'transcript', 'analysis', 'verify'] as const).map((s, i) => {
              const steps = ['record', 'transcript', 'analysis', 'verify'];
              const current = steps.indexOf(step);
              const idx = steps.indexOf(s);
              const done = idx < current;
              const active = s === step;
              return (
                <div key={s} className="flex items-center gap-2 flex-shrink-0">
                  <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                    active ? 'bg-blue-600/20 text-blue-400' :
                    done ? 'bg-green-600/20 text-green-400' :
                    'bg-white/5 text-gray-600'
                  }`}>
                    {done && <CheckCircle size={12} />}
                    <span className="capitalize">{s}</span>
                  </div>
                  {i < 3 && <div className="w-6 h-px bg-white/10 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ── STEP 1: RECORD ── */}
        {step === 'record' && (
          <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-8">
            {/* Language selector */}
            <div className="mb-8">
              <label className="block text-sm text-gray-400 mb-2">Speaking language</label>
              <div className="flex gap-3">
                {[['hi-IN', 'हिंदी'], ['en-IN', 'English']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setLanguage(val)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      language === val
                        ? 'border-blue-500/50 bg-blue-600/20 text-blue-300'
                        : 'border-white/10 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mic button */}
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                {recorder.state === 'recording' && (
                  <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                )}
                <button
                  onClick={recorder.state === 'recording' ? recorder.stopRecording : recorder.startRecording}
                  disabled={recorder.state === 'recorded' || recorder.state === 'uploading'}
                  className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                    recorder.state === 'recording'
                      ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/25'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25'
                  }`}
                >
                  {recorder.state === 'recording'
                    ? <Square size={28} className="text-white" />
                    : <Mic size={28} className="text-white" />}
                </button>
              </div>

              {recorder.state === 'recording' && (
                <div className="text-center">
                  <div className="text-red-400 text-2xl font-mono font-bold">
                    {recorder.formattedDuration}
                  </div>
                  {recorder.duration >= 25 ? (
                    <div className="text-yellow-400 text-xs mt-1 animate-pulse">
                      ⚠️ Stop soon — 30s maximum
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm mt-1">Recording — tap to stop</div>
                  )}
                </div>
              )}

              {recorder.state === 'idle' && (
                <p className="text-gray-500 text-sm text-center">Tap the microphone to start recording</p>
              )}

              {recorder.error && <p className="text-red-400 text-sm">{recorder.error}</p>}
            </div>

            {/* Playback & upload */}
            {recorder.state === 'recorded' && recorder.audioUrl && (
              <div className="mt-8 pt-8 border-t border-white/5">
                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={() => {
                      const a = document.createElement('audio');
                      a.src = recorder.audioUrl!;
                      a.play();
                    }}
                    className="flex items-center gap-2 text-sm bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Play size={16} /> Play recording ({recorder.formattedDuration})
                  </button>
                  <button
                    onClick={recorder.reset}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 px-3 py-2 rounded-lg transition-colors"
                  >
                    <RotateCcw size={14} /> Re-record
                  </button>
                </div>

                <button
                  onClick={handleTranscribe}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
                >
                  {processing
                    ? <><Loader2 size={18} className="animate-spin" /> Transcribing with Prisma...</>
                    : <><Upload size={18} /> Transcribe Recording</>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: TRANSCRIPT ── */}
        {step === 'transcript' && (
          <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-8">
            <div className="flex items-center gap-2 text-green-400 text-sm mb-6">
              <CheckCircle size={16} /> Prisma STT transcription complete
            </div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Transcript — review and correct if needed
            </label>
            <textarea
              value={correctedTranscript}
              onChange={(e) => setCorrectedTranscript(e.target.value)}
              rows={5}
              className="w-full bg-black border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
            />
            {correctedTranscript !== transcript && (
              <p className="text-xs text-yellow-500 mt-2 flex items-center gap-1">
                <Info size={12} /> Transcript edited — original preserved
              </p>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setStep('record'); recorder.reset(); }}
                className="flex-1 border border-white/10 text-gray-400 hover:text-white py-2.5 rounded-xl text-sm transition-colors"
              >
                Re-record
              </button>
              <button
                onClick={handleAnalyze}
                disabled={processing || !correctedTranscript.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                {processing
                  ? <><Loader2 size={16} className="animate-spin" /> Analyzing with Evon...</>
                  : <><Zap size={16} /> Analyze with AI</>}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: ANALYSIS RESULT ── */}
        {step === 'analysis' && analysis && editedAnalysis && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle size={16} /> Evon v3.3 analysis complete
              {analysis.confidence !== undefined && (
                <span className="ml-auto text-gray-500 text-xs">
                  Confidence: {(analysis.confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>

            <div className={`border rounded-2xl p-6 ${severityColor[editedAnalysis.severity as SeverityLevel]}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 uppercase tracking-wider">AI Extracted — please verify</span>
                <SeverityBadge severity={editedAnalysis.severity as SeverityLevel} />
              </div>
            </div>

            <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-6 space-y-5">
              {/* Category */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-2"><Tag size={11} /> Category</label>
                <select
                  value={editedAnalysis.category}
                  onChange={(e) => setEditedAnalysis({ ...editedAnalysis, category: e.target.value as IncidentCategory })}
                  className="w-full bg-black border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Description</label>
                <textarea
                  value={editedAnalysis.description}
                  onChange={(e) => setEditedAnalysis({ ...editedAnalysis, description: e.target.value })}
                  rows={3}
                  className="w-full bg-black border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>

              {/* Location */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-2"><MapPin size={11} /> Location</label>
                <div className="flex gap-2">
                  <input
                    value={editedAnalysis.location.name}
                    onChange={(e) => setEditedAnalysis({ ...editedAnalysis, location: { name: e.target.value, verified: true } })}
                    placeholder="Enter location"
                    className="flex-1 bg-black border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <div className={`px-3 py-2 rounded-lg text-xs font-medium ${editedAnalysis.location.verified ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
                    {editedAnalysis.location.verified ? 'Verified' : 'Unverified'}
                  </div>
                </div>
              </div>

              {/* Severity */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Severity</label>
                <div className="grid grid-cols-4 gap-2">
                  {SEVERITIES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setEditedAnalysis({ ...editedAnalysis, severity: s })}
                      className={`py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        editedAnalysis.severity === s
                          ? s === 'Critical' ? 'bg-red-600/30 border-red-500/50 text-red-300'
                          : s === 'High' ? 'bg-orange-600/30 border-orange-500/50 text-orange-300'
                          : s === 'Medium' ? 'bg-yellow-600/30 border-yellow-500/50 text-yellow-300'
                          : 'bg-green-600/30 border-green-500/50 text-green-300'
                          : 'border-white/10 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Urgency Reason */}
              <div className="bg-black/40 rounded-lg px-4 py-3">
                <div className="text-xs text-gray-500 mb-1">Urgency reasoning</div>
                <div className="text-sm text-gray-300">{editedAnalysis.urgencyReason}</div>
              </div>

              {/* Recommended Action */}
              <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg px-4 py-3">
                <div className="text-xs text-blue-500 mb-1">Recommended action</div>
                <div className="text-sm text-blue-200">{editedAnalysis.recommendedAction}</div>
              </div>

              {/* Missing info */}
              {editedAnalysis.missingInformation.length > 0 && (
                <div className="bg-yellow-600/10 border border-yellow-600/20 rounded-lg px-4 py-3">
                  <div className="text-xs text-yellow-500 mb-2">Missing information</div>
                  {editedAnalysis.missingInformation.map((m) => (
                    <div key={m} className="text-xs text-yellow-300 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-yellow-500" /> {m}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setStep('verify')}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors"
            >
              <CheckCircle size={18} /> Review & Confirm
            </button>
          </div>
        )}

        {/* ── STEP 4: VERIFY & SUBMIT ── */}
        {step === 'verify' && editedAnalysis && (
          <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-8">
            <h2 className="text-lg font-semibold text-white mb-2">Confirm your report</h2>
            <p className="text-gray-500 text-sm mb-6">Review the details below before final submission.</p>

            <div className="space-y-3 mb-8">
              {[
                { label: 'Category', value: editedAnalysis.category },
                { label: 'Location', value: editedAnalysis.location.name },
                { label: 'Description', value: editedAnalysis.description },
                { label: 'Severity', value: editedAnalysis.severity },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm py-2 border-b border-white/5">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-white font-medium text-right max-w-xs">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('analysis')}
                className="flex-1 border border-white/10 text-gray-400 hover:text-white py-2.5 rounded-xl text-sm transition-colors"
              >
                Edit Details
              </button>
              <button
                onClick={handleSubmit}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                {processing
                  ? <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                  : <><CheckCircle size={16} /> Submit Report</>}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: CONFIRMED ── */}
        {step === 'confirmed' && (
          <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Incident Reported!</h2>
            <p className="text-gray-400 text-sm mb-2">Your report has been submitted successfully.</p>
            <div className="text-blue-400 font-mono text-lg mb-6">{confirmedIncidentId}</div>

            {/* Timbre audio confirmation */}
            {confirmationAudioUrl && (
              <div className="bg-blue-600/10 border border-blue-600/20 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-blue-400 text-sm mb-3">
                  <Volume2 size={16} /> Voice Confirmation (Gnani Timbre)
                </div>
                <audio ref={audioRef} src={confirmationAudioUrl} onEnded={() => setIsPlaying(false)} />
                <button
                  onClick={togglePlay}
                  className="flex items-center gap-2 text-sm bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-4 py-2 rounded-lg transition-colors mx-auto"
                >
                  {isPlaying ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Play Hindi Confirmation</>}
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/incidents/${confirmedIncidentId}`)}
                className="flex-1 border border-white/10 text-gray-300 hover:text-white py-2.5 rounded-xl text-sm transition-colors"
              >
                View Report
              </button>
              <button
                onClick={() => { setStep('record'); recorder.reset(); setAnalysis(null); setError(''); }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                Report Another
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
