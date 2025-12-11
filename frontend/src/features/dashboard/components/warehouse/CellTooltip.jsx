/**
 * @fileoverview Enhanced Cell Tooltip System
 * Shows detailed information when hovering over cells in 3D view
 */

import { useState, useCallback } from 'react';
import { useDashboardStore } from '../../../../store/useDashboardStore';

/**
 * Tooltip component with cell information
 */
const CellTooltip = ({ cellId, position }) => {
    if (!cellId) return null;

    const inventory = useDashboardStore((state) => state.inventory);
    const cell = inventory.get(cellId);
    if (!cell) return null;

    return (
        <div
            className="fixed z-50 pointer-events-none"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: 'translate(-50%, -120%)',
            }}
        >
            <div className="bg-slate-800 dark:bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl border border-slate-600 min-w-[200px]">
                {/* Cell ID Header */}
                <div className="font-bold text-sm text-blue-300 mb-2 border-b border-slate-600 pb-2">
                    📍 {cellId}
                </div>

                {/* Cell Details */}
                <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                        <span className="text-slate-400">Block:</span>
                        <span className="font-medium">Block {cell.block}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">Layer:</span>
                        <span className="font-medium">Layer {cell.layer}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">Row:</span>
                        <span className="font-medium">Row {cell.row}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">Depth:</span>
                        <span className="font-medium">Depth {cell.depth}</span>
                    </div>

                    {/* Status Badge */}
                    <div className="pt-2 mt-2 border-t border-slate-600">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400">Status:</span>
                            {cell.occupied ? (
                                <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs font-medium">
                                    ✓ Occupied
                                </span>
                            ) : (
                                <span className="bg-slate-600 text-white px-2 py-0.5 rounded text-xs font-medium">
                                    ○ Empty
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tooltip arrow */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                    <div className="border-8 border-transparent border-t-slate-800 dark:border-t-slate-900"></div>
                </div>
            </div>
        </div>
    );
};

/**
 * Hook for managing cell tooltips with raycasting
 */
export const useCellTooltip = () => {
    const [hoveredCell, setHoveredCell] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const handlePointerMove = useCallback((event) => {
        setMousePosition({ x: event.clientX, y: event.clientY });
    }, []);

    const handleCellHover = useCallback((cellId) => {
        setHoveredCell(cellId);
    }, []);

    const handleCellLeave = useCallback(() => {
        setHoveredCell(null);
    }, []);

    return {
        hoveredCell,
        mousePosition,
        handlePointerMove,
        handleCellHover,
        handleCellLeave,
        TooltipComponent: () => (
            <CellTooltip cellId={hoveredCell} position={mousePosition} />
        ),
    };
};

export default CellTooltip;
