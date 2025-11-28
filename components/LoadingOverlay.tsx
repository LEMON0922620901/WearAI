import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <div className="absolute inset-0 z-50 bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center rounded-[2.5rem] border border-white/20 dark:border-slate-700">
      <div className="p-10 rounded-3xl bg-white/70 dark:bg-slate-800/80 shadow-2xl flex flex-col items-center animate-fade-in border border-white/40 dark:border-slate-600">
        <Loader2 className="w-14 h-14 text-black dark:text-white animate-spin mb-6" />
        <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
};