import React, { useEffect, useMemo, useState } from 'react';
import {
    Copy,
    Edit2,
    Trash2,
    Clock,
    RotateCcw,
    History,
    Eye,
    Sparkles
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
}

const PromptDetail: React.FC<PromptDetailProps> = ({
    item,
    onEdit,
    onDelete,
    onCopy,
    versions = [],
    onRestoreVersion,
    lastAction,
    onCreateNew
}) => {
    const [detailTab, setDetailTab] = useState<'content' | 'history'>('content');
    const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
    const [restoreCandidate, setRestoreCandidate] = useState<Version | null>(null);
    const [autoPreviewEnabled, setAutoPreviewEnabled] = useState(true);
    const activeVersion = useMemo(
        () => versions.find(version => version._id === activeVersionId) ?? null,
        [versions, activeVersionId]
    );
    const itemIdentifier = item ? item._id : null;

    const getDiffSnippet = useMemo(() => {
        if (!item) {
            return () => '';
        }
        const currentLines = (item.content || '').split('\n');
        return (version: Version) => {
            const versionLines = version.content.split('\n');
            const snippet: string[] = [];
            for (let i = 0; i < Math.max(versionLines.length, currentLines.length); i += 1) {
                const currentLine = currentLines[i];
                const versionLine = versionLines[i];
                if (currentLine === versionLine) continue;
                if (versionLine !== undefined) snippet.push(`- ${versionLine}`);
                if (currentLine !== undefined) snippet.push(`+ ${currentLine}`);
                if (snippet.length >= 6) break;
            }
            if (snippet.length === 0) {
                return versionLines.slice(0, 4).join('\n');
            }
            return snippet.join('\n');
        };
    }, [item?.content]);
    useEffect(() => {
        setActiveVersionId(null);
        setRestoreCandidate(null);
        setAutoPreviewEnabled(true);
        setDetailTab('content');
    }, [itemIdentifier]);
    useEffect(() => {
        if (!autoPreviewEnabled || activeVersionId || versions.length === 0 || detailTab !== 'history') {
            return;
        }
        setActiveVersionId(versions[0]._id);
    }, [autoPreviewEnabled, activeVersionId, versions, detailTab]);

    const diffRows = useMemo(() => {
        if (!item || !activeVersion) return [];
        const previousLines = activeVersion.content.split('\n');
        const currentLines = item.content.split('\n');
        const maxLines = Math.max(previousLines.length, currentLines.length);
        const rows: Array<{ id: string; previous?: string; current?: string; type: 'unchanged' | 'added' | 'removed' | 'changed' }> = [];
        for (let i = 0; i < maxLines; i += 1) {
            const previous = previousLines[i];
            const current = currentLines[i];
            let type: 'unchanged' | 'added' | 'removed' | 'changed' = 'unchanged';
            if (previous === current) {
                type = 'unchanged';
            } else if (previous === undefined) {
                type = 'added';
            } else if (current === undefined) {
                type = 'removed';
            } else {
                type = 'changed';
            }
            rows.push({
                id: `${i}-${previous ?? ''}-${current ?? ''}`,
                previous,
                current,
                type
            });
        }
        return rows;
    }, [activeVersion, item]);

    const timeAgo = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'just now';
        if (minutes === 1) return '1 minute ago';
        if (minutes < 60) return `${minutes} minutes ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };
    const diffSummary = useMemo(() => {
        return diffRows.reduce(
            (acc, row) => {
                if (row.type === 'added' || row.type === 'changed') acc.additions += 1;
                if (row.type === 'removed' || row.type === 'changed') acc.removals += 1;
                return acc;
            },
            { additions: 0, removals: 0 }
        );
    }, [diffRows]);
    const unifiedDiffLines = useMemo(() => {
        return diffRows.flatMap((row, index) => {
            const baseLine = index + 1;
            if (row.type === 'unchanged') {
                return [{
                    key: `${row.id}-ctx`,
                    type: 'context' as const,
                    text: row.current ?? row.previous ?? '',
                    lineNumber: baseLine
                }];
            }
            const lines: Array<{ key: string; type: 'context' | 'added' | 'removed'; text: string; lineNumber: number }> = [];
            if (row.previous !== undefined) {
                lines.push({
                    key: `${row.id}-prev`,
                    type: 'removed',
                    text: row.previous,
                    lineNumber: baseLine
                });
            }
            if (row.current !== undefined) {
                lines.push({
                    key: `${row.id}-curr`,
                    type: 'added',
                    text: row.current,
                    lineNumber: baseLine
                });
            }
            return lines;
        });
    }, [diffRows]);
    const unifiedDiffClass = (type: 'context' | 'added' | 'removed') => {
        switch (type) {
            case 'added':
                return 'bg-emerald-500/15 text-emerald-50 border-b-2 border-emerald-400/70';
            case 'removed':
                return 'bg-rose-500/15 text-rose-50 border-b-2 border-rose-400/70';
            default:
                return 'text-slate-200 border-b border-slate-800/70';
        }
    };
    const handlePreviewVersion = (version: Version) => {
        setAutoPreviewEnabled(false);
        setActiveVersionId(version._id);
        setDetailTab('history');
    };
    const handleRestoreRequest = (version: Version) => {
        if (!onRestoreVersion) return;
        setRestoreCandidate(version);
        setDetailTab('history');
    };
    const confirmRestore = () => {
        if (restoreCandidate && onRestoreVersion) {
            onRestoreVersion(restoreCandidate);
            setRestoreCandidate(null);
        }
    };
    const cancelRestoreRequest = () => setRestoreCandidate(null);

    if (!item) {
        return (
            <div className="flex-1 flex flex-col items-center justify-start bg-gradient-to-b from-slate-50 to-white text-slate-600 py-8 px-4 overflow-y-auto h-full min-h-0">
                <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl shadow-sm p-4 sm:p-6 text-center space-y-5">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
                        <Sparkles size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-900">No prompt selected</h2>
                        <p className="text-sm text-slate-500">
                            Pick something from the library or start fresh with our curated starter kits.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={onCreateNew}
                            className="px-4 py-2.5 rounded-xl bg-[#0d9488] text-white font-semibold hover:bg-teal-700 transition-all shadow"
                        >
                            New prompt
                        </button>
                    </div>
                    <div className="rounded-2xl bg-slate-50 border border-dashed border-slate-200 p-4 space-y-2 text-left">
                        <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Kickstart ideas</p>
                        <ul className="text-sm text-slate-600 space-y-1 break-words">
                            <li>- Pin favorite prompts for quick reuse.</li>
                            <li>- Use tags to group prompts by workflow.</li>
                            <li>- Capture learnings with inline notes.</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    const isTemplate = 'label' in item;
    const title = isTemplate ? (item as Template).label : (item as Prompt).title;
    const subtitle = isTemplate ? (item as Template).title : null;
    const hasChanges = diffSummary.additions > 0 || diffSummary.removals > 0;

    return (
        <div className="flex-1 flex flex-col h-full bg-white min-w-0">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 bg-white sticky top-0 z-10">
                <div className="flex justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 text-xs font-bold uppercase tracking-wide border border-teal-100">
                                {item.category}
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="uppercase tracking-widest text-[11px] text-slate-500 font-semibold">Tags</span>
                                <div className="flex items-center gap-1 flex-wrap">
                                    {item.tags.length === 0 ? (
                                        <span className="text-[11px] text-slate-400">None</span>
                                    ) : (
                                        item.tags.map(tag => {
                                            const color = getTagColor(tag);
                                            return (
                                                <span
                                                    key={tag}
                                                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                                                    style={{
                                                        borderColor: hexToRgba(color, 0.4),
                                                        backgroundColor: hexToRgba(color, 0.15),
                                                        color: '#000000'
                                                    }}
                                                >
                                                    #{tag}
                                                </span>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-slate-700 font-medium">{subtitle}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                            {/* @ts-ignore */}
                            {item.updatedAt && (
                                <span className="flex items-center gap-1.5">
                                    <Clock size={14} />
                                    Updated {new Date(item.updatedAt).toLocaleDateString()}
                                </span>
                            )}
                            <span className="flex items-center gap-1.5">
                                <History size={14} />
                                {versions.length} version{versions.length === 1 ? '' : 's'}
                            </span>
                            {lastAction && (
                                <span className="flex items-center gap-1.5 text-teal-700 font-semibold">
                                    {lastAction.type} {timeAgo(lastAction.timestamp)}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-start gap-2 flex-wrap">
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

                <div className="mt-4 flex items-center gap-3 flex-wrap justify-between">
                    <div className="inline-flex rounded-lg border border-slate-200 bg-[#f8fafc] p-1">
                        <button
                            onClick={() => setDetailTab('content')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${detailTab === 'content' ? 'bg-white text-teal-700 shadow-sm border border-teal-200' : 'text-slate-600'}`}
                        >
                            Content
                        </button>
                        {!isTemplate && (
                            <button
                                onClick={() => setDetailTab('history')}
                                disabled={versions.length === 0}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${detailTab === 'history' ? 'bg-white text-teal-700 shadow-sm border border-teal-200' : 'text-slate-600 disabled:text-slate-400 disabled:opacity-70'}`}
                            >
                                History
                            </button>
                        )}
                    </div>
                    {detailTab === 'content' && !isTemplate && versions.length > 0 && (
                        <span className="text-xs text-slate-500">
                            Switch to History to compare and restore previous edits.
                        </span>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#f6f5f4]">
                {detailTab === 'content' && (
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div className="relative group">
                                <div className="absolute -inset-4 bg-white rounded-xl shadow-sm opacity-100 transition-opacity -z-10 border border-slate-100" />
                                <pre className="whitespace-pre-wrap font-mono text-base text-slate-800 leading-relaxed p-4 min-h-[320px]">
                                    {item.content}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}

                {detailTab === 'history' && !isTemplate && (
                    <div className="flex-1 overflow-y-auto p-8 pb-16 custom-scrollbar">
                        <div className="max-w-6xl mx-auto grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
                            <div className="space-y-4">
                                {activeVersion ? (
                                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4 lg:max-h-[78vh] lg:flex lg:flex-col">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">
                                                    Comparing to version from {new Date(activeVersion.timestamp).toLocaleString()}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Inline diff of the selected version vs current content
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => { setAutoPreviewEnabled(false); setActiveVersionId(null); }}
                                                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                                                >
                                                    Clear preview
                                                </button>
                                                {onRestoreVersion && (
                                                    <button
                                                        onClick={() => handleRestoreRequest(activeVersion)}
                                                        className="px-3 py-2 text-xs font-semibold rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50"
                                                    >
                                                        Restore this version
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-[11px] uppercase tracking-wider text-slate-500">Change summary</span>
                                            <span className="px-2 py-1 text-[11px] rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                                                +{diffSummary.additions} additions
                                            </span>
                                            <span className="px-2 py-1 text-[11px] rounded-full bg-rose-50 text-rose-700 font-semibold">
                                                -{diffSummary.removals} removals
                                            </span>
                                        </div>
                                        {hasChanges ? (
                                            <div className="rounded-xl border border-slate-900/20 bg-slate-950 text-slate-50 font-mono text-xs overflow-hidden shadow-inner lg:flex-1 lg:flex">
                                                <div className="overflow-auto custom-scrollbar flex-1">
                                                    {unifiedDiffLines.map((line) => (
                                                        <div
                                                            key={line.key}
                                                            className={`flex gap-4 px-4 py-1 whitespace-pre-wrap ${unifiedDiffClass(line.type)}`}
                                                        >
                                                            <span className="w-10 text-right text-[10px] text-slate-400">
                                                                {line.lineNumber}
                                                            </span>
                                                            <span className="w-4 text-center">
                                                                {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ''}
                                                            </span>
                                                            <span className="flex-1">
                                                                {line.text || '[empty]'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                                No visible differences between the current content and this version.
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-slate-900/5 text-slate-600 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
                                        <span>Select a historical version from the timeline to compare changes.</span>
                                        <History size={16} className="text-slate-500" />
                                    </div>
                                )}
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden lg:max-h-[78vh] lg:flex lg:flex-col">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <History size={16} />
                                        Timeline
                                    </div>
                                    <span className="text-[11px] text-slate-500">{versions.length} entries</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                    <ol className="relative border-l border-slate-200 pl-4 space-y-6">
                                        {versions.map((version) => {
                                            const snippetLines = getDiffSnippet(version).split('\n').slice(0, 4);
                                            const isActive = activeVersion?._id === version._id;
                                            return (
                                                <li key={version._id} className="relative">
                                                    <span className="absolute -left-4 top-3 w-2 h-2 rounded-full border-2 border-white shadow" style={{ backgroundColor: isActive ? '#14b8a6' : '#94a3b8' }} />
                                                    <div className={`rounded-xl border p-3 bg-white shadow-sm transition-all ${isActive ? 'border-teal-300 ring-2 ring-teal-100' : 'border-slate-200'}`}>
                                                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                                                            <span className="font-semibold">{new Date(version.timestamp).toLocaleString()}</span>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => handlePreviewVersion(version)}
                                                                    className={`p-1.5 rounded-md border ${isActive ? 'border-teal-200 text-teal-700 bg-teal-50' : 'border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-200'}`}
                                                                    title="Preview changes"
                                                                >
                                                                    <Eye size={12} />
                                                                </button>
                                                                {onRestoreVersion && (
                                                                    <button
                                                                        onClick={() => handleRestoreRequest(version)}
                                                                        className="p-1.5 rounded-md border border-amber-200 text-amber-600 hover:bg-amber-50"
                                                                        title="Restore this version"
                                                                    >
                                                                        <RotateCcw size={12} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 space-y-1 text-[11px] font-mono">
                                                            {snippetLines.map((line, idx) => {
                                                                const trimmed = line.trim();
                                                                const lineClass = trimmed.startsWith('+')
                                                                    ? 'bg-emerald-50 text-emerald-700'
                                                                    : trimmed.startsWith('-')
                                                                        ? 'bg-rose-50 text-rose-700'
                                                                        : 'bg-slate-100 text-slate-600';
                                                                return (
                                                                    <div key={`${version._id}-${idx}`} className={`px-2 py-0.5 rounded ${lineClass}`}>
                                                                        {line}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                </div>
                                {onRestoreVersion && restoreCandidate && (
                                    <div className="p-4 border-t border-slate-100 bg-amber-50/60">
                                        <p className="text-sm font-semibold text-amber-900 mb-2">
                                            Restore version from {new Date(restoreCandidate.timestamp).toLocaleString()}?
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={confirmRestore}
                                                className="flex-1 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600"
                                            >
                                                Confirm restore
                                            </button>
                                            <button
                                                onClick={cancelRestoreRequest}
                                                className="flex-1 px-3 py-2 rounded-lg border border-amber-200 text-amber-700 text-sm font-semibold hover:bg-white"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromptDetail;
