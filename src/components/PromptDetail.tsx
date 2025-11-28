import React from 'react';
import {
    Copy,
    Edit2,
    Trash2,
    Clock,
    Tag,
    MoreVertical,
    Check,
    RotateCcw
} from 'lucide-react';
import { Prompt, Template, Version } from '../types';

interface PromptDetailProps {
    item: Prompt | Template | null;
    onEdit: () => void;
    onDelete: () => void;
    onCopy: (text: string) => void;
    versions?: Version[];
    onRestoreVersion?: (version: Version) => void;
}

const PromptDetail: React.FC<PromptDetailProps> = ({
    item,
    onEdit,
    onDelete,
    onCopy,
    versions = [],
    onRestoreVersion
}) => {
    if (!item) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 text-slate-600">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <div className="w-8 h-8 border-2 border-slate-300 rounded-sm" />
                </div>
                <p className="font-medium">Select an item to view details</p>
            </div>
        );
    }

    const isTemplate = 'label' in item;
    const title = isTemplate ? (item as Template).label : (item as Prompt).title;
    const subtitle = isTemplate ? (item as Template).title : null;

    return (
        <div className="flex-1 flex flex-col h-full bg-white min-w-0">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start bg-white sticky top-0 z-10">
                <div className="max-w-2xl">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 text-xs font-bold uppercase tracking-wide border border-teal-100">
                            {item.category}
                        </span>
                        <div className="flex gap-2">
                            {item.tags.map(tag => (
                                <span key={tag} className="text-xs text-slate-700 font-medium bg-[#fafaf9] px-2 py-0.5 rounded border border-slate-100">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-slate-700 font-medium">{subtitle}</p>
                    )}

                    <div className="flex items-center gap-4 mt-4 text-sm text-slate-600">
                        {/* @ts-ignore */}
                        {item.updatedAt && (
                            <span className="flex items-center gap-1.5">
                                <Clock size={14} />
                                Updated {new Date(item.updatedAt).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => onCopy(item.content)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-[#fafaf9] hover:text-teal-600 hover:border-teal-200 transition-all"
                    >
                        <Copy size={16} />
                        <span className="hidden sm:inline">Copy</span>
                    </button>
                    <button
                        onClick={onEdit}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0d9488] text-white font-medium hover:bg-teal-700 shadow-sm transition-all"
                    >
                        <Edit2 size={16} />
                        <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Content "Reading Room" */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#fafaf9]">
                <div className="max-w-4xl mx-auto">
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-white rounded-xl shadow-sm opacity-100 transition-opacity -z-10 border border-slate-100" />
                        <pre className="whitespace-pre-wrap font-mono text-base text-slate-800 leading-relaxed p-4">
                            {item.content}
                        </pre>
                    </div>
                </div>
            </div>

            {/* Version History Footer (Collapsible or small) */}
            {!isTemplate && versions.length > 0 && (
                <div className="border-t border-slate-100 bg-white p-4">
                    <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 px-2">Recent Versions</h4>
                    <div className="flex gap-3 overflow-x-auto pb-2 px-2">
                        {versions.slice(0, 5).map(v => (
                            <div key={v._id} className="flex-shrink-0 w-64 bg-[#fafaf9] p-3 rounded-lg border border-slate-200 shadow-sm text-xs group cursor-pointer hover:border-teal-300 transition-all">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-slate-600">{new Date(v.timestamp).toLocaleString()}</span>
                                    {onRestoreVersion && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onRestoreVersion(v); }}
                                            className="text-teal-600 hover:bg-teal-50 p-1 rounded opacity-0 group-hover:opacity-100 transition-all"
                                            title="Restore"
                                        >
                                            <RotateCcw size={12} />
                                        </button>
                                    )}
                                </div>
                                <p className="line-clamp-2 font-mono text-slate-700">{v.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromptDetail;
