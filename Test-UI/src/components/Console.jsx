import React, { useEffect, useState, useRef } from 'react'
import Button from 'react-bootstrap/Button';
import { useCaseContext } from '../context/CaseContext';

function Console() {
    const [consoleHeight, setConsoleHeight] = useState(200);
    const [consoleVisible, setConsoleVisible] = useState(true);
    const { consoleLog, setConsoleLog, mappedSteps } = useCaseContext();
    const consoleRef = useRef(null);

    // Push message only once when mappedSteps is available
    useEffect(() => {
        if (mappedSteps && mappedSteps.length > 0) {
            setConsoleLog((prev) => {
                if (!prev.includes('Steps Generated Successfully...')) {
                    return ['Steps Generated Successfully...', ...prev];
                }
                return prev;
            });
        }
    }, [mappedSteps]);

    // Auto-scroll to bottom on log update
    useEffect(() => {
        if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }
    }, [consoleLog]);

    return (
        <>
            {consoleVisible && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: `${consoleHeight}px`,
                        backgroundColor: '#1e1e1e',
                        borderTop: '2px solid #333',
                        zIndex: 10,
                        color: '#d4d4d4',
                        fontFamily: 'monospace',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {/* Resizer Bar */}
                    <div
                        style={{ height: '5px', cursor: 'row-resize', background: '#555' }}
                        onMouseDown={(e) => {
                            const startY = e.clientY;
                            const startHeight = consoleHeight;

                            const onMouseMove = (e) => {
                                const newHeight = startHeight + (startY - e.clientY);
                                setConsoleHeight(Math.min(Math.max(newHeight, 100), 500));
                            };

                            const onMouseUp = () => {
                                window.removeEventListener('mousemove', onMouseMove);
                                window.removeEventListener('mouseup', onMouseUp);
                            };

                            window.addEventListener('mousemove', onMouseMove);
                            window.addEventListener('mouseup', onMouseUp);
                        }}
                    />

                    {/* Console Output */}
                    <div ref={consoleRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                        <h6 className="text-center" style={{ color: '#fff' }}>Console Output</h6>
                        <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>

                            {consoleLog.length > 0 ? [...consoleLog].reverse().map((step, index) => (
                                <div className='' key={index}>{step}  </div>
                            )) :
                                <span>No Steps Generated...</span>
                            }

                           
                        </pre>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <Button
                size="sm"
                variant="dark"
                onClick={() => setConsoleVisible(!consoleVisible)}
                style={{
                    position: 'absolute',
                    bottom: (consoleVisible ? consoleHeight + 10 : 10),
                    right: 10,
                    zIndex: 20,
                }}
            >
                {consoleVisible ? 'Hide Console' : 'Show Console'}
            </Button>
        </>
    )
}

export default Console
