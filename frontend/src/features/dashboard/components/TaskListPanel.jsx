/**
 * @fileoverview Task List Panel Component
 * Semi-transparent overlay showing active shuttle tasks
 * Per 03_functional_requirements.md section 3.2
 */

import { useState } from 'react';
import {
  X,
  ChevronDown,
  Package,
  ArrowRight,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCcw,
} from 'lucide-react';
import { useDashboardStore } from '@/store/useDashboardStore';

// =============================================================================
// CONSTANTS
// =============================================================================

const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

const TASK_STATUS_CONFIG = {
  [TASK_STATUS.PENDING]: {
    label: 'Pending',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/40',
    icon: Clock,
  },
  [TASK_STATUS.IN_PROGRESS]: {
    label: 'Running',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/40',
    icon: Loader2,
    animate: true,
  },
  [TASK_STATUS.COMPLETED]: {
    label: 'Completed',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
    icon: CheckCircle2,
  },
  [TASK_STATUS.FAILED]: {
    label: 'Failed',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/40',
    icon: AlertCircle,
  },
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Individual Task Item
 */
const TaskItem = ({ task, isExpanded, onToggle }) => {
  const config = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG.pending;
  const StatusIcon = config.icon;

  return (
    <div className="border-b border-gray-200/30 dark:border-gray-700/30 last:border-b-0
                    transition-all duration-200">
      {/* Task Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3
                   hover:bg-gray-50 dark:hover:bg-gray-800/50
                   active:bg-gray-100 dark:active:bg-gray-800
                   transition-all duration-200"
      >
        {/* Status Icon */}
        <div className={`p-2 rounded-xl ${config.bgColor} transition-transform duration-200
                        ${isExpanded ? 'scale-110' : ''}`}>
          <StatusIcon
            size={16}
            className={`${config.color} ${config.animate ? 'animate-spin' : ''}`}
          />
        </div>

        {/* Task Info */}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              Task #{task.id}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold shadow-sm
                            ${task.status === 'pending'
                ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-700'
                : task.status === 'in_progress'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700'
                  : task.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-200 dark:border-emerald-700'
                    : 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/50 dark:text-red-200 dark:border-red-700'}`}>
              {config.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
            Shuttle {task.shuttleId}
          </p>
        </div>

        {/* Expand Toggle */}
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded Details */}
      <div className={`overflow-hidden transition-all duration-300 ease-out
                      ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-3 space-y-2">
          {/* Route Info */}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg
                           border border-gray-200 dark:border-gray-700">
              <Package size={14} className="text-gray-500" />
              <span className="font-mono text-xs font-medium text-gray-700 dark:text-gray-300">
                {task.sourceBin}
              </span>
            </div>
            <ArrowRight size={14} className="text-gray-400" />
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg
                           border border-gray-200 dark:border-gray-700">
              <Package size={14} className="text-gray-500" />
              <span className="font-mono text-xs font-medium text-gray-700 dark:text-gray-300">
                {task.targetBin}
              </span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
            <span className="px-2 py-1 bg-gray-50 dark:bg-gray-800/50 rounded">Type: {task.type}</span>
            {task.eta && <span className="px-2 py-1 bg-gray-50 dark:bg-gray-800/50 rounded">ETA: {task.eta}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Panel Header with controls
 */
const PanelHeader = ({ tasksCount, onClose, onRefresh }) => (
  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/30 dark:border-gray-700/30">
    <div className="flex items-center gap-2">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
        Task List
      </h3>
      <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary font-semibold rounded-full
                       border border-primary/20">
        {tasksCount}
      </span>
    </div>
    <div className="flex items-center gap-1">
      <button
        onClick={onRefresh}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800
                   transition-all duration-200 hover:scale-110 active:scale-95"
        aria-label="Refresh"
      >
        <RefreshCcw size={14} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
      </button>
      <button
        onClick={onClose}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800
                   transition-all duration-200 hover:scale-110 active:scale-95"
        aria-label="Close"
      >
        <X size={14} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
      </button>
    </div>
  </div>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * TaskListPanel Component
 * Semi-transparent overlay showing active tasks
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the panel is visible
 * @param {function} props.onClose - Callback to close the panel
 */
export const TaskListPanel = ({ isOpen = true, onClose = () => { } }) => {
  const { tasks } = useDashboardStore();
  const [expandedTask, setExpandedTask] = useState(null);

  const handleToggleTask = (taskId) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  const handleRefresh = () => {
    // Refresh tasks - in real app, this would fetch from API
    console.log('Refreshing tasks...');
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 z-30 animate-slide-in-right">
      {/* Glassmorphism Container */}
      <div className="overlay-panel overflow-hidden">
        <PanelHeader
          tasksCount={tasks.length}
          onClose={onClose}
          onRefresh={handleRefresh}
        />

        {/* Task List */}
        <div className="max-h-96 overflow-y-auto scrollbar-thin">
          {tasks.length > 0 ? (
            <div className="animate-stagger">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isExpanded={expandedTask === task.id}
                  onToggle={() => handleToggleTask(task.id)}
                />
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center animate-fade-in">
              <Package size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                No tasks available
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskListPanel;
