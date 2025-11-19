import axios from 'axios';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTC';

  try {
    // 1. Récupérer les infos (Description, URLs, Logo)
    const infoResponse = await axios.get(`${process.env.CMC_BASE_URL}/cryptocurrency/info`, {
      headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY },
      params: { symbol: symbol }
    });

    // 2. Récupérer le prix (Quotes)
    const quoteResponse = await axios.get(`${process.env.CMC_BASE_URL}/cryptocurrency/quotes/latest`, {
      headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY },
      params: { symbol: symbol }
    });

    const key = Object.keys(infoResponse.data.data)[0]; // ex: 'BTC'
    
    const data = {
      info: infoResponse.data.data[key],
      quote: quoteResponse.data.data[key]
    };

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur API CMC' }, { status: 500 });
  }
}