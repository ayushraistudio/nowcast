"use client";

import { useState } from 'react';
import { Settings, Moon, Sun, Database, CheckCircle } from 'lucide-react';

export default function SettingsView({ isLightMode, setIsLightMode, isRadarOn, toggleRadar }: any) {
    const [toast, setToast] = useState({ show: false, msg: "" });

    const bgMain = isLightMode ? "bg-white border-slate-200" : "bg-[#111827] border-slate-800";
    const textMain = isLightMode ? "text-slate-900" : "text-white";
    const textSub = isLightMode ? "text-slate-500" : "text-slate-400";
    const boxInner = isLightMode ? "bg-slate-50 border-slate-200" : "bg-slate-800/30 border-slate-700/50";

    const handleRadarToggle = () => {
        toggleRadar();
        setToast({ show: true, msg: `Automated Radar Sync is now ${!isRadarOn ? 'ENABLED' : 'DISABLED'}` });
        setTimeout(() => setToast({ show: false, msg: "" }), 3000);
    };

    return (
        <div className="w-full h-full flex flex-col gap-6 relative">
            
            {/* --- Professional UI Toast Notification --- */}
            <div className={`fixed top-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl z-[999] transition-all duration-500 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'} ${isLightMode ? 'bg-white border border-emerald-200' : 'bg-[#1e293b] border border-emerald-900'}`}>
                <CheckCircle className="text-emerald-500 shrink-0" size={20} />
                <div>
                    <p className={`text-xs font-bold uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>System Update</p>
                    <p className={`text-sm font-bold ${textMain}`}>{toast.msg}</p>
                </div>
            </div>

            <div className={`flex items-center gap-3 border-b ${isLightMode ? 'border-slate-200' : 'border-slate-800'} pb-4`}>
                <Settings className="text-indigo-500" size={24} />
                <h2 className={`text-lg font-black ${textMain} tracking-widest uppercase`}>System Settings</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`border ${bgMain} p-6 rounded-xl flex flex-col justify-between transition-colors duration-300`}>
                    <div>
                        <h3 className={`text-sm font-bold ${textSub} uppercase mb-4 flex items-center gap-2`}>
                            {isLightMode ? <Sun size={16} /> : <Moon size={16} />} Display Theme
                        </h3>
                        <div className={`flex items-center justify-between p-4 ${boxInner} rounded-lg border transition-colors duration-300`}>
                            <div>
                                <p className={`${textMain} font-medium text-sm`}>Command Center UI</p>
                                <p className="text-xs text-slate-500 mt-1">Switch between Dark and Light mode.</p>
                            </div>
                            <div onClick={() => setIsLightMode(!isLightMode)} className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${isLightMode ? 'bg-indigo-500' : 'bg-slate-600'}`}>
                                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-300 ${isLightMode ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`border ${bgMain} p-6 rounded-xl flex flex-col justify-between transition-colors duration-300`}>
                    <div>
                        <h3 className={`text-sm font-bold ${textSub} uppercase mb-4 flex items-center gap-2`}>
                            <Database size={16} /> Data Engine
                        </h3>
                        <div className={`flex items-center justify-between p-4 ${boxInner} rounded-lg border transition-colors duration-300`}>
                            <div>
                                <p className={`${textMain} font-medium text-sm`}>Automated Radar Sync</p>
                                <p className="text-xs text-slate-500 mt-1">Fetch new radar tiles every 15 minutes.</p>
                            </div>
                            <div onClick={handleRadarToggle} className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${isRadarOn ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-300 ${isRadarOn ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}