import React from 'react';
import { MapPin, Footprints, Bike, Dumbbell, Activity } from 'lucide-react';
import { getSportCategory } from '../../utils/tssEngine';

// Icono único de cada deporte (spec-capa6-v2-premium, RF-C6 / DUP-2). La clasificación es la de `getSportCategory`.

const svgProps = (size, strokeWidth) => ({
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
});

const SwimIcon = ({ size, strokeWidth }) => (
    <svg {...svgProps(size, strokeWidth)}>
        <path d="M2 20c2-1 4-2 6-2s4 1 6 2 4 1 6 0" /><path d="M2 16c2-1 4-2 6-2s4 1 6 2 4 1 6 0" />
        <path d="M12 12a4 4 0 0 0 4-4V6l-2-2-4 4" /><circle cx="12" cy="4" r="1" />
    </svg>
);

const YogaIcon = ({ size, strokeWidth }) => (
    <svg {...svgProps(size, strokeWidth)}>
        <circle cx="12" cy="4" r="1.5" /><path d="M12 8v4l-3 4" /><path d="M12 12l3 4" /><path d="M8 20h8" /><path d="M6 12l6 2 6-2" />
    </svg>
);

const ICONS = { run: Footprints, ride: Bike, strength: Dumbbell, swim: SwimIcon, yoga: YogaIcon, walk: MapPin, other: Activity };

/** Icono del deporte de un tipo de actividad (decorativo: el nombre va en el texto que lo acompaña). */
export const SportIcon = ({ type, size = 12, strokeWidth = 2 }) => {
    const Icon = ICONS[getSportCategory(type ?? '')] || Activity;
    return <Icon size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
};
