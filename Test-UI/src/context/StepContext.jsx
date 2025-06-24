import { createContext, useContext, useState } from "react";

const stepContext = createContext()

export const StepProvider = ({ children }) => {
    const [step, setStep] = useState('')

    return (

        <stepContext.Provider value={{ step, setStep }}>
            {children}
        </stepContext.Provider>

    )
}

export const useStepContext = () => useContext(stepContext);