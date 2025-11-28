import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, X, Info, Sun, Moon, Type, Hash, GitMerge, Loader2, Tag } from 'lucide-react';
import { ToastMessage, ToastVariant } from '../types';

// --- Confirm Dialog ---

interface ConfirmDialogProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ message, onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3 p-5">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                    <AlertTriangle size={20} />
                </div>
                <div className="space-y-2 flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">Please confirm</h3>
                    <p className="text-slate-600 text-sm">{message}</p>
                </div>
            </div>
            <div className="flex justify-end gap-2 px-5 pb-5">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-sm"
                >
                    Confirm
                </button>
            </div>
        </div>
    </div>
);

// --- Toast ---

interface ToastProps {
    toasts: ToastMessage[];
    onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => (
    <div className="fixed bottom-4 right-4 z-[70] space-y-2">
        {toasts.map(toast => (
            <div
                key={toast.id}
                className={`flex items-start gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm max-w-sm animate-in slide-in-from-right duration-200
          ${toast.variant === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                        toast.variant === 'error' ? 'bg-red-50 text-red-800 border-red-100' :
                            'bg-slate-50 text-slate-800 border-slate-200'}`}
            >
                <div className="pt-0.5">
                    {toast.variant === 'success' ? <Check size={16} /> : toast.variant === 'error' ? <AlertTriangle size={16} /> : <Info size={16} />}
                </div>
                <div className="flex-1">{toast.message}</div>
                <button
                    onClick={() => onDismiss(toast.id)}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label="Dismiss notification"
                >
                    <X size={16} />
                </button>
            </div>
        ))}
    </div>
);

// --- Settings Panel ---

interface SettingsPanelProps {
    isOpen: boolean;
    theme: 'light' | 'dark';
    onThemeChange: (theme: 'light' | 'dark') => void;
    fontSize: 'sm' | 'md' | 'lg';
    onFontSizeChange: (size: 'sm' | 'md' | 'lg') => void;
    onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    isOpen,
    theme,
    onThemeChange,
    fontSize,
    onFontSizeChange,
    onClose
}) => {
    if (!isOpen) return null;

    const fontOptions: { label: string; value: 'sm' | 'md' | 'lg' }[] = [
        { label: 'Compact', value: 'sm' },
        { label: 'Comfortable', value: 'md' },
        { label: 'Roomy', value: 'lg' },
    ];

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-semibold text-slate-900">Workspace Settings</h3>
                        <p className="text-sm text-slate-500">Personalize your writing experience.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Theme</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => onThemeChange('light')}
                                className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border ${theme === 'light' ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-600'}`}
                            >
                                <Sun size={16} />
                                Light
                            </button>
                            <button
                                onClick={() => onThemeChange('dark')}
                                className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border ${theme === 'dark' ? 'border-teal-500 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'}`}
                            >
                                <Moon size={16} />
                                Dark
                            </button>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Editor Font Size</p>
                        <div className="grid grid-cols-3 gap-3">
                            {fontOptions.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => onFontSizeChange(option.value)}
                                    className={`px-4 py-3 rounded-xl border flex items-center justify-center gap-2 ${fontSize === option.value ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-600'}`}
                                >
                                    <Type size={16} />
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Taxonomy Manager ---

interface TaxonomyManagerProps {
    isOpen: boolean;
    isBusy: boolean;
    categories: string[];
    tags: string[];
    onClose: () => void;
    onRenameCategory: (from: string, to: string) => void;
    onMergeCategories: (from: string, to: string) => void;
    onRenameTag: (from: string, to: string) => void;
    onMergeTags: (from: string, to: string) => void;
    initialCategory?: string | null;
}

export const TaxonomyManager: React.FC<TaxonomyManagerProps> = ({
    isOpen,
    isBusy,
    categories,
    tags,
    onClose,
    onRenameCategory,
    onMergeCategories,
    onRenameTag,
    onMergeTags,
    initialCategory = null
}) => {
    const [categoryFrom, setCategoryFrom] = useState('');
    const [categoryTo, setCategoryTo] = useState('');
    const [tagFrom, setTagFrom] = useState('');
    const [tagTo, setTagTo] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setCategoryFrom('');
            setCategoryTo('');
            setTagFrom('');
            setTagTo('');
        } else if (initialCategory) {
            setCategoryFrom(initialCategory);
        }
    }, [isOpen, initialCategory]);

    if (!isOpen) return null;

    const availableCategories = categories.filter(category => category !== 'All');

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-semibold text-slate-900">Manage Categories & Tags</h3>
                        <p className="text-sm text-slate-500">Rename or merge duplicates to keep things tidy.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                        <X size={18} />
                    </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4 border border-slate-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <Hash size={16} />
                            Categories
                        </div>
                        <div className="space-y-2">
                            <select
                                value={categoryFrom}
                                onChange={(e) => setCategoryFrom(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                            >
                                <option value="">Select category...</option>
                                {availableCategories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                            <select
                                value={categoryTo}
                                onChange={(e) => setCategoryTo(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                            >
                                <option value="">Destination category...</option>
                                {availableCategories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                            <div className="flex gap-2">
                                <button
                                    disabled={!categoryFrom || !categoryTo || isBusy}
                                    onClick={() => onRenameCategory(categoryFrom, categoryTo)}
                                    className="flex-1 px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium disabled:opacity-60"
                                >
                                    Rename
                                </button>
                                <button
                                    disabled={!categoryFrom || !categoryTo || isBusy}
                                    onClick={() => onMergeCategories(categoryFrom, categoryTo)}
                                    className="flex-1 px-3 py-2 rounded-lg bg-[#0d9488] text-white hover:bg-teal-700 font-medium disabled:opacity-60 flex items-center justify-center gap-1"
                                >
                                    <GitMerge size={14} />
                                    Merge
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 border border-slate-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <Tag size={16} />
                            Tags
                        </div>
                        <div className="space-y-2">
                            <select
                                value={tagFrom}
                                onChange={(e) => setTagFrom(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                            >
                                <option value="">Select tag...</option>
                                {tags.map(tag => (
                                    <option key={tag} value={tag}>{tag}</option>
                                ))}
                            </select>
                            <select
                                value={tagTo}
                                onChange={(e) => setTagTo(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                            >
                                <option value="">Destination tag...</option>
                                {tags.map(tag => (
                                    <option key={tag} value={tag}>{tag}</option>
                                ))}
                            </select>
                            <div className="flex gap-2">
                                <button
                                    disabled={!tagFrom || !tagTo || isBusy}
                                    onClick={() => onRenameTag(tagFrom, tagTo)}
                                    className="flex-1 px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium disabled:opacity-60"
                                >
                                    Rename
                                </button>
                                <button
                                    disabled={!tagFrom || !tagTo || isBusy}
                                    onClick={() => onMergeTags(tagFrom, tagTo)}
                                    className="flex-1 px-3 py-2 rounded-lg bg-[#0d9488] text-white hover:bg-teal-700 font-medium disabled:opacity-60 flex items-center justify-center gap-1"
                                >
                                    <GitMerge size={14} />
                                    Merge
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {isBusy && (
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                        <Loader2 className="animate-spin" size={16} />
                        Applying updates...
                    </div>
                )}
            </div>
        </div>
    );
};
