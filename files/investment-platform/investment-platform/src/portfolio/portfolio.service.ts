import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarketService } from '../market/market.service';

/**
 * Le module Alpaca permet d'interagir avec l'API de courtage.
 * Nous utilisons l'import 'require' car le module expose son constructeur de maniere specifique en CommonJS.
 */
const { Alpaca } = require('@alpacahq/alpaca-trade-api');

/**
 * Service PortfolioService
 * 
 * Ce service gere les actifs financiers de l'utilisateur. 
 * Il agit comme un ledger interne (base SQLite) et communique simultanement avec 
 * un vrai courtier en ligne (Alpaca) si les cles API sont configurees.
 */
@Injectable()
export class PortfolioService {
    private readonly logger = new Logger(PortfolioService.name);
    private alpaca: any;

    /**
     * Constructeur du service.
     * Initialise l'instance Prisma pour la base de donnees locale, le MarketService pour les prix,
     * et configure le client Alpaca avec les variables d'environnement.
     */
    constructor(
        private readonly prisma: PrismaService,
        private readonly marketService: MarketService,
    ) { 
        this.alpaca = new Alpaca({
            keyId: process.env.ALPACA_API_KEY || 'dummy_key',
            secret: process.env.ALPACA_SECRET_KEY || 'dummy_secret',
            paper: true // Indique que nous utilisons l'environnement de test (Paper Trading)
        });
    }

    /**
     * Recupere l'integralite du portefeuille d'un utilisateur.
     * 
     * @param userId L'identifiant unique de l'utilisateur
     * @returns Un objet contenant la valeur totale, la variation journaliere, le profit total et la liste des actifs.
     */
    async getPortfolio(userId: string) {
        // 1. Recuperation des positions depuis la base de donnees locale (SQLite)
        const holdings: any[] = await this.prisma.$queryRaw`SELECT * FROM holdings WHERE "userId" = ${userId}`;

        if (holdings.length === 0) {
            return { totalValue: 0, dayChange: 0, totalPnl: 0, assets: [] };
        }

        let totalValue = 0;
        let dayChange = 0;
        let totalPnl = 0;

        // 2. Evaluation de chaque position avec les prix du marche en temps reel via Finnhub
        const assets = await Promise.all(
            holdings.map(async (holding) => {
                let currentPrice = holding.avgPrice; // Prix de secours si l'API echoue
                let change = 0;
                let percentChange = 0;

                try {
                    // Appel a l'API de marche pour obtenir le prix en direct
                    const quote = await this.marketService.getQuote(holding.symbol);
                    if (quote) {
                        currentPrice = quote.currentPrice;
                        change = quote.change;
                        percentChange = quote.percentChange;
                    }
                } catch (error) {
                    this.logger.warn(`Impossible de recuperer le prix en direct pour ${holding.symbol}`);
                }

                // Calculs financiers pour la position actuelle
                const value = holding.quantity * currentPrice;
                const costBasis = holding.quantity * holding.avgPrice;
                const pnl = value - costBasis;
                const localDayChange = holding.quantity * change;

                // Agregation globale du portefeuille
                totalValue += value;
                totalPnl += pnl;
                dayChange += localDayChange;

                return {
                    id: holding.id,
                    symbol: holding.symbol,
                    quantity: holding.quantity,
                    avgPrice: holding.avgPrice,
                    currentPrice,
                    percentChange,
                    value,
                    pnl,
                };
            }),
        );

        return {
            totalValue,
            dayChange,
            totalPnl,
            assets,
        };
    }

