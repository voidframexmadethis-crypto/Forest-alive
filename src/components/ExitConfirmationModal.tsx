import React from 'react';
import { AlertTriangle, LogOut } from 'lucide-react';

interface ExitConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

export const ExitConfirmationModal: React.FC<ExitConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title = 'LEAVE MULTIPLAYER',
  message = 'Are you sure you want to leave multiplayer?'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none font-['Plus_Jakarta_Sans'] pointer-events-auto">
      <div className="bg-neutral-950 border border-red-600/60 rounded-2xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(220,38,38,0.35)] space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-950/90 border border-red-600/50 flex items-center justify-center text-red-500 shrink-0 shadow-inner">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-['Chakra_Petch'] text-white tracking-wider">
              {title}
            </h3>
            <p className="text-xs text-neutral-400 font-mono">
              Forest Alive Squad Operations
            </p>
          </div>
        </div>

        <p className="text-sm text-neutral-200 leading-relaxed font-sans">
          {message}
        </p>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-600 text-neutral-300 hover:text-white font-['Chakra_Petch'] text-xs font-bold tracking-wider transition-all min-h-[48px] cursor-pointer flex items-center justify-center active:scale-95"
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3.5 px-4 rounded-xl bg-red-700 hover:bg-red-600 border border-red-500 text-white font-['Chakra_Petch'] text-xs font-extrabold tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all min-h-[48px] flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <LogOut className="w-4 h-4" /> YES, LEAVE
          </button>
        </div>
      </div>
    </div>
  );
};
