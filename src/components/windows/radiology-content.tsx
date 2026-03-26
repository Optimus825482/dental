"use client";

import { useState } from "react";

export function RadiologyContent() {
  return (
    <div className="flex flex-col h-full bg-[#1A1C1E] text-white">
      {/* Dark Theme Header for Diagnotic Imaging */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#121315]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">view_timeline</span>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-100">Radyoloji & Görüntüleme</h2>
            <p className="text-xs text-gray-400">Gelişmiş DICOM ve X-Ray inceleme paneli</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700 tooltip">
            <span className="material-symbols-outlined text-[18px] text-gray-300">upload_file</span>
          </button>
          <button className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-500 transition-colors">
            Yeni Görüntü Yükle
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Patients / Exams List */}
        <div className="w-72 border-r border-gray-800 bg-[#121315] flex flex-col">
          <div className="p-3 border-b border-gray-800">
            <input type="text" placeholder="Hasta no, T.C. veya Ad..." className="w-full bg-[#1A1C1E] border border-gray-700 p-2 text-sm rounded-lg text-gray-200 focus:outline-none focus:border-cyan-500 placeholder-gray-500" />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`p-3 rounded-xl cursor-pointer transition-all ${i === 1 ? 'bg-cyan-900/40 border border-cyan-800/50' : 'bg-[#1A1C1E] border border-gray-800 hover:border-gray-600'}`}>
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-semibold">{i === 1 ? 'Ayşe Yılmaz' : (i === 2 ? 'Kemal Kara' : 'Fatma Demir')}</p>
                  <span className="text-[10px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">Panoramik</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">Çekim: {20-i} Mar 2026, 14:30</p>
                {i === 1 && (
                  <div className="w-full h-24 bg-black rounded-lg border border-gray-700 relative overflow-hidden flex items-center justify-center">
                    <span className="material-symbols-outlined text-gray-600 text-4xl">broken_image</span>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Viewing Area */}
        <div className="flex-1 flex flex-col bg-black relative">
          {/* Toolbar overlay */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gray-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-gray-700/50 z-10 shadow-lg">
            <button className="p-2 hover:bg-gray-800 rounded-xl text-gray-300 hover:text-white transition-colors"><span className="material-symbols-outlined">zoom_in</span></button>
            <button className="p-2 hover:bg-gray-800 rounded-xl text-gray-300 hover:text-white transition-colors"><span className="material-symbols-outlined">contrast</span></button>
            <button className="p-2 hover:bg-gray-800 rounded-xl text-gray-300 hover:text-white transition-colors"><span className="material-symbols-outlined">invert_colors</span></button>
            <div className="w-px h-6 bg-gray-700 mx-1"></div>
            <button className="p-2 hover:bg-gray-800 rounded-xl text-gray-300 hover:text-white transition-colors"><span className="material-symbols-outlined">straighten</span></button>
            <button className="p-2 hover:bg-gray-800 rounded-xl text-gray-300 hover:text-white transition-colors"><span className="material-symbols-outlined">draw</span></button>
            <button className="p-2 bg-cyan-600/20 text-cyan-400 rounded-xl transition-colors"><span className="material-symbols-outlined">save</span></button>
          </div>
          
          {/* Image Canvas */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full h-full border border-gray-800 rounded-xl bg-gray-900 flex items-center justify-center relative shadow-2xl overflow-hidden">
               <span className="material-symbols-outlined text-gray-800 text-9xl">broken_image</span>
               <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black to-transparent flex justify-between text-xs text-gray-400 font-mono">
                  <span>P: Ayşe Yılmaz | ID: 1928374</span>
                  <span>M: Panoramik X-Ray | KvP: 70</span>
               </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Meta & Notes */}
        <div className="w-64 border-l border-gray-800 bg-[#121315] p-4 flex flex-col text-sm">
          <h3 className="font-semibold text-gray-200 mb-4 text-xs tracking-wider uppercase">Analiz Notları</h3>
          <textarea className="w-full flex-1 bg-[#1A1C1E] border border-gray-700 rounded-xl p-3 text-sm text-gray-300 focus:outline-none focus:border-cyan-500 resize-none" placeholder="Hekim görüşü veya radyoloji uzmanı notları buraya girilir..."></textarea>
          <div className="mt-4 flex flex-col gap-2">
            <button className="w-full py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 font-medium hover:bg-gray-700 transition">Paylaş / Gönder</button>
            <button className="w-full py-2 bg-cyan-600 rounded-lg text-white font-medium hover:bg-cyan-500 transition">Notları Kaydet</button>
          </div>
        </div>
      </div>
    </div>
  );
}
