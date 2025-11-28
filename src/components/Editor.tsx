import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Save, ChevronDown, BookOpen, Bold, Italic, Code2, List, Maximize2, Minimize2, Eye } from 'lucide-react';
import { Prompt, Template } from '../types';
import TemplatePicker from './TemplatePicker';

interface EditorProps {
    initialData?: Partial<Prompt | Template>;
    mode: 'create' | 'edit';
    type: 'prompt' | 'template';
    categories: string[];
    templates: Template[];
    tagsOptions: string[];
    fontSize: 'sm' | 'md' | 'lg';
    onSave: (data: any) => void;
    onCancel: () => void;
}

const Editor: React.FC<EditorProps> = ({
    initialData = {} as Partial<Prompt | Template>,
    mode,
    type,
    categories,
    templates,
    tagsOptions,
    fontSize,
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
    const [showPreview, setShowPreview] = useState(false);
    const [focusMode, setFocusMode] = useState(false);

    // Template specific
    const [label, setLabel] = useState((initialData as Template).label || '');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const suggestedTags = useMemo(
        () => tagsOptions.filter(tag => !tags.includes(tag)).slice(0, 6),
        [tagsOptions, tags]
    );

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

    const applyFormat = (type: 'bold' | 'italic' | 'code' | 'list') => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const { selectionStart, selectionEnd, value } = textarea;
        const selected = value.slice(selectionStart, selectionEnd);
        const wrap = (prefix: string, suffix: string = prefix) => {
            const contentToInsert = selected || 'text';
            const newValue = value.slice(0, selectionStart) + prefix + contentToInsert + suffix + value.slice(selectionEnd);
            setContent(newValue);
            requestAnimationFrame(() => {
                textarea.focus();
                const cursorStart = selectionStart + prefix.length;
                const cursorEnd = cursorStart + contentToInsert.length;
                textarea.setSelectionRange(cursorStart, cursorEnd);
            });
        };

        switch (type) {
            case 'bold':
                wrap('**');
                break;
            case 'italic':
                wrap('*');
                break;
            case 'code':
                wrap('`');
                break;
            case 'list': {
                const insertion = selected ? selected.split('\n').map(line => (line ? `- ${line}` : '')).join('\n') : '- ';
                const newValue = value.slice(0, selectionStart) + insertion + value.slice(selectionEnd);
                setContent(newValue);
                requestAnimationFrame(() => {
                    const cursor = selectionStart + insertion.length;
                    textarea.setSelectionRange(cursor, cursor);
                });
                break;
            }
        }
    };

    const renderPreview = (text: string) => {
        let html = text
            .replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-900 text-white p-3 rounded-lg overflow-x-auto"><code>$1</code></pre>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1 rounded">$1</code>');

        html = html.replace(/^- (.*)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/gs, '<ul class="list-disc ml-6 space-y-1">$1</ul>');
        html = html.replace(/\n/g, '<br />');
        return { __html: html };
    };

    const titleHelper = type === 'template'
        ? 'Label is the internal name shown in lists. Title is what end-users see.'
        : 'Use a descriptive title so you can find the prompt quickly later.';

    const validationMessage = !title.trim()
        ? 'Give your prompt a clear title.'
        : !content.trim()
            ? 'Prompt content cannot be empty.'
            : title.length < 5
                ? 'Longer titles are easier to scan.'
                : '';

    const fontSizeClass = fontSize === 'lg' ? 'text-xl' : fontSize === 'sm' ? 'text-base' : 'text-lg';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`bg-white rounded-xl shadow-2xl w-full ${focusMode ? 'max-w-6xl h-[95vh]' : 'max-w-5xl h-[85vh]'} flex flex-col overflow-hidden animate-in zoom-in-95 duration-200`}>

                {/* Toolbar */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#fafaf9]">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onCancel}
                            className="p-2 -ml-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={24} />
                        </button>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                            {mode === 'create' ? `New ${type === 'prompt' ? 'Prompt' : 'Template'}` : `Edit ${type === 'prompt' ? 'Prompt' : 'Template'}`}
                            </h2>
                            <p className="text-xs text-slate-500">{titleHelper}</p>
                        </div>
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

                        <button
                            onClick={() => setFocusMode(!focusMode)}
                            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white"
                        >
                            {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            {focusMode ? 'Exit Focus' : 'Focus Mode'}
                        </button>

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
                                {suggestedTags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        {suggestedTags.map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => setTags([...tags, tag])}
                                                className="px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-teal-200"
                                            >
                                                + {tag}
                                            </button>
                                        ))}
                                    </div>
                                )}
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
                            {validationMessage && (
                                <p className="text-xs text-amber-600 mt-1">{validationMessage}</p>
                            )}
                        </div>
                        <div className="px-6 py-3 flex items-center gap-2 border-b border-slate-100">
                            <button onClick={() => applyFormat('bold')} className="p-2 rounded hover:bg-slate-100" title="Bold">
                                <Bold size={16} />
                            </button>
                            <button onClick={() => applyFormat('italic')} className="p-2 rounded hover:bg-slate-100" title="Italic">
                                <Italic size={16} />
                            </button>
                            <button onClick={() => applyFormat('code')} className="p-2 rounded hover:bg-slate-100" title="Inline code">
                                <Code2 size={16} />
                            </button>
                            <button onClick={() => applyFormat('list')} className="p-2 rounded hover:bg-slate-100" title="Bullet list">
                                <List size={16} />
                            </button>
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className={`ml-auto flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${showPreview ? 'border-teal-500 text-teal-700' : 'border-slate-200 text-slate-600'}`}
                            >
                                <Eye size={16} />
                                {showPreview ? 'Hide Preview' : 'Preview'}
                            </button>
                        </div>
                        <div className="flex-1 p-0 flex flex-col md:flex-row">
                            <div className={`flex-1 p-6 ${showPreview ? 'md:w-1/2' : 'w-full'}`}>
                                <textarea
                                    ref={textareaRef}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Start typing your prompt..."
                                    className={`w-full h-full resize-none border-none focus:ring-0 outline-none ${fontSizeClass} font-mono text-slate-700 leading-relaxed placeholder:text-slate-300 bg-transparent`}
                                    spellCheck={false}
                                />
                            </div>
                            {showPreview && (
                                <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-100 p-6 overflow-y-auto bg-slate-50">
                                    <div className="text-[15px] leading-relaxed text-slate-800 space-y-3" dangerouslySetInnerHTML={renderPreview(content)} />
                                </div>
                            )}
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
