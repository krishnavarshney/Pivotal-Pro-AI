import React, { FC, ReactNode } from 'react';
import Lottie from 'lottie-react';
import { useDashboard } from '../contexts/DashboardProvider';
import { Database, FileSpreadsheet, Plus, ArrowRight } from 'lucide-react';
import { cn } from '../components/ui/utils';
import { motion, type Variants } from 'framer-motion';
import { AnimatedStars } from './auth/AnimatedStars';

// Embedded Lottie JSON
const animationData = { "v": "5.9.6", "fr": 30, "ip": 0, "op": 180, "w": 800, "h": 600, "nm": "Data to Insight", "ddd": 0, "assets": [], "layers": [{ "ddd": 0, "ind": 1, "ty": 4, "nm": "Line 4", "sr": 1, "ks": { "o": { "a": 0, "k": 100, "ix": 11 }, "r": { "a": 0, "k": 0, "ix": 10 }, "p": { "a": 0, "k": [551.5, 450, 0], "ix": 2 }, "a": { "a": 0, "k": [0, 0, 0], "ix": 1 }, "s": { "a": 0, "k": [100, 100, 100], "ix": 6 } }, "ao": 0, "shapes": [{ "ty": "gr", "it": [{ "ind": 0, "ty": "sh", "ix": 1, "ks": { "a": 0, "k": { "i": [[0, 0], [0, 0]], "o": [[0, 0], [0, 0]], "v": [[-120, 0], [120, 0]], "c": false }, "ix": 2 }, "nm": "Path 1", "mn": "ADBE Vector Shape - Group", "hd": false }, { "ty": "st", "c": { "a": 0, "k": [0.96862745285, 0.721568644047, 0, 1], "ix": 3 }, "o": { "a": 0, "k": 100, "ix": 4 }, "w": { "a": 0, "k": 4, "ix": 5 }, "lc": 2, "lj": 2, "ml": 4, "bm": 0, "nm": "Stroke 1", "mn": "ADBE Vector Graphic - Stroke", "hd": false }, { "ty": "tm", "s": { "a": 1, "k": [{ "i": { "x": [0.833], "y": [0.833] }, "o": { "x": [0.167], "y": [0.167] }, "t": 90, "s": 0 }, { "t": 120, "s": 100 }], "ix": 1 }, "e": { "a": 1, "k": [{ "i": { "x": [0.833], "y": [0.833] }, "o": { "x": [0.167], "y": [0.167] }, "t": 90, "s": 0 }, { "t": 120, "s": 100 }], "ix": 2 }, "o": { "a": 0, "k": 0, "ix": 3 }, "m": 1, "ix": 2, "nm": "Trim Paths 1", "mn": "ADBE Vector Filter - Trim", "hd": false }], "nm": "Group 1", "np": 3, "cix": 2, "bm": 0, "ix": 1, "mn": "ADBE Vector Group", "hd": false }], "ip": 0, "op": 180, "st": 0, "bm": 0 }, { "ddd": 0, "ind": 2, "ty": 4, "nm": "Line 3", "sr": 1, "ks": { "o": { "a": 0, "k": 100, "ix": 11 }, "r": { "a": 0, "k": 0, "ix": 10 }, "p": { "a": 0, "k": [248.5, 450, 0], "ix": 2 }, "a": { "a": 0, "k": [0, 0, 0], "ix": 1 }, "s": { "a": 0, "k": [100, 100, 100], "ix": 6 } }, "ao": 0, "shapes": [{ "ty": "gr", "it": [{ "ind": 0, "ty": "sh", "ix": 1, "ks": { "a": 0, "k": { "i": [[0, 0], [0, 0]], "o": [[0, 0], [0, 0]], "v": [[-120, 0], [120, 0]], "c": false }, "ix": 2 }, "nm": "Path 1", "mn": "ADBE Vector Shape - Group", "hd": false }, { "ty": "st", "c": { "a": 0, "k": [0, 0.658823549747, 0.709803938866, 1], "ix": 3 }, "o": { "a": 0, "k": 100, "ix": 4 }, "w": { "a": 0, "k": 4, "ix": 5 }, "lc": 2, "lj": 2, "ml": 4, "bm": 0, "nm": "Stroke 1", "mn": "ADBE Vector Graphic - Stroke", "hd": false }, { "ty": "tm", "s": { "a": 1, "k": [{ "i": { "x": [0.833], "y": [0.833] }, "o": { "x": [0.167], "y": [0.167] }, "t": 90, "s": 0 }, { "t": 120, "s": 100 }], "ix": 1 }, "e": { "a": 1, "k": [{ "i": { "x": [0.833], "y": [0.833] }, "o": { "x": [0.167], "y": [0.167] }, "t": 90, "s": 0 }, { "t": 120, "s": 100 }], "ix": 2 }, "o": { "a": 0, "k": 0, "ix": 3 }, "m": 1, "ix": 2, "nm": "Trim Paths 1", "mn": "ADBE Vector Filter - Trim", "hd": false }], "nm": "Group 1", "np": 3, "cix": 2, "bm": 0, "ix": 1, "mn": "ADBE Vector Group", "hd": false }], "ip": 0, "op": 180, "st": 0, "bm": 0 }, { "ddd": 0, "ind": 3, "ty": 4, "nm": "Line 2", "sr": 1, "ks": { "o": { "a": 0, "k": 100, "ix": 11 }, "r": { "a": 0, "k": 0, "ix": 10 }, "p": { "a": 0, "k": [400, 150, 0], "ix": 2 }, "a": { "a": 0, "k": [0, 0, 0], "ix": 1 }, "s": { "a": 0, "k": [100, 100, 100], "ix": 6 } }, "ao": 0, "shapes": [{ "ty": "gr", "it": [{ "ind": 0, "ty": "sh", "ix": 1, "ks": { "a": 0, "k": { "i": [[0, 0], [0, 0]], "o": [[0, 0], [0, 0]], "v": [[-250, 0], [250, 0]], "c": false }, "ix": 2 }, "nm": "Path 1", "mn": "ADBE Vector Shape - Group", "hd": false }, { "ty": "st", "c": { "a": 0, "k": [0.290196090937, 0.270588248968, 0.858823597431, 1], "ix": 3 }, "o": { "a": 0, "k": 100, "ix": 4 }, "w": { "a": 0, "k": 4, "ix": 5 }, "lc": 2, "lj": 2, "ml": 4, "bm": 0, "nm": "Stroke 1", "mn": "ADBE Vector Graphic - Stroke", "hd": false }, { "ty": "tm", "s": { "a": 1, "k": [{ "i": { "x": [0.833], "y": [0.833] }, "o": { "x": [0.167], "y": [0.167] }, "t": 0, "s": 0 }, { "t": 30, "s": 100 }], "ix": 1 }, "e": { "a": 1, "k": [{ "i": { "x": [0.833], "y": [0.833] }, "o": { "x": [0.167], "y": [0.167] }, "t": 30, "s": 100 }], "ix": 2 }, "o": { "a": 0, "k": 0, "ix": 3 }, "m": 1, "ix": 2, "nm": "Trim Paths 1", "mn": "ADBE Vector Filter - Trim", "hd": false }], "nm": "Group 1", "np": 3, "cix": 2, "bm": 0, "ix": 1, "mn": "ADBE Vector Group", "hd": false }], "ip": 0, "op": 180, "st": 0, "bm": 0 }, { "ddd": 0, "ind": 4, "ty": 4, "nm": "Line 1", "sr": 1, "ks": { "o": { "a": 0, "k": 100, "ix": 11 }, "r": { "a": 0, "k": 0, "ix": 10 }, "p": { "a": 0, "k": [400, 150, 0], "ix": 2 }, "a": { "a": 0, "k": [0, 0, 0], "ix": 1 }, "s": { "a": 0, "k": [100, 100, 100], "ix": 6 } }, "ao": 0, "shapes": [{ "ty": "gr", "it": [{ "ind": 0, "ty": "sh", "ix": 1, "ks": { "a": 0, "k": { "i": [[0, 0], [0, 0]], "o": [[0, 0], [0, 0]], "v": [[-250, 0], [250, 0]], "c": false }, "ix": 2 }, "nm": "Path 1", "mn": "ADBE Vector Shape - Group", "hd": false }, { "ty": "st", "c": { "a": 0, "k": [0.290196090937, 0.270588248968, 0.858823597431, 1], "ix": 3 }, "o": { "a": 0, "k": 100, "ix": 4 }, "w": { "a": 0, "k": 4, "ix": 5 }, "lc": 2, "lj": 2, "ml": 4, "bm": 0, "nm": "Stroke 1", "mn": "ADBE Vector Graphic - Stroke", "hd": false }, { "ty": "tm", "s": { "a": 1, "k": [{ "i": { "x": [0.833], "y": [0.833] }, "o": { "x": [0.167], "y": [0.167] }, "t": 0, "s": 0 }, { "t": 30, "s": 100 }], "ix": 1 }, "e": { "a": 1, "k": [{ "i": { "x": [0.833], "y": [0.833] }, "o": { "x": [0.167], "y": [0.167] }, "t": 30, "s": 100 }], "ix": 2 }, "o": { "a": 0, "k": 0, "ix": 3 }, "m": 1, "ix": 2, "nm": "Trim Paths 1", "mn": "ADBE Vector Filter - Trim", "hd": false }, { "ty": "tr", "p": { "a": 0, "k": [400, 150], "ix": 2 }, "a": { "a": 0, "k": [0, 0], "ix": 1 }, "s": { "a": 0, "k": [100, 100], "ix": 3 }, "r": { "a": 0, "k": 90, "ix": 6 }, "o": { "a": 0, "k": 100, "ix": 7 } }], "nm": "Group 1", "np": 3, "cix": 2, "bm": 0, "ix": 1, "mn": "ADBE Vector Group", "hd": false }], "ip": 0, "op": 180, "st": 0, "bm": 0 }, { "ddd": 0, "ind": 5, "ty": 4, "nm": "Arrow", "sr": 1, "ks": { "o": { "a": 0, "k": 100, "ix": 11 }, "r": { "a": 0, "k": 0, "ix": 10 }, "p": { "a": 0, "k": [400, 300, 0], "ix": 2 }, "a": { "a": 0, "k": [0, 0, 0], "ix": 1 }, "s": { "a": 0, "k": [100, 100, 100], "ix": 6 } }, "ao": 0, "shapes": [{ "ty": "gr", "it": [{ "ty": "gr", "it": [{ "ind": 0, "ty": "sh", "ix": 1, "ks": { "a": 0, "k": { "i": [[0, 0], [0, 0]], "o": [[0, 0], [0, 0]], "v": [[-13.1, 30.3], [13.1, 30.3]], "c": false }, "ix": 2 }, "nm": "Path 1", "mn": "ADBE Vector Shape - Group", "hd": false }], "nm": "Group 1", "np": 3, "cix": 2, "bm": 0, "ix": 1, "mn": "ADBE Vector Group", "hd": false }], "nm": "Group 2", "np": 2, "cix": 2, "bm": 0, "ix": 2, "mn": "ADBE Vector Group", "hd": false }], "ip": 0, "op": 180, "st": 0, "bm": 0 }] };

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.2,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
};

