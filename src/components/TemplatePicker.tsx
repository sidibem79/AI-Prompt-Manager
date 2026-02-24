import React, { useState, useEffect } from 'react';
import { X, Check, LayoutTemplate, Search } from 'lucide-react';
import { Template } from '../types';

interface TemplatePickerProps {
    templates: Template[];
    onSelect: (template: Template) => void;
    onCancel: () => void;
}

const TemplatePicker: React.FC<TemplatePickerProps> = ({ templates, onSelect, onCancel }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onCancel]);

    const filteredTemplates = templates.filter(t =>
        t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedTemplate = templates.find(t => t._id === selectedId);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] sm:h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                role="dialog"
                aria-labelledby="picker-title"
            >

                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-100 text-teal-700 rounded-lg" aria-hidden="true">
                            <LayoutTemplate size={20} />
                        </div>
                        <div>
                            <h2 id="picker-title" className="text-lg font-bold text-slate-900">Choose a Template</h2>
                            <p className="text-xs text-slate-500">Select a template to start with</p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 outline-none"
                        aria-label="Close template picker"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col sm:flex-row min-h-0">

                    {/* Sidebar List */}
                    <div className="w-full sm:w-1/3 border-b sm:border-b-0 sm:border-r border-slate-100 flex flex-col bg-slate-50/30 max-h-48 sm:max-h-none">
                        <div className="p-3 border-b border-slate-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} aria-hidden="true" />
                                <input
                                    type="search"
                                    name="template-search"
                                    autoComplete="off"
                                    placeholder="Search templates\u2026"
                                    aria-label="Search templates"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus-visible:ring-2 focus-visible:ring-teal-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {filteredTemplates.map(template => (
                                <button
                                    key={template._id}
                                    onClick={() => setSelectedId(template._id)}
                                    aria-pressed={selectedId === template._id}
                                    className={`w-full text-left p-3 rounded-lg text-sm transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 outline-none ${selectedId === template._id
                                            ? 'bg-teal-50 text-teal-900 ring-1 ring-teal-200 shadow-sm'
                                            : 'hover:bg-white hover:shadow-sm text-slate-600'
                                        }`}
                                >
                                    <div className="font-medium truncate">{template.label}</div>
                                    <div className="text-xs text-slate-400 mt-0.5 truncate">{template.category}</div>
                                </button>
                            ))}
                            {filteredTemplates.length === 0 && (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                    No templates found
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preview Pane */}
                    <div className="flex-1 flex flex-col bg-white min-h-0">
                        {selectedTemplate ? (
                            <>
                                <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                                    <div className="mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">{selectedTemplate.label}</h3>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                                                {selectedTemplate.category}
                                            </span>
                                            {selectedTemplate.tags.map(tag => (
                                                <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 text-xs border border-slate-100">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="prose prose-slate max-w-none">
                                        <pre className="whitespace-pre-wrap font-mono text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                            {selectedTemplate.content}
                                        </pre>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/30">
                                    <button
                                        onClick={onCancel}
                                        className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-200 font-medium text-sm transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 outline-none"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => onSelect(selectedTemplate)}
                                        className="flex items-center gap-2 px-6 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-lg shadow-teal-900/20 transition-colors active:scale-95 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 outline-none"
                                    >
                                        <Check size={16} aria-hidden="true" />
                                        Use Template
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                                <LayoutTemplate size={48} className="mb-4 opacity-20" aria-hidden="true" />
                                <p>Select a template to preview</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplatePicker;
