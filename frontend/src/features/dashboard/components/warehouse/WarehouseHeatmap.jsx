/**
 * @fileoverview 2D Heatmap Visualization of Warehouse
 * Top-down view showing occupancy levels with color coding
 */

import { useMemo, useState, useEffect } from 'react';
import { BLOCK1, BLOCK2 } from './constants';
import { useDashboardStore } from '../../../../store/useDashboardStore';

/**
 * Generate heatmap data for a specific layer from inventory
 * @param {Map} inventory - Current inventory state from store
 * @param {number} layer - Layer index (0-based: 0-6)
 */
const generateHeatmapData = (inventory, layer) => {
    const data = {
        block1: Array(BLOCK1.ROWS).fill(null).map(() => Array(3).fill(0)),
        block2: Array(BLOCK2.ROWS).fill(null).map(() => Array(8).fill(0)),
    };

    inventory.forEach((cell) => {
        // Convert 0-based layer index to 1-based layer number (1-7)
        if (cell.layer !== layer + 1) return;

        const block = cell.block === 1 ? 'block1' : 'block2';
        const row = cell.row;
        const depth = cell.depth;

        // Skip elevator row for block1
        if (cell.block === 1 && row === BLOCK1.ELEVATOR_ROW) return;

        if (data[block][row]) {
            data[block][row][depth] = cell.occupied ? 1 : 0;
        }
    });

    return data;
};

/**
 * Single cell in heatmap - simple, using title attribute for tooltip
 */
const HeatmapCell = ({ occupied, cellId, onClick }) => {
    const bgColor = occupied
        ? 'bg-green-500 hover:bg-green-600'
        : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500';

    return (
        <div
            className={`${bgColor} transition-all cursor-pointer w-full h-full border border-slate-400/30`}
            onClick={() => onClick(cellId)}
            title={cellId}
        />
    );
};

/**
 * Heatmap for a single block with row and depth labels
 */
const BlockHeatmap = ({ blockData, blockNum, rows, depths, selectedLayer }) => {
    const handleCellClick = (cellId) => {
        console.log('Clicked cell:', cellId);
    };

    const CELL_SIZE = 16;

    return (
        <div className="flex flex-col">
            {/* Block Title */}
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Block {blockNum}
            </div>

            {/* Grid with labels */}
            <div className="flex">
                {/* Row labels (left side) */}
                <div className="flex flex-col mr-1" style={{ marginTop: CELL_SIZE + 2 }}>
                    {Array(rows).fill(null).map((_, idx) => (
                        <div
                            key={idx}
                            className="text-[9px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-end pr-1"
                            style={{ height: CELL_SIZE + 1, lineHeight: `${CELL_SIZE}px` }}
                        >
                            {(idx + 1).toString().padStart(2, '0')}
                        </div>
                    ))}
                </div>

                <div className="flex flex-col">
                    {/* Depth labels (top) */}
                    <div className="flex mb-0.5" style={{ marginLeft: 0 }}>
                        {Array(depths).fill(null).map((_, idx) => (
                            <div
                                key={idx}
                                className="text-[9px] text-slate-500 dark:text-slate-400 font-mono text-center"
                                style={{ width: CELL_SIZE + 1 }}
                            >
                                D{idx + 1}
                            </div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div
                        className="grid bg-slate-400 dark:bg-slate-700 rounded"
                        style={{
                            gridTemplateColumns: `repeat(${depths}, ${CELL_SIZE}px)`,
                            gridTemplateRows: `repeat(${rows}, ${CELL_SIZE}px)`,
                            gap: '1px',
                            padding: '1px',
                        }}
                    >
                        {blockData.map((rowData, rowIdx) => (
                            rowData.map((occupied, depthIdx) => {
                                const cellId = `B${blockNum}-L${selectedLayer + 1}-R${(rowIdx + 1).toString().padStart(2, '0')}-D${depthIdx + 1}`;
                                return (
                                    <HeatmapCell
                                        key={`${rowIdx}-${depthIdx}`}
                                        occupied={occupied}
                                        cellId={cellId}
                                        onClick={handleCellClick}
                                    />
                                );
                            })
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Layer selector tabs
 */
const LayerSelector = ({ selectedLayer, onLayerChange }) => {
    return (
        <div className="flex gap-1.5 flex-wrap">
            {Array(7).fill(null).map((_, idx) => (
                <button
                    key={idx}
                    onClick={() => onLayerChange(idx)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedLayer === idx
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                        }`}
                >
                    L{idx + 1}
                </button>
            ))}
        </div>
    );
};

/**
 * Main heatmap component
 */
const WarehouseHeatmap = () => {
    const [selectedLayer, setSelectedLayer] = useState(0);

    // Get inventory from store with version tracking
    const inventory = useDashboardStore((state) => state.inventory);
    const inventoryVersion = useDashboardStore((state) => state.inventoryVersion);
    const initializeWarehouse = useDashboardStore((state) => state.initializeWarehouse);
    const isInitialized = useDashboardStore((state) => state.isInitialized);

    // Initialize warehouse on mount
    useEffect(() => {
        if (!isInitialized) {
            initializeWarehouse();
        }
    }, [isInitialized, initializeWarehouse]);

    const heatmapData = useMemo(
        () => generateHeatmapData(inventory, selectedLayer),
        [inventory, inventoryVersion, selectedLayer]
    );

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        🗺️ Warehouse Heatmap
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Top-down view by layer
                    </p>
                </div>

                {/* Layer selector */}
                <LayerSelector selectedLayer={selectedLayer} onLayerChange={setSelectedLayer} />
            </div>

            {/* Legend */}
            <div className="flex gap-4 text-xs border-b border-slate-200 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-slate-600 dark:text-slate-400">Occupied</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-slate-300 dark:bg-slate-600 rounded"></div>
                    <span className="text-slate-600 dark:text-slate-400">Empty</span>
                </div>
                <div className="ml-auto text-slate-500 dark:text-slate-400">
                    Layer {selectedLayer + 1} / 7
                </div>
            </div>

            {/* Heatmaps - side by side */}
            <div className="flex gap-6 justify-center overflow-x-auto py-2">
                <BlockHeatmap
                    blockData={heatmapData.block1}
                    blockNum={1}
                    rows={BLOCK1.ROWS}
                    depths={3}
                    selectedLayer={selectedLayer}
                />

                {/* Aisle indicator */}
                <div className="flex flex-col items-center justify-center px-2">
                    <div className="w-px flex-1 bg-gradient-to-b from-transparent via-blue-400 to-transparent"></div>
                    <span className="text-[10px] text-blue-500 font-medium py-2 whitespace-nowrap">
                        AISLE
                    </span>
                    <div className="w-px flex-1 bg-gradient-to-b from-transparent via-blue-400 to-transparent"></div>
                </div>

                <BlockHeatmap
                    blockData={heatmapData.block2}
                    blockNum={2}
                    rows={BLOCK2.ROWS}
                    depths={8}
                    selectedLayer={selectedLayer}
                />
            </div>

            {/* Footer info */}
            <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center pt-2 border-t border-slate-200 dark:border-slate-700">
                Hover cell to see ID: Block-Layer-Row-Depth
            </div>
        </div>
    );
};

export default WarehouseHeatmap;
