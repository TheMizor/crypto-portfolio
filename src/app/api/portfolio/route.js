import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import axios from 'axios';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Récupérer tes actifs en base de données
    const assets = await prisma.asset.findMany({
      orderBy: { createdAt: 'desc' }
    });

    if (assets.length === 0) return NextResponse.json([]);

    // 2. Récupérer les prix actuels via CoinMarketCap (pour tous les actifs d'un coup)
    const symbols = [...new Set(assets.map(a => a.symbol))].join(',');
    
    let prices = {};
    try {
      const response = await axios.get(`${process.env.CMC_BASE_URL}/cryptocurrency/quotes/latest`, {
        headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY },
        params: { symbol: symbols }
      });
      
      // On simplifie la structure pour accéder facilement au prix : prices['BTC'] = 90000
      Object.values(response.data.data).forEach(coin => {
        prices[coin.symbol] = coin.quote.USD.price;
      });
    } catch (err) {
      console.error("Erreur CMC Portfolio:", err.message);
      // Si l'API plante, on continue sans prix actuels (valeur 0)
    }

    // 3. Enrichir les données avec le calcul P&L
    const enrichedAssets = assets.map(asset => {
      const currentPrice = prices[asset.symbol] || 0; // 0 si prix non trouvé
      const currentValue = asset.quantity * currentPrice;
      const investedValue = asset.quantity * asset.buyPrice;
      const pnl = currentValue - investedValue;
      const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;

      return {
        ...asset,
        currentPrice,
        currentValue,
        pnl,
        pnlPercent
      };
    });

    return NextResponse.json(enrichedAssets);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Le POST et DELETE ne changent pas, tu peux garder ceux d'avant ou les remettre ici :
export async function POST(request) {
  try {
    const body = await request.json();
    const newAsset = await prisma.asset.create({
      data: {
        symbol: body.symbol,
        name: body.name,
        quantity: parseFloat(body.quantity),
        buyPrice: parseFloat(body.buyPrice),
      },
    });
    return NextResponse.json(newAsset);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur ajout' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    await prisma.asset.delete({ where: { id: searchParams.get('id') } });
    return NextResponse.json({ message: 'Supprimé' });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 });
  }
}