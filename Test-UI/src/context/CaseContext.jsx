import { createContext, useContext, useState } from 'react';

const CaseContext = createContext();

export const CaseProvider = ({ children }) => {
    const [mappedSteps, setMappedSteps] = useState([]); // ✅ initialize as array

    return (
        <CaseContext.Provider value={{ mappedSteps, setMappedSteps}}>
            {children}
        </CaseContext.Provider>
    );
};

export const useCase = () => useContext(CaseContext);
