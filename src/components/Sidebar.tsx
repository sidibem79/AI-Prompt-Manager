import React from 'react';
import {
    LayoutTemplate,
    FileText,
    Plus,
    Settings,
    Search,
    Hash,
    Folder
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
    onNewTemplate
}) => {
    return (
        <div className="w-64 bg-[#1e293b] text-slate-300 flex flex-col h-full border-r border-slate-700/50 flex-shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50 flex items-center gap-3">
                <div className="w-8 h-8 bg-[#0d9488] rounded-lg flex items-center justify-center text-white shadow-lg shadow-teal-900/20">
                    <Hash size={18} strokeWidth={3} />
                </div>
                <span className="font-bold text-white tracking-tight">PromptManager</span>
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
                </button>
            </div>

            {/* Categories Section */}
            <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
                    Categories
                </div>
                <div className="space-y-0.5 mb-6">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${selectedCategory === category
                                ? 'text-[#14b8a6] bg-[#0d9488]/10'
                                : 'text-slate-300 hover:text-slate-200 hover:bg-slate-800/30'
                                }`}
                        >
                            <Folder size={14} />
                            <span className="truncate">{category}</span>
                        </button>
                    ))}
                </div>

                {/* Tags Section */}
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
                    Tags
                </div>
                <div className="flex flex-wrap gap-2 px-2">
                    {tags.map(tag => (
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
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-700/50">
                <button
                    onClick={viewMode === 'prompts' ? onNewPrompt : onNewTemplate}
                    className="w-full flex items-center justify-center gap-2 bg-[#f59e0b] hover:bg-[#d97706] text-[#1e293b] px-4 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-amber-900/20 active:transform active:scale-95"
                >
                    <Plus size={18} />
                    {viewMode === 'prompts' ? 'New Prompt' : 'New Template'}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
