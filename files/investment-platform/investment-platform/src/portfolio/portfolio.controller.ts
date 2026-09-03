import { Controller, Get, Post, Body, UseGuards, Req, HttpException, HttpStatus } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('portfolio')
@UseGuards(JwtAuthGuard)
export class PortfolioController {
    constructor(private readonly portfolioService: PortfolioService) { }

    @Get()
    async getPortfolio(@Req() req: any) {
        return this.portfolioService.getPortfolio(req.user.id);
    }

    @Get('history')
    async getHistory(@Req() req: any) {
        return this.portfolioService.getHistory(req.user.id);
    }

    @Post('buy')
    async buyAsset(@Req() req: any, @Body() body: { symbol: string, quantity: number, price: number }) {
        if (!body.symbol || body.quantity <= 0 || body.price <= 0) {
            throw new HttpException("Paramètres de transaction invalides", HttpStatus.BAD_REQUEST);
        }
        try {
            return await this.portfolioService.buyAsset(req.user.id, body.symbol, Number(body.quantity), Number(body.price));
        } catch (error: any) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Post('sell')
    async sellAsset(@Req() req: any, @Body() body: { symbol: string, quantity: number, price: number }) {
        if (!body.symbol || body.quantity <= 0 || body.price <= 0) {
            throw new HttpException("Paramètres de transaction invalides", HttpStatus.BAD_REQUEST);
        }
        try {
            return await this.portfolioService.sellAsset(req.user.id, body.symbol, Number(body.quantity), Number(body.price));
        } catch (error: any) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }
}
