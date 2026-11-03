"use client";

import { AlertTriangle, AlertCircle, HelpCircle, CheckCircle2, Loader2, X } from "lucide-react";

export type ConfirmVariant = "danger" | "warning" | "primary" | "success";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Konfirmasi",
  cancelText = "Batal",
  variant = "primary",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: AlertCircle,
          iconBg: "bg-rose-50 text-rose-600 border-rose-200",
          btnConfirm: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          iconBg: "bg-amber-50 text-amber-600 border-amber-200",
          btnConfirm: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20",
        };
      case "success":
        return {
          icon: CheckCircle2,
          iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
          btnConfirm: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20",
        };
      case "primary":
      default:
        return {
          icon: HelpCircle,
          iconBg: "bg-blue-50 text-[#0B4EA2] border-blue-200",
          btnConfirm: "bg-[#0B4EA2] hover:bg-blue-800 text-white shadow-blue-900/20",
        };
    }
  };

  const { icon: Icon, iconBg, btnConfirm } = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border ${iconBg}`}
          >
            <Icon className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-bold text-[#072255] tracking-tight">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
              {description}
            </p>
          </div>

          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5 ${btnConfirm}`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
