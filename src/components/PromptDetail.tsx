import React, { useEffect, useMemo, useState } from 'react';
import {
    Copy,
    Edit2,
    Trash2,
    Clock,
    RotateCcw,
    History,
    Eye,
    Sparkles,
    ArrowLeft,
    MoreHorizontal,
    FileText,
    CheckCircle2,
    ExternalLink
} from 'lucide-react';
import { Prompt, Template, Version } from '../types';
import { getTagColor, hexToRgba } from '../utils/color';

interface PromptDetailProps {
    item: Prompt | Template | null;
    onEdit: () => void;
    onDelete: () => void;
    onCopy: (text: string) => void;
    versions?: Version[];
    onRestoreVersion?: (version: Version) => void;
    lastAction?: { type: string; timestamp: number } | null;
    onCreateNew?: () => void;
    onBack?: () => void;
}

const PromptContent: React.FC<{ content: string }> = ({ content }) => {
    const lines = content.split('\n');

    return (
        <div className="bg-[#0a1e29] border border-[#1a2e39] rounded-xl p-6 font-mono text-sm leading-relaxed shadow-lg">
            {lines.map((line, i) => {
                // Simple regex for basic syntax highlighting
                // Match # Headers
                if (line.startsWith('# ')) {
                    return (
                        <div key={i} className="mb-2">
                            <span className="text-blue-400 font-bold">{line}</span>
                        </div>
                    );
                }

                // Match **bold**
                const parts = line.split(/(\*\*.*?\*\*)/g);
                return (
                    <div key={i} className="min-h-[1.25rem]">
                        {parts.map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return (
                                    <span key={j} className="text-emerald-400 font-bold">
                                        {part}
                                    </span>
                                );
                            }
                            return <span key={j} className="text-slate-100">{part}</span>;
                        })}
                    </div>
                );
            })}
        </div>
    );
};

