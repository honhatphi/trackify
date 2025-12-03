/**
 * @fileoverview Row Number Labels component
 * Displays row numbers on warehouse racks for easy tracking
 */

import { Html } from '@react-three/drei';
import { BLOCK1, BLOCK2 } from './constants';

/**
 * Row number labels displayed at the end of each rack row
 * Shows numbers 00-23 for easy identification
 */
const RowLabels = () => {
    return (
        <group name="row-labels">
            {/* Block 1 Row Labels - Left side */}
            {Array.from({ length: BLOCK1.ROWS }).map((_, row) => (
                <Html
                    key={`row-label-b1-${row}`}
                    position={[BLOCK1.X_START - 0.8, 1.5, row - 0.5]}
                    center
                    distanceFactor={8}
                    style={{ pointerEvents: 'none' }}
                >
                    <div
                        className="select-none font-mono font-bold text-2xl px-3 py-2 rounded-lg
                       bg-slate-800/90 dark:bg-slate-900/95
                       text-white border-2 border-slate-600 dark:border-slate-700
                       shadow-lg backdrop-blur-sm"
                        style={{
                            minWidth: '60px',
                            textAlign: 'center',
                            letterSpacing: '0.05em',
                        }}
                    >
                        {(BLOCK1.ROWS - row).toString().padStart(2, '0')}
                    </div>
                </Html>
            ))}

            {/* Block 2 Row Labels - Right side */}
            {Array.from({ length: BLOCK2.ROWS }).map((_, row) => (
                <Html
                    key={`row-label-b2-${row}`}
                    position={[BLOCK2.X_END + 0.8, 1.5, row - 0.5]}
                    center
                    distanceFactor={8}
                    style={{ pointerEvents: 'none' }}
                >
                    <div
                        className="select-none font-mono font-bold text-2xl px-3 py-2 rounded-lg
                       bg-slate-800/90 dark:bg-slate-900/95
                       text-white border-2 border-slate-600 dark:border-slate-700
                       shadow-lg backdrop-blur-sm"
                        style={{
                            minWidth: '60px',
                            textAlign: 'center',
                            letterSpacing: '0.05em',
                        }}
                    >
                        {(BLOCK2.ROWS - row).toString().padStart(2, '0')}
                    </div>
                </Html>
            ))}
        </group>
    );
};

export default RowLabels;
