'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Holding = {
    id: number;
    symbol: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    percentChange: number;
    value: number;
    pnl: number;
};

type PortfolioData = {
    totalValue: number;
    dayChange: number;
    totalPnl: number;
    assets: Holding[];
};

export default function PortfolioPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPortfolio = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };
                const res = await fetch('https://foliopulse.onrender.com/api/portfolio', { headers });
                if (res.ok) {
                    const data = await res.json();
                    setPortfolio(data);
                } else if (res.status === 401) {
                    window.location.href = '/login';
                }
            } catch (err) {
                console.error("Impossible de charger le portefeuille", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPortfolio();
    }, []);

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            router.push(`/market/${searchQuery.trim().toUpperCase()}`);
        }
    };

    return (
        <div className="flex h-screen bg-[#070b14] text-white font-sans overflow-hidden">

            {/* Sidebar (Navigation Latérale) - Identique au Dashboard */}
            <aside className="w-64 border-r border-white/10 flex flex-col justify-between shrink-0 bg-white/[0.01]">
                <div className="p-6 space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg border border-white/10 shrink-0">
                            <img src="/logo.png" alt="FolioPulse logo" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">FolioPulse</span>
                    </div>

                    <nav className="space-y-3">
                        <Link href="/dashboard" className="w-full flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl font-medium transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            Tableau de bord
                        </Link>
                        <Link href="/portfolio" className="flex items-center gap-3 text-emerald-400 bg-emerald-500/10 px-4 py-3 rounded-xl font-medium border border-emerald-500/20">
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
                <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

                {/* Top Header */}
                <header className="h-20 border-b border-white/10 px-8 flex items-center justify-between shrink-0 bg-transparent z-10">
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
                            className="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all font-medium placeholder:text-gray-500"
                        />
                    </div>
                    <div className="flex items-center gap-6">
                        <Link href="/profile" className="flex items-center gap-3 hover:bg-white/5 p-1 pr-3 rounded-full border border-transparent hover:border-white/10 transition-all">
                            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/30">JS</div>
                            <span className="text-sm font-medium text-gray-300">Mon Profil</span>
                        </Link>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto z-10 p-8">
                    <div className="max-w-[1200px] mx-auto space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Mon Portefeuille Actif</h1>
                            <p className="text-gray-400">Croissance Globale basée sur flux Finnhub Live.</p>
                        </div>

                        {isLoading || !portfolio ? (
                            <div className="h-[200px] flex items-center justify-center glass-panel rounded-2xl">
                                <span className="text-blue-400 flex items-center gap-3 font-medium">
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Synchronisation des prix du marché...
                                </span>
                            </div>
                        ) : (
                            <>
                                {/* KPI Section */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="glass-panel p-6 rounded-2xl">
                                        <h3 className="text-sm font-medium text-gray-400 mb-1">Solde Total du Portefeuille</h3>
                                        <p className="text-4xl font-bold text-white tracking-tight">${portfolio.totalValue.toFixed(2)}</p>
                                    </div>
                                    <div className="glass-panel p-6 rounded-2xl">
                                        <h3 className="text-sm font-medium text-gray-400 mb-1">Évolution 24h</h3>
                                        <p className={`text-4xl font-bold tracking-tight ${portfolio.dayChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {portfolio.dayChange >= 0 ? '+' : ''}${portfolio.dayChange.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="glass-panel p-6 rounded-2xl">
                                        <h3 className="text-sm font-medium text-gray-400 mb-1">Plus/Moins-Value Latente</h3>
                                        <p className={`text-3xl font-bold tracking-tight mt-1 ${portfolio.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {portfolio.totalPnl >= 0 ? '+' : ''}${portfolio.totalPnl.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                {/* Table Section */}
                                <div className="glass-panel rounded-2xl overflow-hidden mt-8">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white/[0.03] border-b border-white/10 text-gray-400 text-sm">
                                                <th className="font-medium p-4 pl-6">Sécurité</th>
                                                <th className="font-medium p-4">Qté</th>
                                                <th className="font-medium p-4">Prix Moyen</th>
                                                <th className="font-medium p-4">Prix Finnhub</th>
                                                <th className="font-medium p-4">Évolution 24H</th>
                                                <th className="font-medium p-4 pr-6 text-right">Valeur Totale</th>
                                                <th className="font-medium p-4 pr-6 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10">
                                            {portfolio.assets.map((asset) => (
                                                <tr key={asset.id} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="p-4 pl-6 font-bold text-white flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-xs text-gray-300 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                                            {asset.symbol[0]}
                                                        </div>
                                                        {asset.symbol}
                                                    </td>
                                                    <td className="p-4 text-gray-300">{asset.quantity.toFixed(2)}</td>
                                                    <td className="p-4 text-gray-300">${asset.avgPrice.toFixed(2)}</td>
                                                    <td className="p-4 text-white font-medium">${asset.currentPrice.toFixed(2)}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${asset.percentChange >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                                                            {asset.percentChange >= 0 ? '+' : ''}{asset.percentChange.toFixed(2)}%
                                                        </span>
                                                    </td>
                                                    <td className="p-4 pr-6 text-right font-bold text-white">
                                                        ${asset.value.toFixed(2)}
                                                    </td>
                                                    <td className="p-4 pr-6 text-center">
                                                        <Link href={`/market/${asset.symbol}`} className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-bold py-1.5 px-4 rounded-lg transition-colors inline-block whitespace-nowrap text-sm border border-blue-500/30">
                                                            Négocier
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
