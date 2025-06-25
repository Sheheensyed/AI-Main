import { createContext, useContext, useEffect, useState } from "react";

const DeviceContext = createContext();

export const DeviceProvider = ({ children }) => {
    const [device, setDevice] = useState(localStorage.getItem('Device') || '')
    const [model, setModel] = useState(localStorage.getItem('Model') || '')
    const [caseId, setCaseId] = useState(null);
    const [mappedSteps, setMappedSteps] = useState([])

    useEffect(() => {
        localStorage.setItem('Device', device)
    }, [device]);

    useEffect(() => {
        localStorage.setItem('Model', model)
    }, [model])

    useEffect(() => {
        const savedCaseId = localStorage.getItem("caseId");
        if (savedCaseId) {
            setCaseId(savedCaseId);
        }
    }, []);


    return (
        <DeviceContext.Provider value={{ device, setDevice, model, setModel, caseId, setCaseId, mappedSteps, setMappedSteps }}>
            {children}
        </DeviceContext.Provider>
    );
};

export default DeviceContext;

export const useDevice = () => useContext(DeviceContext);