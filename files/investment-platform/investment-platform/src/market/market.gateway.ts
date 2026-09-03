import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as WebSocket from 'ws';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } })
export class MarketGateway implements OnGatewayInit {
    @WebSocketServer()
    server: Server;

    private finnhubWs: WebSocket;
    private readonly logger = new Logger(MarketGateway.name);
    private activeSymbols = new Set<string>();

    constructor(private configService: ConfigService) {}

    afterInit() {
        this.connectToFinnhub();
    }

    private connectToFinnhub() {
        const apiKey = this.configService.get<string>('FINNHUB_API_KEY');
        if (!apiKey) {
            this.logger.error('FINNHUB_API_KEY non definie, le WebSocket ne peut pas demarrer.');
            return;
        }

        this.finnhubWs = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);

        this.finnhubWs.on('open', () => {
            this.logger.log('Connecte au WebSocket Finnhub (Wall Street en direct).');
            // Re-subscribe to all active symbols if reconnecting
            for (const symbol of this.activeSymbols) {
                this.finnhubWs.send(JSON.stringify({ type: 'subscribe', symbol }));
            }
        });

        this.finnhubWs.on('message', (data: WebSocket.Data) => {
            try {
                const message = JSON.parse(data.toString());
                if (message.type === 'trade' && message.data) {
                    message.data.forEach((trade: any) => {
                        const symbol = trade.s;
                        const price = trade.p;
                        // On diffuse le nouveau prix à tous les clients dans la "room" (le salon) de ce symbole
                        this.server.to(symbol).emit('priceUpdate', { symbol, currentPrice: price });
                    });
                }
            } catch (e) {
                // Ignore parse errors
            }
        });

        this.finnhubWs.on('close', () => {
            this.logger.warn('Connexion Finnhub WS fermee. Reconnexion dans 5 secondes...');
            setTimeout(() => this.connectToFinnhub(), 5000);
        });

        this.finnhubWs.on('error', (err) => {
            this.logger.error('Erreur WS Finnhub', err);
        });
    }

    @SubscribeMessage('subscribe')
    handleSubscribe(@ConnectedSocket() client: Socket, @MessageBody() symbol: string) {
        if (!symbol) return;
        
        const upperSymbol = symbol.toUpperCase();
        client.join(upperSymbol);

        // Si c'est le premier client à écouter ce symbole, on informe Finnhub
        if (!this.activeSymbols.has(upperSymbol)) {
            this.activeSymbols.add(upperSymbol);
            if (this.finnhubWs && this.finnhubWs.readyState === WebSocket.OPEN) {
                this.finnhubWs.send(JSON.stringify({ type: 'subscribe', symbol: upperSymbol }));
                this.logger.log(`Abonnement Finnhub initie pour ${upperSymbol}`);
            }
        }
    }

    @SubscribeMessage('unsubscribe')
    handleUnsubscribe(@ConnectedSocket() client: Socket, @MessageBody() symbol: string) {
        if (!symbol) return;
        client.leave(symbol.toUpperCase());
    }
}
