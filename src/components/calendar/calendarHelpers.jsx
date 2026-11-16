import { MapPin, Footprints, Bike, Dumbbell, Activity } from 'lucide-react';
import React from 'react';

export const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];


// Shared zone styling used in both planner and viewer
export const zoneColors = {
    Z1: '#94a3b8', R12: '#60a5fa', Z2: '#3b82f6', R23: '#34d399',
    Z3: '#22c55e', Z4: '#eab308', Z5: '#f97316', Z6: '#ef4444',
};
export const getZoneColor = (z) => zoneColors[z] || '#94a3b8';

export const getSportColor = (type) => {
    const t = String(type).toLowerCase();
    if (t.includes('run') || t.includes('carrera') || t.includes('correr')) return 'bg-sport-run-tint-2 text-sport-run-ink-2 border-sport-run-edge hover:bg-sport-run-edge-2';
    if (t.includes('bike') || t.includes('bici') || t.includes('ciclismo')) return 'bg-sport-bike-tint text-sport-bike-ink border-sport-bike-edge hover:bg-sport-bike-edge-2';
    if (t.includes('swim') || t.includes('nadar')) return 'bg-sport-swim-tint text-sport-swim-ink border-sport-swim-edge hover:bg-sport-swim-edge-2';
    if (t.includes('gym') || t.includes('fuerza')) return 'bg-sport-strength-tint text-sport-strength-ink border-sport-strength-edge hover:bg-sport-strength-edge-2';
    return 'bg-slate-100 text-slate-700 border-line-2 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700/50';
};

export const getSportIcon = (type, size = 12) => {
    const t = String(type).toLowerCase();
    if (t.includes('run') || t.includes('carrera') || t.includes('correr')) return <Footprints size={size} />;
    if (t.includes('ride') || t.includes('bici') || t.includes('ciclismo')) return <Bike size={size} />;
    if (t.includes('weight') || t.includes('fuerza') || t.includes('crossfit') || t.includes('workout')) return <Dumbbell size={size} />;
    if (t.includes('swim') || t.includes('natacion') || t.includes('natación')) return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20c2-1 4-2 6-2s4 1 6 2 4 1 6 0" /><path d="M2 16c2-1 4-2 6-2s4 1 6 2 4 1 6 0" /><path d="M12 12a4 4 0 0 0 4-4V6l-2-2-4 4" /><circle cx="12" cy="4" r="1" /></svg>;
    if (t.includes('yoga') || t.includes('stretch')) return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="4" r="1.5" /><path d="M12 8v4l-3 4" /><path d="M12 12l3 4" /><path d="M8 20h8" /><path d="M6 12l6 2 6-2" /></svg>;
    if (t.includes('walk') || t.includes('hike') || t.includes('caminata') || t.includes('senderismo')) return <MapPin size={size} />;
    return <Activity size={size} />;
};
