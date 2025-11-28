import React from 'react';
import { ImageAsset } from '../types';
import { Check, Upload } from 'lucide-react';

interface AssetGridProps {
  assets: ImageAsset[];
  selectedId?: string;
  onSelect: (asset: ImageAsset) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadLabel?: string;
}

export const AssetGrid: React.FC<AssetGridProps> = ({ 
  assets, 
  selectedId, 
  onSelect, 
  onUpload,
  uploadLabel = "上傳照片"
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {/* Upload Button */}
      <label className="aspect-[3/4] glass-panel rounded-3xl border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-sky-400 dark:hover:border-blue-400 hover:bg-white/40 dark:hover:bg-slate-800/40 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group hover:scale-[1.02] shadow-sm hover:shadow-xl">
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={onUpload}
        />
        <div className="p-4 rounded-full bg-white/60 dark:bg-slate-700/60 backdrop-blur-md group-hover:scale-110 transition-transform mb-3 shadow-inner">
          <Upload className="w-7 h-7 text-gray-700 dark:text-gray-200" strokeWidth={2} />
        </div>
        <span className="text-base font-bold text-gray-700 dark:text-gray-300 group-hover:text-sky-600 dark:group-hover:text-blue-400 transition-colors">{uploadLabel}</span>
      </label>

      {/* Preset/Generated Assets */}
      {assets.map((asset) => (
        <div 
          key={asset.id}
          onClick={() => onSelect(asset)}
          className={`relative aspect-[3/4] cursor-pointer group rounded-3xl overflow-hidden transition-all duration-500 ease-out shadow-lg ${
            selectedId === asset.id 
              ? 'ring-4 ring-sky-400 dark:ring-blue-500 ring-offset-2 ring-offset-transparent scale-[1.02] shadow-2xl z-10' 
              : 'hover:scale-[1.02] opacity-90 hover:opacity-100'
          }`}
        >
          <img 
            src={asset.url} 
            alt={asset.label}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
          
          {selectedId === asset.id && (
            <div className="absolute top-3 right-3 bg-sky-500 text-white p-1.5 rounded-full shadow-lg animate-fade-in ring-2 ring-white/50">
              <Check className="w-5 h-5" strokeWidth={3} />
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
             <div className="glass-panel bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl px-3 py-2 inline-block border-0">
               <p className="text-gray-900 dark:text-white text-xs font-extrabold truncate tracking-wide">{asset.label}</p>
             </div>
          </div>
        </div>
      ))}
    </div>
  );
};