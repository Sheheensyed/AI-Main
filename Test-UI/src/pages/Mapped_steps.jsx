import React from 'react';
import { useMappedSteps } from '../context/MappedStepContext';

const Mapped_step = () => {
  const { mappedSteps } = useMappedSteps();

  // Add a safety check
  if (!Array.isArray(mappedSteps)) {
    return <p className="p-6 text-red-500">Mapped steps data not available.</p>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Mapped Steps</h2>
      {mappedSteps.length === 0 ? (
        <p className="text-gray-500">No mapped steps available.</p>
      ) : (
        <ul className="space-y-4">
          {mappedSteps.map((stepObj, idx) => (
            <li key={idx} className="bg-gray-100 p-4 rounded shadow">
              <p><strong>Step:</strong> {stepObj.step}</p>
              <p><strong>API:</strong> {stepObj.api}</p>
              <p><strong>Parameter:</strong> {stepObj.parameter}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Mapped_step;
