import React, { useState, useMemo, useEffect, useRef, FC, useCallback } from 'react';
import { Calculator, Sparkle, Search, Type, Hash, Clock, CheckCircle, AlertCircle, List, Braces, ArrowLeft, ArrowRight, Trash, Plus, ChevronDown } from 'lucide-react';
import _ from 'lodash';
import { useDashboard } from '../../contexts/DashboardProvider';
import { Button } from '../ui/Button';
import { Dialog, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { inputClasses, textareaClasses, cn } from '../ui/utils';
import { Tooltip } from '../ui/Tooltip';
import { Checkbox } from '../ui/Checkbox';
import { Badge } from '../ui/Badge';
import { FORMULA_FUNCTION_DEFINITIONS } from '../../utils/dataProcessing/formulaEngine';
import * as aiService from '../../services/aiService';
import { TransformationType, Field, CreateCategoricalPayload, CategoricalRule, FilterCondition, FieldType, DND_ITEM_TYPE } from '../../utils/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useDrag, useDrop } from 'react-dnd';
import { notificationService } from '../../services/notificationService';

// --- SUB-COMPONENTS for Formula View ---

const FormulaEditorSyntaxHighlight: FC<{ formula: string, allFields: string[], allFunctions: string[] }> = ({ formula, allFields, allFunctions }) => {
    const html = useMemo(() => {
        const escapedFormula = formula.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const functionNames = allFunctions.join('|');
        const tokenizer = new RegExp(`('([^']*)')|(\\[([^\\]]+)\\])|\\b(${functionNames})\\b(?=\\s*\\()|(\\b\\d+(\\.\\d+)?\\b)|([+\\-*/=<>!(),])`, 'gi');
        
        const highlighted = escapedFormula.replace(tokenizer, (match, g1, _g2, g3, g4, g5, g6, _g7, g8) => {
            if (g1) return `<span class="text-amber-400">${g1}</span>`; // String
            if (g3) { // Field
                const fieldName = g4;
                const isValid = allFields.includes(fieldName);
                return isValid ? `<span class="text-purple-400">${g3}</span>` : `<span class="text-red-400 underline decoration-wavy">${g3}</span>`;
            }
            if (g5) return `<span class="text-sky-400">${g5}</span>`; // Function
            if (g6) return `<span class="text-teal-400">${g6}</span>`; // Number
            if (g8) return `<span class="text-rose-400">${g8}</span>`; // Operator
            return match;
        });
        return highlighted.replace(/\n/g, '<br />');
    }, [formula, allFields, allFunctions]);

    return <pre className="p-3 font-mono text-sm tracking-wider leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: html + ' ' }} />;
};


const FunctionInfo: FC<{ info: typeof FORMULA_FUNCTION_DEFINITIONS[string], onInsert: (text: string) => void }> = ({ info, onInsert }) => (
    <div className="p-2 rounded-md hover:bg-accent text-left w-full text-sm">
        <button onDoubleClick={() => onInsert(info.syntax.split('(')[0] + '()')} className="font-semibold font-mono text-primary hover:underline">{info.syntax}</button>
        <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
    </div>
);

// --- MAIN MODAL STEPS ---

const InitialStep: FC<{ onSelectFormula: () => void; onSelectGrouping: () => void; }> = ({ onSelectFormula, onSelectGrouping }) => (
    <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 p-6">
        <button onClick={onSelectFormula} className="flex-1 p-8 rounded-xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all text-center">
            <Calculator size={32} className="mx-auto text-primary mb-3" />
            <h3 className="font-bold text-lg text-foreground">From Formula</h3>
            <p className="text-sm text-muted-foreground">Create a field using mathematical or logical expressions.</p>
        </button>
        <button onClick={onSelectGrouping} className="flex-1 p-8 rounded-xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all text-center">
            <Braces size={32} className="mx-auto text-primary mb-3" />
            <h3 className="font-bold text-lg text-foreground">By Grouping</h3>
            <p className="text-sm text-muted-foreground">Manually group existing values into new categories.</p>
        </button>
    </div>
);

const FormulaStep: FC<{ onBack: () => void; onSave: (fieldName: string, formula: string) => void; sourceId: string; onClose: () => void; }> = ({ onBack, onSave, sourceId, onClose }) => {
    const { dataSources, aiConfig } = useDashboard();
    const [fieldName, setFieldName] = useState('');
    const [formula, setFormula] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<'fields' | 'functions'>('fields');
    const [validation, setValidation] = useState<{ isValid: boolean, message: string }>({ isValid: true, message: '' });
    const [functionSearch, setFunctionSearch] = useState('');
    const [openCategories, setOpenCategories] = useState<string[]>([]);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);

    // Autocomplete state
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activeSuggestion, setActiveSuggestion] = useState(0);
    const [suggestionPos, setSuggestionPos] = useState<{ top: number, left: number } | null>(null);

    const source = sourceId ? dataSources.get(sourceId) : null;
    const allFields = useMemo(() => source ? [...source.fields.dimensions, ...source.fields.measures] : [], [source]);
    const allFieldNames = useMemo(() => allFields.map(f => f.simpleName), [allFields]);
    const allFunctionNames = useMemo(() => Object.keys(FORMULA_FUNCTION_DEFINITIONS), []);
    const groupedFunctions = useMemo(() => _.groupBy(Object.values(FORMULA_FUNCTION_DEFINITIONS), 'category'), []);
    
    useEffect(() => {
        if (functionSearch) {
            const matchingCategories = Object.entries(groupedFunctions)
                .filter(([_category, funcs]) =>
                    (funcs as any[]).some(f => 
                        f.syntax.toLowerCase().includes(functionSearch.toLowerCase()) || 
                        f.description.toLowerCase().includes(functionSearch.toLowerCase())
                    )
                )
                .map(([category]) => category);
            setOpenCategories(matchingCategories);
        }
    }, [functionSearch, groupedFunctions]);


    const validate = useCallback(() => {
        if (!fieldName.trim()) { setValidation({ isValid: false, message: 'Field name is required.'}); return false; }
        if (allFields.some(f => f.simpleName.toLowerCase() === fieldName.trim().toLowerCase())) { setValidation({ isValid: false, message: 'A field with this name already exists.'}); return false; }
        if (!formula.trim()) { setValidation({ isValid: false, message: 'Formula cannot be empty.'}); return false; }
        
        // Parentheses balance
        if ((formula.match(/\(/g) || []).length !== (formula.match(/\)/g) || []).length) { setValidation({isValid: false, message: 'Unbalanced parentheses.'}); return false; }
        if ((formula.match(/\[/g) || []).length !== (formula.match(/\]/g) || []).length) { setValidation({isValid: false, message: 'Unbalanced square brackets.'}); return false; }

        // Field and function validation
        const mentionedFields = formula.match(/\[([^\]]+)\]/g) || [];
        for (const field of mentionedFields) {
            if (!allFieldNames.includes(field.slice(1, -1))) { setValidation({isValid: false, message: `Field ${field} not found.`}); return false; }
        }
        
        const functionRegex = new RegExp(`\\b(${allFunctionNames.join('|')})\\b(?=\\s*\\()`, 'gi');
        const unknownFunctions = formula.replace(functionRegex, '').match(/[a-zA-Z_]\w*(?=\s*\()/g) || [];
        if(unknownFunctions.length > 0) {
            setValidation({isValid: false, message: `Unknown function: ${unknownFunctions[0]}`}); return false;
        }

        setValidation({ isValid: true, message: 'Formula is valid' });
        return true;
    }, [fieldName, formula, allFields, allFieldNames, allFunctionNames]);
    
    useEffect(() => { validate(); }, [fieldName, formula, validate]);

    const insertText = (text: string, moveCursorInside = false) => {
        if (!textareaRef.current) return;
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        setFormula(formula.substring(0, start) + text + formula.substring(end));
        textareaRef.current.focus();
        setTimeout(() => {
            const newPos = start + text.length;
            textareaRef.current?.setSelectionRange(moveCursorInside ? newPos - 1 : newPos, moveCursorInside ? newPos - 1 : newPos);
        }, 0);
    };

    const handleGenerateFormula = async () => {
        if (!aiConfig) { notificationService.error('AI is not configured.'); return; }
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        try {
            const generatedFormula = await aiService.getAiFormulaSuggestion(aiConfig, allFields, aiPrompt);
            setFormula(generatedFormula);
        } catch (error) { notificationService.error(`AI Error: ${(error as Error).message}`); } finally { setIsGenerating(false); }
    };
    
    const handleSave = () => { if (validate()) onSave(fieldName.trim(), formula); };
    
    const handleTextareaScroll = () => {
        if (textareaRef.current && highlightRef.current) {
            highlightRef.current.scrollTop = textareaRef.current.scrollTop;
            highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    };
    
    const getCaretCoordinates = () => {
        const textarea = textareaRef.current;
        if (!textarea) return { top: 0, left: 0 };
        const properties = ['boxSizing', 'width', 'height', 'overflowX', 'overflowY', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontSizeAdjust', 'lineHeight', 'fontFamily', 'textAlign', 'textTransform', 'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing'];
        const div = document.createElement('div');
        properties.forEach(prop => { div.style[prop as any] = getComputedStyle(textarea)[prop as any]; });
        div.style.whiteSpace = 'pre-wrap'; div.style.wordWrap = 'break-word'; div.style.position = 'absolute'; div.style.visibility = 'hidden';
        document.body.appendChild(div);
        div.textContent = textarea.value.substring(0, textarea.selectionStart);
        const span = document.createElement('span');
        span.textContent = textarea.value.substring(textarea.selectionStart) || '.';
        div.appendChild(span);
        const coords = { top: span.offsetTop + parseInt(getComputedStyle(div).borderTopWidth), left: span.offsetLeft + parseInt(getComputedStyle(div).borderLeftWidth) };
        document.body.removeChild(div);
        return coords;
    };

    const updateSuggestions = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const pos = textarea.selectionStart;
        const text = textarea.value;
        const textBefore = text.slice(0, pos);
        
        const fieldMatch = textBefore.match(/\[([^\]]*)$/);
        const functionMatch = textBefore.match(/([a-zA-Z_]\w*)$/);

        if (fieldMatch) {
            const partial = fieldMatch[1];
            const newSuggestions = allFieldNames.filter(f => f.toLowerCase().startsWith(partial.toLowerCase()));
            setSuggestions(newSuggestions);
            setActiveSuggestion(0);
            if (newSuggestions.length > 0) {
                const coords = getCaretCoordinates();
                setSuggestionPos({ top: coords.top + 20, left: coords.left });
            } else { setSuggestionPos(null); }
        } else if (functionMatch && !textBefore.endsWith(']')) {
            const partial = functionMatch[1];
            const newSuggestions = allFunctionNames.filter(f => f.toLowerCase().startsWith(partial.toLowerCase()));
            setSuggestions(newSuggestions);
            setActiveSuggestion(0);
            if (newSuggestions.length > 0) {
                const coords = getCaretCoordinates();
                setSuggestionPos({ top: coords.top + 20, left: coords.left });
            } else { setSuggestionPos(null); }
        } else { setSuggestionPos(null); setSuggestions([]); }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (suggestionPos && suggestions.length > 0) {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActiveSuggestion(s => (s + 1) % suggestions.length); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveSuggestion(s => (s - 1 + suggestions.length) % suggestions.length); }
            else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                const suggestion = suggestions[activeSuggestion];
                const text = textareaRef.current!.value;
                const pos = textareaRef.current!.selectionStart;
                const textBefore = text.slice(0, pos);
                
                const fieldMatch = textBefore.match(/\[([^\]]*)$/);
                const functionMatch = textBefore.match(/([a-zA-Z_]\w*)$/);
                
                if (fieldMatch) {
                    const start = fieldMatch.index! + 1;
                    const newFormula = `${text.slice(0, start)}${suggestion}]${text.slice(pos)}`;
                    setFormula(newFormula);
                    const newPos = start + suggestion.length + 1;
                    setTimeout(() => textareaRef.current?.setSelectionRange(newPos, newPos), 0);
                } else if (functionMatch) {
                    const start = functionMatch.index!;
                    const newFormula = `${text.slice(0, start)}${suggestion}()${text.slice(pos)}`;
                    setFormula(newFormula);
                    const newPos = start + suggestion.length + 1;
                    setTimeout(() => textareaRef.current?.setSelectionRange(newPos, newPos), 0);
                }
                setSuggestionPos(null);
                setSuggestions([]);
            } else if (e.key === 'Escape') {
                setSuggestionPos(null);
                setSuggestions([]);
            }
        }
    };
    
    const getIcon = (type: FieldType) => type === FieldType.MEASURE ? <Hash className="text-green-500"/> : type === FieldType.DATETIME ? <Clock className="text-purple-500"/> : <Type className="text-blue-500"/>;

    const toggleCategory = (category: string) => {
        setOpenCategories(prev =>
            prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
        );
    };

    return (
        <div className="flex flex-col h-full">
            <main className="flex-grow grid grid-cols-1 md:grid-cols-[1fr,320px] min-h-0">
                <div className="flex flex-col p-4 md:p-6 gap-4 border-b md:border-b-0 md:border-r border-border">
                    <input type="text" placeholder="New Field Name" value={fieldName} onChange={e => setFieldName(e.target.value)} className={inputClasses}/>
                    <div className="h-full flex flex-col relative border border-input rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-ring">
                        <textarea ref={textareaRef} value={formula} onChange={e => { setFormula(e.target.value); updateSuggestions(); }} onScroll={handleTextareaScroll} placeholder="e.g., [Sales] - [Profit]" className="absolute inset-0 w-full h-full p-3 font-mono text-sm tracking-wider bg-transparent text-transparent caret-foreground resize-none leading-relaxed focus:outline-none z-10" spellCheck="false" onKeyDown={handleKeyDown} onBlur={() => setTimeout(() => setSuggestionPos(null), 150)} onClick={updateSuggestions} />
                        <div ref={highlightRef} className="absolute inset-0 w-full h-full overflow-auto bg-background pointer-events-none">
                            <FormulaEditorSyntaxHighlight formula={formula} allFields={allFieldNames} allFunctions={allFunctionNames} />
                        </div>
                        {suggestionPos && suggestions.length > 0 && (
                            <div className="absolute bg-popover border border-border shadow-lg rounded-md p-1 z-20 max-h-48 overflow-y-auto" style={{ top: suggestionPos.top, left: suggestionPos.left }}>
                                {suggestions.map((s, i) => (
                                    <div key={s} onMouseDown={(e) => { e.preventDefault(); handleKeyDown({ key: 'Enter', preventDefault: () => {}, ...e } as any); }} className={cn("p-1.5 rounded text-sm cursor-pointer", i === activeSuggestion && "bg-accent")}>
                                        {s}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex-shrink-0 space-y-2">
                        <div className="flex items-center gap-2"><Sparkle className="text-primary"/><label className="text-sm font-semibold">Generate with AI</label></div>
                        <div className="flex items-center gap-2">
                            <input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="e.g., Profit Ratio" className={`${inputClasses} flex-grow`} onKeyDown={e => e.key === 'Enter' && handleGenerateFormula()}/>
                            <Button onClick={handleGenerateFormula} disabled={isGenerating}>{isGenerating ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div> : 'Generate'}</Button>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col overflow-hidden">
                    <div className="flex-shrink-0 border-b border-border flex">
                        <button onClick={() => setActiveTab('fields')} className={`flex-1 text-center py-3 px-4 text-sm font-semibold transition-all relative ${activeTab === 'fields' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                            Fields {activeTab === 'fields' && <motion.div layoutId="calc-field-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                        </button>
                        <button onClick={() => setActiveTab('functions')} className={`flex-1 text-center py-3 px-4 text-sm font-semibold transition-all relative ${activeTab === 'functions' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                            Functions {activeTab === 'functions' && <motion.div layoutId="calc-field-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                        </button>
                    </div>
                    <div className="flex-grow flex flex-col min-h-0">
                        <AnimatePresence mode="wait">
                            <motion.div key={activeTab} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex-grow flex flex-col min-h-0">
                            {activeTab === 'fields' && (
                                <div className="p-2 overflow-y-auto">
                                    {allFields.map(f => (
                                        <Tooltip key={f.name} content={`Double-click to insert [${f.simpleName}]`}>
                                            <button onDoubleClick={() => insertText(`[${f.simpleName}]`)} className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left text-sm">
                                                {getIcon(f.type)}
                                                <span className="font-semibold">{f.simpleName}</span>
                                            </button>
                                        </Tooltip>
                                    ))}
                                </div>
                            )}
                            {activeTab === 'functions' && (
                                <>
                                    <div className="p-2 border-b border-border flex-shrink-0">
                                        <input type="text" placeholder="Search functions..." value={functionSearch} onChange={e => setFunctionSearch(e.target.value)} className={cn(inputClasses, 'h-9')} />
                                    </div>
                                    <div className="p-2 overflow-y-auto">
                                        {Object.entries(groupedFunctions).map(([category, funcs]) => {
                                            const filteredFuncs = (funcs as any[]).filter(f => 
                                                functionSearch === '' ||
                                                f.syntax.toLowerCase().includes(functionSearch.toLowerCase()) || 
                                                f.description.toLowerCase().includes(functionSearch.toLowerCase())
                                            );
                                            if (filteredFuncs.length === 0) return null;

                                            return (
                                                <div key={category} className="mb-1">
                                                    <button onClick={() => toggleCategory(category)} className="w-full flex justify-between items-center font-semibold text-xs text-muted-foreground uppercase tracking-wider px-2 py-2 hover:bg-accent rounded">
                                                        <span>{category}</span>
                                                        <ChevronDown className={`transition-transform ${openCategories.includes(category) ? 'rotate-180' : ''}`} size={16} />
                                                    </button>
                                                    {openCategories.includes(category) && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-2 border-l-2 border-border ml-2">
                                                            {filteredFuncs.map((f: any) => <FunctionInfo key={f.syntax} info={f} onInsert={(text) => insertText(text, true)} />)}
                                                        </motion.div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>
            <DialogFooter className="flex-shrink-0">
                <Button variant="outline" onClick={onBack}><ArrowLeft/> Back</Button>
                <div className="flex-grow flex items-center gap-2 text-sm">
                    {validation.isValid ? <CheckCircle className="text-green-500"/> : <AlertCircle className="text-destructive"/>}
                    <span className={validation.isValid ? 'text-green-500' : 'text-destructive'}>{validation.message}</span>
                </div>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} disabled={!validation.isValid}>Create Field</Button>
            </DialogFooter>
        </div>
    );
};

const ValueListItem: FC<{ value: any; isSelected: boolean; onToggle: () => void; }> = ({ value, isSelected, onToggle }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: DND_ITEM_TYPE.GROUPING_VALUE,
        item: { value },
        collect: monitor => ({ isDragging: monitor.isDragging() }),
    }));

    return (
        <div ref={drag as any} className={cn("flex items-center gap-3 p-1.5 rounded-md text-sm", isDragging ? 'opacity-30' : 'opacity-100', isSelected && 'bg-primary/10')}>
            <Checkbox checked={isSelected} onCheckedChange={onToggle} />
            <span className="truncate">{String(value)}</span>
        </div>
    );
};

const GroupCard: FC<{ name: string; valueCount: number; isActive: boolean; onSelect: () => void; onDrop: (values: any[]) => void; }> = ({ name, valueCount, isActive, onSelect, onDrop }) => {
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: DND_ITEM_TYPE.GROUPING_VALUE,
        drop: (item: { value: any }) => onDrop([item.value]),
        collect: monitor => ({
            isOver: !!monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    }));

    return (
        <div ref={drop as any} onClick={onSelect} className={cn(
            "p-3 rounded-lg border-2 cursor-pointer transition-all",
            isActive ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50",
            isOver && canDrop && "border-primary ring-2 ring-primary/50"
        )}>
            <div className="flex justify-between items-center">
                <span className="font-semibold text-sm truncate">{name}</span>
                <Badge variant="secondary">{valueCount}</Badge>
            </div>
        </div>
    );
};

const GroupingStep: FC<{ onBack: () => void; onSave: (fieldName: string, payload: CreateCategoricalPayload) => void; sourceId: string; onClose: () => void; }> = ({ onBack, onSave, sourceId, onClose }) => {
    const { dataSources } = useDashboard();
    const source = sourceId ? dataSources.get(sourceId) : null;
    const sourceFields = useMemo(() => source ? [...source.fields.dimensions, ...source.fields.measures] : [], [source]);
    const sourceData = useMemo(() => source ? source.data : [], [source]);
    
    const [activeTab, setActiveTab] = useState<'mapping' | 'rules'>('mapping');
    const [newFieldName, setNewFieldName] = useState('');
    
    // State for "By Rules"
    const [rules, setRules] = useState<CategoricalRule[]>([]);
    const [defaultValue, setDefaultValue] = useState('');

    // State for "By Value Mapping"
    const [selectedField, setSelectedField] = useState<Field | null>(sourceFields.find(f => f.type === FieldType.DIMENSION) || null);
    const [groups, setGroups] = useState<Array<{ name: string; values: Set<any> }>>([]);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedUngrouped, setSelectedUngrouped] = useState<Set<any>>(new Set());
    const [activeGroup, setActiveGroup] = useState<string | null>(null);

    const [ungroupedSearch, setUngroupedSearch] = useState('');

    useEffect(() => {
        setGroups([]);
        setSelectedUngrouped(new Set());
        setActiveGroup(null);
    }, [selectedField]);

    const uniqueValues = useMemo(() => {
        if (selectedField && sourceData) {
            return _.sortBy(_.uniq(sourceData.map(row => row[selectedField.name])).filter(v => v !== null && v !== undefined));
        }
        return [];
    }, [selectedField, sourceData]);
    
    const allGroupedValues = useMemo(() => new Set(groups.flatMap(g => Array.from(g.values))), [groups]);
    const ungroupedValues = useMemo(() => {
        const filtered = uniqueValues.filter(uv => !allGroupedValues.has(uv));
        if (!ungroupedSearch) return filtered;
        return filtered.filter(v => String(v).toLowerCase().includes(ungroupedSearch.toLowerCase()));
    }, [uniqueValues, allGroupedValues, ungroupedSearch]);

    const handleAddNewGroup = () => {
        if (newGroupName.trim() && !groups.some(g => g.name === newGroupName.trim())) {
            setGroups(g => [...g, { name: newGroupName.trim(), values: new Set() }]);
            setNewGroupName('');
        }
    };
    
    const handleMoveToGroup = (targetGroup: string, values: any[]) => {
        setGroups(currentGroups => currentGroups.map(g => {
            if (g.name === targetGroup) {
                const newValues = new Set(g.values);
                values.forEach(v => newValues.add(v));
                return { ...g, values: newValues };
            }
            return g;
        }));
        setSelectedUngrouped(s => new Set(Array.from(s).filter(val => !values.includes(val))));
    };

    const handleSave = () => {
        if (!newFieldName.trim()) { alert('Please enter a name for the new field.'); return; }
        let payload: CreateCategoricalPayload;
        if (activeTab === 'mapping') {
            if (!selectedField) { alert('Please select a field to map values from.'); return; }
            const mappingRules: CategoricalRule[] = groups.filter(g => g.values.size > 0).map(g => ({ id: _.uniqueId('rule_'), sourceField: selectedField.name, condition: FilterCondition.IS_ONE_OF, value: Array.from(g.values), output: g.name }));
            payload = { newFieldName: newFieldName.trim(), rules: mappingRules, defaultValue: `Other` };
        } else {
            payload = { newFieldName: newFieldName.trim(), rules, defaultValue: defaultValue.trim() };
        }
        onSave(newFieldName.trim(), payload);
    };

    const conditionOptions = [FilterCondition.EQUALS, FilterCondition.NOT_EQUALS, FilterCondition.CONTAINS, FilterCondition.DOES_NOT_CONTAIN, FilterCondition.STARTS_WITH, FilterCondition.ENDS_WITH, FilterCondition.IS_ONE_OF, FilterCondition.IS_NOT_ONE_OF, FilterCondition.GREATER_THAN, FilterCondition.LESS_THAN];
    const MotionDiv = motion.div as any;
    
    return (
        <div className="flex flex-col h-full">
            <div className="p-4 md:p-6 border-b border-border flex-shrink-0 space-y-4">
                <input type="text" placeholder="New Field Name" value={newFieldName} onChange={e => setNewFieldName(e.target.value)} className={inputClasses} />
                 <div className="flex items-center gap-2 p-1 bg-secondary rounded-lg">
                    <button onClick={() => setActiveTab('mapping')} className={`flex-1 text-center py-2 px-4 rounded-md text-sm font-semibold transition-all ${activeTab === 'mapping' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}>By Value Mapping</button>
                    <button onClick={() => setActiveTab('rules')} className={`flex-1 text-center py-2 px-4 rounded-md text-sm font-semibold transition-all ${activeTab === 'rules' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}>By Rules</button>
                </div>
            </div>
            <div className="flex-grow min-h-0 overflow-hidden">
            <AnimatePresence mode="wait">
                <MotionDiv key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                    {activeTab === 'mapping' ? (
                         <div className="p-4 pt-0 md:p-6 md:pt-0 flex flex-col h-full">
                            <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4 items-end mb-4">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Source Field</label>
                                    <select value={selectedField?.name || ''} onChange={e => setSelectedField(sourceFields.find(f => f.name === e.target.value) || null)} className={inputClasses}>
                                        <option value="" disabled>Select source field...</option>
                                        {sourceFields.filter(f => f.type === FieldType.DIMENSION).map(f => <option key={f.name} value={f.name}>{f.simpleName}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground block mb-1">New Group</label>
                                    <div className="flex items-center gap-2">
                                        <input type="text" placeholder="New group name..." value={newGroupName} onChange={e => setNewGroupName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddNewGroup()} className={`${inputClasses} w-full`} />
                                        <Button onClick={handleAddNewGroup} size="icon" className="h-10 w-10 flex-shrink-0"><Plus/></Button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-grow grid grid-cols-1 md:grid-cols-[1fr,1fr] gap-6 min-h-0">
                                <div className="border border-border rounded-lg bg-background overflow-hidden flex flex-col">
                                    <div className="p-3 border-b border-border font-semibold text-sm flex-shrink-0">Available Values ({ungroupedValues.length})</div>
                                    <div className="p-2 border-b border-border relative"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="text" placeholder="Search values..." value={ungroupedSearch} onChange={e => setUngroupedSearch(e.target.value)} className="w-full bg-transparent focus:outline-none text-sm pl-8 h-7" /></div>
                                    <div className="overflow-y-auto p-1">{ungroupedValues.map(v => <ValueListItem key={String(v)} value={v} isSelected={selectedUngrouped.has(v)} onToggle={() => setSelectedUngrouped(s => { const newSet = new Set(s); if(newSet.has(v)) newSet.delete(v); else newSet.add(v); return newSet; })} />)}</div>
                                    <div className="p-2 border-t mt-auto border-border flex-shrink-0">
                                        <Button onClick={() => handleMoveToGroup(activeGroup!, Array.from(selectedUngrouped))} disabled={selectedUngrouped.size === 0 || !activeGroup} className="w-full">
                                            <ArrowRight/> Assign ({selectedUngrouped.size}) to {activeGroup || '...'}
                                        </Button>
                                    </div>
                                </div>
                                <div className="border border-border rounded-lg bg-background overflow-hidden flex flex-col">
                                    <div className="p-3 border-b border-border font-semibold text-sm flex-shrink-0">Groups ({groups.length})</div>
                                    <div className="overflow-y-auto p-2 space-y-2">{groups.map(g => <GroupCard key={g.name} name={g.name} valueCount={g.values.size} isActive={activeGroup === g.name} onSelect={() => setActiveGroup(g.name)} onDrop={(values) => handleMoveToGroup(g.name, values)} />)}</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                         <div className="p-4 md:p-6 space-y-6 max-h-full overflow-y-auto">
                             <div className="space-y-3">
                                {rules.map(rule => (
                                    <div key={rule.id} className="grid grid-cols-1 md:grid-cols-[1fr,1fr,1fr,auto] gap-3 items-center p-3 bg-secondary rounded-lg border">
                                        <select value={rule.sourceField} onChange={e => setRules(rules.map(r => r.id === rule.id ? {...r, sourceField: e.target.value} : r))} className={inputClasses}>{sourceFields.map(f => <option key={f.name} value={f.name}>{f.simpleName}</option>)}</select>
                                        <select value={rule.condition} onChange={e => setRules(rules.map(r => r.id === rule.id ? {...r, condition: e.target.value as any} : r))} className={inputClasses}>{conditionOptions.map(c => <option key={c} value={c}>{c}</option>)}</select>
                                        <input type="text" placeholder="Value" value={rule.value} onChange={e => setRules(rules.map(r => r.id === rule.id ? {...r, value: e.target.value} : r))} className={inputClasses} />
                                        <div className="flex items-center gap-3"><span className="font-semibold text-sm text-muted-foreground">THEN</span><input type="text" placeholder="Output" value={rule.output} onChange={e => setRules(rules.map(r => r.id === rule.id ? {...r, output: e.target.value} : r))} className={inputClasses} /><Button variant="ghost" size="icon" onClick={() => setRules(rules.filter(r => r.id !== rule.id))}><Trash size={16} /></Button></div>
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" onClick={() => setRules([...rules, {id: _.uniqueId('rule_'), sourceField: sourceFields[0]?.name || '', condition: FilterCondition.EQUALS, value: '', output: ''}])}><Plus size={16}/> Add Rule</Button>
                            <div className="pt-4 border-t border-border"><label className="text-sm font-medium">Default Value</label><input type="text" placeholder="Value if no rules match (optional)" value={defaultValue} onChange={e => setDefaultValue(e.target.value)} className={`${inputClasses} mt-1`} /></div>
                        </div>
                    )}
                </MotionDiv>
            </AnimatePresence>
            </div>
            <DialogFooter className="flex-shrink-0">
                <Button variant="outline" onClick={onBack}><ArrowLeft/> Back</Button>
                <div className="flex-grow"></div>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave}>Create Field</Button>
            </DialogFooter>
        </div>
    );
};


// --- Add Field Modal ---
interface AddFieldModalProps {
    isOpen: boolean;
    onClose: () => void;
    sourceId: string | null;
    initialStep?: 'formula' | 'grouping';
}

export const AddFieldModal: FC<AddFieldModalProps> = ({ isOpen, onClose, sourceId, initialStep }) => {
    const { addCalculatedField, addTransformation } = useDashboard();
    const [step, setStep] = useState<'initial' | 'formula' | 'grouping'>(initialStep || 'initial');
    useEffect(() => { if (isOpen) setStep(initialStep || 'initial'); }, [isOpen, initialStep]);

    const handleSaveFormula = (fieldName: string, formula: string) => {
        if (sourceId) {
            addCalculatedField(sourceId, fieldName, formula);
            onClose();
        }
    };

    const handleSaveGrouping = (fieldName: string, payload: CreateCategoricalPayload) => {
        if (sourceId) {
            addTransformation(sourceId, TransformationType.CREATE_CATEGORICAL_COLUMN, { ...payload, newFieldName: fieldName });
            onClose();
        }
    };
    
    const renderStep = () => {
        switch (step) {
            case 'formula':
                return <FormulaStep onBack={() => setStep('initial')} onSave={handleSaveFormula} sourceId={sourceId!} onClose={onClose} />;
            case 'grouping':
                return <GroupingStep onBack={() => setStep('initial')} onSave={handleSaveGrouping} sourceId={sourceId!} onClose={onClose} />;
            case 'initial':
            default:
                return <InitialStep onSelectFormula={() => setStep('formula')} onSelectGrouping={() => setStep('grouping')} />;
        }
    };
    
    if(!sourceId) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay />
            <DialogContent containerClassName={cn("w-[95%] max-w-lg transition-all duration-300", step !== 'initial' && "max-w-screen-xl")} className="h-[85vh] flex flex-col p-0">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Plus size={20}/> Add New Field</DialogTitle>
                    <DialogDescription>Create a new column in your dataset from a formula or by grouping existing values.</DialogDescription>
                </DialogHeader>
                <AnimatePresence mode="wait">
                    <motion.div key={step} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex-grow min-h-0">
                        {renderStep()}
                    </motion.div>
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
};