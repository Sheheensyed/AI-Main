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
           
        </>
    )
}

export default Console
