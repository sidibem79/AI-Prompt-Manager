import React, { useMemo, useState } from 'react';
import {
    Copy,
    Edit2,
    Trash2,
    Clock,
    RotateCcw,
    History
} from 'lucide-react';
import { Prompt, Template, Version } from '../types';

interface PromptDetailProps {
    item: Prompt | Template | null;
    onEdit: () => void;
    onDelete: () => void;
    onCopy: (text: string) => void;
    versions?: Version[];
    onRestoreVersion?: (version: Version) => void;
    lastAction?: { type: string; timestamp: number } | null;
}

const PromptDetail: React.FC<PromptDetailProps> = ({
    item,
    onEdit,
    onDelete,
    onCopy,
    versions = [],
    onRestoreVersion,
    lastAction
}) => {
    const [showVersions, setShowVersions] = useState(true);
    const versionsPanelWidth = 320;

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

                    <div className="flex items-center gap-4 mt-4 text-sm text-slate-600 flex-wrap">
                        {/* @ts-ignore */}
                        {item.updatedAt && (
                            <span className="flex items-center gap-1.5">
                                <Clock size={14} />
                                Updated {new Date(item.updatedAt).toLocaleDateString()}
                            </span>
                        )}
                        {lastAction && (
                            <span className="text-teal-700 font-semibold">
                                {lastAction.type} {timeAgo(lastAction.timestamp)}
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

            <div className="flex flex-1 overflow-hidden bg-[#f6f5f4] relative">
                {!isTemplate && versions.length > 0 && !showVersions && (
                    <button
                        className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-l-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm absolute top-1/2 right-0 -translate-y-1/2 z-20"
                        onClick={() => setShowVersions(true)}
                    >
                        <History size={14} />
                        Show Versions
                    </button>
                )}
                {/* Content "Reading Room" */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="max-w-4xl mx-auto">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-white rounded-xl shadow-sm opacity-100 transition-opacity -z-10 border border-slate-100" />
                            <pre className="whitespace-pre-wrap font-mono text-base text-slate-800 leading-relaxed p-4 min-h-[320px]">
                                {item.content}
                            </pre>
                        </div>
                    </div>
                </div>
                {/* Versions Panel */}
                {!isTemplate && versions.length > 0 && (
                    <aside
                        className={`border-l border-slate-200 bg-white flex flex-col transition-all duration-200 overflow-hidden hidden lg:flex ${showVersions ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        style={{ width: showVersions ? versionsPanelWidth : 0 }}
                    >
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <History size={16} />
                                Versions
                            </div>
                            <button
                                onClick={() => setShowVersions(!showVersions)}
                                className="text-xs uppercase tracking-wider text-teal-700 font-semibold"
                            >
                                {showVersions ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {versions.slice(0, 8).map(v => (
                                <div key={v._id} className="bg-[#fafaf9] p-3 rounded-lg border border-slate-200 shadow-sm text-xs group hover:border-teal-300">
                                    <div className="flex justify-between items-center mb-2 text-[11px] text-slate-500">
                                        <span>{new Date(v.timestamp).toLocaleString()}</span>
                                        {onRestoreVersion && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onRestoreVersion(v); }}
                                                className="text-teal-600 hover:bg-teal-50 p-1 rounded transition-all"
                                                title="Restore"
                                            >
                                                <RotateCcw size={12} />
                                            </button>
                                        )}
                                    </div>
                                    <pre className="font-mono text-slate-700 whitespace-pre-wrap">
                                        {getDiffSnippet(v)}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
};

export default PromptDetail;
