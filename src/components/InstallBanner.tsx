"use client";
import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    
    if (isAppleDevice && !isStandalone) {
      setIsIos(true);
      setShowBanner(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  async function handleInstallClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  }

  if (!showBanner) return null;

  return (
    <div className="fixed top-3 left-3 right-3 z-[9999] max-w-md mx-auto bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 rounded-2xl shadow-2xl border border-blue-400/30 flex items-center justify-between gap-3 animate-in slide-in-from-top-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center font-black text-lg">
          📱
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">Instalar App SAAT</p>
          <p className="text-xs text-blue-100 mt-0.5">
            {isIos ? "Toque em Compartilhar e 'Adicionar à Tela de Início'" : "Instale no seu celular para acesso rápido"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {!isIos && deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="bg-white text-blue-700 text-xs font-bold px-3 py-2 rounded-xl shadow-md active:scale-95 transition flex items-center gap-1 whitespace-nowrap"
          >
            <Download size={14} /> Instalar
          </button>
        )}
        <button
          onClick={() => setShowBanner(false)}
          className="p-1.5 text-blue-200 hover:text-white rounded-lg"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}