import React from 'react';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Sun, Moon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';

export const ThemeSwitcher: React.FC = () => {
    const { themeConfig, setThemeConfig } = useDashboard();
    
    return (
        <div className="flex items-center justify-between w-full">
            <span className="text-sm font-medium text-muted-foreground">Theme</span>
            <div className="flex items-center rounded-lg bg-secondary p-0.5">
                <Tooltip content="Light Mode">
                    <Button
                        variant={themeConfig.mode === 'light' ? 'outline' : 'ghost'}
                        size="icon"
                        onClick={() => setThemeConfig(t => ({...t, mode: 'light'}))}
                        className={`h-7 w-7 ${themeConfig.mode === 'light' ? 'bg-background shadow-sm' : ''}`}
                    >
                        <Sun size={14} />
                    </Button>
                </Tooltip>
                <Tooltip content="Dark Mode">
                    <Button
                        variant={themeConfig.mode === 'dark' ? 'outline' : 'ghost'}
                        size="icon"
                        onClick={() => setThemeConfig(t => ({...t, mode: 'dark'}))}
                        className={`h-7 w-7 ${themeConfig.mode === 'dark' ? 'bg-background shadow-sm' : ''}`}
                    >
                        <Moon size={14} />
                    </Button>
                </Tooltip>
            </div>
        </div>
    );
};