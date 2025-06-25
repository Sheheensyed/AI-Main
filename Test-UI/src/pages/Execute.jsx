import React, { useEffect, useState } from 'react';
import { getSingleCase } from '../services/allApi'; // API to fetch /cases/:id
import { useParams } from 'react-router-dom';

function Execute() {
    const { id: caseId } = useParams();
    const [steps, setSteps] = useState([]);
    const [mappedSteps, setMappedSteps] = useState([]);
    const [query, setQuery] = useState('')

    useEffect(() => {
        const fetchCase = async () => {
            try {
                const res = await getSingleCase(caseId);
                console.log('Fetched case:', res.data);

                setSteps(res.data.steps || []);
                setMappedSteps(res.data.mapped_steps || []);
                setQuery(res.data.user_query)
            } catch (error) {
                console.error('Failed to fetch case:', error);
            }
        };

        if (caseId) fetchCase();
    }, [caseId]);

    return (
        <div className="container mt-5">
            <h3>Original Steps</h3>
                        <p>
                            <strong>User-Query:</strong> {query}
                        </p>
            <ol>
                {steps.length ? steps.map((step, i) => (
                    <div>
                        <li key={i}>{step}</li>
                    </div>


                )) : <p>No steps available.</p>}
            </ol>

            <h3 className="mt-4">Mapped Steps</h3>
            <ol>
                {mappedSteps.length ? mappedSteps.map((mStep, index) => (
                    <li key={mStep._id || index}>
                        <strong>Step:</strong> {mStep.step}<br />
                        <strong>API:</strong> {mStep.api}<br />
                        <strong>Parameter:</strong> {mStep.parameter}
                    </li>
                )) : <p>No mapped steps available.</p>}
            </ol>
        </div>
    );
}

export default Execute;
