import { createContext, useContext } from "react";

export const CaseContext = createContext()

export const useCaseContext = () => {
    const context = useContext(CaseContext)
    if (!context) {
        throw new Error('useCasecontext must be used within a CaseContext.Provider')
    }
    return context;
}