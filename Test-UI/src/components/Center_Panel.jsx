import React, { useState, useEffect, useRef } from 'react';
import { useCaseContext } from '../context/CaseContext';
import Accordion from 'react-bootstrap/Accordion';
import Button from 'react-bootstrap/Button';
import { ChevronDown, ChevronUp } from 'lucide-react';

function Center_Panel() {
  const { mappedSteps, setConsoleLog, executeSteps, setExecuteSteps, setActiveStepIndex, activeStepIndex, consoleLog } = useCaseContext();
  console.log("mappedSteps:", mappedSteps);
  console.log("executedSteps before set:", executeSteps);
  console.log("executeSteps in render:", executeSteps);


  const [capturedImage, setCapturedImage] = useState(null);
  const [consoleHeight, setConsoleHeight] = useState(200);
  const [consoleVisible, setConsoleVisible] = useState(true); // ✅ Start visible
  const [consoleExpanded, setConsoleExpanded] = useState(false); // ✅ Start expanded
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
        setConsoleLog((prev) => ['❌ No Step Found To Execute', ...prev]);
      }, 1000);
      return;
    }

    const executedSteps = [];

    for (let i = 0; i < mappedSteps.length; i++) {
      const step = mappedSteps[i];
      setActiveStepIndex(i);
      setConsoleLog((prev) => [`⚙️ Step ${i + 1} Executing: ${step.step}`, ...prev]);

      try {
        const cameraResponse = await fetch(CAPTURE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_mod: 'camera',
            source_id: '/dev/v4l/by-id/usb-e-con_systems_See3CAM_CU135_04249400-video-index0',
          }),
        });

        const data = await cameraResponse.json();
        const base64Image = data.response?.['API No:1(capture screen)']?.proof_img;

        if (base64Image) {
          const imgSrc = `data:image/png;base64,${base64Image}`;
          setCapturedImage(imgSrc)
          setConsoleLog((prev) => [`📸 Captured image for Step ${i + 1}`, ...prev]);

          const saveResponse = await fetch('http://localhost:8000/execute_with_gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64_image: base64Image,
              case_id: id,
              step: step.step,
            }),
          });

          const saveData = await saveResponse.json();
          console.log('✅ Saved image URL:', saveData.image_url);
          setCapturedImage(saveData.image_url);


          setConsoleLog((prev) => [`💾 Saved image to DB for Step ${i + 1}`, ...prev]);

          let enrichedStep = { ...step };
          enrichedStep.proof_image = saveData.image_url;

          if (saveData.action_result) {
            enrichedStep.action_result = saveData.action_result;
          }

          executedSteps.push(enrichedStep);

          if (saveData.action_result?.status === 'aborted') {
            setConsoleLog((prev) => [`🚫 Step Aborted by Gemini: ${step.step}`, ...prev]);
            continue;
          }

          if (saveData.action_result?.status?.includes('swipe')) {
            const swipeDirection = saveData.action_result.status.replace('_executed', '');
            setConsoleLog((prev) => [`🧭 Swipe triggered: ${swipeDirection}`, ...prev]);
          }
        } else {
          setConsoleLog((prev) => [`⚠️ No proof_img in API response for Step ${i + 1}`, ...prev]);
        }
      } catch (err) {
        console.error(err);
        setConsoleLog((prev) => [`❌ Error in Step ${i + 1}: ${err.message}`, ...prev]);
      }

      await new Promise((res) => setTimeout(res, 2000));
      setConsoleLog((prev) => [`✅ Execution complete for Step ${i + 1}`, ...prev]);
    }

    // ✅ Set all steps at once AFTER the loop
    setExecuteSteps(executedSteps);

    setConsoleLog((prev) => ['🎯 All Steps Executed Successfully.', ...prev]);
  };

  // const handleManualExecution = async () => {
  //   const caseId = localStorage.getItem('caseId');

  //   if (!caseId) {
  //     setConsoleLog(prev => ["❌ No Case ID found in localStorage", ...prev]);
  //     return;
  //   }

  //   try {
  //     setConsoleLog(prev => ["🔧 Starting manual execution...", ...prev]);

  //     const response = await fetch("http://localhost:8000/execute_all_manual_steps", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json"
  //       },
  //       body: JSON.stringify({ case_id: caseId })
  //     });

  //     const data = await response.json();

  //     if (response.ok) {
  //       setConsoleLog(prev => [`✅ Manual execution complete`, ...prev]);
  //       console.log("Manual Execution Result:", data);

  //       // Optional: show detailed step summary
  //       if (data.summary) {
  //         data.summary.forEach((step) => {
  //           setConsoleLog(prev => [`🔹 Step: ${step.step} — ${step.status}`, ...prev]);
  //         });
  //       }
  //     } else {
  //       setConsoleLog(prev => [`❌ Manual Execution Failed: ${data.detail || "Unknown error"}`, ...prev]);
  //     }

  //   } catch (error) {
  //     console.error("🔥 Manual Execution Error:", error);
  //     setConsoleLog(prev => [`❌ Manual Execution Error: ${error.message}`, ...prev]);
  //   }
  // };

  const handleManualStepByStep = async () => {
    const caseId = localStorage.getItem('caseId');
    if (!caseId || !mappedSteps || mappedSteps.length === 0) {
      setConsoleLog(prev => ["❌ Missing Case ID or mapped steps", ...prev]);
      return;
    }

    for (let i = 0; i < mappedSteps.length; i++) {
      const step = mappedSteps[i];
      const stepName = step.step;

      setActiveStepIndex(i);
      setConsoleLog(prev => [`⚙️ Executing step ${i + 1}: ${stepName}`, ...prev]);

      try {
        const response = await fetch("http://localhost:8000/execute_manual_step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ case_id: caseId, step: stepName })
        });

        const result = await response.json();

        const enrichedStep = { ...step };
        if (result.action_result) {
          enrichedStep.action_result = result.action_result;
        }

        setExecuteSteps(prev => [...prev, enrichedStep]);

        if (result.status === "completed") {
          setConsoleLog(prev => [`✅ Step ${stepName} completed`, ...prev]);

          // ✅ If OCR result present, show extracted value
          if (result.ocr_result && result.ocr_result.extracted_value) {
            setConsoleLog(prev => [
              `🔍 OCR Extracted Value: ${result.ocr_result.extracted_value}`,
              ...prev
            ]);
          }

        } else if (result.status === "failed") {
          setConsoleLog(prev => [`❌ Step ${stepName} failed`, ...prev]);
          break;
        } else {
          setConsoleLog(prev => [`⚠️ Step ${stepName} skipped: ${result.reason}`, ...prev]);
        }

        await new Promise(res => setTimeout(res, 2000));

      } catch (err) {
        setConsoleLog(prev => [`🔥 Error executing step ${stepName}: ${err.message}`, ...prev]);
        break;
      }
    }

    setConsoleLog(prev => ["🎯 Manual execution (step-by-step) complete", ...prev]);
  };

  return (
    <div style={{
      width: '100%',
      position: 'relative',
      height: '100%',
      display: 'flex', flexDirection: 'column'
    }}

    >
      {/* Main Content */}
      <div style={{ flexGrow: 1, overflow: 'auto' }} className="p-3 text-center mt-3">
        <div className="d-flex justify-content-center align-items-center mb-3">

          <button className="btn btn-dark px-4 shadow" hidden onClick={ExecuteStepOneByOne}>
            Execute
          </button>

          {/* <button className=' ms-2 mt-3 px-4 shadow' style={{
            height: '35px',
                            // display: 'inline-flex',
                            boxSizing: 'border-box',
                            letterSpacing: '0.05857em',
                            boxShadow: 'rgba(0, 0, 0, 0.2) 0px 3px 1px -2px, rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px',
                            color: 'white',
                            fontSize: '1em',
                            outline: 0,
                            border: 'none',
                            // transition: 'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1), border-color 250ms cubic-bezier(0.4, 0, 0.2, 1), color 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                            background: 'linear-gradient(135deg,rgba(51, 191, 255)-26.55%,rgba(93, 92, 229)93.75%)',
                            // background:'rgba(51, 145, 255, 1)',
                            // background:'rgba(0, 88, 191, 1)',
                            // background:'rgba(140, 201, 255, 1)',
                            borderRadius: '8px',
          }} onClick={handleManualExecution}>Execute</button> */}

          <button disabled className=' ms-2 mt-3 px-4 shadow' style={{
            height: '35px',
            // display: 'inline-flex',
            boxSizing: 'border-box',
            letterSpacing: '0.05857em',
            boxShadow: 'rgba(0, 0, 0, 0.2) 0px 3px 1px -2px, rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px',
            color: 'white',
            fontSize: '1em',
            outline: 0,
            border: 'none',
            // transition: 'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1), border-color 250ms cubic-bezier(0.4, 0, 0.2, 1), color 250ms cubic-bezier(0.4, 0, 0.2, 1)',
            background: 'linear-gradient(135deg,rgba(51, 191, 255)-26.55%,rgba(93, 92, 229)93.75%)',
            // background:'rgba(51, 145, 255, 1)',
            // background:'rgba(0, 88, 191, 1)',
            // background:'rgba(140, 201, 255, 1)',
            borderRadius: '8px',
          }} onClick={handleManualStepByStep}>Execute</button>

          {/* <h5 className="mb-0 text-center flex-grow-1">Live Cam</h5> */}
          <div style={{ width: '20%' }}></div>
          <div style={{ width: '20%' }}></div>
          <div style={{ width: '20%' }}></div>
          <div style={{ width: '20%' }}></div>
        </div>

        <div className=" my-3">
          <img src={camUrl} alt="Live-Cam" className="rounded-3" style={{ width: '100%' }} />
        </div>


        {executeSteps.map((item, index) => (
          <Accordion className="" key={index}>
            <Accordion.Item eventKey={(index + 1).toString()}>
              <Accordion.Header>
                Step {index + 1} {activeStepIndex === index && '*'} {item.step}
                {item?.action_result?.status === 'aborted' && (
                  <span className="ms-2 badge bg-danger">Aborted</span>
                )}
                {item?.action_result?.action === 'swipe' && (
                  <span className="ms-2 badge bg-primary text-uppercase">
                    {item?.action_result?.direction?.replace('swipe_', '')}
                  </span>
                )}
              </Accordion.Header>
              <Accordion.Body
                className={item?.action_result?.status === 'aborted' ? 'bg-danger-subtle' : 'bg-light'}
                style={{ textAlign: 'justify' }}
              >
                {capturedImage ? (
                  <div className="d-flex justify-content-center">
                    <img
                      src={capturedImage}
                      alt="step image"
                      style={{ maxWidth: '40%', height: '300px' }}
                    />
                  </div>
                ) : (
                  <p>No image Available</p>
                )}
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        ))}

      </div>

      {/* Console Panel */}
      {consoleVisible && (
        <div style={{
          bottom: 0, left: 0, right: 0, height: consoleExpanded ? `${consoleHeight}px` : '40px', backgroundColor: '#1e1e1e', borderTop: '2px solid #333', zIndex: 10, color: 'silver', fontFamily: 'monospace', display: 'flex', flexDirection: 'column',
          position: 'absolute'
        }}>

          {/* Drag Bar */}
          {consoleExpanded && (
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
          )}

          {/* Console Header */}
          <div onClick={() => setConsoleExpanded(!consoleExpanded)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1rem', background: '#111', height: '40px', cursor: 'pointer' }}>
            <Button size="sm" variant="outline-light" style={{ color: '#fff' }} onClick={(e) => { e.stopPropagation(); setConsoleVisible(false) }}>
              Hide
            </Button>
            <h6 className="mb-0 text-light">Console</h6>
            <Button variant="link" size="sm" style={{ color: '#fff' }} onClick={(e) => { e.stopPropagation(); setConsoleExpanded(!consoleExpanded); }}>
              {consoleExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </Button>
          </div>

          {/* Console Body */}
          {consoleExpanded && (
            <div ref={consoleRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem', backgroundColor: '#000' }}>
              <pre style={{ whiteSpace: 'pre-wrap' }}>
                {consoleLog.length > 0 ? (
                  [...consoleLog].reverse().map((step, index) => (
                    <div key={index}>{step}</div>
                  ))
                ) : (
                  <em>No Steps Generated...</em>
                )}
              </pre>
            </div>
          )}
        </div>
      )}

      {!consoleVisible && (
        <Button size="sm" variant="dark" onClick={() => setConsoleVisible(true)} style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 20, }}>
          Show Console
        </Button>
      )}

    </div>
  );
}

export default Center_Panel;