/**
 * Page Analytiques IA
 * 
 * Ce composant React gere l'affichage de l'analyse macroeconomique globale du marche.
 * Il sollicite l'API backend pour obtenir la tendance generale (Market Mood),
 * le niveau de confiance, et les secteurs a surveiller, fournis par notre integration IA/Claude.
 */
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

type MacroData = {
    marketMood: string;
    sentimentScore: number;
    headline: string;
    sectorsToWatch: string[];
    analysis: string;
};

export default function AnalyticsPage() {
    const [macroData, setMacroData] = useState<MacroData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMacro = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('http://localhost:4000/api/ai/macro', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMacroData(data);
            } else if (res.status === 401) {
                window.location.href = '/login';
            } else {
                setError("Oups, l'antenne IA a saturé (Quota TPM de l'API). Attendez ~10s avant de relancer.");
            }
        } catch (err) {
            console.error("Erreur chargement IA Macro", err);
            setError("Le serveur d'intelligence artificielle est injoignable.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMacro();
    }, []);

    return (
        <div className="flex h-screen bg-[#06040b] text-white font-sans overflow-hidden">

            {/* Sidebar Gold/Premium */}
            <aside className="w-64 border-r border-[#ffd700]/10 flex flex-col justify-between shrink-0 bg-[#ffd700]/[0.01]">
                <div className="p-6 space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg border border-[#ffd700]/20 shrink-0">
                            <img src="/logo.png" alt="FolioPulse logo" className="w-full h-full object-cover grayscale-[0.2] sepia-[0.3]" />
                        </div>
                        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#ffd700] to-purple-400 bg-clip-text text-transparent">FolioPulse PRV</span>
                    </div>

                    <nav className="space-y-3">
                        <Link href="/dashboard" className="w-full flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl font-medium transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            Tableau de bord
                        </Link>
                        <Link href="/portfolio" className="w-full flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl font-medium transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Portefeuille
                        </Link>
                        <Link href="/analytics" className="flex items-center gap-3 text-[#ffd700] bg-[#ffd700]/10 px-4 py-3 rounded-xl font-medium border border-[#ffd700]/20 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Analytiques IA
                        </Link>
                    </nav>
                </div>
            </aside>

            {/* Zone Principale Premium */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative">

                {/* Background Ambient Lighting Gold */}
                <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-[#ffd700]/5 rounded-full blur-[120px] pointer-events-none z-0" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none z-0" />

                {/* Top Header */}
                <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between shrink-0 bg-transparent z-10">
                    <h2 className="text-[#ffd700] tracking-widest uppercase font-bold text-sm opacity-80 border border-[#ffd700]/20 px-4 py-1.5 rounded-full">Section Premium Privée</h2>
                    <div className="flex items-center gap-6">
                        <Link href="/login" className="flex items-center gap-3 hover:bg-white/5 p-1 pr-3 rounded-full border border-[#ffd700]/20 transition-all shadow-[0_0_10px_rgba(255,215,0,0.05)]">
                            <div className="w-9 h-9 rounded-full bg-[#ffd700]/20 flex items-center justify-center text-[#ffd700] font-bold">JS</div>
                            <span className="text-sm font-medium text-[#ffd700]">Élite Investisseur</span>
                        </Link>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto z-10 p-8">
                    <div className="max-w-[1200px] mx-auto space-y-12">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight text-white mb-2 font-serif">Aperçu Macro-économique.</h1>
                            <p className="text-purple-300/80">Synthèse institutionnelle générée par IA Qwen (27B) HFT Logic.</p>
                        </div>

                        {isLoading ? (
                            <div className="h-[400px] flex items-center justify-center rounded-3xl border border-[#ffd700]/10 bg-black/40 backdrop-blur-xl shadow-2xl">
                                <span className="text-[#ffd700] flex flex-col items-center gap-6 font-medium text-lg">
                                    <svg className="animate-spin h-12 w-12 text-[#ffd700]" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="tracking-widest uppercase text-sm font-bold opacity-80 animate-pulse">L'IA compile les indices mondiaux...</span>
                                </span>
                            </div>
                        ) : error ? (
                            <div className="h-[400px] flex flex-col items-center justify-center rounded-3xl border border-red-500/20 bg-red-900/10 backdrop-blur-xl shadow-2xl space-y-6">
                                <span className="text-red-400 font-medium text-lg flex items-center gap-3">
                                    Erreur: {error}
                                </span>
                                <button onClick={fetchMacro} className="px-6 py-2 bg-[#ffd700] text-black font-bold rounded-full hover:bg-[#ffe650] transition-colors shadow-[0_0_15px_rgba(255,215,0,0.4)]">
                                    Relancer l'Analyse IA
                                </button>
                            </div>
                        ) : !macroData ? null : (
                            <div className="space-y-8 animate-in fade-in zoom-in duration-500">

                                {/* Jumbotron Headline */}
                                <div className="bg-gradient-to-br from-[#1a1726] to-[#0f0e15] border border-[#ffd700]/20 rounded-3xl p-10 shadow-[0_0_50px_rgba(255,215,0,0.03)] relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 text-[120px] opacity-5">IA</div>
                                    <h2 className="text-3xl font-serif text-white max-w-3xl leading-tight mb-8">
                                        "{macroData.headline}"
                                    </h2>

                                    <div className="flex items-center gap-8 border-t border-white/5 pt-8">
                                        <div>
                                            <p className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-1">Climat Marché</p>
                                            <p className={`text-2xl font-black ${macroData.marketMood === 'BULLISH' ? 'text-emerald-400' : macroData.marketMood === 'BEARISH' ? 'text-red-400' : 'text-blue-400'}`}>
                                                {macroData.marketMood}
                                            </p>
                                        </div>
                                        <div className="h-10 w-px bg-white/10" />
                                        <div>
                                            <p className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-1">Indice Confiance IA</p>
                                            <p className="text-2xl font-black text-[#ffd700]">{macroData.sentimentScore}/100</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Secteurs à surveiller */}
                                    <div className="col-span-1 bg-[#0f0e15] border border-purple-500/20 rounded-3xl p-8 shadow-xl">
                                        <h3 className="text-[#ffd700] font-bold uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Secteurs Prioritaires
                                        </h3>
                                        <div className="space-y-4">
                                            {macroData.sectorsToWatch.map((sec, idx) => (
                                                <div key={idx} className="bg-purple-900/20 border border-purple-500/20 p-4 rounded-xl flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center text-purple-300 font-bold">
                                                        {idx + 1}
                                                    </div>
                                                    <span className="font-medium text-white">{sec}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Analyse détaillée */}
                                    <div className="col-span-1 lg:col-span-2 bg-[#0f0e15] border border-white/5 rounded-3xl p-8 shadow-xl">
                                        <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-6 border-b border-white/5 pb-4">
                                            Synthèse du Comité Stratégique Virtuel
                                        </h3>
                                        <p className="text-gray-300 text-lg leading-relaxed font-serif">
                                            {macroData.analysis}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <section className="space-y-6 mt-16 pt-12 border-t border-white/10">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                                📚 Académie : Investir au Canada
                            </h2>
                            <p className="text-gray-400">Le guide de survie financier pour les débutants. Comprendre les comptes canadiens pour optimiser ses impôts.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* CELI */}
                            <div className="glass-panel p-6 rounded-2xl border-t-2 border-t-emerald-500 hover:bg-white/[0.02] transition-colors group">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">CELI</h3>
                                    <span className="text-xs font-bold px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">Sans Impôt</span>
                                </div>
                                <p className="text-sm font-medium text-gray-300 mb-2">Compte d'Épargne Libre d'Impôt</p>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Le couteau suisse de l'investisseur. Tout l'argent que vous gagnez à l'intérieur (dividendes, plus-values) n'est <strong className="text-white">jamais imposé</strong>. Vous pouvez retirer l'argent quand vous voulez sans pénalité.
                                </p>
                                <div className="mt-4 pt-4 border-t border-white/5">
                                    <p className="text-xs text-gray-500">💡 Idéal pour : Objectifs à court/moyen terme et faire fructifier son argent net d'impôt.</p>
                                </div>
                            </div>

                            {/* REER */}
                            <div className="glass-panel p-6 rounded-2xl border-t-2 border-t-blue-500 hover:bg-white/[0.02] transition-colors group">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">REER</h3>
                                    <span className="text-xs font-bold px-2 py-1 bg-blue-500/20 text-blue-400 rounded">Retraite</span>
                                </div>
                                <p className="text-sm font-medium text-gray-300 mb-2">Régime Enregistré d'Épargne-Retraite</p>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    L'outil ultime pour réduire ses impôts actuels. Chaque dollar investi <strong className="text-white">diminue votre revenu imposable</strong> de l'année. L'argent est imposé uniquement lors du retrait à la retraite (quand vos revenus sont plus faibles).
                                </p>
                                <div className="mt-4 pt-4 border-t border-white/5">
                                    <p className="text-xs text-gray-500">💡 Idéal pour : Épargner pour ses vieux jours et payer moins d'impôts aujourd'hui.</p>
                                </div>
                            </div>

                            {/* CELIAPP */}
                            <div className="glass-panel p-6 rounded-2xl border-t-2 border-t-purple-500 hover:bg-white/[0.02] transition-colors group">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">CELIAPP</h3>
                                    <span className="text-xs font-bold px-2 py-1 bg-purple-500/20 text-purple-400 rounded">Immobilier</span>
                                </div>
                                <p className="text-sm font-medium text-gray-300 mb-2">Achat d'une Première Propriété</p>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Le meilleur des deux mondes (CELI + REER). Les cotisations réduisent vos impôts (comme le REER), et les retraits pour acheter votre première maison sont libres d'impôt (comme le CELI).
                                </p>
                                <div className="mt-4 pt-4 border-t border-white/5">
                                    <p className="text-xs text-gray-500">💡 Idéal pour : Les jeunes (ou moins jeunes) qui veulent devenir propriétaires.</p>
                                </div>
                            </div>

                            {/* Les 3 règles d'or */}
                            <div className="glass-panel p-6 rounded-2xl border border-white/10 md:col-span-2 lg:col-span-3 bg-gradient-to-br from-white/[0.02] to-transparent">
                                <h3 className="text-xl font-bold text-white mb-4">Les 3 Règles d'Or du Débutant</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">🥚</span>
                                            <h4 className="font-bold text-gray-200">1. Diversification</h4>
                                        </div>
                                        <p className="text-sm text-gray-400">Ne mettez pas tous vos œufs dans le même panier. Acheter un fond indiciel (FNB/ETF) comme le S&P 500 permet d'investir dans les 500 plus grandes entreprises d'un coup.</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">⏳</span>
                                            <h4 className="font-bold text-gray-200">2. Horizon de Temps</h4>
                                        </div>
                                        <p className="text-sm text-gray-400">La bourse n'est pas un casino, c'est un marathon. Historiquement, le marché monte sur le long terme (10+ années). Ne paniquez pas lors des baisses.</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">❄️</span>
                                            <h4 className="font-bold text-gray-200">3. Intérêts Composés</h4>
                                        </div>
                                        <p className="text-sm text-gray-400">Comme une boule de neige, vos gains génèrent eux-mêmes des gains. Plus vous commencez tôt, plus l'effet exponentiel est puissant. Le temps est votre meilleur allié.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
