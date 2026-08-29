"use client";

import { Activity, Database, Zap, CloudRain, Wifi, Server } from 'lucide-react';

export default function DataSourcesView({ riskData, isLightMode = false }: { riskData: any, isLightMode?: boolean }) {
    const sources = [
        { name: 'IMD Telemetry', type: 'Atmospheric Data', icon: CloudRain, color: 'text-sky-400', latency: '42ms', status: 'Optimal' },
        { name: 'RainViewer API', type: 'Radar Imagery', icon: Activity, color: 'text-blue-500', latency: '115ms', status: 'Optimal' },
        { name: 'Earth Networks', type: 'Lightning Data', icon: Zap, color: 'text-yellow-400', latency: '88ms', status: 'Optimal' },
        { name: 'Local SQLite DB', type: 'Prediction History', icon: Database, color: 'text-slate-400', latency: '2ms', status: 'Optimal' },
    ];

    const bgCard = isLightMode ? "bg-white border-slate-200 shadow-sm" : "bg-[#111827] border-slate-800";
    const textMain = isLightMode ? "text-slate-900" : "text-white";
    const textSub = isLightMode ? "text-slate-500" : "text-slate-400";
    const borderClass = isLightMode ? "border-slate-200" : "border-slate-800";

    return (
        <div className="w-full h-full flex flex-col gap-6 transition-colors duration-300">
            <div className={`flex items-center gap-3 border-b ${borderClass} pb-4`}>
                <Server className="text-indigo-400" size={24} />
                <h2 className={`text-lg font-black tracking-widest uppercase ${textMain}`}>Data Sources & APIs</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {sources.map((s, i) => (
                    <div key={i} className={`${bgCard} border p-5 rounded-xl flex flex-col justify-between transition-colors duration-300`}>
                        <div className="flex justify-between items-start mb-4">
                            <s.icon size={24} className={s.name === 'Local SQLite DB' && isLightMode ? 'text-slate-500' : s.color} />
                            <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                                <Wifi size={12} /> {s.status}
                            </div>
                        </div>
                        <div>
                            <h3 className={`font-bold mb-1 ${textMain}`}>{s.name}</h3>
                            <p className={`text-xs uppercase ${textSub}`}>{s.type}</p>
                        </div>
                        <div className={`mt-4 pt-4 border-t ${borderClass} flex justify-between items-center text-xs`}>
                            <span className={textSub}>Latency</span>
                            <span className="font-mono text-indigo-400">{s.latency}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}