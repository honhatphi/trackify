/**
 * @fileoverview Warehouse Statistics Dashboard
 * Displays real-time statistics about warehouse occupancy and capacity
 */

import { useMemo } from 'react';
import { CELL_STATES, BLOCK1, BLOCK2 } from './constants';

/**
 * Calculate warehouse statistics from cell states
 */
const calculateStats = () => {
    const stats = {
        total: 0,
        occupied: 0,
        empty: 0,
        byBlock: {
            1: { total: 0, occupied: 0, empty: 0 },
            2: { total: 0, occupied: 0, empty: 0 },
        },
        byLayer: Array(7).fill(null).map(() => ({ total: 0, occupied: 0, empty: 0 })),
    };

    CELL_STATES.forEach((cell) => {
        stats.total++;
        const block = cell.block;
        const layer = cell.layer;
        const layerIndex = layer - 1; // Convert 1-7 to 0-6 for array index

        if (cell.occupied) {
            stats.occupied++;
            stats.byBlock[block].occupied++;
            stats.byLayer[layerIndex].occupied++;
        } else {
            stats.empty++;
            stats.byBlock[block].empty++;
            stats.byLayer[layerIndex].empty++;
        }

        stats.byBlock[block].total++;
        stats.byLayer[layerIndex].total++;
    });

    return stats;
};

/**
 * Statistics card component
 */
const StatCard = ({ title, value, subtitle, color = 'blue' }) => {
    const colorClasses = {
        blue: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',
        green: 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400',
        amber: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
        slate: 'bg-slate-500/10 border-slate-500/30 text-slate-600 dark:text-slate-400',
    };

    return (
        <div className={`rounded-lg border p-3 ${colorClasses[color]}`}>
            <div className="text-xs font-medium opacity-80">{title}</div>
            <div className="text-2xl font-bold mt-1">{value}</div>
            {subtitle && <div className="text-[10px] mt-0.5 opacity-70">{subtitle}</div>}
        </div>
    );
};

/**
 * Progress bar component for occupancy levels
 */
const OccupancyBar = ({ label, occupied, total }) => {
    const percentage = total > 0 ? Math.round((occupied / total) * 100) : 0;

    // Color based on occupancy level
    const getColor = () => {
        if (percentage >= 90) return 'bg-red-500';
        if (percentage >= 70) return 'bg-amber-500';
        return 'bg-green-500';
    };

    return (
        <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
                <span className="text-slate-600 dark:text-slate-400">
                    {occupied}/{total} ({percentage}%)
                </span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                    className={`h-full ${getColor()} transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

/**
 * Main statistics dashboard component
 */
const WarehouseStats = () => {
    const stats = useMemo(() => calculateStats(), []);
    const occupancyRate = Math.round((stats.occupied / stats.total) * 100);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 space-y-4">
            {/* Title */}
            <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    📊 Warehouse Statistics
                </h3>
            </div>

            {/* Overall Stats - 2x2 grid for narrow panel */}
            <div className="grid grid-cols-2 gap-3">
                <StatCard
                    title="Total Slots"
                    value={stats.total.toLocaleString()}
                    color="blue"
                />
                <StatCard
                    title="Occupied"
                    value={stats.occupied.toLocaleString()}
                    subtitle={`${occupancyRate}% capacity`}
                    color="green"
                />
                <StatCard
                    title="Available"
                    value={stats.empty.toLocaleString()}
                    color="amber"
                />
                <StatCard
                    title="Occupancy Rate"
                    value={`${occupancyRate}%`}
                    color="slate"
                />
            </div>

            {/* Block Statistics */}
            <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
                    📦 By Zone
                </h4>
                <div className="space-y-2">
                    <OccupancyBar
                        label="Block 1 (3 depths)"
                        occupied={stats.byBlock[1].occupied}
                        total={stats.byBlock[1].total}
                    />
                    <OccupancyBar
                        label="Block 2 (8 depths)"
                        occupied={stats.byBlock[2].occupied}
                        total={stats.byBlock[2].total}
                    />
                </div>
            </div>

            {/* Layer Statistics */}
            <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
                    📐 By Layer
                </h4>
                <div className="space-y-2">
                    {stats.byLayer.map((layer, idx) => (
                        <OccupancyBar
                            key={idx}
                            label={`Layer ${idx + 1}`}
                            occupied={layer.occupied}
                            total={layer.total}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WarehouseStats;
