import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="glass-panel max-w-3xl w-full p-12 text-center flex flex-col items-center space-y-8 z-10 transition-transform hover:scale-[1.01] duration-500">
        <div className="flex items-center justify-center gap-4 mb-4">
          {/* Real Generated Logo */}
          <img src="/logo.png" alt="FolioPulse Logo" className="w-16 h-16 rounded-2xl shadow-xl border border-white/10 shadow-emerald-500/20" />
          <span className="text-3xl font-bold tracking-widest text-white uppercase mt-2">FolioPulse</span>
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl text-white">
          L'investissement, <br />
          <span className="gradient-text">propulsé par l'IA.</span>
        </h1>
        <p className="max-w-xl text-lg text-gray-400">
          Obtenez votre profil d'investissement personnalisé, des analyses financières
          en temps réel et des recommandations générées par notre intelligence artificielle.
        </p>
        <div className="flex gap-4 pt-4">
          <Link
            href="/login"
            className="px-8 py-4 bg-primary text-white text-lg font-medium rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all hover:-translate-y-0.5"
          >
            Se connecter
          </Link>
          <Link
            href="/onboarding"
            className="px-8 py-4 bg-white/5 border border-white/10 text-white text-lg font-medium rounded-full hover:bg-white/10 transition-all"
          >
            Découvrir mon profil
          </Link>
        </div>
      </div>
    </main>
  );
}
