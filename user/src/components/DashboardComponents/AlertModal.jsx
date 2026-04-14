import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const AlertModal = ({ isOpen, title, message, type = 'info', onClose, actions = [] }) => {
    if (!isOpen) return null;

    const getIconAndColors = () => {
        switch (type) {
            case 'success':
                return {
                    icon: CheckCircle2,
                    bgColor: 'bg-emerald-50',
                    textColor: 'text-emerald-700',
                    borderColor: 'border-emerald-200'
                };
            case 'error':
                return {
                    icon: AlertCircle,
                    bgColor: 'bg-red-50',
                    textColor: 'text-red-700',
                    borderColor: 'border-red-200'
                };
            case 'warning':
                return {
                    icon: AlertTriangle,
                    bgColor: 'bg-amber-50',
                    textColor: 'text-amber-700',
                    borderColor: 'border-amber-200'
                };
            case 'info':
            default:
                return {
                    icon: Info,
                    bgColor: 'bg-blue-50',
                    textColor: 'text-blue-700',
                    borderColor: 'border-blue-200'
                };
        }
    };

    const { icon: Icon, bgColor, textColor, borderColor } = getIconAndColors();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 px-4 dd-fade-in">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.2)] dd-fade-up">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bgColor}`}>
                        <Icon size={24} className={textColor} />
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <h2 className="mt-4 text-lg font-bold text-slate-900">{title}</h2>
                <p className="mt-2 text-sm text-slate-600">{message}</p>

                {/* Actions */}
                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    {actions.length > 0 ? (
                        actions.map((action, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    action.onClick();
                                    onClose();
                                }}
                                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                                    action.variant === 'primary'
                                        ? 'dd-primary-button'
                                        : action.variant === 'danger'
                                        ? 'dd-ghost-button border-rose-200 text-rose-600 hover:bg-rose-50'
                                        : 'dd-ghost-button'
                                }`}
                            >
                                {action.label}
                            </button>
                        ))
                    ) : (
                        <button
                            onClick={onClose}
                            className="dd-primary-button"
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
