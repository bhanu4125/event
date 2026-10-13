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
        return <XCircle className="w-6 h-6 text-rose-600" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-emerald-600" />;
      case 'prompt':
        return <HelpCircle className="w-6 h-6 text-amber-600" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-amber-600" />;
    }
  };

  const getButtonStyles = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm';
      default:
        return 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg p-6 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
            {getIcon()}
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Input prompt if needed */}
        {requireInput !== undefined && (requireInput || inputPlaceholder) && (
          <div className="space-y-1.5">
            {inputLabel && (
              <label className="text-xs font-semibold text-slate-700">
                {inputLabel} {requireInput && <span className="text-rose-600">*</span>}
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
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition ${
                inputError ? 'border-rose-500' : 'border-slate-300'
              }`}
            />
            {inputError && <p className="text-xs text-rose-600">{inputError}</p>}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-5 py-2 text-sm font-semibold rounded-xl transition flex items-center gap-2 ${getButtonStyles()} ${
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
