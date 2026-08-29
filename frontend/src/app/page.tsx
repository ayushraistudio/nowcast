"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { CloudLightning, LayoutDashboard, Map, Bell, Database, Settings, MapPin, Menu, X, Loader2 } from 'lucide-react';
import DashboardView from '../components/DashboardView';

const AlertsView = dynamic(() => import('../components/AlertsView'), {
    loading: () => <div className="flex h-full w-full justify-center items-center"><Loader2 size={32} className="text-indigo-500 animate-spin" /></div>
});

const DataSourcesView = dynamic(() => import('../components/DataSourcesView'), {
    loading: () => <div className="flex h-full w-full justify-center items-center"><Loader2 size={32} className="text-indigo-500 animate-spin" /></div>
});

const SettingsView = dynamic(() => import('../components/SettingsView'), {
    loading: () => <div className="flex h-full w-full justify-center items-center"><Loader2 size={32} className="text-indigo-500 animate-spin" /></div>
});

const MapComponent = dynamic(() => import('../components/MapComponent'), { 
    ssr: false,
    loading: () => <div className="h-full w-full min-h-[300px] bg-slate-800 animate-pulse rounded-xl"></div>
});

// Auto-switch URL based on environment (Vercel Live vs Localhost)
const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://rod-which-midwest-mate.trycloudflare.com'
    : 'http://127.0.0.1:8000';

