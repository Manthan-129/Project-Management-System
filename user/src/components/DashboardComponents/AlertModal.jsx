import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const AlertModal = ({
    isOpen,
    title,
    message,
    type = 'info',
    isDecision = false,
    details = null,
    onClose,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmLoading = false,
    actions = [],
    children = null,
}) => {
    if (!isOpen) return null;

    const getIconAndColors = () => {
        switch (type) {
            case 'success':
                return {
                    icon: CheckCircle2,
                    bgColor: 'bg-emerald-500/15 border border-emerald-500/30',
                    textColor: 'text-emerald-400',
                    confirmBtn: 'bg-emerald-600 hover:bg-emerald-500 text-white',
                };
            case 'error':
            case 'danger':
                return {
                    icon: AlertCircle,
                    bgColor: 'bg-rose-500/15 border border-rose-500/30',
                    textColor: 'text-rose-400',
                    confirmBtn: 'bg-rose-600 hover:bg-rose-500 text-white',
                };
            case 'warning':
                return {
                    icon: AlertTriangle,
                    bgColor: 'bg-amber-500/15 border border-amber-500/30',
                    textColor: 'text-amber-400',
                    confirmBtn: 'bg-amber-600 hover:bg-amber-500 text-white',
                };
            case 'info':
            default:
                return {
                    icon: Info,
                    bgColor: 'bg-sky-500/15 border border-sky-500/30',
                    textColor: 'text-sky-400',
                    confirmBtn: 'bg-indigo-600 hover:bg-indigo-500 text-white',
                };
        }
    };

    const { icon: Icon, bgColor, textColor, confirmBtn } = getIconAndColors();
    const isConfirmationDecision = isDecision || typeof onConfirm === 'function';

    const handleCancel = () => {
        if (typeof onCancel === 'function') {
            onCancel();
        } else if (typeof onClose === 'function') {
            onClose();
        }
    };

    const handleConfirm = async () => {
        if (typeof onConfirm === 'function') {
            await onConfirm();
        }
        if (typeof onClose === 'function') {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm dd-fade-in" onClick={handleCancel}>
            <div
                className="w-full max-w-md rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] p-6 text-white shadow-[0_25px_60px_rgba(0,0,0,0.5)] dd-fade-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bgColor}`}>
                        <Icon size={24} className={textColor} />
                    </div>
                    <button
                        onClick={handleCancel}
                        type="button"
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-[#132d52] hover:text-white"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <h2 className="mt-4 text-lg font-bold text-white tracking-tight">{title}</h2>
                {message && <p className="mt-2 text-sm leading-relaxed text-slate-300">{message}</p>}

                {/* Rich Details / Inside popup preview */}
                {details && (
                    <div className="mt-3 rounded-xl border border-[#1b3a5c] bg-[#081526] p-3.5 text-xs text-slate-300">
                        {details}
                    </div>
                )}

                {children && <div className="mt-3">{children}</div>}

                {/* Actions */}
                <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-end">
                    {actions.length > 0 ? (
                        actions.map((action, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={async () => {
                                    if (action.onClick) await action.onClick();
                                    if (!action.preventClose && typeof onClose === 'function') onClose();
                                }}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                                    action.variant === 'primary'
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                                        : action.variant === 'danger'
                                        ? 'bg-rose-600 text-white hover:bg-rose-500'
                                        : 'border border-[#1b3a5c] bg-[#0a1829] text-slate-300 hover:bg-[#132d52] hover:text-white'
                                }`}
                            >
                                {action.label}
                            </button>
                        ))
                    ) : isConfirmationDecision ? (
                        <>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="rounded-xl border border-[#1b3a5c] bg-[#0a1829] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-[#132d52] hover:text-white"
                            >
                                {cancelText}
                            </button>
                            <button
                                type="button"
                                disabled={confirmLoading}
                                onClick={handleConfirm}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition disabled:opacity-50 ${confirmBtn}`}
                            >
                                {confirmLoading ? 'Processing...' : confirmText}
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                        >
                            OK
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlertModal;
