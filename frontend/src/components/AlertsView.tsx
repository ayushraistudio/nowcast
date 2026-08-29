"use client";

import { AlertTriangle, ShieldAlert, Clock, MapPin, Activity, CheckCircle } from 'lucide-react';

export default function AlertsView({ riskData, location, isLightMode = false }: { riskData: any, location: any, isLightMode?: boolean }) {
    if (!riskData) return null;

    const { prediction_details } = riskData;

    const alertConfig = {
        'Severe': { bg: 'bg-red-900/40', border: 'border-red-500', text: 'text-red-500', icon: ShieldAlert, title: 'CRITICAL THREAT DETECTED', action: 'Issue Evacuation Warning', level: 'Level 4 - Severe' },
        'High': { bg: 'bg-orange-900/40', border: 'border-orange-500', text: 'text-orange-500', icon: AlertTriangle, title: 'HIGH RISK ALERT', action: 'Prepare Ground Teams', level: 'Level 3 - High' },
        'Moderate': { bg: 'bg-yellow-900/40', border: 'border-yellow-500', text: 'text-yellow-500', icon: Activity, title: 'MODERATE WEATHER ACTIVITY', action: 'Monitor Radar Closely', level: 'Level 2 - Moderate' },
        'Low': { bg: 'bg-[#064E3B]/40', border: 'border-emerald-500', text: 'text-emerald-500', icon: CheckCircle, title: 'SYSTEM CLEAR - NO THREAT', action: 'Routine Operations', level: 'Level 1 - Safe' },
    };
    
    const activeAlert = alertConfig[prediction_details.risk_level as keyof typeof alertConfig] || alertConfig['Low'];
    const AlertIcon = activeAlert.icon;

    const bgCard = isLightMode ? "bg-white border-slate-200 shadow-sm" : "bg-[#111827] border-slate-800";
    const bgHeader = isLightMode ? "bg-slate-50" : "bg-[#1e293b]/50";
    const textMain = isLightMode ? "text-slate-900" : "text-white";
    const textSub = isLightMode ? "text-slate-500" : "text-slate-400";
    const borderClass = isLightMode ? "border-slate-200" : "border-slate-800";
    const hoverClass = isLightMode ? "hover:bg-slate-50" : "hover:bg-slate-800/20";

    return (
        <div className="w-full h-full flex flex-col gap-6 transition-colors duration-300">
            <div className={`flex items-center gap-3 border-b ${borderClass} pb-4`}>
                <ShieldAlert className="text-indigo-400" size={24} />
                <h2 className={`text-lg font-black tracking-widest uppercase ${textMain}`}>Threat Intelligence Hub</h2>
            </div>

            {/* Main Threat Banner */}
            <div className={`w-full ${activeAlert.bg} border-l-4 ${activeAlert.border} p-6 rounded-r-xl flex items-center justify-between`}>
                <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-full ${isLightMode ? 'bg-black/5' : 'bg-black/30'} ${activeAlert.text}`}>
                        <AlertIcon size={40} />
                    </div>
                    <div>
                        <p className={`text-xs font-bold ${activeAlert.text} uppercase tracking-widest mb-1`}>{activeAlert.level}</p>
                        <h3 className={`text-2xl font-black uppercase tracking-wide ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{activeAlert.title}</h3>
                        <p className={`text-sm mt-2 flex items-center gap-2 ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}><MapPin size={16} /> Target Region: {location.name}</p>
                    </div>
                </div>
                <div className="hidden md:block text-right">
                    <p className={`text-xs uppercase tracking-widest mb-1 ${textSub}`}>Recommended Action</p>
                    <p className={`text-sm font-bold ${activeAlert.text} ${isLightMode ? 'bg-black/5' : 'bg-black/20'} px-4 py-2 rounded-lg`}>{activeAlert.action}</p>
                </div>
            </div>

            {/* Threat Logs / History Table */}
            <div className={`${bgCard} border rounded-xl overflow-hidden flex-grow transition-colors duration-300`}>
                <div className={`p-4 border-b ${borderClass} ${bgHeader}`}>
                    <h4 className={`text-xs font-bold ${textSub} uppercase tracking-wider`}>System Alert Logs</h4>
                </div>
                <div className="overflow-x-auto">
                    <table className={`w-full text-left text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                        <thead className={`${isLightMode ? 'bg-slate-50' : 'bg-[#111827]'} text-xs uppercase ${textSub} border-b ${borderClass}`}>
                            <tr>
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Risk %</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className={`border-b ${isLightMode ? 'border-slate-200' : 'border-slate-800/50'} ${hoverClass} transition-colors`}>
                                <td className="px-6 py-4 flex items-center gap-2 font-mono text-xs"><Clock size={14} className="text-indigo-400"/> {prediction_details.last_updated}</td>
                                <td className={`px-6 py-4 font-medium ${textMain}`}>Live AI Evaluation</td>
                                <td className="px-6 py-4">{location.lat}, {location.lon}</td>
                                <td className="px-6 py-4 font-mono">{prediction_details.thunderstorm_probability}%</td>
                                <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[10px] font-bold ${activeAlert.text} ${isLightMode ? 'bg-black/5 border-slate-200' : 'bg-black/30 border-slate-800'} border`}>{activeAlert.level.split(' - ')[1]}</span></td>
                            </tr>
                            <tr className={`border-b ${isLightMode ? 'border-slate-200' : 'border-slate-800/50'} opacity-60`}>
                                <td className="px-6 py-4 flex items-center gap-2 font-mono text-xs"><Clock size={14} /> T-15 Mins</td>
                                <td className="px-6 py-4">Background Radar Sync</td>
                                <td className="px-6 py-4">{location.lat}, {location.lon}</td>
                                <td className="px-6 py-4 font-mono">--</td>
                                <td className="px-6 py-4"><span className="text-emerald-500 font-bold text-[10px] uppercase">Processed</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}