import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    // On utilise l'API publique de CryptoCompare (Gratuite et sans blocage)
    const url = 'https://min-api.cryptocompare.com/data/v2/news/?lang=EN';

    const response = await axios.get(url);
    
    // Chez CryptoCompare, les données sont dans response.data.Data
    const rawData = response.data.Data;

    const articles = rawData.map(item => ({
      title: item.title,
      link: item.url,
      // On limite la description à 150 caractères pour l'affichage
      description: item.body.length > 150 ? item.body.substring(0, 150) + '...' : item.body,
      // Le format de date est un Timestamp Unix, on le convertit
      pubDate: new Date(item.published_on * 1000).toLocaleDateString('fr-FR', { 
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
      }),
      source: item.source_info.name,
      image: item.imageurl // Ils fournissent même une image !
    }));

    return NextResponse.json(articles.slice(0, 15));

  } catch (error) {
    console.error("Erreur API News:", error.message);
    return NextResponse.json([]); 
  }
}