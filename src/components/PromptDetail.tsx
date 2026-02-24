import React, { useEffect, useState } from 'react';
import {
    Copy,
    Edit2,
    Trash2,
    RotateCcw,
    Sparkles,
    ArrowLeft,
    FileText,
    CheckCircle2
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
    onRequestConfirm?: (message: string, onConfirm: () => void) => void;
}

const PromptContent: React.FC<{ content: string }> = ({ content }) => {
    const lines = content.split('\n');

    return (
        <div className="bg-[#071924] border border-[#153245] rounded-2xl p-6 lg:p-7 font-mono text-[15px] leading-8 shadow-lg">
            {lines.map((line, i) => {
                if (line.startsWith('# ')) {
                    return (
                        <div key={i} className="mb-2 text-sky-300 font-bold">
                            {line}
                        </div>
                    );
                }

                const parts = line.split(/(\*\*.*?\*\*)/g);
                return (
                    <div key={i} className="min-h-[1.5rem] text-slate-100">
                        {parts.map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return (
                                    <span key={j} className="text-emerald-300 font-semibold">
                                        {part.slice(2, -2)}
                                    </span>
                                );
                            }
                            return <span key={j}>{part}</span>;
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
    onBack,
    onRequestConfirm
}) => {
    const [detailTab, setDetailTab] = useState<'content' | 'metadata' | 'history'>('content');
    const [previewVersion, setPreviewVersion] = useState<Version | null>(null);
    const [contentView, setContentView] = useState<'formatted' | 'raw'>('formatted');

    const itemIdentifier = item ? item._id : null;

    useEffect(() => {
        setPreviewVersion(null);
        setContentView('formatted');
        setDetailTab('content');
    }, [itemIdentifier]);

    if (!item) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-600 p-8 h-full">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-teal-100 text-teal-600 flex items-center justify-center shadow-sm">
                        <Sparkles size={36} aria-hidden="true" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900" style={{ textWrap: 'balance' } as React.CSSProperties}>No prompt selected</h2>
                        <p className="text-slate-500 mt-2">
                            Pick a prompt from the list or create a new one to get started.
                        </p>
                    </div>
                    <button
                        onClick={onCreateNew}
                        type="button"
                        className="px-6 py-3 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition-colors shadow-md focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 outline-none"
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
    const activeContent = previewVersion ? previewVersion.content : item.content;
    const creationDate = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(new Date(item._creationTime));
    const updatedDate = item.updatedAt ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(new Date(item.updatedAt)) : creationDate;

    const handleRestore = (version: Version) => {
        if (onRequestConfirm) {
            onRequestConfirm(
                `Restore this version from ${new Date(version.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}? This will overwrite the current content.`,
                () => onRestoreVersion?.(version)
            );
            return;
        }
        onRestoreVersion?.(version);
    };

    const selectVersionPreview = (version: Version | null) => {
        setPreviewVersion(version);
        setDetailTab('content');
    };

    const tabButtonClass = (tab: 'content' | 'metadata' | 'history') =>
        `px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 outline-none ${detailTab === tab
            ? 'bg-teal-50 text-teal-700 border border-teal-200'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-transparent'
        }`;

    return (
        <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
            <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur px-4 lg:px-6 py-3">
                <div className="flex items-center justify-between gap-3">
                    <button
                        onClick={onBack}
                        type="button"
                        className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 outline-none"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div className="flex items-center gap-2">
                        {previewVersion && (
                            <button
                                onClick={() => setPreviewVersion(null)}
                                type="button"
                                className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1.5 rounded-lg border border-teal-200 hover:bg-teal-100 transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 outline-none"
                            >
                                Exit history preview
                            </button>
                        )}
                        <button
                            onClick={() => onCopy(activeContent)}
                            type="button"
                            aria-label="Copy prompt"
                            className="p-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors border border-teal-200 focus-visible:ring-2 focus-visible:ring-teal-500 outline-none"
                        >
                            <Copy size={16} />
                        </button>
                        <button
                            onClick={onEdit}
                            type="button"
                            aria-label="Edit prompt"
                            className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200 focus-visible:ring-2 focus-visible:ring-teal-500 outline-none"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            onClick={onDelete}
                            type="button"
                            aria-label="Delete prompt"
                            className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors border border-rose-200 focus-visible:ring-2 focus-visible:ring-rose-500 outline-none"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <FileText className="text-slate-400 shrink-0" size={20} aria-hidden="true" />
                            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight leading-tight" style={{ textWrap: 'balance' } as React.CSSProperties}>
                                {previewVersion ? `(History) ${title}` : title}
                            </h1>
                        </div>
                        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                                {item.category || 'Other'}
                            </span>
                            <span className="text-xs text-slate-400 tabular-nums">Created {creationDate}</span>
                        </div>
                    </div>
                    <span className="text-xs text-slate-400 tabular-nums self-start">Updated {updatedDate}</span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                    <button type="button" onClick={() => setDetailTab('content')} className={tabButtonClass('content')}>Content</button>
                    <button type="button" onClick={() => setDetailTab('metadata')} className={tabButtonClass('metadata')}>Metadata</button>
                    <button type="button" onClick={() => setDetailTab('history')} className={tabButtonClass('history')}>History</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 custom-scrollbar">
                <div className="max-w-4xl mx-auto">
                    {detailTab === 'content' && (
                        <div className="space-y-4 pb-10">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-xs text-slate-500 font-medium">
                                    {previewVersion ? 'Previewing a previous version' : 'Current prompt content'}
                                </p>
                                <div className="inline-flex items-center p-1 rounded-lg border border-slate-200 bg-white">
                                    <button
                                        type="button"
                                        onClick={() => setContentView('formatted')}
                                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${contentView === 'formatted' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Formatted
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setContentView('raw')}
                                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${contentView === 'raw' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Raw
                                    </button>
                                </div>
                            </div>

                            {contentView === 'formatted' ? (
                                <PromptContent content={activeContent} />
                            ) : (
                                <pre className="bg-slate-950 text-slate-100 border border-slate-800 rounded-2xl p-6 lg:p-7 text-sm leading-relaxed whitespace-pre-wrap break-words overflow-x-auto">
                                    {activeContent}
                                </pre>
                            )}
                        </div>
                    )}

                    {detailTab === 'metadata' && (
                        <div className="space-y-4 pb-10">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-5">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-1">Category</p>
                                        <p className="text-slate-900 font-semibold">{item.category || 'Other'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-1">Last updated</p>
                                        <p className="text-slate-900 font-semibold tabular-nums">{updatedDate}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-1">Created</p>
                                        <p className="text-slate-900 font-semibold tabular-nums">{creationDate}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-1">Type</p>
                                        <p className="text-slate-900 font-semibold">{isTemplate ? 'Template' : 'Prompt'}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-2">Tags</p>
                                    <div className="flex flex-wrap gap-2">
                                        {item.tags.length === 0 && <span className="text-sm text-slate-400">No tags</span>}
                                        {item.tags.map(tag => {
                                            const color = getTagColor(tag);
                                            return (
                                                <span
                                                    key={tag}
                                                    className="px-3 py-1 rounded-full text-xs font-semibold text-slate-900"
                                                    style={{
                                                        backgroundColor: hexToRgba(color, 0.2),
                                                        border: `1px solid ${hexToRgba(color, 0.45)}`
                                                    }}
                                                >
                                                    #{tag}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {lastAction && (
                                <p className="text-xs text-slate-400 tabular-nums">
                                    Last action: {lastAction.type} at {new Intl.DateTimeFormat('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }).format(new Date(lastAction.timestamp))}
                                </p>
                            )}
                        </div>
                    )}

                    {detailTab === 'history' && (
                        <div className="space-y-3 pb-10">
                            {versions.length > 0 ? (
                                versions.map((v, i) => {
                                    const isActive = (i === 0 && !previewVersion) || (previewVersion?._id === v._id);
                                    const timestamp = new Intl.DateTimeFormat('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }).format(new Date(v.timestamp));

                                    return (
                                        <div
                                            key={v._id}
                                            className={`rounded-xl border p-4 ${isActive ? 'border-teal-300 bg-teal-50/60' : 'border-slate-200 bg-white'}`}
                                        >
                                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className={`text-sm font-semibold ${isActive ? 'text-teal-700' : 'text-slate-800'}`}>
                                                        {i === 0 ? 'Current version' : 'Snapshot'}
                                                    </span>
                                                    <span className="text-xs text-slate-500 tabular-nums">{timestamp}</span>
                                                    {isActive && <CheckCircle2 size={14} className="text-teal-500" aria-hidden="true" />}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => selectVersionPreview(i === 0 ? null : v)}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-500 outline-none"
                                                    >
                                                        {i === 0 ? 'View current' : 'Preview'}
                                                    </button>
                                                    {i > 0 && previewVersion?._id === v._id && (
                                                        <button
                                                            onClick={() => handleRestore(v)}
                                                            type="button"
                                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-amber-500 outline-none"
                                                        >
                                                            <RotateCcw size={12} className="inline mr-1" aria-hidden="true" />
                                                            Restore
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
                                    No historical snapshots yet.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PromptDetail;
