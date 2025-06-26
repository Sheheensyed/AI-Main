import React, { useState } from 'react'
import Button from 'react-bootstrap/Button';

function Console() {
    const [consoleHeight, setConsoleHeight] = useState(200);
    const [consoleVisible, setConsoleVisible] = useState(true);
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
                        style={{
                            height: '5px',
                            cursor: 'row-resize',
                            background: '#555',
                        }}
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
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                        <h6 className="text-center" style={{ color: '#fff' }}>Console Output</h6>
                        <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                            Connecting to robot...
                            {"\n"}Step 1: Power on device
                            {"\n"}Step 2: Initializing...
                            {"\n"}Step 3: Running tests...
                            {"\n"}✅ All systems operational.
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
