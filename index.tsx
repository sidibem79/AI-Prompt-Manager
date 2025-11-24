import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexProvider, ConvexReactClient, useQuery, useMutation } from "convex/react";
import { api } from "./convex/_generated/api";
import { Id } from "./convex/_generated/dataModel";
import { 
  Plus, 
  Search, 
  Tag, 
  Clock, 
  Copy, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  RotateCcw, 
  MoreVertical,
  Check,
  Filter,
  History,
  LayoutTemplate,
  ChevronDown,
  BookTemplate,
  Eye,
  Pencil,
  Upload,
  Download,
  FileText,
  Grid,
  AlertTriangle
} from 'lucide-react';

// --- Types ---

interface Version {
  _id: Id<"versions">;
  _creationTime: number;
  promptId: Id<"prompts">;
  content: string;
  timestamp: number;
}

interface Prompt {
  _id: Id<"prompts">;
  _creationTime: number;
  title: string;
  category: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

interface Template {
  _id: Id<"templates">;
  _creationTime: number;
  label: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  isCustom: boolean;
}

type ToastVariant = 'info' | 'success' | 'error';

interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
}

// --- Utils ---

const generateId = () => Math.random().toString(36).substr(2, 9);

const formatDate = (timestamp: number) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp));
};

const getRelativeTime = (timestamp: number) => {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const diffInSeconds = (timestamp - Date.now()) / 1000;
  
  if (Math.abs(diffInSeconds) < 60) return 'just now';
  if (Math.abs(diffInSeconds) < 3600) return rtf.format(Math.ceil(diffInSeconds / 60), 'minutes');
  if (Math.abs(diffInSeconds) < 86400) return rtf.format(Math.ceil(diffInSeconds / 3600), 'hours');
  return rtf.format(Math.ceil(diffInSeconds / 86400), 'days');
};

// --- Seed Data removed - now in Convex database ---

