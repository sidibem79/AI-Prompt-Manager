import React from 'react';
import { Search, Clock, Tag, LayoutTemplate, FileText } from 'lucide-react';
import { Prompt, Template } from '../types';

interface PromptListProps {
    items: (Prompt | Template)[];
    selectedId: string | null;
    onSelect: (item: Prompt | Template) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    viewMode: 'prompts' | 'templates';
}

const PromptList: React.FC<PromptListProps> = ({
    items,
    selectedId,
    onSelect,
    searchQuery,
    onSearchChange,
    viewMode
}) => {

    const formatDate = (timestamp: number) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
        }).format(new Date(timestamp));
    };

    return (
        <div className="flex flex-col h-full w-96 border-r border-slate-200 bg-white flex-shrink-0">
            {/* Search Header */}
            <div className="p-4 border-b border-slate-100 bg-[#fafaf9]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm transition-all"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto bg-[#fafaf9]">
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

                            return (
                                <div
                                    key={item._id}
                                    onClick={() => onSelect(item)}
                                    className={`
                    group p-4 cursor-pointer transition-all border-l-4
                    ${isSelected
                                            ? 'bg-white border-[#0d9488] shadow-sm'
                                            : 'bg-[#fafaf9] border-transparent hover:bg-white hover:border-slate-200'
                                        }
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

                                    <h3 className={`font-semibold text-sm mb-1 line-clamp-1 ${isSelected ? 'text-teal-900' : 'text-slate-900'}`}>
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
