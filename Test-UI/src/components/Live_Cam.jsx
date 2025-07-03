import React, { act, useState } from 'react'
import { useCaseContext } from '../context/CaseContext'
import Accordion from 'react-bootstrap/Accordion';
import { executeSteps } from '../services/allApi';

function Live_Cam() {
    const { mappedSteps, setConsoleLog, executeSteps, setExecuteSteps, setActiveStepIndex, activeStepIndex } = useCaseContext();
    console.log(mappedSteps);
    const [capturedImage, setCapturedImage] = useState(null);



    const ExecuteStepOneByOne = async () => {
        if (!mappedSteps || mappedSteps.length === 0) {
            setTimeout(() => {
                setConsoleLog(prev => [`❌ No Step Found To Execute`, ...prev]);
            }, 1000);
            return;
        }

        for (let i = 0; i < mappedSteps.length; i++) {
            const step = mappedSteps[i];

            // 1️⃣ Update UI step status
            setExecuteSteps(prev => [...prev, step]);
            setActiveStepIndex(i);

            // 2️⃣ Log starting
            setConsoleLog(prev => [`⚙️ Step ${i + 1} Executing : ${step.step}`, ...prev]);

            try {
                // ✅ 3️⃣ Call your external CAPTURE API
                const cameraResponse = await fetch(import.meta.env.capture_screen, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        source_mod: "camera",
                        source_id: "/dev/v4l/by-id/",
                    }),
                });

                const data = await cameraResponse.json();

                const base64Image = data.response?.["API No:1(capture screen)"]?.proof_img;

                if (base64Image) {
                    // 4️⃣ Convert to <img> for preview
                    const imgSrc = `data:image/png;base64,${base64Image}`;
                    setCapturedImage(imgSrc);

                    setConsoleLog(prev => [`📸 Captured image for Step ${i + 1}`, ...prev]);

                    // ✅ 5️⃣ Send to your own backend to store in MongoDB
                    await fetch("http://localhost:8000/capture_screen", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            base64_image: base64Image,
                            case_id: "<YOUR_CASE_ID>",
                            step: step.step,
                        }),
                    });

                    setConsoleLog(prev => [`💾 Saved image to MongoDB for Step ${i + 1}`, ...prev]);
                } else {
                    setConsoleLog(prev => [`⚠️ No proof_img found in API response for Step ${i + 1}`, ...prev]);
                }

            } catch (err) {
                console.error(err);
                setConsoleLog(prev => [`❌ Error in Step ${i + 1}: ${err.message}`, ...prev]);
            }

            // ✅ 6️⃣ Delay before next step
            await new Promise(res => setTimeout(res, 2000));

            // 7️⃣ Log step complete
            setConsoleLog(prev => [`✅ Execution complete for Step ${i + 1}`, ...prev]);
        }

        setConsoleLog(prev => [`🎯 All Steps Executed Successfully.`, ...prev]);
    };



    const camUrl = import.meta.env.capture_screen
    return (
        <>
            <div className="p-3 text-center mt-3" style={{ height: '65%', overflow: 'auto' }}>

                <div className='d-flex justify-content-center align-items-center mb-3'>

                    <button className='btn btn-dark px-4 shadow' onClick={ExecuteStepOneByOne}>Execute</button>
                    <button className='btn btn-warning ms-2 px-3'>Pause</button>
                    <button className='btn btn-success px-3'>Play</button>

                    <h5 className="mb-0 text-center flex-grow-1">Live Cam</h5>
                    <div style={{ width: '20%' }}></div>
                </div>
                <div className="bg-dark w-100 h-100 rounded" style={{ height: '100%', width: '100%', borderRadius: '8px' }}>
                    <img src={camUrl} alt="" style={{ height: '100px', width: '100px' }} />
                </div>

                <Accordion className='my-3'>
                    {executeSteps.map((item, index) => (
                        <Accordion.Item eventKey={(index + 1).toString()} >
                            <Accordion.Header key={index} > Step {index + 1} {activeStepIndex === index && '*'} {item.step}</Accordion.Header>
                            <Accordion.Body className='bg-light' style={{ textAlign: 'justify' }}>
                                {/* style={{ backgroundColor: activeStepIndex === index ? "#f0ad4e" : "inherit", color: activeStepIndex === index ? '#000' : 'inherit', textAlign: 'justify' }} */}
                                {item.parameter}
                                {capturedImage && (
                                    <img src={capturedImage} alt="Captured" style={{ maxWidth: "400px" }} />
                                )}

                                {/* {console.log("Image data for step", index, ":", item.image)}
                                {item.image ? <img src={`data:image/jpeg;base64,${item.image}`} alt="step image" style={{ maxWidth: '100%', height: 'auto' }}
                                /> :
                                    <p>No image Available</p>} */}
                            </Accordion.Body>
                        </Accordion.Item>
                    ))}
                </Accordion>

            </div>

        </>
    )
}

export default Live_Cam