const ActionCard: FC<{
    icon: ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    className?: string;
}> = ({ icon, title, description, onClick, className }) => {
    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -8, scale: 1.02, boxShadow: '0 20px 25px -5px hsl(var(--primary-values) / 0.1), 0 8px 10px -6px hsl(var(--primary-values) / 0.1)' }}
            className={cn("glass-panel rounded-2xl p-4 sm:p-6 text-left flex flex-col items-start gap-4 cursor-pointer relative overflow-hidden group", className)}
            onClick={onClick}
        >
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center text-primary transition-colors duration-300 group-hover:bg-primary/20">
                {icon}
            </div>
            <div className="flex-grow">
                <h3 className="font-bold text-lg sm:text-xl text-foreground">{title}</h3>
                <p className="text-muted-foreground text-sm mt-1">{description}</p>
            </div>
            <div className="mt-4 text-primary font-semibold text-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Get Started <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </div>
        </motion.div>
    );
};

export const EmptyStateView: FC = () => {
    const { importInputRef, openAddDataSourceModal, loadSampleData } = useDashboard();

    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 overflow-auto relative bg-background empty-state-container">
            <AnimatedStars />
            <div className="absolute inset-0 -z-10 bg-aurora" />

            <div className="text-center w-full max-w-4xl mx-auto">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div variants={itemVariants} className="w-64 h-48 mx-auto -mb-8">
                        <Lottie animationData={animationData} loop={true} />
                    </motion.div>
                    <motion.h1
                        variants={itemVariants}
                        className="text-4xl md:text-6xl lg:text-7xl font-bold font-display text-gradient-aurora tracking-tight"
                    >
                        Unlock Your Data's Potential
                    </motion.h1>
                    <motion.p
                        variants={itemVariants}
                        className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mt-6"
                    >
                        Welcome to Pivotal Pro AI. Connect your data to begin building interactive dashboards, uncovering insights, and telling compelling data stories.
                    </motion.p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="mt-16 grid grid-cols-1 lg:grid-cols-5 gap-8"
                >
                    <ActionCard
                        icon={<FileSpreadsheet size={32} />}
                        title="Upload a File"
                        description="Get started quickly by uploading a CSV, Excel, or Parquet file."
                        onClick={() => importInputRef.current?.click()}
                        className="lg:col-span-3"
                    />

                    <ActionCard
                        icon={<Database size={32} />}
                        title="Connect Source"
                        description="Link to live databases or applications for real-time analysis."
                        onClick={openAddDataSourceModal}
                        className="lg:col-span-2"
                    />

                    <ActionCard
                        icon={<Plus size={32} />}
                        title="Use Sample Data"
                        description="No data? No problem. Explore features with our sample sales dataset."
                        onClick={() => loadSampleData('sales')}
                        className="lg:col-span-5"
                    />
                </motion.div>
            </div>
        </div>
    );
};