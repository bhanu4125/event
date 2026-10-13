import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, HelpCircle, XCircle } from 'lucide-react';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // 'warning' | 'danger' | 'success' | 'prompt'
  inputPlaceholder = '',
  requireInput = false,
  inputLabel = '',
  isLoading = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requireInput && !inputValue.trim()) {
      setInputError('This field is mandatory.');
      return;
    }
    onConfirm(inputValue);
  };

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <XCircle className="w-6 h-6 text-rose-400" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-emerald-400" />;
      case 'prompt':
        return <HelpCircle className="w-6 h-6 text-amber-400" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-amber-400" />;
    }
  };

  const getButtonStyles = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30';
      default:
        return 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50 shrink-0">
            {getIcon()}
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Input prompt if needed (e.g., rejection reason or modification notes) */}
        {requireInput !== undefined && (requireInput || inputPlaceholder) && (
          <div className="space-y-1.5">
            {inputLabel && (
              <label className="text-xs font-semibold text-slate-300">
                {inputLabel} {requireInput && <span className="text-rose-400">*</span>}
              </label>
            )}
            <textarea
              rows={3}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (inputError) setInputError('');
              }}
              placeholder={inputPlaceholder}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                inputError ? 'border-rose-500 ring-rose-500/20' : 'border-slate-800'
              }`}
            />
            {inputError && <p className="text-xs text-rose-400">{inputError}</p>}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-5 py-2 text-sm font-semibold rounded-xl shadow-lg transition flex items-center gap-2 ${getButtonStyles()} ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
