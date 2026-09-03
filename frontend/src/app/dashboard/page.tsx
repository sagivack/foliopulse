/**
 * Page de Tableau de Bord (Dashboard)
 * 
 * Ce composant React gere l'interface principale de l'utilisateur apres sa connexion.
 * Il affiche un resume financier, une liste de surveillance des actifs technologiques,
 * un graphique interactif provenant de TradingView, et un module d'intelligence artificielle
 * pour l'analyse macroeconomique.
 */
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';

type Quote = {
    symbol: string;
    currentPrice: number;
    change: number;
    percentChange: number;
    flash?: 'green' | 'red';
};

export default function DashboardPage() {
    const router = useRouter();

    // Données fictives pour le graphique de performance
    const performanceData = [
        { name: '1 Jui', value: 12400 },
        { name: '5 Jui', value: 12850 },
        { name: '10 Jui', value: 12100 },
        { name: '15 Jui', value: 13500 },
        { name: '20 Jui', value: 13200 },
        { name: '25 Jui', value: 14100 },
        { name: '30 Jui', value: 14750 },
        { name: 'Aujourd\'hui', value: 15420 },
    ];

    const [searchQuery, setSearchQuery] = useState("");
    const [question, setQuestion] = useState("");
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [quotes, setQuotes] = useState<Record<string, Quote | null>>({
        AAPL: null,
        TSLA: null,
        NVDA: null,
    });
    const [isMarketLoading, setIsMarketLoading] = useState(true);

    useEffect(() => {
        const fetchQuotes = async () => {
            const symbols = ['AAPL', 'TSLA', 'NVDA'];
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';
                return;
            }
            const headers = { 'Authorization': `Bearer ${token}` };

            try {
                const results = await Promise.all(
                    symbols.map(async (sym) => {
                        const res = await fetch(`https://foliopulse.onrender.com/api/market/quote/${sym}`, { headers });
                        if (res.status === 401) {
                            window.location.href = '/login';
                            throw new Error("Unauthorized");
                        }
                        if (!res.ok) throw new Error("API failed to fetch " + sym);
                        return res.json();
                    })
                );

                const newQuotes = {} as Record<string, Quote>;
                results.forEach(val => {
                    newQuotes[val.symbol] = val;
                });
                setQuotes(newQuotes);
            } catch (err) {
                console.error("Erreur API de marché:", err);
            } finally {
                setIsMarketLoading(false);
            }
        };

        fetchQuotes();

        // Connexion WebSocket pour les prix en direct
        const socket = io('https://foliopulse.onrender.com');
        
        socket.on('connect', () => {
            ['AAPL', 'TSLA', 'NVDA'].forEach(sym => socket.emit('subscribe', sym));
        });

        socket.on('priceUpdate', (data: { symbol: string, currentPrice: number }) => {
            setQuotes(prev => {
                const oldQuote = prev[data.symbol];
                if (!oldQuote) return prev;
                if (oldQuote.currentPrice === data.currentPrice) return prev;
                
                return {
                    ...prev,
                    [data.symbol]: {
                        ...oldQuote,
                        currentPrice: data.currentPrice,
                        flash: data.currentPrice > oldQuote.currentPrice ? 'green' : 'red'
                    }
                };
            });
            
            // Retirer l'effet de flash apres 1 seconde
            setTimeout(() => {
                setQuotes(prev => {
                    if (!prev[data.symbol]) return prev;
                    return {
                        ...prev,
                        [data.symbol]: { ...(prev[data.symbol] as Quote), flash: undefined }
                    };
                });
            }, 1000);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const handleAskAi = (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim()) return;

        setChatHistory(prev => [...prev, { role: 'user', content: question }]);
        setIsAiLoading(true);
        setQuestion("");

        fetch('https://foliopulse.onrender.com/api/ai/ask', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ question: question })
        })
            .then(res => res.json())
            .then(data => {
                setChatHistory(prev => [...prev, { role: 'ai', content: data.answer || "Erreur de réponse" }]);
            })
            .catch(err => {
                setChatHistory(prev => [...prev, { role: 'ai', content: "Erreur de connexion au bridge IA." }]);
            })
            .finally(() => setIsAiLoading(false));
    };

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            router.push(`/market/${searchQuery.trim().toUpperCase()}`);
        }
    };

    return (
        <div className="flex h-screen bg-[#070b14] text-white font-sans overflow-hidden">

            {/* Sidebar (Navigation Latérale) */}
            <aside className="w-64 border-r border-white/10 flex flex-col justify-between shrink-0 bg-white/[0.01]">
                <div className="p-6 space-y-8">
                    {/* Logo Area */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg border border-white/10 shrink-0">
                            <img src="/logo.png" alt="FolioPulse logo" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">FolioPulse</span>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="space-y-3">
                        <Link href="/dashboard" className="flex items-center gap-3 text-emerald-400 bg-emerald-500/10 px-4 py-3 rounded-xl font-medium border border-emerald-500/20">
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
                        <Link href="/analytics" className="w-full flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl font-medium transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Analytiques IA
                        </Link>
                    </nav>
                </div>
            </aside>

            {/* Zone Principale */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative">

                {/* Background ambient lighting */}
                <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

                {/* Top Header (Searh Bar + Profil) */}
                <header className="h-20 border-b border-white/10 px-8 flex items-center justify-between shrink-0 bg-transparent z-10">
                    {/* Search Bar */}
                    <div className="relative w-[400px]">
                        <svg className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearch}
                            placeholder="Rechercher une action (Ex: MSFT) + Entrée..."
                            className="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all font-medium placeholder:text-gray-500"
                        />
                    </div>
                    {/* Profil Actions */}
                    <div className="flex items-center gap-6">
                        <button className="text-gray-400 hover:text-white transition-colors relative">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        </button>
                        <Link href="/profile" className="flex items-center gap-3 hover:bg-white/5 p-1 pr-3 rounded-full border border-transparent hover:border-white/10 transition-all">
                            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/30">JS</div>
                            <span className="text-sm font-medium text-gray-300">Mon Profil</span>
                        </Link>
                    </div>
                </header>

                {/* Dashboard Scrollable Content */}
                <main className="flex-1 overflow-y-auto z-10 pl-8 pr-4">
                    <div className="py-8 pr-4 max-w-[1600px] mx-auto h-full flex flex-col">

                        <div className="mb-8 pl-1">
                            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Aperçu du Portefeuille</h1>
                            <p className="text-gray-400">Stratégie en cours : <span className="text-emerald-400 font-medium px-2 py-0.5 rounded shadow-sm bg-emerald-500/10 border border-emerald-500/20">Croissance Modérée</span></p>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 flex-1 pb-12">

                            {/* Colonne Principale (Marchés) */}
                            <section className="xl:col-span-2 space-y-8">

                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-white">Watchlist &bull; Temps Réel Finnhub</h2>
                                </div>

                                {isMarketLoading ? (
                                    <div className="h-32 flex items-center justify-center glass-panel rounded-2xl">
                                        <span className="text-emerald-400 flex items-center gap-3 font-medium">
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Connexion à Wall Street...
                                        </span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {['AAPL', 'TSLA', 'NVDA'].map((sym) => {
                                            const quote = quotes[sym];
                                            const isPositive = quote ? quote.percentChange >= 0 : false;

                                            return (
                                                <Link key={sym} href={`/market/${sym}`} className="glass-panel p-5 rounded-2xl block hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,0,0,0.5)] hover:border-white/20 transition-all group group relative overflow-hidden">
                                                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-sm font-bold text-gray-300 border border-white/10 group-hover:bg-white/10 transition-colors">
                                                                {sym[0]}
                                                            </div>
                                                            <h3 className="font-bold text-lg text-white tracking-wide">{sym}</h3>
                                                        </div>
                                                        {quote && (
                                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${isPositive ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                                                                {isPositive ? '+' : ''}{quote.percentChange.toFixed(2)}%
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-between items-baseline">
                                                        <div className={`mt-4 text-3xl font-bold tracking-tight transition-colors duration-300 ${quote?.flash === 'green' ? 'text-emerald-400' : quote?.flash === 'red' ? 'text-red-400' : 'text-white'}`}>
                                                            {quote ? `$${quote.currentPrice.toFixed(2)}` : '---'}
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Graphique Zone (Interactive Recharts) */}
                                <div className="glass-panel rounded-2xl p-6 h-[400px] flex flex-col relative overflow-hidden border-t-2 border-t-emerald-500/40 mt-8">
                                    <h3 className="text-sm font-medium text-gray-400 mb-6">Performance Globale Mensuelle</h3>
                                    <div className="flex-1 relative w-full mt-2 rounded-xl overflow-hidden border border-white/5">
                                        <iframe 
                                            scrolling="no" 
                                            src="https://s.tradingview.com/widgetembed/?frameElementId=tradingview_76d87&symbol=NASDAQ%3AAAPL&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=fr" 
                                            style={{ boxSizing: 'border-box', height: '100%', width: '100%', border: 'none' }}>
                                        </iframe>
                                    </div>
                                </div>

                            </section>

                            {/* Colonne IA (Chat Sidebar interne) */}
                            <section className="xl:col-span-1 h-[720px] flex flex-col glass-panel rounded-3xl overflow-hidden relative shadow-[0_0_40px_rgba(59,130,246,0.05)] border-indigo-500/20">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

                                <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-semibold text-white text-lg">Assistant IA</h3>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin scrollbar-thumb-white/10 shrink-0 min-h-0">
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-gray-300 text-sm leading-relaxed shadow-sm">
                                        Bonjour ! Je suis connecté au moteur IA. Posez-moi vos questions sur le marché ou votre stratégie.
                                    </div>

                                    {chatHistory.map((msg, idx) => (
                                        <div key={idx} className={`p-4 rounded-xl border text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-500/10 border-indigo-500/20 text-white ml-6' : 'bg-white/5 border-white/10 text-gray-300 mr-6'}`}>
                                            {msg.content}
                                        </div>
                                    ))}
                                    {isAiLoading && (
                                        <div className="p-4 bg-white/5 border border-white/10 text-indigo-300 rounded-xl mr-6 flex items-center gap-3 text-sm">
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            IA tape...
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 border-t border-white/5 shrink-0 bg-black/20">
                                    <form onSubmit={handleAskAi} className="relative">
                                        <input
                                            type="text"
                                            placeholder="Ex: Que penses-tu de Tesla ce mois-ci ?"
                                            value={question}
                                            onChange={(e) => setQuestion(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-sm text-white focus:outline-none focus:ring-1 focus:border-indigo-500 transition-all placeholder:text-gray-600"
                                            disabled={isAiLoading}
                                        />
                                        <button
                                            type="submit"
                                            disabled={isAiLoading || !question.trim()}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 rounded-lg text-white transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </form>
                                </div>
                            </section>

                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
