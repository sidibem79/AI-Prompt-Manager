import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Search, LayoutTemplate, FileText, XCircle, X, Plus, Sparkles } from 'lucide-react';
import { Prompt, Template } from '../types';
import { getTagColor, hexToRgba } from '../utils/color';

interface PromptListProps {
    items: (Prompt | Template)[];
    selectedId: string | null;
    onSelect: (item: Prompt | Template) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    viewMode: 'prompts' | 'templates';
    setViewMode: (mode: 'prompts' | 'templates') => void;
    searchInputRef: React.RefObject<HTMLInputElement>;
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    categories: string[];
    selectedTags: string[];
    allTags: string[];
    toggleTag: (tag: string) => void;
    onCategoryReset: () => void;
    onRemoveTag: (tag: string) => void;
    onClearFilters: () => void;
    shortcutsEnabled?: boolean;
    onCreateNew?: () => void;
    density: 'comfortable' | 'compact';
    onDensityChange: (mode: 'comfortable' | 'compact') => void;
    counts: {
        prompts: number;
        templates: number;
        categories: Record<string, number>;
    };
    onOpenSettings: () => void;
    onOpenTaxonomy: () => void;
    isLoading?: boolean;
}

// Debounce hook
function useDebouncedValue<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

// Skeleton card for loading state
const SkeletonCard: React.FC = () => (
    <div className="bg-white rounded-2xl p-5 border-2 border-slate-100 animate-pulse">
        <div className="flex justify-between items-start mb-4">
            <div className="h-5 w-20 bg-slate-100 rounded-md" />
            <div className="h-4 w-16 bg-slate-100 rounded" />
        </div>
        <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 bg-slate-100 rounded-lg" />
            <div className="flex-1 space-y-2 pt-1">
                <div className="h-5 bg-slate-100 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
            </div>
        </div>
        <div className="space-y-2 mb-4">
            <div className="h-3 bg-slate-50 rounded w-full" />
            <div className="h-3 bg-slate-50 rounded w-5/6" />
            <div className="h-3 bg-slate-50 rounded w-2/3" />
        </div>
        <div className="flex gap-1.5">
            <div className="h-5 w-14 bg-slate-50 rounded-full" />
            <div className="h-5 w-12 bg-slate-50 rounded-full" />
        </div>
    </div>
);

// Highlight matched text in search results
const HighlightMatch: React.FC<{ text: string; query: string }> = ({ text, query }) => {
    if (!query.trim()) return <>{text}</>;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
        <>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <mark key={i} className="bg-amber-200/60 text-inherit rounded-sm px-0.5">{part}</mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    );
};

