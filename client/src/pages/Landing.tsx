import { Link } from 'react-router-dom';
import { Mic, Zap, ArrowRight, CheckCircle, Radio, Brain, Volume2 } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Mic size={16} />
          </div>
          <span className="font-bold text-lg">AwaazSetu AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Sign In</Link>
          <Link to="/register" className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-4 py-1.5 text-sm text-blue-400 mb-8">
          <Radio size={14} className="animate-pulse" />
          Powered by Gnani AI — Prisma · Evon v3.3 · Timbre
        </div>
        <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
          Speak Naturally.<br />
          <span className="text-blue-500">Understand Intelligently.</span><br />
          Take Action.
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          AwaazSetu AI enables India's frontline workers to report infrastructure problems
          using natural speech in Hindi, Hinglish, or regional languages — no forms, no barriers.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/register" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Start Reporting <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="flex items-center gap-2 border border-white/10 hover:border-white/20 text-gray-300 px-6 py-3 rounded-lg font-medium transition-colors">
            Sign In
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">How the Three Gnani Models Work Together</h2>
        <p className="text-gray-500 text-center mb-12">A complete AI pipeline from voice to action</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Mic,
              color: 'blue',
              step: '01',
              title: 'Prisma — Speech to Text',
              desc: 'Gnani Prisma transcribes your Hindi or Hinglish speech with high accuracy, removing the literacy barrier entirely.',
              api: 'api.vachana.ai/stt/v3',
            },
            {
              icon: Brain,
              color: 'violet',
              step: '02',
              title: 'Evon v3.3 — AI Reasoning',
              desc: 'The 30B parameter Evon model understands context, classifies the incident, extracts location and severity, and recommends actions.',
              api: 'gnani-evon-v3.3-30B-A3B',
            },
            {
              icon: Volume2,
              color: 'emerald',
              step: '03',
              title: 'Timbre — Text to Speech',
              desc: 'Gnani Timbre generates a natural Hindi voice confirmation, completing the voice-first loop for users who prefer audio feedback.',
              api: 'api.vachana.ai/tts/inference',
            },
          ].map(({ icon: Icon, color, step, title, desc, api: apiLabel }) => (
            <div key={step} className="bg-[#0f0f0f] border border-white/5 rounded-xl p-6">
              <div className={`w-12 h-12 bg-${color}-600/20 rounded-xl flex items-center justify-center mb-4`}>
                <Icon size={22} className={`text-${color}-400`} />
              </div>
              <div className="text-xs text-gray-600 font-mono mb-2">STEP {step}</div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-gray-400 text-sm mb-4">{desc}</p>
              <div className="text-xs font-mono text-gray-600 bg-black/40 px-2 py-1 rounded">{apiLabel}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <h2 className="text-3xl font-bold text-center mb-12">Built for India's Frontline</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            'Voice recording in Hindi & Hinglish',
            'AI-powered incident classification',
            'Automatic severity assessment',
            'Human verification workflow',
            'Hindi voice confirmation (Timbre)',
            'Real-time admin dashboard',
            'Complete incident history & tracking',
            'Role-based access (Citizen / Admin)',
            'Works on mobile devices',
          ].map((f) => (
            <div key={f} className="flex items-center gap-3 bg-[#0f0f0f] border border-white/5 rounded-lg px-4 py-3">
              <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
              <span className="text-sm text-gray-300">{f}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="bg-blue-600/10 border border-blue-600/20 rounded-2xl p-12">
          <Zap size={40} className="text-blue-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Ready to Report an Incident?</h2>
          <p className="text-gray-400 mb-8">Create a free account and start using voice-first incident reporting today.</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">
            Create Free Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-8 text-center text-sm text-gray-600">
        <p>AwaazSetu AI · Great Indian AI Internship Challenge 2026 · Built with Gnani AI</p>
      </footer>
    </div>
  );
}
