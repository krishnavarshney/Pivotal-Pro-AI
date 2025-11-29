import { FC, useState, useRef, useEffect } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardProvider';

export const EditablePageName: FC = () => {
    const { activePage, updatePage } = useDashboard();
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(activePage?.name || 'Dashboard');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setValue(activePage?.name || 'Dashboard');
    }, [activePage?.name]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (value.trim() && activePage && value !== activePage.name) {
            updatePage(activePage.id, { name: value.trim() });
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setValue(activePage?.name || 'Dashboard');
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (!activePage) {
        return <h1 className="text-xl lg:text-2xl font-bold font-display text-foreground">Dashboard</h1>;
    }

    return (
        <div className="flex items-center gap-2 group">
            {isEditing ? (
                <>
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleSave}
                        className="text-xl lg:text-2xl font-bold font-display text-foreground bg-transparent border-b-2 border-primary focus:outline-none min-w-[200px] max-w-[400px]"
                    />
                    <button
                        onClick={handleSave}
                        className="p-1 hover:bg-secondary rounded transition-colors"
                        aria-label="Save"
                    >
                        <Check size={16} className="text-green-600" />
                    </button>
                    <button
                        onClick={handleCancel}
                        className="p-1 hover:bg-secondary rounded transition-colors"
                        aria-label="Cancel"
                    >
                        <X size={16} className="text-destructive" />
                    </button>
                </>
            ) : (
                <>
                    <h1 className="text-xl lg:text-2xl font-bold font-display text-foreground truncate max-w-[400px]">
                        {activePage.name}
                    </h1>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-secondary rounded transition-all"
                        aria-label="Edit page name"
                    >
                        <Edit2 size={14} className="text-muted-foreground" />
                    </button>
                </>
            )}
        </div>
    );
};
