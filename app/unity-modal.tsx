"use client";

import { useState } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";

export function UnityModal() {
  const [isOpen, setIsOpen] = useState(false);

  // Unity WebGL context targeting standard builds in /unity folder
  const { unityProvider, isLoaded, loadingProgression } = useUnityContext({
    loaderUrl: "/unity/Build.loader.js",
    dataUrl: "/unity/Build.data",
    frameworkUrl: "/unity/Build.framework.js",
    codeUrl: "/unity/Build.wasm",
  });

  return (
    <>
      {/* Floating Unity Launcher Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/30 transition-all transform hover:scale-105"
      >
        <span className="text-xl">🎮</span>
        <span>Launch Unity WebGL</span>
      </button>

      {/* Unity WebGL Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🕹️</span>
                <h3 className="text-lg font-bold text-white tracking-wide">Unity 3D Engine Showcase</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Unity Viewport Container */}
            <div className="relative w-full h-[500px] bg-black flex items-center justify-center">
              {!isLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-white gap-4 z-10">
                  <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-300 text-sm font-medium">
                    Loading Unity Environment... {Math.round(loadingProgression * 100)}%
                  </p>
                  <p className="text-slate-500 text-xs max-w-md text-center px-4">
                    Place exported WebGL builds in <code className="text-cyan-400">/public/unity/</code> to render interactive 3D experiences.
                  </p>
                </div>
              )}
              <Unity
                unityProvider={unityProvider}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
