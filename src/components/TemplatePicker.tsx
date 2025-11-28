import React, { useState } from 'react';
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

    const filteredTemplates = templates.filter(t =>
        t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedTemplate = templates.find(t => t._id === selectedId);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-100 text-teal-700 rounded-lg">
                            <LayoutTemplate size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Choose a Template</h2>
                            <p className="text-xs text-slate-500">Select a template to start with</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex min-h-0">

                    {/* Sidebar List */}
                    <div className="w-1/3 border-r border-slate-100 flex flex-col bg-slate-50/30">
                        <div className="p-3 border-b border-slate-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search templates..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {filteredTemplates.map(template => (
                                <button
                                    key={template._id}
                                    onClick={() => setSelectedId(template._id)}
                                    className={`w-full text-left p-3 rounded-lg text-sm transition-all ${selectedId === template._id
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
                    <div className="flex-1 flex flex-col bg-white">
                        {selectedTemplate ? (
                            <>
                                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                    <div className="mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">{selectedTemplate.label}</h3>
                                        <div className="flex gap-2 mt-2">
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
                                        className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-200 font-medium text-sm transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => onSelect(selectedTemplate)}
                                        className="flex items-center gap-2 px-6 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-lg shadow-teal-900/20 transition-all active:scale-95"
                                    >
                                        <Check size={16} />
                                        Use Template
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                                <LayoutTemplate size={48} className="mb-4 opacity-20" />
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
