import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'glass' | 'icon';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyles = "px-6 py-3.5 text-base font-bold rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95";
  
  const variants = {
    primary: "bg-gray-900 text-white hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-500 border border-transparent shadow-lg shadow-gray-900/20 dark:shadow-blue-900/30",
    secondary: "bg-white/80 text-gray-900 hover:bg-white dark:bg-slate-800/80 dark:text-white dark:hover:bg-slate-700 border border-white/50 dark:border-slate-600 backdrop-blur-md shadow-sm",
    outline: "border-2 border-gray-900/10 text-gray-900 hover:border-gray-900/30 hover:bg-gray-900/5 dark:border-white/10 dark:text-white dark:hover:border-white/30 dark:hover:bg-white/5 bg-transparent",
    glass: "bg-white/20 text-gray-900 dark:text-white hover:bg-white/40 dark:hover:bg-slate-800/40 border border-white/40 dark:border-white/20 backdrop-blur-xl shadow-xl hover:shadow-2xl",
    icon: "p-2 bg-transparent hover:bg-black/5 dark:hover:bg-white/10 rounded-full border-0 !px-2 !py-2"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          處理中...
        </>
      ) : children}
    </button>
  );
};