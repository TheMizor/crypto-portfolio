// src/components/CryptoChart.js
'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function CryptoChart({ cryptoName }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [color, setColor] = useState('#10b981'); // Vert par défaut

  useEffect(() => {
    const fetchHistory = async () => {
      if (!cryptoName) return;
      
      try {
        // On utilise l'API gratuite CoinGecko pour l'historique (slug = nom en minuscule ex: "bitcoin")
        // Note : Parfois le slug CMC diffère du slug CoinGecko, mais ça marche pour 95% des cas majeurs.
        const slug = cryptoName.toLowerCase().replace(/\s+/g, '-'); 
        
        const res = await axios.get(`https://api.coingecko.com/api/v3/coins/${slug}/market_chart`, {
          params: {
            vs_currency: 'usd',
            days: '7', // 7 derniers jours
            interval: 'daily'
          }
        });

        const prices = res.data.prices.map(point => ({
          date: new Date(point[0]).toLocaleDateString(undefined, { weekday: 'short' }),
          price: point[1]
        }));

        setChartData(prices);

        // Si le prix de fin est plus bas que le prix de début = Rouge, sinon Vert
        if (prices.length > 0) {
          const firstPrice = prices[0].price;
          const lastPrice = prices[prices.length - 1].price;
          setColor(lastPrice >= firstPrice ? '#10b981' : '#ef4444');
        }

      } catch (err) {
        console.error("Erreur Graphique:", err);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [cryptoName]);

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-500">Chargement du graphique...</div>;
  if (chartData.length === 0) return <div className="h-64 flex items-center justify-center text-slate-500">Graphique indisponible</div>;

  return (
    <div className="h-72 w-full mt-6">
      <h3 className="text-slate-400 text-sm mb-4">Tendance 7 Jours</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
            formatter={(value) => [`$${value.toFixed(2)}`, 'Prix']}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke={color} 
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}