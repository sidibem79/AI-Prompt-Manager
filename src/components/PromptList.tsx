import React, { useMemo, useState } from 'react';
import { Search, LayoutTemplate, FileText, XCircle, X } from 'lucide-react';
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
}

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
    onOpenTaxonomy
}) => {
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');

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

    return (
        <div className="flex flex-col h-full w-full max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search prompts..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-base shadow-sm transition-all"
                />
            </div>

            {/* Filter Chips & Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all ${getCategoryStyles(cat, selectedCategory === cat)}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500 font-medium">Sort By</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="alphabetical">Alphabetical</option>
                        </select>
                    </div>

                    <button
                        onClick={onCreateNew}
                        className="flex items-center gap-2 bg-[#0d9488] hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold transition-all shadow-sm active:scale-95"
                    >
                        Create New Prompt
                    </button>
                </div>
            </div>

            {/* Tags Row */}
            <div className="flex flex-wrap items-center gap-2 mb-8">
                {allTags.map(tag => (
                    <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full border text-xs font-medium transition-all ${selectedTags.includes(tag)
                            ? "bg-teal-50 text-slate-900 border-teal-200"
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                            }`}
                    >
                        #{tag}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto min-h-0 pb-12 custom-scrollbar">
                {sortedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <FileText size={48} className="mb-4 opacity-20" />
                        <p>No prompts found matching your criteria</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {sortedItems.map(item => {
                            const isSelected = selectedId === item._id;
                            const isTemplate = 'label' in item;
                            const catColor = getTagColor(item.category || 'Other');

                            return (
                                <div
                                    key={item._id}
                                    onClick={() => onSelect(item)}
                                    className={`
                                        group bg-white rounded-2xl p-5 border-2 cursor-pointer transition-all duration-200 hover:shadow-md
                                        ${isSelected ? 'ring-2 ring-teal-500/50 border-teal-500 shadow-sm' : 'shadow-sm'}
                                    `}
                                    style={!isSelected ? { borderColor: hexToRgba(catColor, 0.4) } : {}}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <span
                                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md text-slate-900"
                                            style={{ backgroundColor: hexToRgba(catColor, 0.12) }}
                                        >
                                            {item.category || 'Other'}
                                        </span>
                                        <span className="text-[11px] text-slate-400 font-medium">
                                            {formatDate(Number(item.updatedAt || item._creationTime))}
                                        </span>
                                    </div>

                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600 transition-colors">
                                            {isTemplate ? <LayoutTemplate size={18} /> : <FileText size={18} />}
                                        </div>
                                        <h3 className="font-semibold text-slate-900 leading-tight line-clamp-2 pt-1">
                                            {isTemplate ? (item as Template).label : (item as Prompt).title}
                                        </h3>
                                    </div>

                                    <p className="text-sm text-slate-600 font-mono mb-4 line-clamp-3 leading-relaxed">
                                        {item.content}
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
