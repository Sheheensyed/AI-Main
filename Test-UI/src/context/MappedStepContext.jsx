import React, { createContext, useContext, useState } from 'react'

const MappedStepContext = createContext()

export const MappedStepsProvider = ({ children }) => {
    const [mappedSteps, setMappedSteps] = useState([])

    return (
        <MappedStepContext.Provider value={{ mappedSteps, setMappedSteps }}>
            {children}
        </MappedStepContext.Provider>
    )
}

export const useMappedSteps = () => useContext(MappedStepContext)