import React, { useEffect } from 'react';
import { useStepContext } from '../context/StepContext';
import { getSingleCase } from '../services/allApi';
import { useParams } from 'react-router-dom';

function List() {
    const { steps, setSteps } = useStepContext();
    const { caseId } = useParams();

    useEffect(() => {
        const fetchCase = async () => {
            try {
                const response = await getSingleCase(caseId);
                console.log("📦 Full response from getSingleCase:", response);

                // Safely access steps
                const fetchedSteps = response?.data?.steps;
                if (Array.isArray(fetchedSteps)) {
                    setSteps(fetchedSteps);
                } else {
                    console.warn("⚠️ No steps array found in response:", response.data);
                }
            } catch (err) {
                console.error("❌ Error fetching case:", err);
            }
        };

        if (caseId) fetchCase();
    }, [caseId, setSteps]);

    return (
        <div className="container mt-5">
            <h3>Original Steps</h3>
            {Array.isArray(steps) && steps.length > 0 ? (
                <ol>
                    {steps.map((step, i) => (
                        <li key={i}>{step}</li>
                    ))}
                </ol>
            ) : (
                <p>No steps found.</p>
            )}
        </div>
    );
}

export default List;
