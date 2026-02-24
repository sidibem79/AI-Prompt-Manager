import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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

// Sanitize HTML to prevent XSS
const sanitizeHtml = (text: string): string => {
    // First escape all HTML entities
    const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    // Then apply formatting on the escaped text
    let html = escaped
        .replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-900 text-white p-3 rounded-lg overflow-x-auto"><code>$1</code></pre>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1 rounded">$1</code>');

    html = html.replace(/^- (.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul class="list-disc ml-6 space-y-1">$1</ul>');
    html = html.replace(/\n/g, '<br />');
    return html;
};

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

    // Track dirty state for unsaved changes warning
    const initialStateRef = useRef({
        title: initialData.title || (initialData as Template).label || '',
        content: initialData.content || '',
        category: initialData.category || '',
        tags: initialData.tags || [],
        label: (initialData as Template).label || ''
    });

    const isDirty = useMemo(() => {
        const initial = initialStateRef.current;
        return (
            title !== initial.title ||
            content !== initial.content ||
            category !== initial.category ||
            label !== initial.label ||
            JSON.stringify(tags) !== JSON.stringify(initial.tags)
        );
    }, [title, content, category, tags, label]);

    const suggestedTags = useMemo(
        () => tagsOptions.filter(tag => !tags.includes(tag)),
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

    // Escape key to close (with unsaved changes check)
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isTemplatePickerOpen) {
                handleCancel();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isTemplatePickerOpen, isDirty]);

    // Warn before browser navigation with unsaved changes
    useEffect(() => {
        if (!isDirty) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [isDirty]);

    const handleCancel = useCallback(() => {
        if (isDirty) {
            if (!window.confirm('You have unsaved changes. Discard them?')) {
                return;
            }
        }
        onCancel();
    }, [isDirty, onCancel]);

    const handleSave = () => {
        if (!title.trim() || !content.trim()) return;

        const data: any = {
            title,
            content,
            category: category || 'Uncategorized',
            tags
        };

        if (type === 'template') {
            data.label = label || title;
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

    const applyFormat = (formatType: 'bold' | 'italic' | 'code' | 'list') => {
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

        switch (formatType) {
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
        return { __html: sanitizeHtml(text) };
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
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-labelledby="editor-title"
        >
            <div className={`bg-white rounded-xl shadow-2xl w-full ${focusMode ? 'max-w-6xl h-[98vh] sm:h-[95vh]' : 'max-w-5xl h-[95vh] sm:h-[85vh]'} flex flex-col overflow-hidden animate-in zoom-in-95 duration-200`}>

                {/* Toolbar */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-center bg-[#fafaf9]">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <button
                            onClick={handleCancel}
                            className="p-2 -ml-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 outline-none"
                            aria-label="Close editor"
                        >
                            <X size={24} />
                        </button>
                        <div>
                            <h2 id="editor-title" className="text-lg font-bold text-slate-900">
                            {mode === 'create' ? `New ${type === 'prompt' ? 'Prompt' : 'Template'}` : `Edit ${type === 'prompt' ? 'Prompt' : 'Template'}`}
                            </h2>
                            <p className="text-xs text-slate-500 hidden sm:block">{titleHelper}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {mode === 'create' && type === 'prompt' && (
                            <button
                                onClick={() => setIsTemplatePickerOpen(true)}
                                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-200 font-medium text-sm transition-colors mr-2 focus-visible:ring-2 focus-visible:ring-teal-500 outline-none"
                            >
                                <BookOpen size={18} aria-hidden="true" />
                                Browse Templates
                            </button>
                        )}

                        <button
                            onClick={() => setFocusMode(!focusMode)}
                            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white focus-visible:ring-2 focus-visible:ring-teal-500 outline-none"
                            aria-label={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
                        >
                            {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            <span className="hidden md:inline">{focusMode ? 'Exit Focus' : 'Focus Mode'}</span>
                        </button>

                        <span className="text-xs text-slate-600 mr-2 hidden lg:inline">
                            Ctrl+Enter to save
                        </span>
                        <button
                            onClick={handleSave}
                            disabled={!title.trim() || !content.trim()}
                            className="flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg bg-[#0d9488] text-white font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-teal-900/20 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 outline-none"
                        >
                            <Save size={18} aria-hidden="true" />
                            Save
                        </button>
                    </div>
                </div>

                {/* Main Editor Area */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

                    {/* Settings Sidebar */}
                    <div className="w-full md:w-80 bg-[#fafaf9] border-b md:border-b-0 md:border-r border-slate-100 p-4 sm:p-6 overflow-y-auto flex-shrink-0 max-h-48 md:max-h-none">
                        <div className="space-y-4 sm:space-y-6">

                            {type === 'template' && (
                                <div className="space-y-2">
                                    <label htmlFor="template-label" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Template Label</label>
                                    <input
                                        id="template-label"
                                        type="text"
                                        name="label"
                                        value={label}
                                        onChange={(e) => setLabel(e.target.value)}
                                        placeholder="e.g. Weekly Report"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus-visible:ring-2 focus-visible:ring-teal-500 outline-none text-sm bg-white"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label htmlFor="category-select" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Category</label>
                                <div className="relative">
                                    <select
                                        id="category-select"
                                        name="category"
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
                                        className="w-full appearance-none px-3 py-2 rounded-lg border border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-teal-500 outline-none text-sm cursor-pointer"
                                    >
                                        <option value="" disabled>Select category\u2026</option>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        <option value="__NEW__" className="font-semibold text-teal-600">+ New Category</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} aria-hidden="true" />
                                </div>
                                {isCustomCategory && (
                                    <input
                                        type="text"
                                        name="custom-category"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        placeholder="Enter category name"
                                        autoFocus
                                        className="w-full mt-2 px-3 py-2 rounded-lg border border-teal-200 ring-2 ring-teal-50 focus-visible:ring-teal-500 outline-none text-sm"
                                    />
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="tag-input" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Tags</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {tags.map(tag => (
                                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-700">
                                            #{tag}
                                            <button
                                                onClick={() => setTags(tags.filter(t => t !== tag))}
                                                className="hover:text-red-500 focus-visible:ring-2 focus-visible:ring-teal-500 rounded outline-none"
                                                aria-label={`Remove tag ${tag}`}
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        id="tag-input"
                                        type="text"
                                        name="tag"
                                        autoComplete="off"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                        placeholder="Add tag\u2026"
                                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus-visible:ring-2 focus-visible:ring-teal-500 outline-none text-sm bg-white"
                                    />
                                    <button
                                        onClick={addTag}
                                        disabled={!newTag.trim()}
                                        className="px-3 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50 text-sm font-medium focus-visible:ring-2 focus-visible:ring-teal-500 outline-none"
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
                                                className="px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-teal-200 focus-visible:ring-2 focus-visible:ring-teal-500 outline-none"
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
                        <div className="p-4 sm:p-6 pb-0">
                            <input
                                type="text"
                                name="title"
                                aria-label="Prompt title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={type === 'template' ? "Template Title (e.g. Subject Line)" : "Prompt Title"}
                                className="w-full text-2xl sm:text-3xl font-bold text-slate-900 placeholder:text-slate-300 border-none outline-none bg-transparent border-b-2 border-transparent focus-visible:border-teal-200 transition-colors pb-1"
                            />
                            {validationMessage && (
                                <p className="text-xs text-amber-600 mt-1" role="alert">{validationMessage}</p>
                            )}
                        </div>
                        <div className="px-4 sm:px-6 py-3 flex items-center gap-1 sm:gap-2 border-b border-slate-100" role="toolbar" aria-label="Formatting toolbar">
                            <button onClick={() => applyFormat('bold')} className="p-2 rounded hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-500 outline-none" aria-label="Bold">
                                <Bold size={16} />
                            </button>
                            <button onClick={() => applyFormat('italic')} className="p-2 rounded hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-500 outline-none" aria-label="Italic">
                                <Italic size={16} />
                            </button>
                            <button onClick={() => applyFormat('code')} className="p-2 rounded hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-500 outline-none" aria-label="Inline code">
                                <Code2 size={16} />
                            </button>
                            <button onClick={() => applyFormat('list')} className="p-2 rounded hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-500 outline-none" aria-label="Bullet list">
                                <List size={16} />
                            </button>
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className={`ml-auto flex items-center gap-2 px-3 py-2 rounded-lg text-sm border focus-visible:ring-2 focus-visible:ring-teal-500 outline-none ${showPreview ? 'border-teal-500 text-teal-700' : 'border-slate-200 text-slate-600'}`}
                                aria-pressed={showPreview}
                            >
                                <Eye size={16} aria-hidden="true" />
                                <span className="hidden sm:inline">{showPreview ? 'Hide Preview' : 'Preview'}</span>
                            </button>
                        </div>
                        <div className="flex-1 p-0 flex flex-col md:flex-row min-h-0">
                            <div className={`flex-1 p-4 sm:p-6 min-h-[200px] ${showPreview ? 'md:w-1/2' : 'w-full'}`}>
                                <textarea
                                    ref={textareaRef}
                                    name="content"
                                    aria-label="Prompt content"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Start typing your prompt\u2026"
                                    className={`w-full h-full resize-none border-none outline-none ${fontSizeClass} font-mono text-slate-700 leading-relaxed placeholder:text-slate-300 bg-transparent`}
                                    spellCheck={false}
                                />
                            </div>
                            {showPreview && (
                                <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-100 p-4 sm:p-6 overflow-y-auto bg-slate-50">
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
