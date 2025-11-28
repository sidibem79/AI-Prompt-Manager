import React, { useState, useEffect } from 'react';
import { X, Save, Tag, LayoutTemplate, ChevronDown, BookOpen } from 'lucide-react';
import { Prompt, Template } from '../types';
import TemplatePicker from './TemplatePicker';

interface EditorProps {
    initialData?: Partial<Prompt | Template>;
    mode: 'create' | 'edit';
    type: 'prompt' | 'template';
    categories: string[];
    templates: Template[];
    onSave: (data: any) => void;
    onCancel: () => void;
}

const Editor: React.FC<EditorProps> = ({
    initialData = {} as Partial<Prompt | Template>,
    mode,
    type,
    categories,
    templates,
    onSave,
    onCancel
}) => {
    const [title, setTitle] = useState(initialData.title || (initialData as Template).label || '');
    const [content, setContent] = useState(initialData.content || '');
    const [category, setCategory] = useState(initialData.category || '');
    const [tags, setTags] = useState<string[]>(initialData.tags || []);
    const [newTag, setNewTag] = useState('');
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);

    // Template specific
    const [label, setLabel] = useState((initialData as Template).label || '');

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || (initialData as Template).label || '');
            setContent(initialData.content || '');
            setCategory(initialData.category || '');
            setTags(initialData.tags || []);
            if (type === 'template') {
                setLabel((initialData as Template).label || '');
            }
        }
    }, [initialData, type]);

    const handleSave = () => {
        if (!title.trim() || !content.trim()) return;

        const data: any = {
            title,
            content,
            category: category || 'Uncategorized',
            tags
        };

        if (type === 'template') {
            data.label = label || title; // Use title as label if not specified
        }

        onSave(data);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSave();
        }
    };

    const addTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()]);
            setNewTag('');
        }
    };

    const handleTemplateSelect = (template: Template) => {
        setTitle(template.title);
        setContent(template.content);
        setCategory(template.category);
        setTags(template.tags);
        setIsTemplatePickerOpen(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Toolbar */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#fafaf9]">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onCancel}
                            className="p-2 -ml-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={24} />
                        </button>
                        <h2 className="text-lg font-bold text-slate-900">
                            {mode === 'create' ? `New ${type === 'prompt' ? 'Prompt' : 'Template'}` : `Edit ${type === 'prompt' ? 'Prompt' : 'Template'}`}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        {mode === 'create' && type === 'prompt' && (
                            <button
                                onClick={() => setIsTemplatePickerOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-200 font-medium text-sm transition-colors mr-2"
                            >
                                <BookOpen size={18} />
                                Browse Templates
                            </button>
                        )}

                        <span className="text-xs text-slate-600 mr-2 hidden sm:inline">
                            Cmd+Enter to save
                        </span>
                        <button
                            onClick={handleSave}
                            disabled={!title.trim() || !content.trim()}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#0d9488] text-white font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-900/20"
                        >
                            <Save size={18} />
                            Save
                        </button>
                    </div>
                </div>

                {/* Main Editor Area */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

                    {/* Settings Sidebar */}
                    <div className="w-full md:w-80 bg-[#fafaf9] border-r border-slate-100 p-6 overflow-y-auto flex-shrink-0">
                        <div className="space-y-6">

                            {type === 'template' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Template Label</label>
                                    <input
                                        type="text"
                                        value={label}
                                        onChange={(e) => setLabel(e.target.value)}
                                        placeholder="e.g. Weekly Report"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-sm bg-white"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Category</label>
                                <div className="relative">
                                    <select
                                        value={isCustomCategory ? '__NEW__' : category}
                                        onChange={(e) => {
                                            if (e.target.value === '__NEW__') {
                                                setIsCustomCategory(true);
                                                setCategory('');
                                            } else {
                                                setIsCustomCategory(false);
                                                setCategory(e.target.value);
                                            }
                                        }}
                                        className="w-full appearance-none px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500 outline-none text-sm cursor-pointer"
                                    >
                                        <option value="" disabled>Select category...</option>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        <option value="__NEW__" className="font-semibold text-teal-600">+ New Category</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                                </div>
                                {isCustomCategory && (
                                    <input
                                        type="text"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        placeholder="Enter category name"
                                        autoFocus
                                        className="w-full mt-2 px-3 py-2 rounded-lg border border-teal-200 ring-2 ring-teal-50 focus:ring-teal-500 outline-none text-sm"
                                    />
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Tags</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {tags.map(tag => (
                                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-700">
                                            #{tag}
                                            <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-red-500">
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                        placeholder="Add tag..."
                                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-sm bg-white"
                                    />
                                    <button
                                        onClick={addTag}
                                        disabled={!newTag.trim()}
                                        className="px-3 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50 text-sm font-medium"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Editor */}
                    <div className="flex-1 flex flex-col min-w-0 bg-white">
                        <div className="p-6 pb-0">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={type === 'template' ? "Template Title (e.g. Subject Line)" : "Prompt Title"}
                                className="w-full text-3xl font-bold text-slate-900 placeholder:text-slate-300 border-none focus:ring-0 outline-none bg-transparent"
                            />
                        </div>
                        <div className="flex-1 p-6">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Start typing your prompt..."
                                className="w-full h-full resize-none border-none focus:ring-0 outline-none text-lg font-mono text-slate-700 leading-relaxed placeholder:text-slate-300 bg-transparent"
                                spellCheck={false}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {isTemplatePickerOpen && (
                <TemplatePicker
                    templates={templates}
                    onSelect={handleTemplateSelect}
                    onCancel={() => setIsTemplatePickerOpen(false)}
                />
            )}
        </div>
    );
};

export default Editor;
