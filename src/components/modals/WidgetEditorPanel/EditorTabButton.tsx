
import React, { FC, Dispatch, SetStateAction, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../ui/utils';

interface EditorTabButtonProps {
    tabId: string;
    activeTab: string;
    setActiveTab: Dispatch<SetStateAction<string>>;
    icon: ReactNode;
    children: ReactNode;
}

export const EditorTabButton: FC<EditorTabButtonProps> = ({ tabId, activeTab, setActiveTab, icon, children }) => {
    
    return (
        <button
            onClick={() => setActiveTab(tabId)}
            className={cn(
                "flex-1 flex justify-center items-center gap-2 p-3 font-semibold text-sm transition-colors relative",
                activeTab === tabId ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
        >
            {icon}
            {children}
            {activeTab === tabId && <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" layoutId="editor-tab-underline" />}
        </button>
    );
};
