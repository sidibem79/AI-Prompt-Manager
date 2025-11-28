import React from 'react';
import { AlertTriangle, Check, X, Info } from 'lucide-react';
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
