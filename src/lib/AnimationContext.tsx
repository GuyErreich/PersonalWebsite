import React, { createContext, useContext } from 'react';
import { AnimationOrchestrator } from './AnimationOrchestrator';

// Create a Context that holds our Orchestrator instance
export const AnimationContext = createContext<AnimationOrchestrator | null>(null);

// Provider Component to wrap the scene
export const AnimationProvider = ({ 
    orchestrator, 
    children 
}: { 
    orchestrator: AnimationOrchestrator, 
    children: React.ReactNode 
}) => {
    return (
        <AnimationContext.Provider value={orchestrator}>
            {children}
        </AnimationContext.Provider>
    );
};

// Custom hook to cleanly consume the orchestrator
export const useOrchestrator = () => {
    const context = useContext(AnimationContext);
    if (!context) {
        throw new Error("useOrchestrator must be used within an AnimationProvider");
    }
    return context;
};
