import React, { useEffect } from 'react'
import { useMappedSteps } from '../context/MappedStepContext'
import { useNavigate } from 'react-router-dom';
import { updateMappedStepsInDB } from '../services/allApi';
import { useDevice } from '../context/Temp';

function Map() {
    const { mappedSteps } = useMappedSteps();
    const { device, model, caseId, setCaseId } = useDevice(); // ✅ Use caseId from context
    const navigate = useNavigate();

    console.log("📦 useDevice():", useDevice());
    console.log("📦 DeviceContext Values:", { device, model, caseId });

    const handleSave = async () => {
        const payload = {
            mapped_steps: mappedSteps,
        };

        try {
            if (!caseId) {
                alert("❌ Case ID not found!");
                return;
            }

            console.log("🆔 Sending PATCH to update mapped steps for:", caseId);
            const res = await updateMappedStepsInDB(caseId, payload);
            console.log("✅ Mapped steps updated:", res.data);
            alert("Mapped steps saved to existing document!");
            navigate("/");
        } catch (err) {
            console.error("❌ Error updating mapped steps:", err);
            alert("Failed to update steps.");
        }
    };

    useEffect(() => {
        if (!caseId) {
            const storedId = localStorage.getItem("caseId");
            if (storedId) {
                setCaseId(storedId); // Optional: sync it back to context
            }
        }
    }, [caseId]);

    return (
        <div className="container d-flex justify-content-center vh-100 align-items-center">
            <div className="row">
                <div className="col-12 col-lg-6">
                    <div className='border border-2 p-3 m-1 d-flex justify-content-center align-items-center flex-column'>
                        <h1 className='text-center'>Mapped Steps</h1>
                        <ul>
                            {mappedSteps?.map((item, index) => (
                                <li className='text-center' key={index}>{item}</li>
                            ))}
                        </ul>
                        <button className='btn btn-success' onClick={handleSave}>Ok</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Map;