    /**
     * Achete un actif financier.
     * Cette methode envoie d'abord un ordre de marche reel a Alpaca, 
     * puis met a jour le registre interne (SQLite).
     * 
     * @param userId Identifiant de l'utilisateur
     * @param symbol Le symbole boursier (ex: AAPL)
     * @param quantity La quantite a acheter
     * @param price Le prix unitaire d'execution
     */
    async buyAsset(userId: string, symbol: string, quantity: number, price: number) {
        // Tentative d'envoi de l'ordre reel si la cle Alpaca est configuree
        try {
            if (process.env.ALPACA_API_KEY) {
                await this.alpaca.createOrder({
                    symbol: symbol,
                    qty: quantity,
                    side: 'buy',
                    type: 'market',
                    time_in_force: 'day'
                });
                this.logger.log(`Ordre d'achat Alpaca execute : ${quantity} ${symbol}`);
            }
        } catch (e) {
            this.logger.warn("Erreur de courtage Alpaca (Achat), execution en simulation locale.");
        }

        // Verification de l'existence de cet actif dans le portefeuille local
        const existing: any[] = await this.prisma.$queryRaw`SELECT * FROM holdings WHERE "userId" = ${userId} AND symbol = ${symbol}`;
        const date = new Date().toISOString();

        // Enregistrement dans l'historique
        await this.prisma.$executeRaw`INSERT INTO transactions ("userId", type, symbol, quantity, price, createdAt) VALUES (${userId}, 'BUY', ${symbol}, ${quantity}, ${price}, ${date})`;

        if (existing.length > 0) {
            // L'utilisateur possede deja cet actif, on moyenne le prix d'achat
            const holding = existing[0];
            const newQuantity = holding.quantity + quantity;
            const newTotalCost = (holding.quantity * holding.avgPrice) + (quantity * price);
            const newAvgPrice = newTotalCost / newQuantity;

            await this.prisma.$executeRaw`UPDATE holdings SET quantity = ${newQuantity}, avgPrice = ${newAvgPrice}, updatedAt = ${date} WHERE id = ${holding.id}`;
            return { message: "Position renforcee", holding: { symbol, quantity: newQuantity, avgPrice: newAvgPrice } };
        } else {
            // Creation d'une nouvelle position
            await this.prisma.$executeRaw`INSERT INTO holdings ("userId", symbol, quantity, avgPrice, updatedAt) VALUES (${userId}, ${symbol}, ${quantity}, ${price}, ${date})`;
            return { message: "Nouvelle position acquise", holding: { symbol, quantity, avgPrice: price } };
        }
    }

    /**
     * Vend un actif financier.
     * Cette methode envoie d'abord un ordre de marche reel a Alpaca, 
     * puis met a jour ou supprime la position dans le registre interne (SQLite).
     * 
     * @param userId Identifiant de l'utilisateur
     * @param symbol Le symbole boursier (ex: AAPL)
     * @param quantity La quantite a vendre
     * @param price Le prix unitaire d'execution
     */
    async sellAsset(userId: string, symbol: string, quantity: number, price: number) {
        // Tentative d'envoi de l'ordre reel sur Alpaca
        try {
            if (process.env.ALPACA_API_KEY) {
                await this.alpaca.createOrder({
                    symbol: symbol,
                    qty: quantity,
                    side: 'sell',
                    type: 'market',
                    time_in_force: 'day'
                });
                this.logger.log(`Ordre de vente Alpaca execute : ${quantity} ${symbol}`);
            }
        } catch (e) {
            this.logger.warn("Erreur de courtage Alpaca (Vente), execution en simulation locale.");
        }

        // Verification des fonds locaux
        const existing: any[] = await this.prisma.$queryRaw`SELECT * FROM holdings WHERE "userId" = ${userId} AND symbol = ${symbol}`;
        const date = new Date().toISOString();

        if (existing.length === 0) {
            throw new Error("Vous ne possedez pas cet actif.");
        }

        const holding = existing[0];
        if (quantity > holding.quantity) {
            throw new Error("Quantite insuffisante en portefeuille.");
        }

        // Enregistrement dans l'historique
        await this.prisma.$executeRaw`INSERT INTO transactions ("userId", type, symbol, quantity, price, createdAt) VALUES (${userId}, 'SELL', ${symbol}, ${quantity}, ${price}, ${date})`;

        if (quantity === holding.quantity) {
            // Vente totale : on efface l'enregistrement de la base de donnees
            await this.prisma.$executeRaw`DELETE FROM holdings WHERE id = ${holding.id}`;
            return { message: "Position totalement liguidee", holding: null };
        } else {
            // Vente partielle : on reduit la quantite possedee
            const newQuantity = holding.quantity - quantity;
            // Note: Le prix moyen d'achat initial reste inchange lors d'une vente partielle
            await this.prisma.$executeRaw`UPDATE holdings SET quantity = ${newQuantity}, updatedAt = ${date} WHERE id = ${holding.id}`;
            return { message: "Position allegee", holding: { symbol, quantity: newQuantity, avgPrice: holding.avgPrice } };
        }
    }

    /**
     * Recupere l'historique complet des transactions d'un utilisateur
     * 
     * @param userId Identifiant de l'utilisateur
     */
    async getHistory(userId: string) {
        return this.prisma.$queryRaw`SELECT * FROM transactions WHERE "userId" = ${userId} ORDER BY createdAt DESC`;
    }
}
