import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, LayoutTemplate, FileText, XCircle } from 'lucide-react';
import { Prompt, Template } from '../types';

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
    desktopWidth
}) => {
    const listContainerRef = useRef<HTMLDivElement>(null);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const hasFilters = useMemo(() => selectedCategory !== 'All' || selectedTags.length > 0, [selectedCategory, selectedTags]);

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
                {hasFilters && (
                    <div className="flex flex-wrap gap-2 mt-3 text-xs">
                        {selectedCategory !== 'All' && (
                            <button
                                onClick={onCategoryReset}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300"
                            >
                                Category: {selectedCategory}
                                <XCircle size={12} />
                            </button>
                        )}
                        {selectedTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => onRemoveTag(tag)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300"
                            >
                                #{tag}
                                <XCircle size={12} />
                            </button>
                        ))}
                        <button
                            onClick={onClearFilters}
                            className="ml-auto text-[11px] uppercase tracking-wider text-teal-700 hover:text-teal-900 font-semibold"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto bg-[#fafaf9]" ref={listContainerRef}>
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-600 text-sm">
                        <Search size={24} className="mb-2 opacity-50" />
                        <p>No items found</p>
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
                    group p-4 cursor-pointer transition-all border-l-4
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

                                    <h3 className={`font-semibold text-sm mb-1 line-clamp-1 flex items-center gap-2 ${isSelected ? 'text-teal-900' : 'text-slate-900'}`}>
                                        {isTemplate ? <LayoutTemplate size={14} className="text-slate-500" /> : <FileText size={14} className="text-slate-500" />}
                                        {isTemplate ? (item as Template).label : (item as Prompt).title}
                                    </h3>

                                    <p className={`text-xs line-clamp-2 mb-2 font-mono ${isSelected ? 'text-teal-800' : 'text-slate-700'}`}>
                                        {item.content}
                                    </p>

                                    <div className="flex gap-1 overflow-hidden">
                                        {item.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-700'}`}>
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
