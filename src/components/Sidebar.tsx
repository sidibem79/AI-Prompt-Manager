import React, { useMemo, useState } from 'react';
import {
    LayoutTemplate,
    FileText,
    Plus,
    Settings,
    Hash,
    Folder,
    Menu,
    X,
    Pencil
} from 'lucide-react';

interface SidebarProps {
    viewMode: 'prompts' | 'templates';
    setViewMode: (mode: 'prompts' | 'templates') => void;
    categories: string[];
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    tags: string[];
    selectedTags: string[];
    toggleTag: (tag: string) => void;
    onNewPrompt: () => void;
    onNewTemplate: () => void;
    counts: {
        prompts: number;
        templates: number;
        categories: Record<string, number>;
    };
    isMobileOpen: boolean;
    onToggleMobile: () => void;
    onOpenSettings: () => void;
    desktopWidth: number;
    onOpenTaxonomy: () => void;
    onRenameCategory: (from: string, to: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    viewMode,
    setViewMode,
    categories,
    selectedCategory,
    setSelectedCategory,
    tags,
    selectedTags,
    toggleTag,
    onNewPrompt,
    onNewTemplate,
    counts,
    isMobileOpen,
    onToggleMobile,
    onOpenSettings,
    onOpenTaxonomy,
    desktopWidth,
    onRenameCategory
}) => {
    const [tagsExpanded, setTagsExpanded] = useState(false);
    const [tagSearch, setTagSearch] = useState('');
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState('');
    const maxVisibleTags = 8;
    const filteredTags = useMemo(
        () => tags.filter(tag => tag.toLowerCase().includes(tagSearch.toLowerCase())),
        [tags, tagSearch]
    );
    const visibleTags = useMemo(
        () => filteredTags.slice(0, tagsExpanded ? filteredTags.length : maxVisibleTags),
        [filteredTags, tagsExpanded]
    );
    const hasOverflowTags = tags.length > maxVisibleTags;

    return (
        <>
            <button
                className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-[#0d9488] text-white shadow-lg"
                onClick={onToggleMobile}
                aria-label="Toggle navigation"
            >
                {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div
                style={{ width: `${desktopWidth}px` }}
                className={`bg-[#0f172a] text-slate-200 flex flex-col h-full border-r border-slate-800/50 flex-shrink-0 transition-transform duration-200 lg:translate-x-0 fixed lg:static inset-y-0 z-30 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:-translate-x-0'}`}
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-800/50 flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#0d9488] rounded-lg flex items-center justify-center text-white shadow-lg shadow-teal-900/20">
                        <Hash size={18} strokeWidth={3} />
                    </div>
                    <div className="flex-1">
                        <span className="font-bold text-white tracking-tight block">PromptManager</span>
                        <span className="text-[11px] uppercase tracking-wider text-slate-400">
                            {viewMode === 'prompts' ? `${counts.prompts} prompts` : `${counts.templates} templates`}
                        </span>
                    </div>
                    <button
                        onClick={onOpenSettings}
                        className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        aria-label="Open settings"
                    >
                        <Settings size={16} />
                    </button>
                </div>

                {/* Primary Navigation */}
                <div className="p-3 space-y-1">
                    <button
                        onClick={() => setViewMode('prompts')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'prompts'
                            ? 'bg-[#0f172a] text-white shadow-sm ring-1 ring-slate-700'
                            : 'hover:bg-slate-800/50 hover:text-white'
                            }`}
                    >
                        <FileText size={18} className={viewMode === 'prompts' ? 'text-[#0d9488]' : 'text-slate-400'} />
                        Prompts
                        <span className="ml-auto text-xs font-semibold text-slate-400">{counts.prompts}</span>
                    </button>
                    <button
                        onClick={() => setViewMode('templates')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'templates'
                            ? 'bg-[#0f172a] text-white shadow-sm ring-1 ring-slate-700'
                            : 'hover:bg-slate-800/50 hover:text-white'
                            }`}
                    >
                        <LayoutTemplate size={18} className={viewMode === 'templates' ? 'text-[#0d9488]' : 'text-slate-400'} />
                        Templates
                        <span className="ml-auto text-xs font-semibold text-slate-400">{counts.templates}</span>
                    </button>
                </div>

                {/* Categories Section */}
                <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">
                        <span>Categories</span>
                        <span className="text-[11px] text-slate-500">{categories.length - 1} total</span>
                    </div>
                    <div className="space-y-0.5 mb-4">
                        {categories.map(category => (
                            <div
                                key={category}
                                className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${selectedCategory === category
                                    ? 'text-[#14b8a6] bg-[#0d9488]/10'
                                    : 'text-slate-300 hover:text-slate-200 hover:bg-slate-800/30'
                                    }`}
                            >
                                {editingCategory === category ? (
                                    <input
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && editingValue.trim()) {
                                                onRenameCategory(category, editingValue.trim());
                                                setEditingCategory(null);
                                            }
                                            if (e.key === 'Escape') {
                                                setEditingCategory(null);
                                            }
                                        }}
                                        onBlur={() => {
                                            if (editingValue.trim() && editingValue.trim() !== category) {
                                                onRenameCategory(category, editingValue.trim());
                                            }
                                            setEditingCategory(null);
                                        }}
                                        autoFocus
                                        className="w-full px-2 py-1 rounded bg-slate-900/60 border border-slate-700 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-teal-500"
                                    />
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setSelectedCategory(category)}
                                            className="flex items-center gap-2 flex-1 text-left"
                                        >
                                            <Folder size={14} />
                                            <span className="truncate">{category}</span>
                                        </button>
                                        <span className="w-6 text-right text-[11px] text-slate-500">
                                            {counts.categories[category] ?? 0}
                                        </span>
                                        {category !== 'All' && (
                                            <button
                                                onClick={() => { setEditingCategory(category); setEditingValue(category); }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white transition-opacity"
                                                title="Rename category"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Tags Section */}
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">
                        <span>Tags</span>
                        {hasOverflowTags && (
                            <button
                                onClick={() => setTagsExpanded(!tagsExpanded)}
                                className="text-[11px] font-semibold text-[#5eead4]"
                            >
                                {tagsExpanded ? 'Show less' : 'Show more'}
                            </button>
                        )}
                    </div>
                    <div className="px-2 mb-2">
                        <input
                            value={tagSearch}
                            onChange={(e) => setTagSearch(e.target.value)}
                            placeholder="Search tags..."
                            className="w-full px-3 py-2 rounded-md bg-slate-900/50 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 px-2 mb-2">
                        {visibleTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`text-xs px-2 py-1 rounded-full border transition-colors ${selectedTags.includes(tag)
                                    ? 'bg-[#0d9488]/20 text-[#5eead4] border-[#0d9488]/30'
                                    : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:border-slate-600'
                                    }`}
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                    {tags.length === 0 && (
                        <div className="px-2 text-[11px] text-slate-500">No tags yet</div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-800/50 space-y-3">
                    <button
                        onClick={viewMode === 'prompts' ? onNewPrompt : onNewTemplate}
                        className="w-full flex items-center justify-center gap-2 bg-[#f59e0b] hover:bg-[#d97706] text-[#1e293b] px-4 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-amber-900/20 active:transform active:scale-95"
                    >
                        <Plus size={18} />
                        {viewMode === 'prompts' ? 'New Prompt' : 'New Template'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