// --- Components ---

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
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

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => (
  <div className="fixed bottom-4 right-4 z-[60] space-y-2">
    {toasts.map(toast => (
      <div
        key={toast.id}
        className={`flex items-start gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm max-w-sm animate-in slide-in-from-right duration-200
          ${toast.variant === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
            toast.variant === 'error' ? 'bg-red-50 text-red-800 border-red-100' :
            'bg-slate-50 text-slate-800 border-slate-200'}`}
      >
        <div className="pt-0.5">
          {toast.variant === 'success' ? <Check size={16} /> : toast.variant === 'error' ? <AlertTriangle size={16} /> : <InfoIcon />}
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

const InfoIcon = () => <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">i</div>;

interface TagBadgeProps {
  label: string;
  onClick?: () => void;
  active?: boolean;
  onRemove?: () => void;
}

const TagBadge: React.FC<TagBadgeProps> = ({ label, onClick, active, onRemove }) => (
  <span 
    onClick={onClick}
    className={`
      inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border
      ${active 
        ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
      }
    `}
  >
    #{label}
    {onRemove && (
      <span onClick={(e) => { e.stopPropagation(); onRemove(); }} className="hover:text-red-500 ml-1">
        <X size={12} />
      </span>
    )}
  </span>
);

const App = () => {
  // Convex queries
  const prompts = useQuery(api.prompts.list) ?? [];
  const templates = useQuery(api.templates.list) ?? [];
  const allCategories = useQuery(api.prompts.getCategories) ?? [];
  const allTags = useQuery(api.prompts.getTags) ?? [];

  // Convex mutations
  const createPrompt = useMutation(api.prompts.create);
  const updatePrompt = useMutation(api.prompts.update);
  const deletePrompt = useMutation(api.prompts.remove);
  const restoreVersion = useMutation(api.prompts.restoreVersion);

  const createTemplate = useMutation(api.templates.create);
  const updateTemplate = useMutation(api.templates.update);
  const deleteTemplate = useMutation(api.templates.remove);

  const [viewMode, setViewMode] = useState<'prompts' | 'templates'>('prompts');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<Id<"prompts"> | null>(null); // If null but modal open -> Create mode
  const [viewingPromptId, setViewingPromptId] = useState<Id<"prompts"> | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    category: string;
    content: string;
    tags: string[];
    newTag: string;
  }>({
    title: '',
    category: '',
    content: '',
    tags: [],
    newTag: ''
  });

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  
  // Template State
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [saveTemplateCategory, setSaveTemplateCategory] = useState('');
  const [isSaveTemplateCustomCategory, setIsSaveTemplateCustomCategory] = useState(false);
  
  // Template Preview/Edit State
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [isPreviewFromDashboard, setIsPreviewFromDashboard] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editingTemplateData, setEditingTemplateData] = useState<Template | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null);

  // Get versions for the current viewing/editing prompt
  const currentPromptVersions = useQuery(
    api.versions.list,
    viewingPromptId ? { promptId: viewingPromptId } : "skip"
  ) ?? [];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Derived Data
  const categories = useMemo(() => {
    return ['All', ...allCategories];
  }, [allCategories]);

  const uniqueExistingCategories = useMemo(() => {
    return allCategories;
  }, [allCategories]);

  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => {
      const matchesSearch = (p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             p.content.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesTags = selectedTags.length === 0 || selectedTags.some(t => p.tags.includes(t));
      
      return matchesSearch && matchesCategory && matchesTags;
    });
  }, [prompts, searchQuery, selectedCategory, selectedTags]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = (t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             t.label.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
      const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => t.tags.includes(tag));
      return matchesSearch && matchesCategory && matchesTags;
    });
  }, [templates, searchQuery, selectedCategory, selectedTags]);

  const promptCount = prompts.length;
  const templateCount = templates.length;
  const tagCount = allTags.length;
  const hasActiveFilters = !!searchQuery || selectedCategory !== 'All' || selectedTags.length > 0;

  const showToast = (message: string, variant: ToastVariant = 'info') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2600);
  };

  const requestConfirm = (message: string, action: () => void) => {
    setConfirmState({ message, onConfirm: () => { action(); setConfirmState(null); } });
  };

  // Handlers
  const handleOpenCreate = () => {
    setViewingPromptId(null);
    setEditingPromptId(null); // Create mode
    setFormData({ title: '', category: '', content: '', tags: [], newTag: '' });
    setIsCustomCategory(false);
    setIsSavingTemplate(false);
    setNewTemplateName('');
    setPreviewTemplate(null);
    setIsPreviewFromDashboard(false);
    setIsModalOpen(true);
  };

  const handleOpenCreateTemplate = () => {
    setViewingPromptId(null);
    setEditingPromptId(null);
    setFormData({ title: '', category: '', content: '', tags: [], newTag: '' });
    setIsCustomCategory(false);
    setIsSavingTemplate(true);
    setNewTemplateName('');
    setPreviewTemplate(null);
    setIsPreviewFromDashboard(false);
    setSaveTemplateCategory('');
    setIsSaveTemplateCustomCategory(false);
    setIsModalOpen(true);
  };

  const handleOpenView = (prompt: Prompt) => {
    setViewingPromptId(prompt.id);
    setEditingPromptId(null);
    setPreviewTemplate(null);
    setIsModalOpen(true);
  };

  const handleEdit = (prompt: Prompt) => {
    setViewingPromptId(null);
    setEditingPromptId(prompt.id);
    setFormData({
      title: prompt.title,
      category: prompt.category,
      content: prompt.content,
      tags: [...prompt.tags],
      newTag: ''
    });
    // Check if category is existing or custom
    const exists = uniqueExistingCategories.includes(prompt.category);
    setIsCustomCategory(!exists);
    setIsSavingTemplate(false);
    setNewTemplateName('');
    setPreviewTemplate(null);
    setIsModalOpen(true);
  };

  const handleTemplateClick = (template: Template) => {
    setPreviewTemplate(template);
    setIsEditingTemplate(false);
    setEditingTemplateData(null);
  };

  const handleOpenTemplateFromDashboard = (template: Template) => {
    setViewingPromptId(null);
    setEditingPromptId(null);
    setFormData({ title: '', category: '', content: '', tags: [], newTag: '' }); // Prepare empty form underneath
    setPreviewTemplate(template);
    setIsPreviewFromDashboard(true);
    setIsEditingTemplate(false);
    setEditingTemplateData(null);
    setIsModalOpen(true);
  };

  const applyTemplate = () => {
     if (!previewTemplate) return;
     const exists = uniqueExistingCategories.includes(previewTemplate.category);
     setIsCustomCategory(!exists);
     setFormData({
      title: previewTemplate.title,
      category: previewTemplate.category,
      content: previewTemplate.content,
      tags: [...previewTemplate.tags],
      newTag: ''
    });
    setPreviewTemplate(null);
    setIsPreviewFromDashboard(false); // Reset this so we stay in modal
  };

  const handleStartEditTemplate = () => {
    if (!previewTemplate) return;
    setEditingTemplateData({ ...previewTemplate });
    setIsEditingTemplate(true);
  };

  const handleSaveTemplateEdit = async () => {
    if (!editingTemplateData) return;

    try {
      // Check if we are updating an existing custom template or creating a new one from default
      const isUpdatingCustom = editingTemplateData.isCustom;

      if (isUpdatingCustom) {
        await updateTemplate({
          id: editingTemplateData._id,
          label: editingTemplateData.label,
          title: editingTemplateData.title,
          category: editingTemplateData.category,
          content: editingTemplateData.content,
          tags: editingTemplateData.tags,
        });
        setPreviewTemplate(editingTemplateData);
        showToast('Template updated', 'success');
      } else {
        // Create new custom template from default (Clone)
        await createTemplate({
          label: editingTemplateData.label,
          title: editingTemplateData.title,
          category: editingTemplateData.category,
          content: editingTemplateData.content,
          tags: editingTemplateData.tags,
        });
        showToast('Template saved', 'success');
      }
      setIsEditingTemplate(false);
    } catch (error) {
      showToast('Failed to save template', 'error');
      console.error(error);
    }
  };

  const handleCategorySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__NEW__') {
      setIsCustomCategory(true);
      setFormData(prev => ({ ...prev, category: '' }));
    } else {
      setIsCustomCategory(false);
      setFormData(prev => ({ ...prev, category: val }));
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;

    try {
      if (editingPromptId) {
        // Update existing
        await updatePrompt({
          id: editingPromptId,
          title: formData.title,
          category: formData.category || 'Uncategorized',
          content: formData.content,
          tags: formData.tags,
        });
        showToast('Prompt updated', 'success');
      } else {
        // Create new
        await createPrompt({
          title: formData.title,
          category: formData.category || 'Uncategorized',
          content: formData.content,
          tags: formData.tags,
        });
        showToast('Prompt created', 'success');
      }
      setIsModalOpen(false);
      setViewMode('prompts');
    } catch (error) {
      showToast('Failed to save prompt', 'error');
      console.error(error);
    }
  };

  const handleDelete = (id: Id<"prompts">) => {
    requestConfirm('Delete this prompt? This will remove all its versions too.', async () => {
      try {
        await deletePrompt({ id });
        setIsModalOpen(false);
        showToast('Prompt deleted', 'success');
      } catch (error) {
        showToast('Failed to delete prompt', 'error');
        console.error(error);
      }
    });
  };

  const handleInitiateSaveTemplate = () => {
    setNewTemplateName('');
    const currentCategory = formData.category || 'Uncategorized';

    // Check if current category is available in the list
    const exists = allCategories.includes(currentCategory);

    setSaveTemplateCategory(currentCategory);
    setIsSaveTemplateCustomCategory(!exists);
    setIsSavingTemplate(true);
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) return;

    const finalCategory = isSaveTemplateCustomCategory
        ? (saveTemplateCategory || 'Uncategorized')
        : (saveTemplateCategory || 'Uncategorized');

    try {
      await createTemplate({
        label: newTemplateName.trim(),
        title: formData.title,
        category: finalCategory,
        content: formData.content,
        tags: [...formData.tags],
      });
      setIsSavingTemplate(false);
      setNewTemplateName('');
      showToast('Template saved', 'success');
    } catch (error) {
      showToast('Failed to save template', 'error');
      console.error(error);
    }
  };

  const handleSaveTemplateCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__NEW__') {
      setIsSaveTemplateCustomCategory(true);
      setSaveTemplateCategory('');
    } else {
      setIsSaveTemplateCustomCategory(false);
      setSaveTemplateCategory(val);
    }
  };

  const handleDeleteTemplate = (id: Id<"templates">, e: React.MouseEvent) => {
    e.stopPropagation();
    requestConfirm('Delete this custom template?', async () => {
      try {
        await deleteTemplate({ id });
        showToast('Template deleted', 'success');
      } catch (error) {
        showToast('Failed to delete template', 'error');
        console.error(error);
      }
    });
  };
  
  const handleExportTemplates = () => {
    const customTemplates = templates.filter(t => t.isCustom);
    if (customTemplates.length === 0) {
        showToast("No custom templates to export.", 'info');
        return;
    }
    const blob = new Blob([JSON.stringify(customTemplates, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", "prompt_manager_templates.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
    showToast('Templates exported', 'success');
  };

  const handleImportTemplates = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const json = JSON.parse(e.target?.result as string);
            if (!Array.isArray(json)) throw new Error("Invalid format: Expected an array");

            // Basic validation
            const validTemplates = json.filter((t: any) =>
                t.label && t.title && t.content && Array.isArray(t.tags)
            );

            if (validTemplates.length === 0) {
                showToast("No valid templates found in file.", 'error');
                return;
            }

            // Import each template
            for (const t of validTemplates) {
                await createTemplate({
                    label: t.label,
                    title: t.title,
                    category: t.category || 'Uncategorized',
                    content: t.content,
                    tags: t.tags,
                });
            }

            showToast(`Imported ${validTemplates.length} template${validTemplates.length > 1 ? 's' : ''}.`, 'success');
        } catch (err) {
            console.error(err);
            showToast("Failed to import templates. Please check the file format.", 'error');
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleRestoreVersion = async (promptId: Id<"prompts">, versionId: Id<"versions">) => {
    try {
      await restoreVersion({
        promptId,
        versionId
      });
      showToast('Version restored', 'success');
    } catch (error) {
      showToast('Failed to restore version', 'error');
      console.error(error);
    }
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard', 'success');
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast('Copy failed', 'error');
    }
  };

  // Render Helpers
  const currentPrompt = useMemo(() =>
    prompts.find(p => p._id === (viewingPromptId || editingPromptId)),
  [prompts, viewingPromptId, editingPromptId]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-600 p-2 rounded-lg text-white">
                  <Edit2 size={24} />
                </div>
                <h1 className="text-xl font-bold text-slate-900 hidden sm:block">PromptManager</h1>
              </div>

              {/* View Toggles */}
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('prompts')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'prompts' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FileText size={16} />
                  Prompts ({filteredPrompts.length})
                </button>
                <button
                  onClick={() => setViewMode('templates')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'templates' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Grid size={16} />
                  Templates ({filteredTemplates.length})
                </button>
              </div>
            </div>

            <div className="flex flex-1 max-w-2xl gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder={viewMode === 'prompts' ? "Search prompts..." : "Search templates..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  ref={searchInputRef}
                  className="w-full pl-10 pr-16 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 bg-white">
                  Ctrl/Cmd + K
                </span>
              </div>
              
              <div className="relative">
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer max-w-[150px]"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              </div>
            </div>

            <button 
              onClick={viewMode === 'templates' ? handleOpenCreateTemplate : handleOpenCreate}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm active:transform active:scale-95 whitespace-nowrap"
            >
              <Plus size={18} />
              {viewMode === 'templates' ? 'New Template' : 'New Prompt'}
            </button>
          </div>

          {/* Tag Filters */}
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2 text-slate-500 text-sm mr-2">
              <Filter size={14} />
              <span>Filter by tags:</span>
            </div>
            {allTags.map(tag => (
              <TagBadge 
                key={tag} 
                label={tag} 
                active={selectedTags.includes(tag)}
                onClick={() => toggleTagFilter(tag)}
              />
            ))}
            {allTags.length === 0 && <span className="text-slate-400 text-sm italic">No tags created yet.</span>}
            {hasActiveFilters && (
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setSelectedTags([]); }}
                className="text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* PROMPTS GRID */}
        {viewMode === 'prompts' && (
          filteredPrompts.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                <Search className="text-slate-400" size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No prompts found</h3>
              <p className="text-slate-500 mt-2">Try adjusting your search or filters, or create a new prompt.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrompts.map(prompt => (
                <div
                  key={prompt._id}
                  onClick={() => handleOpenView(prompt)}
                  className="relative group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer flex flex-col min-h-[240px]"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md uppercase tracking-wide">
                      {prompt.category}
                    </span>
                    <span className="text-xs text-slate-400 group-hover:text-indigo-500 transition-colors">
                      {getRelativeTime(prompt.updatedAt)}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(prompt.content); }}
                      className="p-2 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200"
                      title="Copy content"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(prompt); }}
                      className="p-2 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200"
                      title="Edit prompt"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {prompt.title}
                  </h3>
                  
                  <p className="text-slate-600 text-sm line-clamp-3 mb-4 flex-1 font-mono bg-slate-50/50 p-2 rounded">
                    {prompt.content}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                    <div className="flex gap-1 overflow-hidden">
                      {prompt.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                          #{tag}
                        </span>
                      ))}
                      {prompt.tags.length > 3 && (
                        <span className="text-xs text-slate-400 px-1">+{prompt.tags.length - 3}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* TEMPLATES GRID */}
        {viewMode === 'templates' && (
          filteredTemplates.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                <Grid className="text-slate-400" size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No templates found</h3>
              <p className="text-slate-500 mt-2">Try adjusting your search or filters, or add a new template.</p>
            </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <div
                  key={template._id}
                  onClick={() => handleOpenTemplateFromDashboard(template)}
                  className={`
                    relative group bg-white rounded-xl border p-5 hover:shadow-lg transition-all cursor-pointer flex flex-col min-h-[240px]
                    ${template.isCustom ? 'border-purple-200 hover:border-purple-300' : 'border-slate-200 hover:border-indigo-200'}
                  `}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                       <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-md uppercase tracking-wide ${template.isCustom ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                         {template.category}
                       </span>
                       {template.isCustom && <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200">CUSTOM</span>}
                    </div>
                    {/* Delete button only visible on hover for custom templates */}
                    {template.isCustom && (
                        <button
                            onClick={(e) => handleDeleteTemplate(template._id, e)}
                            className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete Template"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(template.content); }}
                      className="p-2 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200"
                      title="Copy content"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenTemplateFromDashboard(template); }}
                      className="p-2 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200"
                      title="Open template"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                     <LayoutTemplate size={16} className={template.isCustom ? "text-purple-500" : "text-indigo-500"} />
                     <h3 className={`text-lg font-bold line-clamp-1 transition-colors ${template.isCustom ? "text-slate-900 group-hover:text-purple-600" : "text-slate-900 group-hover:text-indigo-600"}`}>
                       {template.label}
                     </h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-2 font-medium">{template.title}</p>
                  
                  <p className="text-slate-600 text-sm line-clamp-3 mb-4 flex-1 font-mono bg-slate-50/50 p-2 rounded">
                    {template.content}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                    <div className="flex gap-1 overflow-hidden">
                      {template.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                          #{tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="text-xs text-slate-400 px-1">+{template.tags.length - 3}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {/* VIEW MODE */}
        {viewingPromptId && currentPrompt && (
          <>
            <div className="flex justify-between items-start p-6 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wide">
                    {currentPrompt.category}
                  </span>
                  <div className="flex gap-2">
                    {currentPrompt.tags.map(tag => (
                      <span key={tag} className="text-xs text-slate-500 font-medium">#{tag}</span>
                    ))}
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{currentPrompt.title}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> Created {formatDate(currentPrompt.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Edit2 size={14} /> Updated {getRelativeTime(currentPrompt.updatedAt)}
                  </span>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto md:overflow-hidden p-0 flex flex-col md:flex-row h-full min-h-0">
              {/* Main Content Area */}
              <div className="flex-1 p-6 border-r border-slate-100 md:overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Prompt Content</h3>
                  <button 
                    onClick={() => copyToClipboard(currentPrompt.content)}
                    className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Copy size={14} /> Copy
                  </button>
                </div>
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-slate-700 leading-relaxed overflow-x-auto">
                    {currentPrompt.content}
                  </pre>
                </div>
              </div>

              {/* Sidebar: Actions & History */}
              <div className="w-full md:w-80 bg-slate-50 p-6 flex flex-col gap-6 md:h-full border-t md:border-t-0 md:border-l border-slate-100 min-h-0">
                <div className="flex-shrink-0">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleEdit(currentPrompt)}
                      className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-700 px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm"
                    >
                      <Edit2 size={16} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(currentPrompt._id)}
                      className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-red-300 hover:text-red-600 text-slate-700 px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col min-h-[200px] md:min-h-0">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2 flex-shrink-0">
                    <History size={14} /> Version History
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {currentPromptVersions.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">No previous versions.</p>
                    ) : (
                      currentPromptVersions.map((version) => (
                        <div key={version._id} className="bg-white p-3 rounded-lg border border-slate-200 text-sm shadow-sm group">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-slate-500 text-xs font-mono">{formatDate(version.timestamp)}</span>
                            <button
                              onClick={() => handleRestoreVersion(currentPrompt._id, version._id)}
                              className="text-indigo-600 hover:text-indigo-800 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Restore this version"
                            >
                              <RotateCcw size={14} />
                            </button>
                          </div>
                          <p className="line-clamp-2 text-slate-600 text-xs font-mono bg-slate-50 p-1.5 rounded">
                            {version.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* EDIT/CREATE MODE */}
        {(editingPromptId || (!viewingPromptId && !editingPromptId)) && (
          <>
            {previewTemplate ? (
              /* TEMPLATE PREVIEW / EDIT OVERLAY */
              <div className="flex flex-col h-full min-h-0 bg-white animate-in fade-in zoom-in-95 duration-200">
                {/* Preview Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-slate-50 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className={`${previewTemplate.isCustom ? 'bg-purple-100 text-purple-600' : 'bg-indigo-100 text-indigo-600'} p-2 rounded-lg`}>
                       <LayoutTemplate size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {isEditingTemplate ? 'Edit Template' : 'Template Preview'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {isEditingTemplate ? 'Modify the template definition' : 'Review content before applying'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => isPreviewFromDashboard ? setIsModalOpen(false) : setPreviewTemplate(null)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>

                {/* Preview/Edit Content */}
                <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-white">
                  {isEditingTemplate && editingTemplateData ? (
                    /* EDIT TEMPLATE FORM */
                    <div className="max-w-3xl mx-auto space-y-5">
                       <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Template Label</label>
                        <input 
                          type="text"
                          value={editingTemplateData.label}
                          onChange={(e) => setEditingTemplateData({...editingTemplateData, label: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">Default Title</label>
                          <input 
                            type="text"
                            value={editingTemplateData.title}
                            onChange={(e) => setEditingTemplateData({...editingTemplateData, title: e.target.value})}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">Category</label>
                          <input 
                            type="text"
                            value={editingTemplateData.category}
                            onChange={(e) => setEditingTemplateData({...editingTemplateData, category: e.target.value})}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-sm font-semibold text-slate-700">Tags</label>
                         <div className="flex flex-wrap gap-2 p-2 bg-white rounded-lg border border-slate-300">
                            {editingTemplateData.tags.map(tag => (
                              <TagBadge key={tag} label={tag} active onRemove={() => setEditingTemplateData(prev => prev ? ({...prev, tags: prev.tags.filter(t => t !== tag)}) : null)} />
                            ))}
                            <input 
                              type="text"
                              placeholder="Add tag..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const val = e.currentTarget.value.trim();
                                  if (val && editingTemplateData && !editingTemplateData.tags.includes(val)) {
                                    setEditingTemplateData({...editingTemplateData, tags: [...editingTemplateData.tags, val]});
                                    e.currentTarget.value = '';
                                  }
                                }
                              }}
                              className="flex-1 min-w-[100px] outline-none text-sm"
                            />
                         </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Default Content</label>
                        <textarea 
                          value={editingTemplateData.content}
                          onChange={(e) => setEditingTemplateData({...editingTemplateData, content: e.target.value})}
                          className="w-full min-h-[250px] px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm resize-none"
                        />
                      </div>
                    </div>
                  ) : (
                    /* VIEW PREVIEW */
                    <div className="max-w-3xl mx-auto space-y-6">
                       <div className="space-y-1">
                          <h3 className="text-2xl font-bold text-slate-900">{previewTemplate.title}</h3>
                          <div className="flex items-center gap-3">
                             <span className="text-xs font-semibold uppercase tracking-wide bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                               {previewTemplate.category}
                             </span>
                             <div className="flex gap-2">
                               {previewTemplate.tags.map(t => (
                                 <span key={t} className="text-xs text-slate-500">#{t}</span>
                               ))}
                             </div>
                          </div>
                       </div>
                       
                       <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Content Preview</h4>
                          <pre className="whitespace-pre-wrap break-words font-mono text-sm text-slate-700 leading-relaxed overflow-x-auto">
                            {previewTemplate.content}
                          </pre>
                       </div>
                    </div>
                  )}
                </div>

                {/* Preview Actions */}
                <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-between items-center flex-shrink-0">
                   <div>
                     {!isEditingTemplate && (
                       <button 
                         onClick={handleStartEditTemplate}
                         className="text-sm text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-1.5 transition-colors"
                       >
                         <Pencil size={16} />
                         {previewTemplate.isCustom ? 'Edit Template' : 'Customize Template'}
                       </button>
                     )}
                   </div>
                   <div className="flex gap-3">
                     {isEditingTemplate ? (
                       <>
                         <button 
                           onClick={() => setIsEditingTemplate(false)}
                           className="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-white transition-colors"
                         >
                           Cancel Edit
                         </button>
                         <button 
                           onClick={handleSaveTemplateEdit}
                           className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                         >
                           Save Changes
                         </button>
                       </>
                     ) : (
                       <>
                         <button 
                           onClick={() => isPreviewFromDashboard ? setIsModalOpen(false) : setPreviewTemplate(null)}
                           className="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-white transition-colors"
                         >
                           {isPreviewFromDashboard ? 'Close' : 'Back'}
                         </button>
                         <button 
                           onClick={applyTemplate}
                           className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
                         >
                           <Check size={18} />
                           Use Template
                         </button>
                       </>
                     )}
                   </div>
                </div>
              </div>
            ) : (
              /* MAIN FORM */
              <div className="flex flex-col h-full min-h-0">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-white flex-shrink-0">
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingPromptId ? 'Edit Prompt' : 'Create New Prompt'}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 min-h-0">
                  <div className="max-w-3xl mx-auto space-y-6">
                    
                    {/* Templates Section */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                          <LayoutTemplate size={16} />
                          Quick Start Templates
                        </h3>
                        <div className="flex gap-2">
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleImportTemplates}
                                className="hidden"
                                accept=".json"
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors"
                                title="Import Templates"
                            >
                                <Upload size={16} />
                            </button>
                            <button
                                onClick={handleExportTemplates}
                                className={`p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors ${templates.filter(t => t.isCustom).length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Export Templates"
                                disabled={templates.filter(t => t.isCustom).length === 0}
                            >
                                <Download size={16} />
                            </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {templates.map((t) => (
                          <div
                            key={t._id}
                            onClick={() => handleTemplateClick(t)}
                            className={`
                              relative text-left p-3 bg-white rounded-lg border hover:shadow-md transition-all group cursor-pointer
                              ${t.isCustom ? 'border-purple-200 hover:border-purple-400' : 'border-indigo-100 hover:border-indigo-300'}
                            `}
                          >
                            {t.isCustom && (
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => handleDeleteTemplate(t._id, e)}
                                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            )}
                            <div className={`font-medium text-xs mb-1 ${t.isCustom ? 'text-purple-700' : 'text-indigo-700'}`}>
                              {t.label}
                            </div>
                            <div className="text-slate-400 text-[10px] uppercase tracking-wider">
                              {t.category}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Title</label>
                        <input 
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          placeholder="e.g., SEO Blog Post Generator"
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Category</label>
                        <div className="space-y-2">
                          <div className="relative">
                            <select 
                              value={isCustomCategory ? '__NEW__' : formData.category}
                              onChange={handleCategorySelectChange}
                              className="w-full appearance-none px-4 py-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none cursor-pointer"
                            >
                              <option value="" disabled>Select a category...</option>
                              {uniqueExistingCategories.map(c => <option key={c} value={c}>{c}</option>)}
                              <option value="__NEW__" className="font-semibold text-indigo-600 bg-indigo-50">+ Add New Category</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                          </div>
                          
                          {isCustomCategory && (
                            <input 
                              type="text"
                              value={formData.category}
                              onChange={(e) => setFormData({...formData, category: e.target.value})}
                              placeholder="Enter New Category Name"
                              autoFocus
                              className="w-full px-4 py-2.5 rounded-lg border border-indigo-300 ring-2 ring-indigo-100 focus:ring-indigo-500 focus:border-transparent outline-none animate-in fade-in slide-in-from-top-2 duration-200"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Tags</label>
                      <div className="flex flex-wrap gap-2 p-3 bg-white rounded-lg border border-slate-300 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
                        {formData.tags.map(tag => (
                          <TagBadge 
                            key={tag} 
                            label={tag} 
                            active 
                            onRemove={() => setFormData(prev => ({...prev, tags: prev.tags.filter(t => t !== tag)}))}
                          />
                        ))}
                        <input 
                          type="text"
                          value={formData.newTag}
                          onChange={(e) => setFormData({...formData, newTag: e.target.value})}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
                                setFormData(prev => ({
                                  ...prev, 
                                  tags: [...prev.tags, prev.newTag.trim()],
                                  newTag: ''
                                }));
                              }
                            }
                          }}
                          placeholder={formData.tags.length === 0 ? "Type tag and press Enter..." : "Add another..."}
                          className="flex-1 bg-transparent border-none outline-none text-sm min-w-[120px]"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 flex flex-col">
                      <label className="text-sm font-semibold text-slate-700">Prompt Content</label>
                      <textarea 
                        value={formData.content}
                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                        placeholder="Enter your prompt here..."
                        className="flex-1 w-full min-h-[300px] px-4 py-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono text-sm resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-200 bg-white flex justify-between items-center flex-shrink-0 relative">
                  {/* Left Side: Save as Template */}
                  <div className="relative flex items-center">
                    {isSavingTemplate && (
                       <div className="absolute bottom-full left-0 mb-4 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-5 z-50 animate-in zoom-in-95 duration-200">
                          <h3 className="font-semibold text-sm mb-3 text-slate-900">Save as New Template</h3>
                          
                          <div className="space-y-3">
                              <div className="space-y-1">
                                  <label className="text-xs font-medium text-slate-500">Template Name</label>
                                  <input 
                                    type="text" 
                                    value={newTemplateName}
                                    onChange={(e) => setNewTemplateName(e.target.value)}
                                    placeholder="e.g. Weekly Report"
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    autoFocus
                                  />
                              </div>

                              <div className="space-y-1">
                                  <label className="text-xs font-medium text-slate-500">Category</label>
                                  <select 
                                    value={isSaveTemplateCustomCategory ? '__NEW__' : saveTemplateCategory}
                                    onChange={handleSaveTemplateCategoryChange}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                  >
                                      <option value="" disabled>Select category...</option>
                                      {allCategories.map(c => (
                                          <option key={c} value={c}>{c}</option>
                                      ))}
                                      <option value="__NEW__" className="font-semibold text-indigo-600 bg-indigo-50">+ Add New Category</option>
                                  </select>
                              </div>

                              {isSaveTemplateCustomCategory && (
                                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                      <input 
                                          type="text" 
                                          value={saveTemplateCategory}
                                          onChange={(e) => setSaveTemplateCategory(e.target.value)}
                                          placeholder="New Category Name"
                                          className="w-full px-3 py-2 text-sm rounded-lg border border-indigo-300 ring-2 ring-indigo-50 focus:ring-indigo-500 outline-none"
                                      />
                                  </div>
                              )}

                              <div className="flex justify-end gap-2 pt-2">
                                  <button 
                                      onClick={() => setIsSavingTemplate(false)}
                                      className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                                  >
                                      Cancel
                                  </button>
                                  <button 
                                      onClick={handleSaveTemplate}
                                      disabled={!newTemplateName.trim()}
                                      className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50 transition-colors"
                                  >
                                      Save Template
                                  </button>
                              </div>
                          </div>
                          
                          {/* Triangle Arrow */}
                          <div className="absolute top-full left-6 -mt-1.5 border-8 border-transparent border-t-white drop-shadow-sm w-0 h-0"></div>
                       </div>
                    )}
                    
                    <button 
                      onClick={handleInitiateSaveTemplate}
                      className={`text-sm text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-1.5 transition-colors ${isSavingTemplate ? 'text-indigo-600' : ''}`}
                    >
                      <BookTemplate size={16} />
                      Save as Template
                    </button>
                  </div>

                  {/* Right Side: Main Actions */}
                  <div className="flex gap-3">
                      <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSave}
                        className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
                      >
                        <Save size={18} />
                        Save Prompt
                      </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </Modal>

      {confirmState && (
        <ConfirmDialog 
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

      <ToastContainer 
        toasts={toasts} 
        onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} 
      />
    </div>
  );
};

// Initialize Convex client
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  );
}
