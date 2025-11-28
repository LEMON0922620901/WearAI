import React, { useState, useEffect } from 'react';
import { User, Shirt, Sparkles, RefreshCw, Download, ArrowRight, ArrowLeft, Wand2, Lock, Quote, Moon, Sun } from 'lucide-react';
import { Step, ImageAsset, HistoryItem } from './types';
import { PRESET_PEOPLE, PRESET_CLOTHING } from './constants';
import { generateClothingImage, generateTryOnImage, urlToBase64, enhancePrompt, generateFashionCritique } from './services/geminiService';
import { AssetGrid } from './components/AssetGrid';
import { Button } from './components/Button';
import { StatusCard } from './components/StatusCard';
import { LoadingOverlay } from './components/LoadingOverlay';

// New WearAI Logo (Abstract Hanger/Infinity/Glass)
const Logo: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <path d="M24 8C20 8 18 12 18 12C14 16 8 18 8 22C8 26 12 28 14 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.9"/>
    <path d="M24 8C28 8 30 12 30 12C34 16 40 18 40 22C40 26 36 28 34 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.9"/>
    <path d="M14 28C16 32 20 38 24 38C28 38 32 32 34 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.7"/>
    <circle cx="24" cy="8" r="3" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    <path d="M24 16L24 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 4" strokeOpacity="0.5"/>
    <circle cx="24" cy="22" r="14" stroke="url(#logo_gradient)" strokeWidth="2" strokeOpacity="0.6"/>
    <defs>
      <linearGradient id="logo_gradient" x1="10" y1="10" x2="38" y2="38" gradientUnits="userSpaceOnUse">
        <stop stopColor="currentColor" stopOpacity="0"/>
        <stop offset="0.5" stopColor="currentColor"/>
        <stop offset="1" stopColor="currentColor" stopOpacity="0"/>
      </linearGradient>
    </defs>
  </svg>
);

