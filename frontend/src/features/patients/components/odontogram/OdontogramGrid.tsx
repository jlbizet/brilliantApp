import React from 'react';
import Tooth, { Surface, ConditionType } from './Tooth';

interface OdontogramGridProps {
    conditions: any[]; // Replace 'any' with proper type from API
    onToothClick: (toothId: string, surface: Surface) => void;
    isChild?: boolean;
}

const ADULT_TEETH = [
    [18, 17, 16, 15, 14, 13, 12, 11], // Q1: Right Upper (rendered left-to-right: 18..11)
    [21, 22, 23, 24, 25, 26, 27, 28], // Q2: Left Upper (rendered left-to-right: 21..28)
    [48, 47, 46, 45, 44, 43, 42, 41], // Q4: Right Lower (rendered left-to-right: 48..41)
    [31, 32, 33, 34, 35, 36, 37, 38], // Q3: Left Lower (rendered left-to-right: 31..38)
];

const CHILD_TEETH = [
    [55, 54, 53, 52, 51], // Q5: Right Upper
    [61, 62, 63, 64, 65], // Q6: Left Upper
    [85, 84, 83, 82, 81], // Q8: Right Lower
    [71, 72, 73, 74, 75], // Q7: Left Lower
];

// Helper to filter conditions for a specific tooth
const getConditionsForTooth = (toothId: number, allConditions: any[]) => {
    return allConditions.filter(c => c.tooth === toothId.toString())
        .map(c => ({
            type: c.type as ConditionType,
            surfaces: c.surfaces as Surface[],
            color: c.color
        }));
};

const OdontogramGrid: React.FC<OdontogramGridProps> = ({ conditions, onToothClick, isChild = false }) => {
    const quadrants = isChild ? CHILD_TEETH : ADULT_TEETH;

    const renderQuadrant = (teeth: number[]) => {
        return (
            <div className="flex gap-1 justify-center">
                {teeth.map(toothId => (
                    <Tooth
                        key={toothId}
                        id={toothId.toString()}
                        conditions={getConditionsForTooth(toothId, conditions)}
                        onClick={onToothClick}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-8 select-none">
            {/* Upper Jaw */}
            <div className="flex gap-4 min-[400px]:gap-10 justify-center items-end border-b-2 border-slate-200 pb-8 relative">
                <span className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-bold text-gray-400">RIGHT</span>
                <span className="absolute -right-6 top-1/2 -translate-y-1/2 rotate-90 text-[10px] font-bold text-gray-400">LEFT</span>

                {renderQuadrant(quadrants[0])} {/* Q1 / Q5 */}
                {renderQuadrant(quadrants[1])} {/* Q2 / Q6 */}
            </div>

            {/* Lower Jaw */}
            <div className="flex gap-4 min-[400px]:gap-10 justify-center items-start pt-4">
                {renderQuadrant(quadrants[2])} {/* Q4 / Q8 */}
                {renderQuadrant(quadrants[3])} {/* Q3 / Q7 */}
            </div>
        </div>
    );
};

export default OdontogramGrid;
