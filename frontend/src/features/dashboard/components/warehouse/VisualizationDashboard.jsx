/**
 * @fileoverview Visualization Dashboard Container
 * Combines all visualization components into a tabbed interface
 */

import { useState } from 'react';
import WarehouseStats from './WarehouseStats';
import WarehouseHeatmap from './WarehouseHeatmap';

/**
 * Tab navigation component
 */
const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${active
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md -mb-px border-b-2 border-blue-500'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
    >
        <span>{icon}</span>
        <span>{label}</span>
    </button>
);

/**
 * Main visualization dashboard
 */
const VisualizationDashboard = () => {
    const [activeTab, setActiveTab] = useState('stats');

    const tabs = [
        { id: 'stats', icon: '📊', label: 'Statistics' },
        { id: 'heatmap', icon: '🗺️', label: 'Heatmap' },
    ];

    return (
        <div className="w-full h-full flex flex-col">
            {/* Tab Navigation */}
            <div className="flex gap-2 px-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                {tabs.map((tab) => (
                    <TabButton
                        key={tab.id}
                        active={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        icon={tab.icon}
                        label={tab.label}
                    />
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto p-4 bg-slate-50 dark:bg-slate-900">
                {activeTab === 'stats' && <WarehouseStats />}
                {activeTab === 'heatmap' && <WarehouseHeatmap />}
            </div>
        </div>
    );
};

export default VisualizationDashboard;
