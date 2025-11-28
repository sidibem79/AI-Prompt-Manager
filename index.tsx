import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexProvider, ConvexReactClient, useQuery, useMutation } from "convex/react";
import { api } from "./convex/_generated/api";
import { Id } from "./convex/_generated/dataModel";

import Layout from './src/components/Layout';
import Sidebar from './src/components/Sidebar';
import PromptList from './src/components/PromptList';
import PromptDetail from './src/components/PromptDetail';
import Editor from './src/components/Editor';
import { ToastContainer, ConfirmDialog, SettingsPanel, TaxonomyManager } from './src/components/UI';
import { Prompt, Template, ToastMessage, ToastVariant, Version } from './src/types';

const App = () => {
  // --- Data ---
  const prompts = useQuery(api.prompts.list) ?? [];
  const templates = useQuery(api.templates.list) ?? [];
  const allCategories = useQuery(api.prompts.getCategories) ?? [];
  const allTags = useQuery(api.prompts.getTags) ?? [];

  // --- Mutations ---
  const createPrompt = useMutation(api.prompts.create);
  const updatePrompt = useMutation(api.prompts.update);
  const deletePrompt = useMutation(api.prompts.remove);
  const restoreVersion = useMutation(api.prompts.restoreVersion);

  const createTemplate = useMutation(api.templates.create);
  const updateTemplate = useMutation(api.templates.update);
  const deleteTemplate = useMutation(api.templates.remove);

  // --- State ---
  const [viewMode, setViewMode] = useState<'prompts' | 'templates'>('prompts');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem('pm-theme') as 'light' | 'dark') || 'light';
  });
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>(() => {
    if (typeof window === 'undefined') return 'md';
    return (localStorage.getItem('pm-font-size') as 'sm' | 'md' | 'lg') || 'md';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTaxonomyOpen, setIsTaxonomyOpen] = useState(false);
  const [taxonomyPresetCategory, setTaxonomyPresetCategory] = useState<string | null>(null);
  const [isTaxonomyBusy, setIsTaxonomyBusy] = useState(false);
  const [lastAction, setLastAction] = useState<{ type: string; timestamp: number } | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(288);
  const [listWidth, setListWidth] = useState(360);

  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editorData, setEditorData] = useState<Partial<Prompt | Template>>({});

  // UI State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dragTypeRef = useRef<'sidebar' | 'list' | null>(null);
  const sidebarWidthRef = useRef(sidebarWidth);
  const listWidthRef = useRef(listWidth);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = theme === 'dark' ? '#020617' : '#fafaf9';
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('pm-theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pm-font-size', fontSize);
    }
  }, [fontSize]);

  useEffect(() => {
    if (!isSidebarOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSidebarOpen]);
  useEffect(() => {
    return () => {
      dragTypeRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);
  useEffect(() => {
    sidebarWidthRef.current = sidebarWidth;
  }, [sidebarWidth]);

  useEffect(() => {
    listWidthRef.current = listWidth;
  }, [listWidth]);

  // --- Derived Data ---
  const categories = useMemo(() => ['All', ...allCategories], [allCategories]);
  const itemsForView = viewMode === 'prompts' ? prompts : templates;

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach(category => { counts[category] = 0; });
    itemsForView.forEach(item => {
      const key = item.category || 'Uncategorized';
      counts[key] = (counts[key] ?? 0) + 1;
    });
    counts['All'] = itemsForView.length;
    return counts;
  }, [itemsForView, categories]);
  const sidebarCounts = useMemo(() => ({
    prompts: prompts.length,
    templates: templates.length,
    categories: categoryCounts
  }), [prompts.length, templates.length, categoryCounts]);
  const shortcutsEnabled = !isEditorOpen;

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const startResize = (type: 'sidebar' | 'list') => (event: React.MouseEvent) => {
    if (window.innerWidth < 1024) return;
    event.preventDefault();
    dragTypeRef.current = type;
    const handleMouseMove = (e: MouseEvent) => {
      if (dragTypeRef.current === 'sidebar') {
        setSidebarWidth(clamp(e.clientX, 220, 420));
      } else if (dragTypeRef.current === 'list') {
        const newWidth = clamp(e.clientX - sidebarWidthRef.current - 8, 260, 560);
        setListWidth(newWidth);
      }
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };

    const stopDragging = () => {
      dragTypeRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDragging);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDragging);
  };

  const filteredItems = useMemo(() => {
    return itemsForView.filter(item => {
      const matchesSearch = (
        ('title' in item ? item.title : item.label).toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => item.tags.includes(tag));
      return matchesSearch && matchesCategory && matchesTags;
    });
  }, [itemsForView, searchQuery, selectedCategory, selectedTags]);

  const selectedItem = useMemo(() => {
    if (!selectedId) return null;
    const items = viewMode === 'prompts' ? prompts : templates;
    // @ts-ignore
    return items.find(i => i._id === selectedId) || null;
  }, [selectedId, viewMode, prompts, templates]);

  const currentPromptVersions = useQuery(
    api.versions.list,
    (viewMode === 'prompts' && selectedId) ? { promptId: selectedId as Id<"prompts"> } : "skip"
  ) ?? [];

  // --- Actions ---
  const showToast = (message: string, variant: ToastVariant = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, variant }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleClearFilters = () => {
    setSelectedCategory('All');
    setSelectedTags([]);
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const handleCategoryReset = () => setSelectedCategory('All');

  const handleViewModeChange = (mode: 'prompts' | 'templates') => {
    setViewMode(mode);
    setSelectedId(null);
    handleClearFilters();
  };

  const handleCreateNew = () => {
    setEditorMode('create');
    setEditorData({});
    setIsEditorOpen(true);
    setIsSidebarOpen(false);
  };

  const handleEdit = () => {
    if (!selectedItem) return;
    setEditorMode('edit');
    setEditorData(selectedItem);
    setIsEditorOpen(true);
  };

  const handleDelete = () => {
    if (!selectedItem) return;
    setConfirmState({
      message: `Are you sure you want to delete this ${viewMode === 'prompts' ? 'prompt' : 'template'}?`,
      onConfirm: async () => {
        try {
          if (viewMode === 'prompts') {
            await deletePrompt({ id: selectedItem._id as Id<"prompts"> });
          } else {
            await deleteTemplate({ id: selectedItem._id as Id<"templates"> });
          }
          setSelectedId(null);
          showToast('Item deleted', 'success');
          setLastAction({ type: 'Deleted', timestamp: Date.now() });
        } catch (error) {
          showToast('Failed to delete item', 'error');
        }
        setConfirmState(null);
      }
    });
  };

  const handleSave = async (data: any) => {
    try {
      if (viewMode === 'prompts') {
        if (editorMode === 'create') {
          await createPrompt(data);
          showToast('Prompt created', 'success');
        } else {
          await updatePrompt({ id: selectedItem!._id as Id<"prompts">, ...data });
          showToast('Prompt updated', 'success');
        }
      } else {
        if (editorMode === 'create') {
          await createTemplate(data);
          showToast('Template created', 'success');
        } else {
          await updateTemplate({ id: selectedItem!._id as Id<"templates">, ...data });
          showToast('Template updated', 'success');
        }
      }
      setIsEditorOpen(false);
      setLastAction({ type: 'Saved', timestamp: Date.now() });
    } catch (error) {
      console.error(error);
      showToast('Failed to save', 'error');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
    setLastAction({ type: 'Copied', timestamp: Date.now() });
  };

  const handleRestoreVersion = async (version: Version) => {
    if (!selectedItem) return;
    try {
      const result = await restoreVersion({
        promptId: selectedItem._id as Id<"prompts">,
        versionId: version._id
      });

      if (result?.restored) {
        showToast('Version restored', 'success');
        setLastAction({ type: 'Version restored', timestamp: Date.now() });
      } else {
        showToast('Already on this version', 'info');
      }
    } catch (error) {
      showToast('Failed to restore version', 'error');
    }
  };

  const updatePromptRecord = (prompt: Prompt, patch: Partial<Pick<Prompt, 'category' | 'tags' | 'title' | 'content'>>) => {
    return updatePrompt({
      id: prompt._id as Id<"prompts">,
      title: patch.title ?? prompt.title,
      category: patch.category ?? prompt.category,
      content: patch.content ?? prompt.content,
      tags: patch.tags ?? prompt.tags,
    });
  };

  const updateTemplateRecord = (template: Template, patch: Partial<Pick<Template, 'category' | 'tags' | 'title' | 'content' | 'label'>>) => {
    if (!template.isCustom) {
      return Promise.resolve();
    }
    return updateTemplate({
      id: template._id as Id<"templates">,
      label: patch.label ?? template.label,
      title: patch.title ?? template.title,
      category: patch.category ?? template.category,
      content: patch.content ?? template.content,
      tags: patch.tags ?? template.tags,
    });
  };

  const performCategoryChange = async (from: string, to: string) => {
    if (!from || !to || from === to) return;
    setIsTaxonomyBusy(true);
    try {
      const promptTargets = prompts.filter(prompt => prompt.category === from);
      const templateTargets = templates.filter(template => template.category === from);
      await Promise.all([
        ...promptTargets.map(prompt => updatePromptRecord(prompt, { category: to })),
        ...templateTargets.map(template => updateTemplateRecord(template, { category: to }))
      ]);
      showToast(`Category "${from}" moved to "${to}"`, 'success');
      setLastAction({ type: 'Category updated', timestamp: Date.now() });
    } catch (error) {
      showToast('Failed to update categories', 'error');
    } finally {
      setIsTaxonomyBusy(false);
    }
  };

  const performTagChange = async (from: string, to: string) => {
    if (!from || !to || from === to) return;
    setIsTaxonomyBusy(true);
    try {
      const promptTargets = prompts.filter(prompt => prompt.tags.includes(from));
      const templateTargets = templates.filter(template => template.tags.includes(from));

      const updateTags = (tags: string[]) => Array.from(new Set(tags.map(tag => (tag === from ? to : tag))));

      await Promise.all([
        ...promptTargets.map(prompt => updatePromptRecord(prompt, { tags: updateTags(prompt.tags) })),
        ...templateTargets.map(template => updateTemplateRecord(template, { tags: updateTags(template.tags) }))
      ]);
      showToast(`Tag "${from}" merged into "${to}"`, 'success');
      setLastAction({ type: 'Tags updated', timestamp: Date.now() });
    } catch (error) {
      showToast('Failed to update tags', 'error');
    } finally {
      setIsTaxonomyBusy(false);
    }
  };

  const handleRenameCategory = (from: string, to: string) => performCategoryChange(from, to);
  const handleMergeCategories = (from: string, to: string) => performCategoryChange(from, to);
  const handleRenameTag = (from: string, to: string) => performTagChange(from, to);
  const handleMergeTags = (from: string, to: string) => performTagChange(from, to);
  useEffect(() => {
    if (!isTaxonomyOpen) {
      setTaxonomyPresetCategory(null);
    }
  }, [isTaxonomyOpen]);

  return (
    <Layout theme={theme} focusMode={isEditorOpen}>
      <div className="flex w-full h-full overflow-hidden">
        <Sidebar
          viewMode={viewMode}
          setViewMode={handleViewModeChange}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          tags={allTags}
          selectedTags={selectedTags}
          toggleTag={toggleTag}
          onNewPrompt={handleCreateNew}
          onNewTemplate={handleCreateNew}
          counts={sidebarCounts}
          isMobileOpen={isSidebarOpen}
          onToggleMobile={() => setIsSidebarOpen(prev => !prev)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenTaxonomy={() => setIsTaxonomyOpen(true)}
          desktopWidth={sidebarWidth}
          onEditCategory={(category) => { setTaxonomyPresetCategory(category); setIsTaxonomyOpen(true); }}
        />

        <div
          className="hidden lg:block w-2 cursor-col-resize bg-slate-200/0 hover:bg-slate-200/60 transition-colors"
          onMouseDown={startResize('sidebar')}
        />

        <div className="flex-1 flex flex-col lg:ml-0 overflow-hidden">
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <PromptList
              items={filteredItems}
              selectedId={selectedId}
              onSelect={(item) => { setSelectedId(item._id); setIsSidebarOpen(false); }}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              viewMode={viewMode}
              searchInputRef={searchInputRef}
              selectedCategory={selectedCategory}
              selectedTags={selectedTags}
              onCategoryReset={handleCategoryReset}
              onRemoveTag={handleRemoveTag}
              onClearFilters={handleClearFilters}
              shortcutsEnabled={shortcutsEnabled}
              desktopWidth={listWidth}
            />

            <div
              className="hidden lg:block w-2 cursor-col-resize bg-slate-200/0 hover:bg-slate-200/60 transition-colors"
              onMouseDown={startResize('list')}
            />

            <PromptDetail
              item={selectedItem}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCopy={handleCopy}
              versions={currentPromptVersions}
              onRestoreVersion={handleRestoreVersion}
              lastAction={lastAction}
            />
          </div>
        </div>
      </div>

      {isEditorOpen && (
        <Editor
          initialData={editorData}
          mode={editorMode}
          type={viewMode === 'prompts' ? 'prompt' : 'template'}
          categories={allCategories}
          templates={templates}
          tagsOptions={allTags}
          fontSize={fontSize}
          onSave={handleSave}
          onCancel={() => setIsEditorOpen(false)}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

      <SettingsPanel
        isOpen={isSettingsOpen}
        theme={theme}
        onThemeChange={setTheme}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        onClose={() => setIsSettingsOpen(false)}
      />

      <TaxonomyManager
        isOpen={isTaxonomyOpen}
        isBusy={isTaxonomyBusy}
        categories={allCategories}
        tags={allTags}
        onClose={() => setIsTaxonomyOpen(false)}
        onRenameCategory={handleRenameCategory}
        onMergeCategories={handleMergeCategories}
        onRenameTag={handleRenameTag}
        onMergeTags={handleMergeTags}
        initialCategory={taxonomyPresetCategory}
      />

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </Layout>
  );
};

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