export default function Home() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const [location, setLocation] = useState({ name: 'Ghaziabad, UP', lat: 28.66, lon: 77.43 });
    const [riskData, setRiskData] = useState<any>(null);
    const [trendData, setTrendData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Global States for Settings
    const [isLightMode, setIsLightMode] = useState(false);
    const [isRadarOn, setIsRadarOn] = useState(false);

    const fetchRiskData = async () => {
        try {
            setLoading(true); 
            setError(null);
            
            const response = await fetch(`${API_BASE_URL}/api/realtime-risk?lat=${location.lat}&lon=${location.lon}`);
            if (!response.ok) throw new Error('API Sync Failed');
            const data = await response.json();
            setRiskData(data);

            const historyResponse = await fetch(`${API_BASE_URL}/api/history?lat=${location.lat}&lon=${location.lon}`);
            if (historyResponse.ok) {
                const hData = await historyResponse.json();
                setTrendData(hData);
            }
        } catch (err: any) {
            setError(err.message || 'System fault');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRiskData();
        const interval = setInterval(fetchRiskData, 900000); 
        return () => clearInterval(interval);
    }, [location]);

    // Fetch initial settings
    useEffect(() => {
        fetch(`${API_BASE_URL}/api/settings`)
            .then(res => res.json())
            .then(data => setIsRadarOn(data.radar_sync_enabled))
            .catch(console.error);
    }, []);

    const toggleRadar = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/settings/radar/toggle`, { method: 'POST' });
            const data = await res.json();
            setIsRadarOn(data.radar_sync_enabled);
        } catch (err) {
            console.error("Failed to toggle radar", err);
        }
    };

    const handleLocationToggle = () => {
        if (location.name.includes('Ghaziabad')) {
            setLocation({ name: 'Patna, Bihar', lat: 25.59, lon: 85.13 });
        } else {
            setLocation({ name: 'Ghaziabad, UP', lat: 28.66, lon: 77.43 });
        }
    };

    // Smooth Theme Transitions
    const bgApp = isLightMode ? "bg-slate-50 text-slate-800" : "bg-[#0B1120] text-slate-300";
    const bgSidebar = isLightMode ? "bg-white border-slate-200" : "bg-[#0B1120] border-slate-800";
    const bgHeader = isLightMode ? "bg-white/80 border-slate-200" : "bg-[#0B1120]/80 border-slate-800";
    const textMain = isLightMode ? "text-slate-900" : "text-white";
    const textSub = isLightMode ? "text-slate-500" : "text-slate-400";
    const btnActive = "bg-indigo-600/20 text-indigo-600 font-bold border border-indigo-500/30";
    const btnInactive = isLightMode ? "text-slate-600 hover:bg-slate-100" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800";

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex h-full w-full flex-col justify-center items-center">
                    <Loader2 size={48} className="text-indigo-500 animate-spin mb-4" />
                    <p className="text-indigo-400 font-medium animate-pulse text-sm md:text-base">
                        Acquiring telemetry for {location.name}...
                    </p>
                </div>
            );
        }
        if (error) {
            return <div className="text-red-500 p-6 border border-red-900 bg-red-950/20 rounded-xl text-sm md:text-base">Error: {error} <button onClick={fetchRiskData} className="ml-4 underline">Retry</button></div>;
        }
        
        switch (activeTab) {
            case 'dashboard': return <DashboardView riskData={riskData} trendData={trendData} isLightMode={isLightMode} />;
            case 'map':
            case 'radar':
            case 'satellite': 
                return (
                    <div className={`w-full h-full border rounded-xl overflow-hidden flex flex-col ${isLightMode ? 'bg-white border-slate-200' : 'bg-[#111827] border-slate-800'}`}>
                        <div className={`p-4 border-b ${isLightMode ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-[#1e293b]/50'}`}>
                            <h2 className={`text-sm font-bold ${textMain} uppercase tracking-widest flex items-center gap-2`}><Map size={18} className="text-indigo-400"/> Full Screen Nowcast Map</h2>
                        </div>
                        <div className="flex-grow">
                            <MapComponent riskData={riskData} isLightMode={isLightMode} />
                        </div>
                    </div>
                );
            case 'alerts': return <AlertsView riskData={riskData} location={location} isLightMode={isLightMode} />;
            case 'data': return <DataSourcesView riskData={riskData} isLightMode={isLightMode} />;
            case 'settings': return <SettingsView isLightMode={isLightMode} setIsLightMode={setIsLightMode} isRadarOn={isRadarOn} toggleRadar={toggleRadar} />;
            default: return <div className={`p-10 text-center ${textSub} text-sm md:text-base`}>Module configuration pending...</div>;
        }
    };

    return (
        <div className={`h-screen font-sans flex flex-col md:flex-row overflow-hidden transition-colors duration-300 ${bgApp}`}>
            
            <div className={`md:hidden flex items-center justify-between p-4 border-b z-20 shrink-0 ${bgSidebar}`}>
                <div className="flex items-center gap-2">
                    <CloudLightning className="text-yellow-400" size={24} />
                    <h1 className={`text-base font-black ${textMain} leading-tight`}>NOWCAST <span className="text-indigo-400">AI</span></h1>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1">
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            <aside className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-64 border-r absolute md:relative z-50 h-[calc(100vh-65px)] md:h-screen top-[65px] md:top-0 left-0 transition-colors duration-300 ${bgSidebar}`}>
                <div className={`hidden md:flex p-5 border-b items-center gap-3 shrink-0 ${isLightMode ? 'border-slate-200' : 'border-slate-800'}`}>
                    <CloudLightning className="text-yellow-400" size={28} />
                    <div>
                        <h1 className={`text-lg font-black ${textMain} leading-tight tracking-wide`}>NOWCAST <span className="text-indigo-400">AI</span></h1>
                        <p className={`text-[9px] ${textSub} uppercase tracking-widest`}>Thunderstorm & Lightning</p>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-4 space-y-6 scrollbar-hide">
                    <div>
                        <p className={`text-[10px] font-bold ${textSub} uppercase tracking-wider mb-2 px-3`}>Overview</p>
                        <nav className="space-y-1">
                            <button onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-lg text-sm transition-colors ${activeTab === 'dashboard' ? btnActive : btnInactive}`}>
                                <LayoutDashboard size={18} /> Live Dashboard
                            </button>
                            <button onClick={() => { setActiveTab('map'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-lg text-sm transition-colors ${['map', 'radar', 'satellite'].includes(activeTab) ? btnActive : btnInactive}`}>
                                <Map size={18} /> Nowcast Map
                            </button>
                            <button onClick={() => { setActiveTab('alerts'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-lg text-sm transition-colors ${activeTab === 'alerts' ? btnActive : btnInactive}`}>
                                <Bell size={18} /> Alerts & Notifications
                            </button>
                            <button onClick={() => { setActiveTab('data'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-lg text-sm transition-colors ${activeTab === 'data' ? btnActive : btnInactive}`}>
                                <Database size={18} /> Data Sources
                            </button>
                            <button onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-lg text-sm transition-colors ${activeTab === 'settings' ? btnActive : btnInactive}`}>
                                <Settings size={18} /> Settings
                            </button>
                        </nav>
                    </div>

                    <div>
                        <p className={`text-[10px] font-bold ${textSub} uppercase tracking-wider mb-2 px-3`}>Data Layers</p>
                        <div className="space-y-3 md:space-y-2 px-3">
                            {['Radar Data', 'Satellite Imagery', 'Lightning Data', 'Weather Model', 'Risk Zones'].map((layer, i) => (
                                <label key={i} className={`flex items-center justify-between text-xs ${textSub} cursor-pointer group`}>
                                    <span className={`flex items-center gap-2 ${isLightMode ? 'group-hover:text-slate-900' : 'group-hover:text-slate-200'}`}><div className={`w-4 flex justify-center ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>❖</div> {layer}</span>
                                    <input type="checkbox" defaultChecked className="accent-indigo-500 w-4 h-4 md:w-3 md:h-3" />
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={`p-4 border-t shrink-0 ${isLightMode ? 'border-slate-200' : 'border-slate-800'}`}>
                    <div className={`rounded-xl p-4 border transition-colors duration-300 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#111827] border-slate-800'}`}>
                        <p className={`text-[10px] font-bold ${textSub} uppercase tracking-wider mb-2`}>Location</p>
                        <div className="flex items-start gap-2 mb-2">
                            <MapPin size={18} className="text-red-500 shrink-0" />
                            <div>
                                <p className={`text-sm font-bold ${textMain} leading-none`}>{location.name}</p>
                                <p className={`text-[10px] md:text-xs ${textSub} mt-1`}>Live Backend Feed</p>
                            </div>
                        </div>
                        <p className={`text-[10px] ${textSub} mb-3 font-mono border-b pb-2 ${isLightMode ? 'border-slate-200' : 'border-slate-800'}`}>{location.lat}° N, {location.lon}° E</p>
                        
                        <button 
                            onClick={handleLocationToggle}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 rounded-lg font-medium transition-colors"
                        >
                            Change Location
                        </button>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-[calc(100vh-65px)] md:h-screen overflow-hidden relative z-10">
                <header className={`h-14 md:h-16 border-b flex items-center justify-between px-4 md:px-6 backdrop-blur-md shrink-0 transition-colors duration-300 ${bgHeader}`}>
                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="flex items-center gap-1 md:gap-2 bg-green-500/10 text-green-500 border border-green-500/20 px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold">
                            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse"></span> LIVE
                        </div>
                        <p className={`text-[10px] md:text-xs ${textSub} hidden sm:block`}>Last Updated: {riskData?.prediction_details?.last_updated || 'Syncing...'}</p>
                    </div>
                    
                    <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide snap-x">
                        {['Dashboard', 'Radar', 'Satellite', 'Lightning', 'Alerts'].map((item) => (
                            <button 
                                key={item}
                                onClick={() => setActiveTab(item.toLowerCase())}
                                className={`px-3 py-1.5 text-[10px] md:text-xs font-medium rounded-md transition-colors whitespace-nowrap snap-start ${activeTab === item.toLowerCase() ? 'bg-indigo-600 text-white' : btnInactive}`}
                            >
                                {item}
                            </button>
                        ))}
                    </nav>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
                    {renderContent()}
                </div>
            </main>
            
        </div>
    );
}
