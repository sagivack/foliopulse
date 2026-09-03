/**
 * Page de Detail du Marche
 * 
 * Ce composant React affiche les informations detaillees pour un actif specifique (ex: AAPL, BTC).
 * Il permet a l'utilisateur de consulter le prix en direct (via Finnhub), d'observer
 * le graphique professionnel (TradingView), de soumettre un ordre d'achat ou de vente
 * a notre courtier Alpaca, et de lire l'analyse de l'Intelligence Artificielle.
 */
'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { io } from 'socket.io-client';

type Quote = {
    currentPrice: number;
    percentChange: number;
    flash?: 'green' | 'red';
};

type AiRecommendation = {
    stance: string;
    confidence: number;
    summary: string;
    reasoning: string;
    risks: string[];
    profileType: string;
};

export default function MarketDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
    const resolvedParams = use(params);
    const { symbol } = resolvedParams;

    const [quote, setQuote] = useState<Quote | null>(null);
    const [aiData, setAiData] = useState<AiRecommendation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Trade state
    const [quantity, setQuantity] = useState<number | ''>(1);
    const [tradeMode, setTradeMode] = useState<'BUY' | 'SELL'>('BUY');
    const [isTrading, setIsTrading] = useState(false);
    const [tradeSuccess, setTradeSuccess] = useState(false);
    const [tradeError, setTradeError] = useState<string | null>(null);

    const handleTrade = async () => {
        if (!quote || quantity === '' || quantity <= 0) return;
        setIsTrading(true);
        setTradeError(null);
        try {
            const endpoint = tradeMode === 'BUY' ? 'buy' : 'sell';
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`https://foliopulse.onrender.com/api/portfolio/${endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ symbol, quantity: Number(quantity), price: quote.currentPrice })
            });
            
            if (res.status === 401) {
                window.location.href = '/login';
                return;
            }
            if (res.ok) {
                setTradeSuccess(true);
                setTimeout(() => setTradeSuccess(false), 3000);
            } else {
                const data = await res.json().catch(() => ({}));
                setTradeError(data.message || "Erreur de transaction");
            }
        } catch (e) {
            console.error(e);
            setTradeError("Problème de réseau");
        } finally {
            setIsTrading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Quote
                const quoteRes = await fetch(`https://foliopulse.onrender.com/api/market/quote/${symbol}`);
                if (!quoteRes.ok) throw new Error("Impossible de charger les données du marché");
                const quoteJson = await quoteRes.json();
                setQuote(quoteJson);

                // Fetch AI Recommendation
                const token = localStorage.getItem('token');
                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const aiRes = await fetch(`https://foliopulse.onrender.com/api/ai/recommendation`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ symbol })
                });
                
                if (aiRes.status === 401) {
                    window.location.href = '/login';
                    return;
                }
                
                if (!aiRes.ok) throw new Error("Impossible de charger l'analyse IA");
                const aiJson = await aiRes.json();
                setAiData(aiJson);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        // Connexion WebSocket
        const socket = io('https://foliopulse.onrender.com');
        
        socket.on('connect', () => {
            socket.emit('subscribe', symbol);
        });

        socket.on('priceUpdate', (data: { symbol: string, currentPrice: number }) => {
            setQuote(prev => {
                if (!prev) return prev;
                if (prev.currentPrice === data.currentPrice) return prev;
                return {
                    ...prev,
                    currentPrice: data.currentPrice,
                    flash: data.currentPrice > prev.currentPrice ? 'green' : 'red'
                };
            });
            setTimeout(() => {
                setQuote(prev => prev ? { ...prev, flash: undefined } : prev);
            }, 1000);
        });

        return () => { socket.disconnect(); };
    }, [symbol]);

    return (
        <div className="min-h-screen p-6 md:p-12 space-y-8 relative">
            <Link href="/dashboard" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2 mb-8">
                ← Retour au tableau de bord
            </Link>

            <header className="flex justify-between items-end pb-6 border-b border-white/10">
                <div>
                    <h1 className="text-4xl font-bold text-white">{symbol.toUpperCase()}</h1>
                    <p className="text-gray-400 mt-1">Données en direct (Finnhub)</p>
                </div>
                <div className="text-right">
                    {isLoading ? (
                        <p className="text-gray-400">Chargement...</p>
                    ) : quote ? (
                        <>
                            <p className={`text-3xl font-semibold transition-colors duration-300 ${quote.flash === 'green' ? 'text-emerald-400' : quote.flash === 'red' ? 'text-red-400' : 'text-white'}`}>
                                ${quote.currentPrice.toFixed(2)}
                            </p>
                            <p className={`font-medium ${quote.percentChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {quote.percentChange >= 0 ? '+' : ''}{quote.percentChange.toFixed(2)}% aujourd'hui
                            </p>
                        </>
                    ) : (
                        <p className="text-red-400">N/A</p>
                    )}
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    {/* TradingView Graph */}
                    <section className="glass-panel p-1 flex items-center justify-center flex-col relative overflow-hidden h-[300px]">
                        <iframe 
                            scrolling="no" 
                            src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_1&symbol=${symbol.toUpperCase()}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=fr`}
                            style={{ boxSizing: 'border-box', height: '100%', width: '100%', border: 'none' }}>
                        </iframe>
                    </section>

                    {/* Trade Interface */}
                    <section className={`glass-panel p-6 relative overflow-hidden border-t-2 ${tradeMode === 'BUY' ? 'border-t-emerald-500' : 'border-t-red-500'}`}>
                        <div className={`absolute inset-0 blur-3xl ${tradeMode === 'BUY' ? 'bg-emerald-500/5' : 'bg-red-500/5'}`} />

                        <div className="flex bg-black/40 p-1 rounded-xl mb-6 relative z-10 border border-white/5">
                            <button
                                onClick={() => setTradeMode('BUY')}
                                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${tradeMode === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-500 hover:text-white'}`}
                            >
                                Acheter
                            </button>
                            <button
                                onClick={() => setTradeMode('SELL')}
                                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${tradeMode === 'SELL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-gray-500 hover:text-white'}`}
                            >
                                Vendre
                            </button>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Nombre d'actions / fractions</label>
                                <div className={`flex bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-${tradeMode === 'BUY' ? 'emerald' : 'red'}-500/50 transition-colors relative`}>
                                    <input
                                        type="number"
                                        min="0.1"
                                        step="0.1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full bg-transparent px-4 py-3 text-white outline-none"
                                        placeholder="Ex: 5"
                                    />
                                    <div className="px-5 py-3 bg-white/5 border-l border-white/10 text-gray-400 font-bold shrink-0">
                                        {symbol.toUpperCase()}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center py-2 border-y border-white/5">
                                <span className="text-gray-400 font-medium">Prix unitaire</span>
                                <span className="text-white font-bold">{quote ? `$${quote.currentPrice.toFixed(2)}` : '...'}</span>
                            </div>

                            <div className={`flex justify-between items-center p-4 rounded-xl border ${tradeMode === 'BUY' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                <span className={tradeMode === 'BUY' ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                                    Montant Total
                                </span>
                                <span className={`text-2xl font-bold tracking-tight ${tradeMode === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {quote && quantity !== '' ? `$${(quote.currentPrice * quantity).toFixed(2)}` : '$0.00'}
                                </span>
                            </div>

                            {tradeError && (
                                <div className="p-3 bg-red-900/30 border border-red-500/30 text-red-400 text-sm font-medium rounded-lg text-center">
                                    {tradeError}
                                </div>
                            )}

                            <button
                                onClick={handleTrade}
                                disabled={!quote || quantity === '' || quantity <= 0 || isTrading}
                                className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center ${tradeSuccess
                                        ? (tradeMode === 'BUY' ? 'bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]')
                                        : (!quote || quantity === '' || quantity <= 0 || isTrading)
                                            ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/10'
                                            : tradeMode === 'BUY'
                                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-[0.98]'
                                                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] active:scale-[0.98]'
                                    }`}
                            >
                                {tradeSuccess ? "✔️ Ordre Exécuté !" : isTrading ? "Transaction..." : (tradeMode === 'BUY' ? "Investir" : "Liquider")}
                            </button>
                        </div>
                    </section>
                </div>

                {/* AI Insight */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        Analyse IA
                    </h2>

                    <div className="glass-panel p-6 space-y-4 border-t-4 border-t-indigo-500 min-h-[300px]">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-4 text-indigo-300">
                                <svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>IA analyse le marché en direct...</span>
                            </div>
                        ) : error ? (
                            <div className="text-red-400">{error}</div>
                        ) : aiData ? (
                            <>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold text-white text-lg">Verdict: {aiData.stance}</span>
                                    <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-gray-300">Confiance: {aiData.confidence}%</span>
                                </div>

                                <p className="text-gray-300 leading-relaxed text-sm">
                                    {aiData.summary}
                                </p>
                                <p className="text-gray-400 leading-relaxed text-sm italic mt-2">
                                    {aiData.reasoning}
                                </p>

                                <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                                    <h4 className="text-sm font-medium text-white mb-2">Points d'attention (Risques) :</h4>
                                    <ul className="list-disc pl-5 text-sm text-gray-400 space-y-1">
                                        {aiData.risks && aiData.risks.map((risk, i) => (
                                            <li key={i}>{risk}</li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        ) : null}
                    </div>
                </section>
            </main>
        </div>
    );
}
