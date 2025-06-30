import React from 'react'
import { useCaseContext } from '../context/CaseContext'

function Live_Cam() {
    const { mappedSteps, setConsoleLog } = useCaseContext();

    const ExecuteStepOneByOne = async () => {
        if (!mappedSteps || mappedSteps.length === 0) {

            setTimeout(() => {

                setConsoleLog(prev => [`❌ No Step Found To Execute`, ...prev]);
            }, 1000);

            return;
        }

        for (let i = 0; i < mappedSteps.length; i++) {
            const step = mappedSteps[i];

            // Log : Step executing
            setConsoleLog(prev => [`⚙️ Step  ${i + 1} Executing:${step.step}`, ...prev])

            //Step execution (delay 2sec)
            await new Promise(res => setTimeout(res, 2000))

            // log: Step complete
            setConsoleLog(prev => [`✅ Execution complete for Step ${i + 1}`, ...prev])
        }

        setConsoleLog(prev => [`🎯 All Steps Executed Successfully.`, ...prev])
    }

    const camUrl = import.meta.env.VITE_CAM_LINK
    return (
        <>
            <div className="p-3 text-center" style={{ height: '65%', overflow: 'hidden' }}>

                <div className='d-flex justify-content-center align-items-center mb-3'>

                    <button className='btn btn-dark px-4' onClick={ExecuteStepOneByOne}>Execute</button>
                    <button className='btn btn-warning ms-2 px-3'>Pause</button>
                    <button className='btn btn-success px-3'>Play</button>

                    <h5 className="mb-0 text-center flex-grow-1">Live Cam</h5>
                    <div style={{ width: '20%' }}></div>
                </div>
                <div className="bg-dark w-100 h-100 rounded" style={{ height: '100%', width: '100%', borderRadius: '8px' }}>{camUrl}</div>
            </div>

        </>
    )
}

export default Live_Cam