const PromptList: React.FC<PromptListProps> = ({
    items,
    selectedId,
    onSelect,
    searchQuery,
    onSearchChange,
    viewMode,
    setViewMode,
    searchInputRef,
    selectedCategory,
    setSelectedCategory,
    categories,
    selectedTags,
    allTags,
    toggleTag,
    onCategoryReset,
    onRemoveTag,
    onClearFilters,
    shortcutsEnabled = true,
    onCreateNew,
    density,
    onDensityChange,
    counts,
    onOpenSettings,
    onOpenTaxonomy,
    isLoading = false
}) => {
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
    const gridRef = useRef<HTMLDivElement>(null);

    // Keyboard shortcuts
    useEffect(() => {
        if (!shortcutsEnabled) return;
        const handler = (e: KeyboardEvent) => {
            // Ctrl/Cmd + K to focus search
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            // Ctrl/Cmd + N to create new
            if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
                e.preventDefault();
                onCreateNew?.();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [shortcutsEnabled, onCreateNew, searchInputRef]);

    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => {
            if (sortBy === 'newest') return (Number(b.updatedAt || b._creationTime)) - (Number(a.updatedAt || a._creationTime));
            if (sortBy === 'oldest') return (Number(a.updatedAt || a._creationTime)) - (Number(b.updatedAt || b._creationTime));
            const titleA = ('title' in a ? a.title : a.label).toLowerCase();
            const titleB = ('title' in b ? b.title : b.label).toLowerCase();
            return titleA.localeCompare(titleB);
        });
    }, [items, sortBy]);

    const formatDate = (timestamp: number) =>
        new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(timestamp));

    const getCategoryStyles = (cat: string, isSelected: boolean) => {
        if (isSelected) return "bg-[#e2f2f0] text-slate-900 border-[#0d9488]";
        return "bg-white text-slate-700 border-slate-200 hover:border-slate-300";
    };

    const hasActiveFilters = selectedCategory !== 'All' || selectedTags.length > 0 || searchQuery.trim() !== '';

    return (
        <div className="flex flex-col h-full w-full max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} aria-hidden="true" />
                <input
                    ref={searchInputRef}
                    type="search"
                    name="search"
                    autoComplete="off"
                    placeholder="Search prompts\u2026"
                    aria-label="Search prompts"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 rounded-xl border border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:border-transparent outline-none text-base shadow-sm transition-shadow"
                />
                {searchQuery && (
                    <button
                        onClick={() => onSearchChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 outline-none"
                        aria-label="Clear search"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Filter Chips & Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Category filters">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            aria-pressed={selectedCategory === cat}
                            className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 outline-none ${getCategoryStyles(cat, selectedCategory === cat)}`}
                        >
                            {cat}
                            {counts.categories[cat] !== undefined && (
                                <span className="ml-1.5 text-xs opacity-60 tabular-nums">{counts.categories[cat]}</span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label htmlFor="sort-select" className="text-sm text-slate-500 font-medium">Sort By</label>
                        <select
                            id="sort-select"
                            name="sortBy"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'alphabetical')}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-teal-500 outline-none"
                        >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="alphabetical">Alphabetical</option>
                        </select>
                    </div>

                    <button
                        onClick={onCreateNew}
                        className="flex items-center gap-2 bg-[#0d9488] hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors shadow-sm active:scale-95 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 outline-none"
                    >
                        <Plus size={18} aria-hidden="true" />
                        <span className="hidden sm:inline">Create New Prompt</span>
                        <span className="sm:hidden">New</span>
                    </button>
                </div>
            </div>

            {/* Tags Row */}
            {allTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-8" role="group" aria-label="Tag filters">
                    {allTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            aria-pressed={selectedTags.includes(tag)}
                            className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 outline-none ${selectedTags.includes(tag)
                                ? "bg-teal-50 text-slate-900 border-teal-200"
                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                                }`}
                        >
                            #{tag}
                        </button>
                    ))}
                </div>
            )}

            {/* Result count */}
            {hasActiveFilters && (
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-slate-500">
                        <span className="font-semibold tabular-nums">{sortedItems.length}</span> {sortedItems.length === 1 ? 'result' : 'results'}
                        {searchQuery && <> for &ldquo;{searchQuery}&rdquo;</>}
                    </p>
                    <button
                        onClick={onClearFilters}
                        className="text-xs text-teal-600 hover:text-teal-700 font-medium focus-visible:ring-2 focus-visible:ring-teal-500 rounded outline-none px-2 py-1"
                    >
                        Clear all filters
                    </button>
                </div>
            )}

            {/* Grid */}
            <div ref={gridRef} className="flex-1 overflow-y-auto min-h-0 pb-12 custom-scrollbar">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : sortedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        {hasActiveFilters ? (
                            <>
                                <Search size={48} className="mb-4 opacity-20" aria-hidden="true" />
                                <p className="text-lg font-medium text-slate-500 mb-1">No matches found</p>
                                <p className="text-sm mb-4">Try adjusting your search or filters.</p>
                                <button
                                    onClick={onClearFilters}
                                    className="text-sm text-teal-600 hover:text-teal-700 font-semibold focus-visible:ring-2 focus-visible:ring-teal-500 rounded outline-none px-3 py-1.5"
                                >
                                    Clear all filters
                                </button>
                            </>
                        ) : (
                            <>
                                <Sparkles size={48} className="mb-4 opacity-20 text-teal-400" aria-hidden="true" />
                                <p className="text-lg font-medium text-slate-600 mb-1" style={{ textWrap: 'balance' } as React.CSSProperties}>
                                    {viewMode === 'prompts' ? 'No prompts yet' : 'No templates yet'}
                                </p>
                                <p className="text-sm text-slate-400 mb-4">
                                    {viewMode === 'prompts'
                                        ? 'Create your first prompt to get started.'
                                        : 'Create a template for reusable prompt patterns.'}
                                </p>
                                <button
                                    onClick={onCreateNew}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition-colors shadow-md focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 outline-none"
                                >
                                    <Plus size={18} aria-hidden="true" />
                                    Create your first {viewMode === 'prompts' ? 'prompt' : 'template'}
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {sortedItems.map(item => {
                            const isSelected = selectedId === item._id;
                            const isTemplate = 'label' in item;
                            const catColor = getTagColor(item.category || 'Other');
                            const itemTitle = isTemplate ? (item as Template).label : (item as Prompt).title;

                            return (
                                <button
                                    key={item._id}
                                    onClick={() => onSelect(item)}
                                    className={`
                                        group bg-white rounded-2xl p-5 border-2 cursor-pointer transition-shadow transition-[border-color] duration-200 hover:shadow-md text-left w-full
                                        focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 outline-none
                                        ${isSelected ? 'ring-2 ring-teal-500/50 border-teal-500 shadow-sm' : 'shadow-sm'}
                                    `}
                                    style={!isSelected ? { borderColor: hexToRgba(catColor, 0.4) } : {}}
                                    aria-pressed={isSelected}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <span
                                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md text-slate-900"
                                            style={{ backgroundColor: hexToRgba(catColor, 0.12) }}
                                        >
                                            {item.category || 'Other'}
                                        </span>
                                        <span className="text-[11px] text-slate-400 font-medium tabular-nums">
                                            {formatDate(Number(item.updatedAt || item._creationTime))}
                                        </span>
                                    </div>

                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600 transition-colors" aria-hidden="true">
                                            {isTemplate ? <LayoutTemplate size={18} /> : <FileText size={18} />}
                                        </div>
                                        <h3 className="font-semibold text-slate-900 leading-tight line-clamp-2 pt-1" style={{ textWrap: 'balance' } as React.CSSProperties}>
                                            <HighlightMatch text={itemTitle} query={searchQuery} />
                                        </h3>
                                    </div>

                                    <p className="text-sm text-slate-600 font-mono mb-4 line-clamp-3 leading-relaxed">
                                        <HighlightMatch text={item.content.slice(0, 200)} query={searchQuery} />
                                    </p>

                                    <div className="flex flex-wrap gap-1.5 mt-auto">
                                        {item.tags.slice(0, 3).map(tag => {
                                            const tagColor = getTagColor(tag);
                                            return (
                                                <span
                                                    key={tag}
                                                    className="text-[10px] px-2 py-0.5 rounded-full border border-transparent font-medium text-slate-900"
                                                    style={{ backgroundColor: hexToRgba(tagColor, 0.08) }}
                                                >
                                                    #{tag}
                                                </span>
                                            );
                                        })}
                                        {item.tags.length > 3 && (
                                            <span className="text-[10px] text-slate-400 font-medium self-center">
                                                +{item.tags.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Keyboard hints */}
            <div className="hidden lg:flex items-center justify-center gap-4 py-2 text-[11px] text-slate-400">
                <span><kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-500 font-mono">Ctrl+K</kbd> Search</span>
                <span><kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-500 font-mono">Ctrl+N</kbd> New prompt</span>
            </div>
        </div>
    );
};

export default PromptList;
