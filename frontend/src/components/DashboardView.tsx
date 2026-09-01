"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { 
    Thermometer, Droplets, Gauge, Wind, Navigation, CloudRain, 
    Zap, Activity, Database, Server, Layers, PlayCircle, CheckCircle, AlertTriangle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const DynamicMap = dynamic(() => import('./MapComponent'), { 
    ssr: false,
    loading: () => <div className="h-full w-full min-h-[300px] bg-slate-800 animate-pulse rounded-xl"></div>
});

// Generates an offline data URI fake radar image sequence that blends natively
const getMockImage = (step: number) => {
    const cx = 80 + step * 25;
    const cy = 80 + step * 15;
    const r = 40 + step * 12;
    const color = step < 2 ? '#22c55e' : (step < 4 ? '#eab308' : '#ef4444');
    const innerOp = step > 2 ? 0.7 : 0;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><defs><filter id="blur"><feGaussianBlur stdDeviation="25"/></filter></defs><circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" filter="url(#blur)" opacity="0.7"/><circle cx="${cx - 10}" cy="${cy + 10}" r="${r * 0.5}" fill="#dc2626" filter="url(#blur)" opacity="${innerOp}"/></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export default function DashboardView({ riskData, trendData, isLightMode = false, isMockActive = false }: { riskData: any, trendData: any[], isLightMode?: boolean, isMockActive?: boolean }) {
    const [radarTimeline, setRadarTimeline] = useState<{time: string, url: string}[]>([]);
    const [liveTime, setLiveTime] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setLiveTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
        const timer = setInterval(() => {
            setLiveTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!riskData) return;
        
        const fetchRadarTimeline = async () => {
            // Intercept and inject fake progressive radar images if offline mock is active
            if (isMockActive) {
                const fakeFrames = [0, 1, 2, 3, 4].map((step) => {
                    const date = new Date(Date.now() - (4 - step) * 15 * 60000);
                    const timeString = date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                    return { time: timeString, url: getMockImage(step) };
                });
                setRadarTimeline(fakeFrames);
                return;
            }

            try {
                const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
                const data = await res.json();
                const past = data.radar.past.slice(-5);
                
                const lat = riskData.latitude;
                const lon = riskData.longitude;
                const zoom = 6; 

                const n = Math.pow(2, zoom);
                const xTile = Math.floor((lon + 180) / 360 * n);
                const latRad = (lat * Math.PI) / 180;
                const yTile = Math.floor((1.0 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2.0 * n);

                const frames = past.map((frame: any) => {
                    const date = new Date(frame.time * 1000);
                    const timeString = date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                    const tileUrl = `https://tilecache.rainviewer.com/v2/radar/${frame.time}/256/${zoom}/${xTile}/${yTile}/2/1_1.png`;
                    return { time: timeString, url: tileUrl };
                });

                setRadarTimeline(frames);
            } catch (err) {
                console.error("Timeline radar fetch failed", err);
            }
        };

        fetchRadarTimeline();
    }, [riskData, isMockActive]);

    if (!riskData) return null;

    const { current_weather, prediction_details, storm_movement, ai_status } = riskData;
    const speed = storm_movement.speed_kmh;
    let etaMinutes = "Stationary";
    if (speed > 0) {
        const timeHours = 15 / speed;
        etaMinutes = `~ ${Math.round(timeHours * 60)} Minutes`;
    }

    const alertConfig = {
        'Severe': { bg: 'bg-red-900/40', border: 'border-red-900', text: 'text-red-500', icon: AlertTriangle, title: 'Severe Weather Warning', desc: 'Critical risk in your area. Seek shelter immediately.' },
        'High': { bg: 'bg-orange-900/40', border: 'border-orange-900', text: 'text-orange-500', icon: AlertTriangle, title: 'High Risk Alert', desc: 'Strong chances of storm formation. Stay alert.' },
        'Moderate': { bg: 'bg-yellow-900/40', border: 'border-yellow-900', text: 'text-yellow-500', icon: Activity, title: 'Moderate Risk', desc: 'Conditions are favorable for storm development.' },
        'Low': { bg: 'bg-[#064E3B]/40', border: 'border-emerald-900', text: 'text-emerald-500', icon: CheckCircle, title: 'No Severe Alert', desc: 'No severe risk in your area. Stay safe!' },
    };
    const activeAlert = alertConfig[prediction_details.risk_level as keyof typeof alertConfig] || alertConfig['Low'];
    const AlertIcon = activeAlert.icon;
    const sourceStatus = prediction_details.last_updated ? "Live" : "Syncing";

    // Dynamic Light Mode CSS
    const bgCard = isLightMode ? "bg-white border-slate-200 shadow-sm" : "bg-[#111827] border-slate-800";
    const textMain = isLightMode ? "text-slate-900" : "text-white";
    const textSub = isLightMode ? "text-slate-500" : "text-slate-400";
    const textMuted = isLightMode ? "text-slate-600" : "text-slate-300";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pb-10 md:pb-0 transition-colors duration-300">
            
            <div className={`col-span-1 lg:col-span-3 border rounded-xl p-4 md:p-5 flex flex-col justify-between transition-colors duration-300 ${bgCard}`}>
                <h3 className={`text-xs font-bold ${textSub} uppercase tracking-wider mb-2 flex items-center gap-2`}>
                    Current Conditions <Activity size={14} />
                </h3>
                
                <div className="flex-grow flex flex-col items-end justify-center py-4 md:py-2">
                    <div className="flex items-center gap-2">
                        <Activity size={16} className={isLightMode ? 'text-indigo-400' : 'text-slate-600'} />
                        <span className="text-3xl md:text-4xl font-mono font-bold text-indigo-400 tracking-widest drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]">
                            {mounted && liveTime ? liveTime : "00:00:00"}
                        </span>
                    </div>
                    <p className={`text-[9px] ${textSub} uppercase tracking-widest mt-1 pr-1`}>Live Local Time</p>
                </div>
                
                <div className="space-y-3 md:space-y-4">
                    <div className="flex justify-between items-center"><div className={`flex items-center gap-2 md:gap-3 ${textMuted} text-sm md:text-base`}><Thermometer size={16} className="text-red-400" /> Temperature</div><div className={`font-bold ${textMain} text-sm md:text-base`}>{current_weather.temperature_celsius} °C</div></div>
                    <div className="flex justify-between items-center"><div className={`flex items-center gap-2 md:gap-3 ${textMuted} text-sm md:text-base`}><Droplets size={16} className="text-blue-400" /> Humidity</div><div className={`font-bold ${textMain} text-sm md:text-base`}>{current_weather.humidity_percent} %</div></div>
                    <div className="flex justify-between items-center"><div className={`flex items-center gap-2 md:gap-3 ${textMuted} text-sm md:text-base`}><Gauge size={16} className="text-emerald-400" /> Pressure</div><div className={`font-bold ${textMain} text-sm md:text-base`}>{current_weather.pressure_hpa} hPa</div></div>
                    <div className="flex justify-between items-center"><div className={`flex items-center gap-2 md:gap-3 ${textMuted} text-sm md:text-base`}><Wind size={16} className="text-sky-400" /> Wind Speed</div><div className={`font-bold ${textMain} text-sm md:text-base`}>{storm_movement.speed_kmh} km/h</div></div>
                    <div className="flex justify-between items-center"><div className={`flex items-center gap-2 md:gap-3 ${textMuted} text-sm md:text-base`}><Navigation size={16} className="text-indigo-400" /> Wind Direction</div><div className={`font-bold ${textMain} text-sm md:text-base`}>{storm_movement.direction.split(' ')[0]}</div></div>
                    <div className="flex justify-between items-center"><div className={`flex items-center gap-2 md:gap-3 ${textMuted} text-sm md:text-base`}><CloudRain size={16} className="text-slate-400" /> Rainfall</div><div className={`font-bold ${textMain} text-sm md:text-base`}>0 mm</div></div>
                </div>
            </div>

            <div className={`col-span-1 lg:col-span-4 border rounded-xl p-4 md:p-5 transition-colors duration-300 ${bgCard}`}>
                <h3 className={`text-xs font-bold ${textSub} uppercase tracking-wider mb-4 md:mb-6 flex items-center gap-2`}>
                    Nowcast Prediction <Zap size={14} />
                </h3>
                
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className={`flex items-center gap-2 ${textMuted} mb-1 text-xs md:text-sm`}><CloudRain size={16} className={isLightMode ? 'text-slate-500' : 'text-slate-100'} /> Thunderstorm Probability</div>
                        <div className="text-3xl md:text-4xl font-bold text-orange-500">{prediction_details.thunderstorm_probability}%</div>
                        <div className={`w-full ${isLightMode ? 'bg-slate-200' : 'bg-slate-800'} h-2 rounded-full mt-2 md:mt-3 overflow-hidden`}><div className="bg-orange-500 h-full rounded-full" style={{ width: `${prediction_details.thunderstorm_probability}%` }}></div></div>
                        <div className={`flex justify-between text-[10px] ${textSub} mt-1`}><span>0%</span><span>100%</span></div>
                    </div>
                    <div className="text-right">
                        <p className={`text-[10px] ${textSub} uppercase mb-1`}>Risk Level</p>
                        <div className={`border ${activeAlert.border} ${isLightMode ? 'bg-black/5' : 'bg-black/20'} ${activeAlert.text} px-2 py-1 md:px-3 rounded-md font-bold flex items-center gap-1 md:gap-2 text-xs md:text-base`}>
                            {prediction_details.risk_level.toUpperCase()} <AlertIcon size={14} />
                        </div>
                    </div>
                </div>

                <div className={`flex flex-col sm:flex-row justify-between items-start pt-4 border-t ${isLightMode ? 'border-slate-200' : 'border-slate-800'} gap-4 sm:gap-0`}>
                    <div className={`w-full sm:w-1/2 sm:pr-4 sm:border-r ${isLightMode ? 'border-slate-200' : 'border-slate-800'}`}>
                        <div className={`flex items-center gap-2 ${textMuted} mb-1 text-xs md:text-sm`}><Zap size={16} className="text-yellow-400 fill-yellow-400" /> Lightning Probability</div>
                        <div className="text-2xl md:text-3xl font-bold text-yellow-400">{prediction_details.lightning_probability}%</div>
                        <div className={`w-full ${isLightMode ? 'bg-slate-200' : 'bg-slate-800'} h-2 rounded-full mt-2 md:mt-3 overflow-hidden`}><div className="bg-yellow-400 h-full rounded-full" style={{ width: `${prediction_details.lightning_probability}%` }}></div></div>
                        <div className={`flex justify-between text-[10px] ${textSub} mt-1`}><span>0%</span><span>100%</span></div>
                    </div>
                    <div className="w-full sm:w-1/2 sm:pl-4 flex flex-row sm:flex-col justify-between sm:gap-4">
                        <div>
                            <p className={`text-[10px] ${textSub} uppercase`}>Confidence</p>
                            <p className={`text-lg md:text-xl font-bold ${textMain}`}>{prediction_details.confidence_percent}%</p>
                        </div>
                        <div>
                            <p className={`text-[10px] ${textSub} uppercase`}>Forecast Window</p>
                            <p className={`text-xs md:text-sm font-bold ${textMain}`}>{prediction_details.forecast_window}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`col-span-1 lg:col-span-5 border rounded-xl overflow-hidden flex flex-col min-h-[300px] transition-colors duration-300 ${bgCard}`}>
                <div className={`p-3 border-b flex justify-between items-center shrink-0 ${isLightMode ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-[#111827]'}`}>
                    <h3 className={`text-xs font-bold ${textSub} uppercase tracking-wider flex items-center gap-2`}>Live Spatial Risk Map <Navigation size={14} /></h3>
                </div>
                <div className="flex-grow relative h-[300px] lg:h-auto">
                    <DynamicMap riskData={riskData} isLightMode={isLightMode} />
                </div>
            </div>

            <div className={`col-span-1 lg:col-span-3 border rounded-xl p-4 md:p-5 transition-colors duration-300 ${bgCard}`}>
                <h3 className={`text-xs font-bold ${textSub} uppercase tracking-wider mb-4`}>AI Model Status</h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-500/20 p-2 rounded-lg text-blue-500 shrink-0"><Layers size={20} /></div>
                        <div className="flex-grow">
                            <div className="flex justify-between"><p className={`text-sm font-bold ${textMain}`}>ConvLSTM <span className={`text-[10px] md:text-xs ${textSub} font-normal`}>(Radar)</span></p><span className="text-xs text-emerald-500 font-medium">Active</span></div>
                            <p className={`text-[10px] ${textSub}`}>Input: 4 Radar Frames</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-500 shrink-0"><Database size={20} /></div>
                        <div className="flex-grow">
                            <div className="flex justify-between"><p className={`text-sm font-bold ${textMain}`}>XGBoost <span className={`text-[10px] md:text-xs ${textSub} font-normal`}>(Atmos)</span></p><span className="text-xs text-emerald-500 font-medium">Active</span></div>
                            <p className={`text-[10px] ${textSub}`}>Input: Atmospheric Params</p>
                        </div>
                    </div>
                    <div className={`flex items-center gap-3 pt-3 border-t ${isLightMode ? 'border-slate-200' : 'border-slate-800'}`}>
                        <div className="bg-purple-500/20 p-2 rounded-lg text-purple-500 shrink-0"><Server size={20} /></div>
                        <div className="flex-grow">
                            <div className="flex justify-between"><p className={`text-sm font-bold ${textMain}`}>Fusion Engine</p><span className="text-xs text-emerald-500 font-medium">Active</span></div>
                            <p className={`text-[10px] ${textSub}`}>Risk Score: <span className={`${textMain} font-bold`}>{prediction_details.thunderstorm_probability}%</span></p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`col-span-1 lg:col-span-3 border rounded-xl p-4 md:p-5 transition-colors duration-300 ${bgCard}`}>
                <h3 className={`text-xs font-bold ${textSub} uppercase tracking-wider mb-4`}>Data Source Status</h3>
                <div className="space-y-3">
                    {[
                        { icon: Activity, color: "text-blue-500", name: "Radar Data", src: "IMD", status: sourceStatus },
                        { icon: Database, color: "text-slate-400", name: "Satellite Data", src: "INSAT-3D", status: sourceStatus },
                        { icon: Zap, color: "text-yellow-500", name: "Lightning", src: "Earth Networks", status: sourceStatus },
                        { icon: CloudRain, color: "text-sky-500", name: "Atmospheric", src: "IMD Observations", status: sourceStatus }
                    ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <item.icon size={16} className={`${item.color} shrink-0`} />
                                <div><p className={`text-xs font-bold ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>{item.name}</p><p className={`text-[10px] ${textSub} truncate max-w-[100px] md:max-w-none`}>{item.src}</p></div>
                            </div>
                            <span className={`text-[10px] font-medium ${item.status === 'Live' ? 'text-emerald-600 bg-emerald-500/10' : 'text-yellow-600 bg-yellow-500/10'} px-2 py-0.5 rounded`}>{item.status}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className={`col-span-1 lg:col-span-3 border rounded-xl p-4 md:p-5 transition-colors duration-300 ${bgCard}`}>
                <h3 className={`text-xs font-bold ${textSub} uppercase tracking-wider mb-4`}>Storm Movement</h3>
                <div className="space-y-4 flex flex-row lg:flex-col justify-between items-center lg:items-stretch">
                    <div className="flex items-center gap-3 md:gap-4"><Navigation size={24} className="text-slate-400 rotate-45 shrink-0" /><div><p className={`text-[10px] ${textSub} uppercase`}>Direction</p><p className={`text-base md:text-lg font-bold ${textMain}`}>{storm_movement.direction}</p></div></div>
                    <div className="flex items-center gap-3 md:gap-4"><Wind size={24} className="text-slate-400 shrink-0" /><div><p className={`text-[10px] ${textSub} uppercase`}>Speed</p><p className={`text-base md:text-lg font-bold ${textMain}`}>{storm_movement.speed_kmh} km/h</p></div></div>
                </div>
                <div className={`flex items-center gap-3 md:gap-4 mt-4 pt-3 border-t ${isLightMode ? 'border-slate-200' : 'border-slate-800'}`}>
                    <Activity size={20} className="text-slate-400 shrink-0" /><div><p className={`text-[10px] ${textSub} uppercase`}>Estimated Arrival</p><p className={`text-sm font-bold ${textMain}`}>{etaMinutes}</p></div>
                </div>
            </div>

            <div className={`col-span-1 lg:col-span-3 ${activeAlert.bg} border ${activeAlert.border} rounded-xl p-4 md:p-5 flex flex-col justify-center items-center text-center transition-colors duration-500`}>
                <h3 className={`text-xs font-bold ${activeAlert.text} uppercase tracking-wider mb-2 md:mb-4 self-start w-full text-left`}>Alerts</h3>
                <div className={`h-12 w-12 md:h-16 md:w-16 rounded-full border-2 ${activeAlert.text} border-opacity-50 flex items-center justify-center mb-2 md:mb-4 shrink-0`}><AlertIcon size={24} className={activeAlert.text} /></div>
                <p className={`${activeAlert.text} font-bold text-base md:text-lg mb-1`}>{activeAlert.title}</p>
                <p className={`${activeAlert.text} opacity-80 text-[10px] md:text-xs`}>{activeAlert.desc}</p>
            </div>

            <div className={`col-span-1 lg:col-span-6 border rounded-xl p-4 md:p-5 transition-colors duration-300 ${bgCard}`}>
                <h3 className={`text-xs font-bold ${textSub} uppercase tracking-wider mb-4 flex items-center gap-2`}>Radar Nowcast Timeline <PlayCircle size={14} className="text-indigo-500 cursor-pointer" /></h3>
                <div className="flex justify-start md:justify-between items-center gap-3 md:gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
                    {radarTimeline.length > 0 ? radarTimeline.map((frame, i) => (
                        <div key={i} className="flex-none w-20 md:w-auto md:flex-1 flex flex-col items-center snap-center">
                            <div className={`w-full aspect-square rounded-lg mb-2 border relative overflow-hidden flex items-center justify-center ${i === 4 ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]' : (isLightMode ? 'border-slate-300 bg-slate-200' : 'border-slate-700 bg-slate-900')}`}>
                                <div className={`absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${isLightMode ? 'from-blue-200 via-slate-100 to-white' : 'from-blue-900 via-slate-900 to-black'}`}></div>
                                
                                {/* Error fallback to clear text is already safe here */}
                                <img src={frame.url} alt={`Radar at ${frame.time}`} className={`absolute inset-0 w-full h-full object-cover opacity-90 z-10 ${isLightMode ? 'mix-blend-multiply' : 'mix-blend-screen'}`} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                <span className={`text-[9px] ${textSub} font-medium z-0`}>Clear</span>
                            </div>
                            <p className={`text-[9px] md:text-[10px] ${i === 4 ? 'text-indigo-500 font-bold' : textSub}`}>{i === 4 ? 'LIVE' : frame.time}</p>
                        </div>
                    )) : (
                        <div className="w-full flex justify-center py-6"><p className={`text-xs ${textSub} animate-pulse`}>Fetching radar sequence...</p></div>
                    )}
                </div>
            </div>

            <div className={`col-span-1 lg:col-span-6 border rounded-xl p-4 md:p-5 transition-colors duration-300 ${bgCard}`}>
                <h3 className={`text-xs font-bold ${textSub} uppercase tracking-wider mb-2`}>Prediction Trend <span className="text-slate-500 normal-case">(Live SQLite Database)</span></h3>
                <div className="flex items-center gap-3 md:gap-4 mb-2 text-[9px] md:text-[10px]">
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> <span className={textSub}>Thunderstorm</span></div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> <span className={textSub}>Lightning</span></div>
                </div>
                <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                            <XAxis dataKey="time" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                            <Tooltip contentStyle={{ backgroundColor: isLightMode ? '#ffffff' : '#1e293b', border: isLightMode ? '1px solid #e2e8f0' : 'none', borderRadius: '8px', fontSize: '12px', color: isLightMode ? '#0f172a' : '#fff' }} />
                            <Line type="monotone" dataKey="thunder" stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: '#f97316' }} />
                            <Line type="monotone" dataKey="lightning" stroke="#facc15" strokeWidth={2} dot={{ r: 3, fill: '#facc15' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
        </div>
    );
}