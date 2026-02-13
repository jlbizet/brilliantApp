import React from 'react';
import { clsx } from 'clsx';

export type Surface = 'O' | 'M' | 'D' | 'V' | 'L'; // Occlusal, Mesial, Distal, Vestibular, Lingual
export type ConditionType = 'CARIES' | 'FILLING' | 'CROWN' | 'EXTRACTION' | 'IMPLANT' | 'ENDODONTIC' | 'FRACTURE' | 'BRIDGE' | 'SEALANT' | 'MISSING' | 'HEALTHY' | 'PROSTHESIS_FIXED' | 'PROSTHESIS_REMOVABLE';

interface ToothProps {
    id: string; // Tooth number (e.g., '18')
    conditions?: { surfaces?: Surface[]; type: ConditionType; color?: string }[];
    onClick?: (toothId: string, surface: Surface) => void;
    selected?: boolean;
    missing?: boolean;
}

const SURFACE_PATHS = {
    top: "M 25 25 L 15 15 L 35 15 L 25 25 Z", // Top / Vestibular (for upper teeth logic, simplified here as geometric)
    right: "M 25 25 L 35 15 L 35 35 L 25 25 Z", // Right / Distal
    bottom: "M 25 25 L 35 35 L 15 35 L 25 25 Z", // Bottom / Lingual
    left: "M 25 25 L 15 35 L 15 15 L 25 25 Z", // Left / Mesial
    center: "M 25 25 m -5 -5 h 10 v 10 h -10 z" // Center / Occlusal (box)
};

// Map logical surfaces to geometric parts based on quadrant
// Quadrant 1 (UR): 18-11
// Quadrant 2 (UL): 21-28
// Quadrant 3 (LL): 31-38
// Quadrant 4 (LR): 41-48
//
// Standard mapping for posterior teeth:
// Center -> Occlusal
// Top -> Vestibular (Buccal) for Upper, Lingual for Lower?
// Actually, usually:
// Upper Teeth (1x, 2x): Top=Vestibular, Bottom=Lingual
// Lower Teeth (3x, 4x): Top=Lingual, Bottom=Vestibular
// Left/Right depends on Mesial/Distal and Quadrant.
// 
// Let's simplify for the SVG representation:
// Outer Top: Vestibular (for upper), Lingual (for lower) -> Let's just map explicitly.
// 
// To keep it simple and consistent:
// We will use a geometric map: Top, Bottom, Left, Right, Center.
// And a helper to map Tooth+Surface -> GeometricPart.

const getGeometricPart = (toothId: string, surface: Surface): 'part_top' | 'part_bottom' | 'part_left' | 'part_right' | 'part_center' | null => {
    const quadrant = parseInt(toothId.toString().charAt(0));
    const isUpper = quadrant === 1 || quadrant === 2 || quadrant === 5 || quadrant === 6;
    const isRight = quadrant === 1 || quadrant === 4 || quadrant === 5 || quadrant === 8; // Right side of patient (Left side of screen usually?) No, standard numbering: 18 is rightmost upper.

    // ISO 3950 notation
    // 18 ... 11 | 21 ... 28
    // 48 ... 41 | 31 ... 38

    if (surface === 'O') return 'part_center'; // Occlusal/Incisal

    if (isUpper) {
        if (surface === 'V') return 'part_top';
        if (surface === 'L') return 'part_bottom';
    } else {
        // Lower
        if (surface === 'V') return 'part_bottom';
        if (surface === 'L') return 'part_top';
    }

    // Mesial is towards the midline (between 11 and 21)
    // Distal is away from midline

    // Q1 (18-11): 11 is Mesial, 18 is Distal.
    // So for 1x: Mesial is Left (visually on 18), Right (visually on 11)?
    // Wait, let's look at the standard cross representation.
    // Usually: Top, Bottom, Left, Right.
    // Let's stick to visual mapping for now relative to the tooth box.
    // M = Mesial, D = Distal.

    // For 1x (Right Upper): Mesial is Left side of tooth (towards midline), Distal is Right side.
    // For 2x (Left Upper): Mesial is Right side of tooth, Distal is Left side.
    // For 3x (Left Lower): Mesial is Right side of tooth, Distal is Left side.
    // For 4x (Right Lower): Mesial is Left side of tooth, Distal is Right side.

    if (quadrant === 1 || quadrant === 5 || quadrant === 4 || quadrant === 8) {
        // Right side quadrants (1, 4, 5, 8)
        // Mesial is towards midline -> Left side of the tooth visual
        if (surface === 'M') return 'part_left';
        if (surface === 'D') return 'part_right';
    } else {
        // Left side quadrants (2, 3, 6, 7)
        // Mesial is towards midline -> Right side of the tooth visual
        if (surface === 'M') return 'part_right';
        if (surface === 'D') return 'part_left';
    }

    return null;
};