const App: React.FC = () => {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // API Key State
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isCheckingKey, setIsCheckingKey] = useState<boolean>(true);

  // App State
  const [currentStep, setCurrentStep] = useState<Step>(Step.SelectPerson);
  const [people, setPeople] = useState<ImageAsset[]>(PRESET_PEOPLE);
  const [clothing, setClothing] = useState<ImageAsset[]>(PRESET_CLOTHING);
  
  const [selectedPerson, setSelectedPerson] = useState<ImageAsset | null>(null);
  const [selectedClothing, setSelectedClothing] = useState<ImageAsset | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [critique, setCritique] = useState<string | null>(null);
  
  const [prompt, setPrompt] = useState<string>('');
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize theme
  useEffect(() => {
    // Default to light mode as requested per "Light Blue" base
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
        setHasApiKey(true);
      }
      setIsCheckingKey(false);
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        setHasApiKey(true);
      } catch (e) {
        console.error("Failed to select key", e);
      }
    }
  };

  const handleUpload = (type: 'person' | 'clothing') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const newAsset: ImageAsset = {
        id: Date.now().toString(),
        url,
        label: type === 'person' ? '自選模特' : '自選服飾',
        isUserUploaded: true
      };

      if (type === 'person') {
        setPeople([newAsset, ...people]);
        setSelectedPerson(newAsset);
      } else {
        setClothing([newAsset, ...clothing]);
        setSelectedClothing(newAsset);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateClothing = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setIsEnhancing(true);
    setEnhancedPrompt(null);
    setErrorMsg(null);

    try {
      const optimizedPrompt = await enhancePrompt(prompt);
      setEnhancedPrompt(optimizedPrompt);
      setIsEnhancing(false);

      const generatedUrl = await generateClothingImage(optimizedPrompt);
      const newAsset: ImageAsset = {
        id: Date.now().toString(),
        url: generatedUrl,
        label: prompt, 
        isUserUploaded: false
      };
      setClothing([newAsset, ...clothing]);
      setSelectedClothing(newAsset);
      setPrompt('');
    } catch (err) {
      setErrorMsg('生成服裝失敗，請重試。');
      setIsEnhancing(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateTryOn = async () => {
    if (!selectedPerson || !selectedClothing) return;
    setIsGenerating(true);
    setCritique(null);
    setErrorMsg(null);
    setCurrentStep(Step.Result); 

    try {
      const personB64 = selectedPerson.url.startsWith('data:') 
        ? selectedPerson.url 
        : await urlToBase64(selectedPerson.url);
      
      const clothingB64 = selectedClothing.url.startsWith('data:') 
        ? selectedClothing.url 
        : await urlToBase64(selectedClothing.url);

      const [result, critiqueText] = await Promise.all([
        generateTryOnImage(personB64, clothingB64),
        generateFashionCritique(personB64, clothingB64)
      ]);

      setResultImage(result);
      setCritique(critiqueText);

      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        personUrl: selectedPerson.url,
        clothingUrl: selectedClothing.url,
        resultUrl: result,
        critique: critiqueText,
        timestamp: Date.now()
      };
      setHistory([newHistoryItem, ...history]);

    } catch (err: any) {
      console.error(err);
      let msg = '穿搭生成失敗，請稍後再試。';
      if (err.message && err.message.includes("Requested entity was not found")) {
         msg = "API Key 權限錯誤，請重新選擇付費專案的 Key。";
         setHasApiKey(false); 
      }
      setErrorMsg(msg);
      setCurrentStep(Step.SelectClothing);
    } finally {
      setIsGenerating(false);
    }
  };

  const resetFlow = () => {
    setSelectedClothing(null);
    setResultImage(null);
    setCritique(null);
    setEnhancedPrompt(null);
    setCurrentStep(Step.SelectPerson);
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setResultImage(item.resultUrl);
    setCritique(item.critique || null);
    setCurrentStep(Step.Result);
  };

  const renderStepContent = () => {
    if (isGenerating && currentStep === Step.Result) {
       return <LoadingOverlay message="AI 正在編織時尚，請稍候..." />;
    }

    switch (currentStep) {
      case Step.SelectPerson:
        return (
          <div className="space-y-6 md:space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-end gap-2 md:gap-4">
              <div>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white drop-shadow-sm font-sans">選擇您的模特</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1 md:mt-2 text-lg md:text-xl font-medium">開啟您的時尚之旅，Step 1</p>
              </div>
            </div>
            <AssetGrid 
              assets={people}
              selectedId={selectedPerson?.id}
              onSelect={setSelectedPerson}
              onUpload={handleUpload('person')}
              uploadLabel="上傳照片"
            />
            <div className="flex justify-end pt-4 md:pt-8">
              <Button 
                onClick={() => setCurrentStep(Step.SelectClothing)}
                disabled={!selectedPerson}
                className="w-full md:w-auto shadow-2xl text-lg px-8 md:px-10 py-4 md:py-5"
              >
                下一步：搭配服裝 <ArrowRight className="w-6 h-6" />
              </Button>
            </div>
          </div>
        );

      case Step.SelectClothing:
        return (
          <div className="space-y-6 md:space-y-8 animate-fade-in">
             <div className="flex flex-col md:flex-row justify-between items-end gap-2 md:gap-4">
              <div>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white drop-shadow-sm font-sans">挑選或創造服飾</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1 md:mt-2 text-lg md:text-xl font-medium">AI 靈感設計，Step 2</p>
              </div>
            </div>

            {/* AI Generator for Clothing */}
            <div className="glass-panel p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/60 dark:border-slate-600 shadow-lg">
              <label className="block text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Wand2 className="w-6 h-6 text-indigo-600 dark:text-blue-400" />
                AI 靈感工坊
              </label>
              <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-4">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="輸入靈感關鍵詞，例如：未來感銀色夾克..."
                  className="flex-1 px-5 py-4 md:px-6 md:py-5 bg-white/50 dark:bg-slate-800/50 border border-white/50 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-sky-200 dark:focus:ring-blue-800 focus:bg-white/90 dark:focus:bg-slate-800 focus:border-transparent outline-none transition-all placeholder:text-gray-500 dark:placeholder:text-slate-400 text-gray-900 dark:text-white text-base md:text-lg font-medium shadow-inner"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateClothing()}
                />
                <Button 
                  onClick={handleGenerateClothing}
                  disabled={!prompt.trim() || isGenerating}
                  variant="secondary"
                  isLoading={isGenerating && !resultImage}
                  className="w-full md:w-36 py-4 md:py-5 text-lg"
                >
                  {isEnhancing ? '優化中' : '生成'}
                </Button>
              </div>
              {enhancedPrompt && (
                <div className="text-sm text-gray-700 dark:text-slate-300 bg-white/40 dark:bg-slate-800/40 p-5 rounded-2xl border border-white/40 dark:border-slate-600 flex items-start gap-3 backdrop-blur-md">
                  <Sparkles className="w-5 h-5 mt-0.5 text-amber-500 shrink-0" />
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white mr-2">已優化指令:</span> 
                    <span className="italic">{enhancedPrompt}</span>
                  </div>
                </div>
              )}
            </div>

            <AssetGrid 
              assets={clothing}
              selectedId={selectedClothing?.id}
              onSelect={setSelectedClothing}
              onUpload={handleUpload('clothing')}
              uploadLabel="上傳服飾"
            />
            
            <div className="flex flex-col-reverse md:flex-row justify-between pt-4 md:pt-8 gap-4">
              <Button variant="outline" onClick={() => setCurrentStep(Step.SelectPerson)} className="w-full md:w-auto text-lg px-8 py-4">
                <ArrowLeft className="w-6 h-6" /> 上一步
              </Button>
              <Button 
                onClick={handleGenerateTryOn}
                disabled={!selectedClothing}
                className="w-full md:w-auto shadow-2xl text-lg px-8 md:px-10 py-4 md:py-5"
              >
                <Sparkles className="w-6 h-6" />
                生成穿搭
              </Button>
            </div>
          </div>
        );

      case Step.Result:
        return (
          <div className="space-y-6 md:space-y-10 animate-fade-in">
             <div className="flex flex-col md:flex-row justify-between items-end gap-2 md:gap-4">
              <div>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white drop-shadow-sm font-sans">您的專屬時刻</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1 md:mt-2 text-lg md:text-xl font-medium">完美搭配，Step 3</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
              {/* Result Image */}
              <div className="flex flex-col items-center">
                {resultImage ? (
                  <div className="relative w-full aspect-[3/4] glass-panel rounded-[2rem] md:rounded-[2.5rem] p-3 md:p-4 shadow-2xl mb-6 md:mb-8 ring-1 ring-white/60 dark:ring-white/10 group">
                     <div className="w-full h-full rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative bg-gray-100 dark:bg-slate-800">
                       <img src={resultImage} alt="Try-on Result" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                       <div className="absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/5 rounded-[1.5rem] md:rounded-[2rem] pointer-events-none"></div>
                     </div>
                  </div>
                ) : (
                  <div className="w-full aspect-[3/4] glass-panel rounded-[2.5rem] flex items-center justify-center text-gray-500 dark:text-gray-400">
                    準備中...
                  </div>
                )}
                <div className="flex gap-4 w-full">
                   <Button variant="secondary" className="flex-1 shadow-lg py-4 md:py-5 text-lg" onClick={() => {
                     if (!resultImage) return;
                     const link = document.createElement('a');
                     link.href = resultImage;
                     link.download = 'wearai-result.png';
                     link.click();
                   }}>
                     <Download className="w-6 h-6" /> 下載
                   </Button>
                   <Button className="flex-1 shadow-lg py-4 md:py-5 text-lg" onClick={resetFlow}>
                     <RefreshCw className="w-6 h-6" /> 再玩一次
                   </Button>
                </div>
              </div>

              {/* Critique Section */}
              <div className="flex flex-col gap-6 md:gap-8 justify-center">
                <div className="glass-panel p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-xl relative overflow-hidden border-t border-white/80 dark:border-slate-600">
                  <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 text-black dark:text-white">
                    <Quote size={140} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 md:mb-8 flex items-center gap-4 text-gray-900 dark:text-white font-sans">
                    <span className="w-2 h-8 md:h-10 bg-black dark:bg-white block rounded-full"></span>
                    AI 總編講評
                  </h3>
                  {critique ? (
                    <div className="space-y-4 md:space-y-6 relative z-10">
                      <p className="text-xl md:text-2xl leading-relaxed font-normal text-gray-800 dark:text-gray-100 font-sans tracking-wide">
                        "{critique}"
                      </p>
                      <div className="flex items-center justify-end gap-3 mt-4 md:mt-8">
                         <div className="h-px w-12 bg-gray-400 dark:bg-gray-500"></div>
                         <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">WearAI Editor</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40 animate-pulse text-gray-400 dark:text-gray-500 text-lg">
                      正在撰寫分析...
                    </div>
                  )}
                </div>

                {/* Source Images Review */}
                <div className="glass-panel p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/40 dark:border-slate-700">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-4 md:mb-6 uppercase tracking-widest text-center">Style Components</h4>
                  <div className="flex gap-4 md:gap-8 justify-center items-center">
                    {selectedPerson && (
                      <div className="w-20 md:w-28 aspect-[3/4] rounded-2xl overflow-hidden bg-white/50 dark:bg-slate-700 shadow-md ring-2 ring-white dark:ring-slate-500 hover:scale-105 transition-transform duration-300">
                        <img src={selectedPerson.url} alt="Person" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex items-center justify-center text-gray-400 dark:text-gray-600">
                      <div className="w-8 md:w-12 h-px bg-current opacity-30"></div>
                      <div className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-current opacity-50"></div>
                      <div className="w-8 md:w-12 h-px bg-current opacity-30"></div>
                    </div>
                    {selectedClothing && (
                      <div className="w-20 md:w-28 aspect-[3/4] rounded-2xl overflow-hidden bg-white/50 dark:bg-slate-700 shadow-md ring-2 ring-white dark:ring-slate-500 hover:scale-105 transition-transform duration-300">
                        <img src={selectedClothing.url} alt="Clothing" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  // API Key Selection Screen
  if (!isCheckingKey && !hasApiKey) {
    return (
       <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-8 relative overflow-hidden text-gray-900 dark:text-white">
          <div className="glass-panel p-10 md:p-16 rounded-[3rem] md:rounded-[4rem] shadow-2xl max-w-lg w-full flex flex-col items-center border-t border-white/80 dark:border-slate-600 relative z-10">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-white/40 to-white/10 dark:from-slate-700/40 dark:to-slate-800/10 backdrop-blur-xl rounded-full flex items-center justify-center mb-6 md:mb-8 shadow-inner ring-1 ring-white/60 dark:ring-white/20 text-gray-900 dark:text-white">
               <Logo />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 font-sans tracking-tight">WearAI</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8 md:mb-10 leading-relaxed text-lg md:text-xl font-medium">
              探索未來穿搭體驗。<br/>
              使用頂級 Gemini Pro Image 模型，<br/>
              將想像化為觸手可及的現實。
            </p>
            <Button onClick={handleSelectKey} className="w-full shadow-xl py-4 md:py-5 text-lg md:text-xl rounded-2xl">
              <Lock className="w-6 h-6" />
              連結 API Key 開始體驗
            </Button>
          </div>
       </div>
    );
  }

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-200 dark:selection:bg-blue-900 pb-20 overflow-x-hidden transition-colors duration-500">
      {/* Header */}
      <header className="sticky top-0 z-40 transition-all duration-300 py-4 px-4 md:py-6 md:px-6">
        <div className="max-w-7xl mx-auto glass-panel rounded-full px-4 md:px-8 h-20 md:h-24 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3 md:gap-4 cursor-pointer group text-gray-900 dark:text-white" onClick={resetFlow}>
            <div className="transition-transform group-hover:rotate-180 duration-1000 scale-75 md:scale-100">
               <Logo />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-sans">WearAI</h1>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
             <Button variant="icon" onClick={toggleTheme} className="text-gray-800 dark:text-white">
                {isDarkMode ? <Sun className="w-5 h-5 md:w-6 md:h-6" /> : <Moon className="w-5 h-5 md:w-6 md:h-6" />}
             </Button>
            <span className="hidden md:block text-sm font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase">WearAI</span>
            <div className="px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-black/90 dark:bg-white/90 text-white dark:text-black text-[10px] md:text-xs font-bold shadow-lg tracking-wide border border-white/20">BETA</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 relative z-10">
        
        {/* Error Message */}
        {errorMsg && (
          <div className="mb-6 md:mb-10 p-4 md:p-6 glass-panel border-l-8 border-red-500 rounded-r-2xl flex items-center justify-between animate-fade-in shadow-xl bg-white/70 dark:bg-slate-800/80">
            <div className="flex items-center gap-4 text-red-700 dark:text-red-400">
              <span className="font-bold text-lg">提示</span>
              <span className="text-base font-bold opacity-90">{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-sm font-bold text-red-500 hover:text-red-700 dark:hover:text-red-300 transition-colors bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">關閉</button>
          </div>
        )}

        {/* Top Visual Indicators - Cards */}
        {/* Mobile: Horizontal Scroll, Desktop: Grid */}
        <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-12 mb-8 md:mb-16 overflow-x-auto pb-6 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide snap-x">
          <div className="min-w-[70vw] md:min-w-0 snap-center">
            <StatusCard 
              stepNumber={1} 
              title="選擇模特兒" 
              subtitle="Choose Model"
              imageUrl={selectedPerson?.url}
              isActive={currentStep === Step.SelectPerson}
              isCompleted={!!selectedPerson}
              icon={User}
              onClick={() => !isGenerating && setCurrentStep(Step.SelectPerson)}
            />
          </div>
          <div className="min-w-[70vw] md:min-w-0 snap-center">
            <StatusCard 
              stepNumber={2} 
              title="搭配服裝" 
              subtitle="Pick Outfit"
              imageUrl={selectedClothing?.url}
              isActive={currentStep === Step.SelectClothing}
              isCompleted={!!selectedClothing}
              icon={Shirt}
              onClick={() => !isGenerating && selectedPerson && setCurrentStep(Step.SelectClothing)}
            />
          </div>
          <div className="min-w-[70vw] md:min-w-0 snap-center">
            <StatusCard 
              stepNumber={3} 
              title="生成穿搭" 
              subtitle="WearAI Look"
              imageUrl={resultImage || undefined}
              isActive={currentStep === Step.Result}
              isCompleted={!!resultImage}
              icon={Sparkles}
            />
          </div>
        </div>

        {/* Interaction Area */}
        <div className="relative min-h-[500px]">
           {renderStepContent()}
        </div>

        {/* Gallery */}
        {history.length > 0 && (
          <div className="mt-20 md:mt-32 pt-8 md:pt-12 border-t border-white/30 dark:border-slate-700">
            <h3 className="text-2xl md:text-3xl font-extrabold mb-6 md:mb-10 text-gray-800 dark:text-gray-100 drop-shadow-sm px-2 md:px-4 font-sans">歷史穿搭</h3>
            <div className="flex gap-4 md:gap-8 overflow-x-auto pb-10 scrollbar-hide px-2 md:px-4 -mx-2 md:-mx-4">
              {history.map((item) => (
                <div key={item.id} className="flex-shrink-0 w-40 md:w-64 aspect-[3/4] glass-panel rounded-[2rem] p-3 relative group cursor-pointer hover:scale-105 transition-transform duration-500"
                     onClick={() => loadHistoryItem(item)}>
                  <div className="w-full h-full rounded-[1.5rem] overflow-hidden shadow-inner">
                    <img src={item.resultUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" alt="Generated history" />
                  </div>
                  <div className="absolute inset-0 rounded-[2rem] bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/50" />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      
      <footer className="py-8 md:py-12 text-center text-xs md:text-sm text-gray-600/60 dark:text-gray-400/60 font-bold">
        <p>Designed for WearAI &bull; Powered by Google Gemini 3 Pro</p>
      </footer>
    </div>
  );
};

export default App;