"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function MapFlyTo({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, 10, { animate: true, duration: 1.5 });
    }, [center, map]);
    return null;
}

export default function MapComponent({ riskData, isLightMode = false }: { riskData: any, isLightMode?: boolean }) {
    const [radarUrl, setRadarUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchRadarTime = async () => {
            try {
                const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
                const data = await res.json();
                const past = data.radar?.past;

                if (past && past.length > 0) {
                    const latestFrame = past[past.length - 1];
                    setRadarUrl(`${data.host}${latestFrame.path}/256/{z}/{x}/{y}/2/1_1.png`);
                }
            } catch (err) {
                console.error("Failed to fetch radar timestamps");
            }
        };
        fetchRadarTime();
    }, []);

    const center: [number, number] = [
        riskData?.latitude || 28.66, 
        riskData?.longitude || 77.43
    ];
    
    const getRiskColor = (level: string) => {
        if (level === 'Severe') return '#dc2626';
        if (level === 'High') return '#f97316';
        if (level === 'Moderate') return '#eab308';
        return '#22c55e';
    };

    const movementVector: [[number, number], [number, number]] = [
        [center[0] - 0.05, center[1] - 0.05],
        [center[0] + 0.05, center[1] + 0.05]
    ];

    // Background color shifts based on the theme
    const mapBgColor = isLightMode ? '#f8fafc' : '#0B1120';

    return (
        <div style={{ height: '100%', minHeight: '350px', width: '100%', position: 'relative', backgroundColor: mapBgColor, transition: 'background-color 0.3s' }}>
            <MapContainer center={center} zoom={10} attributionControl={false} style={{ height: '100%', width: '100%', background: mapBgColor }}>
                <MapFlyTo center={center} />
                
                {/* Dynamically shift between Light OpenStreetMap and Sleek Dark Carto Map */}
                <TileLayer
                    url={isLightMode 
                        ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                        : "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"}
                    attribution="" 
                />
                
                {radarUrl && (
                    <TileLayer
                        url={radarUrl}
                        opacity={0.65}
                        zIndex={10}
                        maxNativeZoom={7}
                    />
                )}
                
                {riskData?.map_zones && riskData.map_zones.map((zone: any, index: number) => (
                    <Circle 
                        key={index}
                        center={[zone.lat, zone.lng]} 
                        radius={zone.radius} 
                        pathOptions={{ 
                            color: getRiskColor(zone.level),
                            fillColor: getRiskColor(zone.level),
                            fillOpacity: 0.25,
                            weight: 2,
                            dashArray: index === 0 ? '4, 6' : ''
                        }}
                    >
                        <Popup>
                            <div style={{ fontFamily: 'sans-serif', color: '#000' }}>
                                <strong style={{ fontSize: '14px' }}>Zone: {zone.level} Risk</strong>
                            </div>
                        </Popup>
                    </Circle>
                ))}

                {riskData?.storm_movement && (
                    <Polyline 
                        positions={movementVector}
                        pathOptions={{ color: '#ffffff', weight: 4 }}
                    >
                        <Popup>
                            <div style={{ color: '#000' }}>
                                <strong>Trajectory</strong><br/>
                                {riskData.storm_movement.direction} @ {riskData.storm_movement.speed_kmh} km/h
                            </div>
                        </Popup>
                    </Polyline>
                )}
            </MapContainer>
            
            <div className={`absolute top-4 right-4 z-[400] ${isLightMode ? 'bg-white/90 border-slate-200' : 'bg-[#111827]/90 border-slate-700'} border p-3 rounded-lg text-xs ${isLightMode ? 'text-slate-700' : 'text-slate-300'} backdrop-blur-sm hidden sm:block transition-colors duration-300`}>
                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="layer" defaultChecked className="accent-indigo-500" /> <span className={`font-medium ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Risk Zones</span></label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="layer" className="accent-indigo-500" /> Radar</label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="layer" className="accent-indigo-500" /> Satellite</label>
                </div>
            </div>

            <div className={`absolute bottom-4 right-4 z-[400] ${isLightMode ? 'bg-white/90 border-slate-200' : 'bg-[#111827]/90 border-slate-700'} border p-3 rounded-lg text-xs ${isLightMode ? 'text-slate-700' : 'text-slate-300'} backdrop-blur-sm hidden sm:block transition-colors duration-300`}>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-600 rounded-sm"></span> Severe Risk</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-orange-500 rounded-sm"></span> High Risk</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-yellow-500 rounded-sm"></span> Moderate Risk</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-sm"></span> Low Risk</div>
                </div>
            </div>
        </div>
    );
}