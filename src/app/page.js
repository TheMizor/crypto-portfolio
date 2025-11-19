'use client';
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import CryptoChart from '../components/CryptoChart';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

export default function Home() {
  // --- ÉTATS ---
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | market | news
  const [search, setSearch] = useState('');
  const [cryptoData, setCryptoData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [assets, setAssets] = useState([]);
  const [myAlerts, setMyAlerts] = useState([]);
  const [news, setNews] = useState([]);
  
  // Formulaires
  const [newAsset, setNewAsset] = useState({ quantity: '', buyPrice: '' });
  const [alertForm, setAlertForm] = useState({ price: '', email: '' });
  const [statusMsg, setStatusMsg] = useState('');

  // --- CALCULS GLOBAUX (MEMO) ---
  const portfolioStats = useMemo(() => {
    let totalInvested = 0;
    let totalValue = 0;
    
    assets.forEach(a => {
      totalInvested += (a.quantity * a.buyPrice);
      totalValue += a.currentValue || 0;
    });

    const totalPnl = totalValue - totalInvested;
    const totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

    return { totalInvested, totalValue, totalPnl, totalPnlPercent };
  }, [assets]);

  const pieData = useMemo(() => {
    const dataMap = {};
    assets.forEach(asset => {
      const val = asset.currentValue || (asset.quantity * asset.buyPrice);
      dataMap[asset.symbol] = (dataMap[asset.symbol] || 0) + val;
    });
    return Object.keys(dataMap).map(k => ({ name: k, value: dataMap[k] }));
  }, [assets]);

  // --- CHARGEMENT ---
  useEffect(() => { 
    fetchPortfolio(); 
    fetchAlerts(); 
    fetchNews(); 
  }, []);

  // --- API CALLS ---
  const fetchPortfolio = async () => {
    try { const res = await axios.get('/api/portfolio'); setAssets(res.data); } catch(e) { console.error(e); }
  };

  const fetchAlerts = async () => {
    try { const res = await axios.get('/api/alert'); setMyAlerts(res.data); } catch(e){}
  };

  const fetchNews = async () => {
    try { 
      const res = await axios.get('/api/news'); 
      setNews(res.data); 
    } catch(e) { 
      console.error("Erreur news", e);
      setNews([]);
    }
  };

  const searchCrypto = async () => {
    if (!search) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/crypto?symbol=${search.toUpperCase()}`);
      setCryptoData(res.data);
    } catch (err) { alert("Crypto introuvable"); }
    setLoading(false);
  };

  // --- HANDLERS ---
  const handleAddAsset = async () => {
    if(!cryptoData) return;
    await axios.post('/api/portfolio', { ...newAsset, symbol: cryptoData.info.symbol, name: cryptoData.info.name });
    setNewAsset({ quantity: '', buyPrice: '' });
    fetchPortfolio();
    alert("Achat ajouté !");
  };

  const handleCreateAlert = async () => {
    if(!cryptoData) return;
    setStatusMsg('Envoi...');
    try {
      await axios.post('/api/alert', {
        symbol: cryptoData.info.symbol, targetPrice: alertForm.price, email: alertForm.email, currentPrice: cryptoData.quote.quote.USD.price
      });
      setStatusMsg('✅ Alerte créée');
      fetchAlerts();
    } catch (e) { setStatusMsg('Erreur'); }
  };

  const handleDelete = async (endpoint, id) => {
    if(!confirm('Supprimer ?')) return;
    await axios.delete(`/api/${endpoint}?id=${id}`);
    endpoint === 'portfolio' ? fetchPortfolio() : fetchAlerts();
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6 font-sans">
      
      <header className="max-w-5xl mx-auto mb-8 text-center">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">My Crypto Manager</h1>
      </header>

      {/* NAVIGATION */}
      <div className="flex justify-center gap-4 mb-8 overflow-x-auto py-2">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`px-6 py-2 rounded-full font-medium transition whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          💼 Mon Portfolio
        </button>
        <button 
          onClick={() => setActiveTab('market')}
          className={`px-6 py-2 rounded-full font-medium transition whitespace-nowrap ${activeTab === 'market' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          📈 Marché
        </button>
        <button 
          onClick={() => setActiveTab('news')}
          className={`px-6 py-2 rounded-full font-medium transition whitespace-nowrap ${activeTab === 'news' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          📰 Actualités
        </button>
      </div>

      <div className="max-w-6xl mx-auto">

        {/* --- DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            {/* KPI Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl">
                <p className="text-slate-400 text-xs uppercase font-bold">Valeur Totale</p>
                <p className="text-3xl font-bold text-white mt-2">${portfolioStats.totalValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                <p className="text-xs text-slate-500 mt-1">Investi: ${portfolioStats.totalInvested.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
              </div>
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl">
                <p className="text-slate-400 text-xs uppercase font-bold">P&L Global</p>
                <p className={`text-3xl font-bold mt-2 ${portfolioStats.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {portfolioStats.totalPnl >= 0 ? '+' : ''}{portfolioStats.totalPnl.toLocaleString(undefined, {maximumFractionDigits: 0})}$
                </p>
                <p className={`text-xs mt-1 ${portfolioStats.totalPnlPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {portfolioStats.totalPnlPercent.toFixed(2)}%
                </p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 shadow-xl flex items-center justify-center min-h-[120px]">
                 <div className="w-full h-[100px] min-h-[100px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={45} dataKey="value">
                          {pieData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none"/>)}
                        </Pie>
                        <Tooltip contentStyle={{backgroundColor:'#1e293b', border:'none', borderRadius: '8px'}}/>
                      </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="ml-4">
                    <p className="text-sm font-bold text-white">{assets.length} Actifs</p>
                    <p className="text-xs text-slate-400">{myAlerts.length} Alertes</p>
                 </div>
              </div>
            </div>

            {/* Asset Table */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-700"><h2 className="font-bold">Détail des actifs</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Asset</th>
                      <th className="px-4 py-3">Prix Achat</th>
                      <th className="px-4 py-3">Prix Actuel</th>
                      <th className="px-4 py-3">Valeur</th>
                      <th className="px-4 py-3">P&L ($)</th>
                      <th className="px-4 py-3">P&L (%)</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {assets.map(a => (
                      <tr key={a.id} className="hover:bg-slate-700/30 transition">
                        <td className="px-4 py-3 font-bold flex flex-col">
                          <span>{a.symbol}</span>
                          <span className="text-xs text-slate-500 font-normal">{a.quantity}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">${a.buyPrice.toLocaleString()}</td>
                        <td className="px-4 py-3 text-white">${a.currentPrice?.toLocaleString() ?? '...'}</td>
                        <td className="px-4 py-3 font-bold">${a.currentValue?.toLocaleString() ?? '...'}</td>
                        <td className={`px-4 py-3 font-bold ${a.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {a.pnl > 0 ? '+' : ''}{a.pnl?.toLocaleString(undefined, {maximumFractionDigits: 2})}$
                        </td>
                        <td className={`px-4 py-3`}>
                            <span className={`px-2 py-1 rounded ${a.pnlPercent >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {a.pnlPercent > 0 ? '+' : ''}{a.pnlPercent?.toFixed(2)}%
                            </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDelete('portfolio', a.id)} className="text-slate-500 hover:text-red-400 transition">🗑️</button>
                        </td>
                      </tr>
                    ))}
                    {assets.length === 0 && <tr><td colSpan="7" className="text-center py-8 text-slate-500">Aucun actif.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Alerts List */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-xl">
               <h2 className="font-bold mb-4">Alertes actives</h2>
               <div className="grid md:grid-cols-3 gap-4">
                 {myAlerts.map(a => (
                   <div key={a.id} className="bg-slate-900 border border-slate-600 p-3 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="font-bold block">{a.symbol}</span>
                        <span className="text-slate-500 text-xs">Cible: ${a.target}</span>
                        <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${a.direction === 'UP' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                          {a.direction}
                        </span>
                      </div>
                      <button onClick={() => handleDelete('alert', a.id)} className="text-slate-500 hover:text-red-400 transition">✕</button>
                   </div>
                 ))}
                 {myAlerts.length === 0 && <span className="text-slate-500 text-sm">Aucune alerte configurée.</span>}
               </div>
            </div>
          </div>
        )}

        {/* --- MARCHÉ --- */}
        {activeTab === 'market' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex gap-2 max-w-xl mx-auto">
              <input type="text" placeholder="Rechercher (BTC, ETH...)" className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-3 focus:border-blue-500 outline-none transition"
                value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&searchCrypto()}/>
              <button onClick={searchCrypto} className="bg-blue-600 hover:bg-blue-700 px-6 rounded-xl font-bold transition">{loading ? '...' : 'Go'}</button>
            </div>
            
            {cryptoData && (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 p-6 rounded-2xl shadow-xl">
                   <div className="flex items-center gap-4 mb-4">
                      <img src={cryptoData.info.logo} className="w-10 h-10 rounded-full"/>
                      <div>
                        <h2 className="text-2xl font-bold leading-none">{cryptoData.info.name}</h2>
                        <span className="text-emerald-400 text-xl font-mono font-bold">${cryptoData.quote.quote.USD.price.toFixed(2)}</span>
                      </div>
                   </div>
                   <CryptoChart cryptoName={cryptoData.info.name} />
                </div>
                <div className="space-y-4">
                   <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl shadow-xl">
                      <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2">💼 Ajouter Achat</h3>
                      <input type="number" placeholder="Quantité" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 mb-2 text-sm outline-none focus:border-blue-500" value={newAsset.quantity} onChange={e=>setNewAsset({...newAsset, quantity: e.target.value})}/>
                      <input type="number" placeholder="Prix d'achat ($)" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 mb-2 text-sm outline-none focus:border-blue-500" value={newAsset.buyPrice} onChange={e=>setNewAsset({...newAsset, buyPrice: e.target.value})}/>
                      <button onClick={handleAddAsset} className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-bold transition">Ajouter</button>
                   </div>
                   <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl shadow-xl">
                      <h3 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">🔔 Créer Alerte</h3>
                      <input type="email" placeholder="Email" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 mb-2 text-sm outline-none focus:border-emerald-500" value={alertForm.email} onChange={e=>setAlertForm({...alertForm, email: e.target.value})}/>
                      <input type="number" placeholder="Cible ($)" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 mb-2 text-sm outline-none focus:border-emerald-500" value={alertForm.price} onChange={e=>setAlertForm({...alertForm, price: e.target.value})}/>
                      <button onClick={handleCreateAlert} className="w-full bg-emerald-600 hover:bg-emerald-700 py-2 rounded-lg font-bold transition">Créer</button>
                      {statusMsg && <p className="text-center text-xs mt-2 text-slate-400">{statusMsg}</p>}
                   </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- ACTUALITÉS --- */}
        {activeTab === 'news' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-bold mb-6 text-center text-purple-400">Dernières Actualités Crypto</h2>
            
            {news.length === 0 ? (
              <div className="text-center py-12">
                 <p className="text-slate-500">Chargement des actualités...</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {news.map((article, index) => (
                  <a href={article.link} target="_blank" rel="noopener noreferrer" key={index}
                    className="block bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl shadow-xl overflow-hidden hover:shadow-purple-900/20 transition-all duration-300 transform hover:-translate-y-1 group"
                  >
                    {article.image && (
                        <div className="h-40 w-full overflow-hidden">
                            <img src={article.image} alt="news" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-500 group-hover:scale-105"/>
                        </div>
                    )}
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] uppercase font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded">{article.source}</span>
                        <span className="text-[10px] text-slate-500">{article.pubDate}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-snug group-hover:text-purple-400 transition">{article.title}</h3>
                      <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed">{article.description}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}