const PromptDetail: React.FC<PromptDetailProps> = ({
    item,
    onEdit,
    onDelete,
    onCopy,
    versions = [],
    onRestoreVersion,
    lastAction,
    onCreateNew,
    onBack
}) => {
    const [detailTab, setDetailTab] = useState<'content' | 'history'>('content');
    const [previewVersion, setPreviewVersion] = useState<Version | null>(null);
    const [restoreCandidate, setRestoreCandidate] = useState<Version | null>(null);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    const itemIdentifier = item ? item._id : null;

    useEffect(() => {
        setPreviewVersion(null);
        setRestoreCandidate(null);
        setDetailTab('content');
    }, [itemIdentifier]);

    // Snapshot scroll position before re-render, then restore it
    // Actually, setting state shouldn't scroll unless something else is happening.
    // Let's ensure the event is fully handled.

    if (!item) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-600 p-8 h-full">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-teal-100 text-teal-600 flex items-center justify-center shadow-sm">
                        <Sparkles size={36} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">No prompt selected</h2>
                        <p className="text-slate-500 mt-2">
                            Pick a prompt from the sidebar or create a new one to get started.
                        </p>
                    </div>
                    <button
                        onClick={onCreateNew}
                        type="button"
                        className="px-6 py-3 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition-all shadow-md"
                    >
                        Create New Prompt
                    </button>
                </div>
            </div>
        );
    }

    const isTemplate = 'label' in item;
    const title = isTemplate ? (item as Template).label : (item as Prompt).title;
    const subtitle = isTemplate ? (item as Template).title : null;
    const creationDate = new Date(item._creationTime).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    const updatedDate = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }) : creationDate;

    return (
        <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
            {/* Top Navigation */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <button
                    onClick={onBack}
                    type="button"
                    className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                    {previewVersion && (
                        <button
                            onClick={() => setPreviewVersion(null)}
                            type="button"
                            className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100 hover:bg-teal-100 transition-all"
                        >
                            Viewing History (Exit)
                        </button>
                    )}
                    <button type="button" className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                        <MoreHorizontal size={20} />
                    </button>
                </div>
            </div>

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar scroll-smooth">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4">
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-2 group">
                                <FileText className="text-slate-400" size={28} />
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                                    {previewVersion ? `(History) ${title}` : title}
                                </h1>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-sm">
                                <FileText size={16} />
                                <span>{item.category}</span>
                            </div>
                        </div>
                        <div className="text-right whitespace-nowrap">
                            <p className="text-slate-400 text-sm">Created {creationDate}</p>
                        </div>
                    </div>

                    {/* Content Block */}
                    <PromptContent content={previewVersion ? previewVersion.content : item.content} />

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onCopy(previewVersion ? previewVersion.content : item.content);
                            }}
                            type="button"
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-6 bg-[#14b8a6] text-white font-bold rounded-xl hover:bg-[#0d9488] transition-all shadow-sm"
                        >
                            <Copy size={20} />
                            Copy Prompt
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onEdit();
                            }}
                            type="button"
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-6 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <Edit2 size={20} className="text-slate-400" />
                            Edit Prompt
                        </button>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                            <span className="text-slate-900 font-bold min-w-[120px]">Tags:</span>
                            <div className="flex flex-wrap gap-2">
                                {item.tags.map(tag => {
                                    const color = getTagColor(tag);
                                    return (
                                        <span
                                            key={tag}
                                            className="px-3 py-1 rounded-full text-xs font-bold"
                                            style={{
                                                backgroundColor: hexToRgba(color, 0.2),
                                                color: color,
                                                border: `1px solid ${hexToRgba(color, 0.4)}`
                                            }}
                                        >
                                            #{tag}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-slate-900 font-bold min-w-[120px]">Last Updated:</span>
                            <span className="text-slate-500">{updatedDate}</span>
                        </div>
                    </div>

                    {/* Version History */}
                    <div className="space-y-6 pt-8 border-t border-slate-100 pb-12">
                        <h2 className="text-xl font-bold text-slate-900">Version History</h2>
                        <div className="space-y-4 pl-4 relative border-l-2 border-slate-100">
                            {versions.length > 0 ? (
                                versions.map((v, i) => {
                                    const isActive = (i === 0 && !previewVersion) || (previewVersion?._id === v._id);
                                    return (
                                        <div key={v._id} className="relative pl-6 pb-2">
                                            <div className={`absolute left-[-29px] top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm transition-colors ${isActive ? 'bg-teal-500' : 'bg-slate-200'}`} />
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    const scrollPos = scrollContainerRef.current?.scrollTop;
                                                    if (i === 0) {
                                                        setPreviewVersion(null);
                                                    } else {
                                                        setPreviewVersion(v);
                                                    }
                                                    // Request a frame to restore scroll after render jump
                                                    requestAnimationFrame(() => {
                                                        if (scrollContainerRef.current && scrollPos !== undefined) {
                                                            scrollContainerRef.current.scrollTop = scrollPos;
                                                        }
                                                    });
                                                }}
                                                type="button"
                                                className={`flex items-center gap-2 text-left hover:text-teal-600 transition-colors ${isActive ? 'text-teal-600 font-bold' : ''}`}
                                            >
                                                <span className={`${isActive ? 'text-teal-700' : 'text-slate-900'} font-bold`}>
                                                    {i === 0 ? 'Last Updated:' : 'Version from:'}
                                                </span>
                                                <span className={isActive ? 'text-teal-600' : 'text-slate-500'}>
                                                    {new Date(v.timestamp).toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                                {isActive && <CheckCircle2 size={14} className="text-teal-500" />}
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="relative pl-6">
                                    <div className="absolute left-[-29px] top-1.5 w-4 h-4 rounded-full bg-slate-200 border-4 border-white shadow-sm" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-900 font-bold">First updated:</span>
                                        <span className="text-slate-500">{creationDate}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromptDetail;
