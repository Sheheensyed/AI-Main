import React, { useState, useEffect, useRef } from 'react';
import { useCaseContext } from '../context/CaseContext';
import Accordion from 'react-bootstrap/Accordion';
import Button from 'react-bootstrap/Button';

function Center_Panel() {
  const { mappedSteps, setConsoleLog, executeSteps, setExecuteSteps, setActiveStepIndex, activeStepIndex, consoleLog } = useCaseContext();
  const [capturedImage, setCapturedImage] = useState(null);
  const [consoleHeight, setConsoleHeight] = useState(200);
  const [consoleVisible, setConsoleVisible] = useState(true);
  const consoleRef = useRef(null);

  const id = localStorage.getItem('caseId');
  const CAPTURE_URL = import.meta.env.VITE_CAPTURE_SCREEN;
  const camUrl = import.meta.env.VITE_CAM_LINK;

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

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleLog]);

  const ExecuteStepOneByOne = async () => {
    if (!mappedSteps || mappedSteps.length === 0) {
      setTimeout(() => {
        setConsoleLog(prev => [`❌ No Step Found To Execute`, ...prev]);
      }, 1000);
      return;
    }

    for (let i = 0; i < mappedSteps.length; i++) {
      const step = mappedSteps[i];

      setExecuteSteps(prev => [...prev, step]);
      setActiveStepIndex(i);
      setConsoleLog(prev => [`⚙️ Step ${i + 1} Executing : ${step.step}`, ...prev]);

      try {
        const cameraResponse = await fetch(CAPTURE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source_mod: "camera",
            source_id: "/dev/v4l/by-id/usb-e-con_systems_See3CAM_CU135_04249400-video-index0",
          }),
        });

        const data = await cameraResponse.json();
        const base64Image = data.response?.["API No:1(capture screen)"]?.proof_img;

        if (base64Image) {
          const imgSrc = `data:image/png;base64,${base64Image}`;
          setCapturedImage(imgSrc);
          setConsoleLog(prev => [`📸 Captured image for Step ${i + 1}`, ...prev]);

          const saveResponse = await fetch("http://localhost:8000/capture_screen", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              base64_image: base64Image,
              case_id: id,
              step: step.step,
            }),
          });

          const saveData = await saveResponse.json();
          console.log("✅ Saved image URL:", saveData.image_url);
          setCapturedImage(saveData.image_url);

          setConsoleLog(prev => [`💾 Saved image to DB for Step ${i + 1}`, ...prev]);

        } else {
          setConsoleLog(prev => [`⚠️ No proof_img in API response for Step ${i + 1}`, ...prev]);
        }

      } catch (err) {
        console.error(err);
        setConsoleLog(prev => [`❌ Error in Step ${i + 1}: ${err.message}`, ...prev]);
      }

      await new Promise(res => setTimeout(res, 2000));
      setConsoleLog(prev => [`✅ Execution complete for Step ${i + 1}`, ...prev]);
    }

    setConsoleLog(prev => [`🎯 All Steps Executed Successfully.`, ...prev]);
  };

  return (
    <div style={{ height: '98%', width: '100%', position: 'relative' }}>
      {/* Live Cam Area */}
      <div
        style={{
          height: consoleVisible ? `calc(100% - ${consoleHeight}px)` : '100%',
          overflow: 'auto',
        }}
        className="p-3 text-center mt-3"
      >
        <div className='d-flex justify-content-center align-items-center mb-3'>
          <button className='btn btn-dark px-4 shadow' onClick={ExecuteStepOneByOne}>Execute</button>
          <button className='btn btn-warning ms-2 px-3'>Pause</button>
          <button className='btn btn-success px-3'>Play</button>
          <h5 className="mb-0 text-center flex-grow-1">Live Cam</h5>
          <div style={{ width: '20%' }}></div>
        </div>
        <div className="w-100 h-100 rounded">
          <img src={camUrl} alt="Live-Cam" style={{ height: '100%', width: '100%' }} />
        </div>

        <Accordion className='my-3'>
          {executeSteps.map((item, index) => (
            <Accordion.Item key={index} eventKey={(index + 1).toString()}>
              <Accordion.Header>Step {index + 1} {activeStepIndex === index && '*'} {item.step}</Accordion.Header>
              <Accordion.Body className='bg-light' style={{ textAlign: 'justify' }}>
                {capturedImage ?
                  <img src={`data:image/jpeg;base64,${capturedImage}`} alt="step image" style={{ maxWidth: '100%', height: 'auto' }} />
                  :
                  <p>No image Available</p>}
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      </div>

      {/* Console Panel */}
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
          {/* Resizer */}
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

          {/* Toggle Button inside Console */}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setConsoleVisible(false)}
            style={{
              position: 'absolute',
              top: 5,
              right: 10,
              zIndex: 11,
            }}
          >
            Hide Console
          </Button>

          {/* Logs */}
          <div ref={consoleRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            <h6 className="text-center" style={{ color: '#fff' }}>Console Output</h6>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
              {consoleLog.length > 0 ? [...consoleLog].reverse().map((step, index) => (
                <div key={index}>{step}</div>
              )) :
                <span>No Steps Generated...</span>
              }
            </pre>
          </div>
        </div>
      )}

      {/* Show Console Button (when hidden) */}
      {!consoleVisible && (
        <Button
          size="sm"
          variant="dark"
          onClick={() => setConsoleVisible(true)}
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            zIndex: 20,
          }}
        >
          Show Console
        </Button>
      )}
    </div>
  );
}

export default Center_Panel;
