import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, LayoutTemplate, FileText, XCircle } from 'lucide-react';
import { Prompt, Template } from '../types';
import { getTagColor, hexToRgba } from '../utils/color';

interface PromptListProps {
    items: (Prompt | Template)[];
    selectedId: string | null;
    onSelect: (item: Prompt | Template) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    viewMode: 'prompts' | 'templates';
    searchInputRef: React.RefObject<HTMLInputElement>;
    selectedCategory: string;
    selectedTags: string[];
    onCategoryReset: () => void;
    onRemoveTag: (tag: string) => void;
    onClearFilters: () => void;
    shortcutsEnabled?: boolean;
    desktopWidth: number;
    onCreateNew?: () => void;
    density: 'comfortable' | 'compact';
    onDensityChange: (mode: 'comfortable' | 'compact') => void;
}

const PromptList: React.FC<PromptListProps> = ({
    items,
    selectedId,
    onSelect,
    searchQuery,
    onSearchChange,
    viewMode,
    searchInputRef,
    selectedCategory,
    selectedTags,
    onCategoryReset,
    onRemoveTag,
    onClearFilters,
    shortcutsEnabled = true,
    desktopWidth,
    onCreateNew,
    density,
    onDensityChange
}) => {
    const listContainerRef = useRef<HTMLDivElement>(null);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const hasFilters = useMemo(() => selectedCategory !== 'All' || selectedTags.length > 0, [selectedCategory, selectedTags]);
    const chipStyles = (value: string, emphasize = false) => {
        const color = getTagColor(value);
        return {
            borderColor: hexToRgba(color, emphasize ? 0.6 : 0.3),
            backgroundColor: hexToRgba(color, emphasize ? 0.25 : 0.1),
            color: '#000000'
        };
    };
    const starterTemplates = useMemo(() => {
        if (viewMode === 'templates') {
            return [
                { title: 'Product launch', description: 'Announce releases with crisp positioning.' },
                { title: 'Persona brief', description: 'Capture voice, audience, and guardrails.' },
                { title: 'Rewrite sandbox', description: 'Experiment with multiple tones quickly.' }
            ];
        }
        return [
            { title: 'Customer support reply', description: 'Answer tricky tickets with empathy.' },
            { title: 'Research planning', description: 'Frame discovery prompts for interviews.' },
            { title: 'Brainstorm buddy', description: 'Kickstart ideation with structured prompts.' }
        ];
    }, [viewMode]);
    const isCompact = density === 'compact';
    const cardPadding = isCompact ? 'p-3' : 'p-4';
    const titleTextClass = isCompact ? 'text-xs' : 'text-sm';
    const excerptClass = isCompact ? 'text-[11px] line-clamp-1' : 'text-xs line-clamp-2';
    const tagLimit = isCompact ? 2 : 3;

    const formatDate = (timestamp: number) =>
        new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(timestamp));

    useEffect(() => {
        setFocusedIndex(items.findIndex(item => item._id === selectedId));
    }, [items, selectedId]);

    useEffect(() => {
        if (!shortcutsEnabled) return;
        const handler = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const isTypingTarget = target && ['INPUT', 'TEXTAREA'].includes(target.tagName);

            if (e.key === '/' && !isTypingTarget) {
                e.preventDefault();
                searchInputRef.current?.focus();
                return;
            }

            if (e.key === 'Escape') {
                if (searchQuery) {
                    onSearchChange('');
                }
                searchInputRef.current?.blur();
                return;
            }

            if (!isTypingTarget) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setFocusedIndex(prev => {
                        const nextIndex = Math.min(items.length - 1, (prev === -1 ? 0 : prev + 1));
                        const nextItem = items[nextIndex];
                        if (nextItem) {
                            listContainerRef.current?.querySelectorAll<HTMLElement>('[data-item-card]')[nextIndex]?.scrollIntoView({ block: 'nearest' });
                        }
                        return nextIndex;
                    });
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setFocusedIndex(prev => {
                        const nextIndex = prev <= 0 ? 0 : prev - 1;
                        const nextItem = items[nextIndex];
                        if (nextItem) {
                            listContainerRef.current?.querySelectorAll<HTMLElement>('[data-item-card]')[nextIndex]?.scrollIntoView({ block: 'nearest' });
                        }
                        return nextIndex;
                    });
                } else if (e.key === 'Enter' && focusedIndex >= 0) {
                    e.preventDefault();
                    const item = items[focusedIndex];
                    if (item) {
                        onSelect(item);
                    }
                }
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [focusedIndex, items, onSelect, onSearchChange, searchInputRef, searchQuery, shortcutsEnabled]);

    return (
        <div
            className="flex flex-col h-full w-full border-r border-slate-200 bg-white flex-shrink-0"
            style={{ width: `min(100%, ${desktopWidth}px)` }}
        >
            {/* Search Header */}
            <div className="p-4 border-b border-slate-100 bg-[#fafaf9]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm transition-all"
                    />
                </div>
                <div className="mt-3 flex items-start gap-x-4 gap-y-2 text-xs">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                        {selectedCategory !== 'All' ? (
                            <button
                                onClick={onCategoryReset}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full border flex-shrink-0"
                                style={chipStyles(selectedCategory, true)}
                            >
                                {selectedCategory}
                                <XCircle size={12} />
                            </button>
                        ) : (
                            <span className="text-[11px] text-slate-400 flex-shrink-0">All categories</span>
                        )}
                        {selectedTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => onRemoveTag(tag)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full border flex-shrink-0"
                                style={chipStyles(tag, true)}
                            >
                                #{tag}
                                <XCircle size={12} />
                            </button>
                        ))}
                        {!hasFilters && (
                            <span className="text-[11px] text-slate-400">
                                Showing every {viewMode === 'prompts' ? 'prompt' : 'template'}
                            </span>
                        )}
                        {hasFilters && (
                            <button
                                onClick={onClearFilters}
                                className="uppercase tracking-wider text-[11px] text-teal-700 hover:text-teal-900 font-semibold flex-shrink-0"
                            >
                                Clear
                            </button>
                        )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 self-start">
                        <div className="inline-flex rounded-md border border-slate-200 bg-white overflow-hidden">
                            <button
                                onClick={() => onDensityChange('comfortable')}
                                className={`px-2 py-1 text-[11px] font-semibold whitespace-nowrap ${!isCompact ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                Cozy
                            </button>
                            <button
                                onClick={() => onDensityChange('compact')}
                                className={`px-2 py-1 text-[11px] font-semibold whitespace-nowrap ${isCompact ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                Compact
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto bg-[#fafaf9]" ref={listContainerRef}>
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <p className="text-xs uppercase tracking-[0.2em] text-teal-500 font-bold">No {viewMode}</p>
                                <h3 className="text-2xl font-semibold text-slate-900">Let's create your first {viewMode === 'prompts' ? 'prompt' : 'template'}</h3>
                                <p className="text-sm text-slate-600">
                                    Start with a blank canvas or explore the starter packs for inspiration.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                    onClick={onCreateNew}
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-[#0d9488] text-white font-semibold hover:bg-teal-700 transition-all shadow"
                                >
                                    New {viewMode === 'prompts' ? 'Prompt' : 'Template'}
                                </button>
                            </div>
                            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-left">
                                <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Starter packs</p>
                                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {starterTemplates.map(template => (
                                        <div key={template.title} className="p-2 rounded-lg bg-white border border-slate-100">
                                            <p className="text-sm font-semibold text-slate-900">{template.title}</p>
                                            <p className="text-xs text-slate-500">{template.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {items.map(item => {
                            const isSelected = selectedId === item._id;
                            const isTemplate = 'label' in item; // Type guard check
                            const isFocused = items[focusedIndex]?._id === item._id;

                            return (
                                <div
                                    key={item._id}
                                    data-item-card
                                    onClick={() => onSelect(item)}
                                    className={`
                    group ${cardPadding} cursor-pointer transition-all border-l-4
                    ${isSelected
                                            ? 'bg-white border-[#0d9488] shadow-sm'
                                            : 'bg-[#fafaf9] border-transparent hover:bg-white hover:border-slate-200'
                                        }
                    ${isFocused && !isSelected ? 'ring-1 ring-teal-300' : ''}
                  `}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`
                      text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded
                      ${isSelected ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'}
                    `}>
                                            {item.category}
                                        </span>
                                        <span className="text-[10px] text-slate-600 flex items-center gap-1">
                                            {/* @ts-ignore - handling different timestamp fields */}
                                            {formatDate(item.updatedAt || item._creationTime)}
                                        </span>
                                    </div>

                                    <h3 className={`font-semibold ${titleTextClass} mb-1 line-clamp-1 flex items-center gap-2 ${isSelected ? 'text-teal-900' : 'text-slate-900'}`}>
                                        {isTemplate ? <LayoutTemplate size={14} className="text-slate-500" /> : <FileText size={14} className="text-slate-500" />}
                                        {isTemplate ? (item as Template).label : (item as Prompt).title}
                                    </h3>

                                    <p className={`${excerptClass} mb-2 font-mono ${isSelected ? 'text-teal-800' : 'text-slate-700'}`}>
                                        {item.content}
                                    </p>

                                    <div className="flex gap-1 overflow-hidden">
                                        {item.tags.slice(0, tagLimit).map(tag => (
                                            <span
                                                key={tag}
                                                className="text-[10px] px-1.5 py-0.5 rounded-full border font-semibold"
                                                style={chipStyles(tag, isSelected)}
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromptList;