const Tooth: React.FC<ToothProps> = ({ id, conditions = [], onClick, missing }) => {

    const getColor = (surface: Surface) => {
        const condition = conditions.find(c => c.surfaces?.includes(surface) || (c.type === 'MISSING'));
        if (missing) return 'transparent';

        if (condition) {
            if (condition.color) return condition.color;

            switch (condition.type) {
                case 'CARIES': return '#ef4444'; // Red
                case 'FILLING': return '#3b82f6'; // Blue
                case 'CROWN': return '#eab308'; // Yellow/Gold
                case 'HEALTHY': return '#059669'; // Green
                case 'EXTRACTION': return '#6b7280'; // Gray
                default: return '#d1d5db'; // Default Gray
            }
        }
        return 'white';
    };

    const handlePartClick = (surface: Surface) => {
        if (onClick) onClick(id, surface);
    };

    // Reverse map for click handling
    // We need to know which surface 'part_top' corresponds to.
    const getSurfaceFromPart = (part: 'part_top' | 'part_bottom' | 'part_left' | 'part_right' | 'part_center'): Surface => {
        if (part === 'part_center') return 'O';

        const quadrant = parseInt(id.toString().charAt(0));
        const isUpper = quadrant === 1 || quadrant === 2 || quadrant === 5 || quadrant === 6;
        const isRightQuad = quadrant === 1 || quadrant === 4 || quadrant === 5 || quadrant === 8;

        if (part === 'part_top') return isUpper ? 'V' : 'L';
        if (part === 'part_bottom') return isUpper ? 'L' : 'V';

        if (isRightQuad) {
            if (part === 'part_left') return 'M';
            if (part === 'part_right') return 'D';
        } else {
            if (part === 'part_right') return 'M';
            if (part === 'part_left') return 'D';
        }

        return 'O'; // Fallback
    };

    if (missing) {
        // Render X or simplified placeholder
    }

    return (
        <div className="relative w-12 h-12 flex flex-col items-center justify-center p-1 cursor-pointer group">
            <span className="text-[10px] font-bold text-gray-500 mb-0.5 select-none">{id}</span>
            <svg viewBox="0 0 50 50" className="w-full h-full drop-shadow-sm transition-transform hover:scale-105">
                {/* Background for hover catch */}
                <circle cx="25" cy="25" r="24" fill="transparent" />

                {/* Top / Vestibular (for Upper) */}
                <path
                    d="M 10 10 Q 25 0 40 10 L 32 18 Q 25 12 18 18 Z"
                    fill={getColor(getSurfaceFromPart('part_top'))}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    onClick={(e) => { e.stopPropagation(); handlePartClick(getSurfaceFromPart('part_top')); }}
                    className="hover:brightness-90 transition-all cursor-pointer hover:stroke-primary-400"
                />

                {/* Bottom / Lingual (for Upper) */}
                <path
                    d="M 10 40 Q 25 50 40 40 L 32 32 Q 25 38 18 32 Z"
                    fill={getColor(getSurfaceFromPart('part_bottom'))}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    onClick={(e) => { e.stopPropagation(); handlePartClick(getSurfaceFromPart('part_bottom')); }}
                    className="hover:brightness-90 transition-all cursor-pointer hover:stroke-primary-400"
                />

                {/* Left / Mesial (for Q1) */}
                <path
                    d="M 10 10 Q 0 25 10 40 L 18 32 Q 12 25 18 18 Z"
                    fill={getColor(getSurfaceFromPart('part_left'))}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    onClick={(e) => { e.stopPropagation(); handlePartClick(getSurfaceFromPart('part_left')); }}
                    className="hover:brightness-90 transition-all cursor-pointer hover:stroke-primary-400"
                />

                {/* Right / Distal (for Q1) */}
                <path
                    d="M 40 10 Q 50 25 40 40 L 32 32 Q 38 25 32 18 Z"
                    fill={getColor(getSurfaceFromPart('part_right'))}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    onClick={(e) => { e.stopPropagation(); handlePartClick(getSurfaceFromPart('part_right')); }}
                    className="hover:brightness-90 transition-all cursor-pointer hover:stroke-primary-400"
                />

                {/* Center / Occlusal */}
                <circle
                    cx="25" cy="25" r="8"
                    fill={getColor(getSurfaceFromPart('part_center'))}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    onClick={(e) => { e.stopPropagation(); handlePartClick(getSurfaceFromPart('part_center')); }}
                    className="hover:brightness-90 transition-all cursor-pointer hover:stroke-primary-400"
                />

                {/* Missing / Logic overlays */}
                {conditions?.some(c => c.type === 'MISSING' || c.type === 'EXTRACTION') && (
                    <g stroke="red" strokeWidth="3" opacity="0.8">
                        <line x1="10" y1="10" x2="40" y2="40" />
                        <line x1="40" y1="10" x2="10" y2="40" />
                    </g>
                )}
            </svg>
        </div>
    );
};

export default Tooth;
