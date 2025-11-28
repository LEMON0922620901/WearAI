import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatusCardProps {
  stepNumber: number;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  isActive: boolean;
  isCompleted: boolean;
  icon: LucideIcon;
  onClick?: () => void;
}

export const StatusCard: React.FC<StatusCardProps> = ({ 
  stepNumber, 
  title, 
  subtitle,
  imageUrl, 
  isActive, 
  isCompleted,
  icon: Icon,
  onClick
}) => {
  const stepMap = ["", "第一步", "第二步", "第三步"];
  const stepText = stepMap[stepNumber] || `Step ${stepNumber}`;

  return (
    <div 
      onClick={onClick}
      className={`relative rounded-[2rem] overflow-hidden aspect-[3/4] transition-all duration-500 cubic-bezier(0.25, 0.8, 0.25, 1) ${
        isActive 
          ? 'shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-10 border-opacity-100' 
          : 'opacity-80 hover:opacity-100 cursor-pointer hover:shadow-xl'
      } glass-panel group`}
    >
      {/* Background Image or Placeholder */}
      {imageUrl ? (
        <img src={imageUrl} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-white/40 to-white/10 dark:from-slate-800/40 dark:to-slate-900/10 backdrop-blur-3xl transition-colors duration-500">
          <div className="p-6 rounded-full bg-white/30 dark:bg-slate-700/30 mb-4 border border-white/40 dark:border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.5)]">
             <Icon className="w-10 h-10 text-gray-700 dark:text-gray-200" strokeWidth={2} />
          </div>
        </div>
      )}
      
      {/* Liquid Glass Overlay Gradient when active */}
      {isActive && <div className="absolute inset-0 bg-gradient-to-t from-sky-100/50 via-transparent to-transparent dark:from-blue-900/40 pointer-events-none" />}

      {/* Floating Info Capsule - HIGH CONTRAST */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className={`flex flex-col p-5 rounded-2xl 
          bg-white/90 dark:bg-slate-900/90 
          backdrop-blur-xl border border-white/60 dark:border-slate-700/50 
          shadow-lg 
          ${isActive ? 'opacity-100' : 'opacity-95'} 
          transition-all duration-500`}>
          
          <div className="flex items-center gap-2 mb-1.5">
             <div className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase ${
                isActive 
                  ? 'bg-black text-white dark:bg-blue-600' 
                  : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
             }`}>
               {stepText}
             </div>
             {isCompleted && <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>}
          </div>
          <span className="font-bold text-lg text-gray-900 dark:text-white tracking-tight leading-tight">{title}</span>
          {subtitle && <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
};