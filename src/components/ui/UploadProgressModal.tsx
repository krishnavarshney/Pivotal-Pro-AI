import { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, Database, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from './utils';

import { UploadProgress } from '../utils/types';

const stageConfig = {
    uploading: {
        icon: Upload,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        label: 'Uploading',
    },
    parsing: {
        icon: FileSpreadsheet,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
        label: 'Parsing Data',
    },
    processing: {
        icon: Database,
        color: 'text-primary',
        bg: 'bg-primary/10',
        label: 'Processing',
    },
    complete: {
        icon: CheckCircle,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        label: 'Complete',
    },
    error: {
        icon: XCircle,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        label: 'Error',
    },
};

export const UploadProgressModal: FC<{ progress: UploadProgress | null; onClose?: () => void }> = ({ 
    progress,
    onClose 
}) => {
    if (!progress) return null;

    const config = stageConfig[progress.stage];
    const Icon = config.icon;

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '';
        const mb = bytes / (1024 * 1024);
        return mb.toFixed(2) + ' MB';
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm"
            >
                {/* Background gradient */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    />
                </div>

                {/* Main content */}
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="relative bg-card border border-border rounded-2xl shadow-2xl p-8 w-full max-w-lg mx-4"
                >
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <motion.div
                            className={cn("w-16 h-16 rounded-2xl flex items-center justify-center", config.bg)}
                            animate={progress.stage !== 'complete' && progress.stage !== 'error' ? {
                                scale: [1, 1.05, 1],
                                rotate: progress.stage === 'uploading' ? [0, 360] : [0, 5, -5, 0],
                            } : {}}
                            transition={{
                                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                                rotate: progress.stage === 'uploading' 
                                    ? { duration: 2, repeat: Infinity, ease: "linear" }
                                    : { duration: 2, repeat: Infinity, ease: "easeInOut" }
                            }}
                        >
                            <Icon size={32} className={config.color} strokeWidth={2} />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-foreground truncate">
                                {progress.fileName}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                {config.label}
                            </p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{progress.message}</span>
                            <span className="font-semibold text-foreground">{Math.round(progress.progress)}%</span>
                        </div>
                        <div className="h-3 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                                className={cn(
                                    "h-full rounded-full",
                                    progress.stage === 'error' ? 'bg-red-500' :
                                    progress.stage === 'complete' ? 'bg-green-500' :
                                    'bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_100%]'
                                )}
                                initial={{ width: 0 }}
                                animate={{
                                    width: `${progress.progress}%`,
                                    backgroundPosition: progress.stage !== 'complete' && progress.stage !== 'error' 
                                        ? ['0% 50%', '100% 50%', '0% 50%'] 
                                        : undefined
                                }}
                                transition={{
                                    width: { duration: 0.5, ease: "easeOut" },
                                    backgroundPosition: { duration: 2, repeat: Infinity, ease: "linear" }
                                }}
                            />
                        </div>
                    </div>

                    {/* File size info */}
                    {progress.fileSize && (
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-6 p-3 bg-secondary/50 rounded-lg">
                            <span>File Size:</span>
                            <span className="font-medium">
                                {progress.uploadedSize && progress.stage === 'uploading' 
                                    ? `${formatFileSize(progress.uploadedSize)} / ${formatFileSize(progress.fileSize)}`
                                    : formatFileSize(progress.fileSize)
                                }
                            </span>
                        </div>
                    )}

                    {/* Stage indicators */}
                    <div className="flex items-center justify-between mb-6">
                        {(['uploading', 'parsing', 'processing', 'complete'] as const).map((stage, index) => {
                            const stageIndex = ['uploading', 'parsing', 'processing', 'complete'].indexOf(progress.stage);
                            const currentIndex = ['uploading', 'parsing', 'processing', 'complete'].indexOf(stage);
                            const isActive = currentIndex === stageIndex;
                            const isComplete = currentIndex < stageIndex || progress.stage === 'complete';
                            const StageIcon = stageConfig[stage].icon;

                            return (
                                <div key={stage} className="flex flex-col items-center gap-2 flex-1">
                                    <motion.div
                                        className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                                            isComplete ? "bg-primary border-primary text-primary-foreground" :
                                            isActive ? "bg-primary/20 border-primary text-primary" :
                                            "bg-secondary border-border text-muted-foreground"
                                        )}
                                        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        {isComplete ? (
                                            <CheckCircle size={20} />
                                        ) : (
                                            <StageIcon size={20} />
                                        )}
                                    </motion.div>
                                    <span className={cn(
                                        "text-xs font-medium",
                                        isActive || isComplete ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                        {stageConfig[stage].label}
                                    </span>
                                    {index < 3 && (
                                        <div className="absolute h-0.5 bg-border" style={{
                                            width: 'calc(25% - 2.5rem)',
                                            left: `calc(${(index + 1) * 25}% - 1.25rem)`,
                                            top: '1.25rem'
                                        }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Loading spinner for active stages */}
                    {progress.stage !== 'complete' && progress.stage !== 'error' && (
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Loader2 size={16} className="animate-spin" />
                            <span>Please wait...</span>
                        </div>
                    )}

                    {/* Success/Error message */}
                    {(progress.stage === 'complete' || progress.stage === 'error') && onClose && (
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={onClose}
                            className={cn(
                                "w-full py-3 rounded-lg font-semibold transition-colors",
                                progress.stage === 'complete' 
                                    ? "bg-green-500 hover:bg-green-600 text-white"
                                    : "bg-red-500 hover:bg-red-600 text-white"
                            )}
                        >
                            {progress.stage === 'complete' ? 'Done' : 'Close'}
                        </motion.button>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
