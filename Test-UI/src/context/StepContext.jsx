import { createContext, useContext, useState } from "react";

const StepContext = createContext()

export const StepProvider = ({ children }) => {
    const [steps, setSteps] = useState([])

    return (

        <StepContext.Provider value={{ steps, setSteps }}>
            {children}
        </StepContext.Provider>

    )
}

export const useStepContext = () => useContext(StepContext);