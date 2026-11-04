import React from 'react';

export const EndCredits: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center text-white font-mono p-10 animate-fade-in">
      <h1 className="text-4xl font-extrabold font-['Chakra_Petch'] text-red-600 mb-8 tracking-widest">FOREST ALIVE</h1>
      <div className="space-y-4 text-center text-sm text-neutral-400">
        <p>A Survival Experience by AI Studio</p>
        <p>Lead Developer: AI Engineer</p>
        <p>Art Direction: AI Vision</p>
        <p>Multiplayer Engine: Network Core</p>
        <p className="pt-10 font-bold text-white">Thank you for surviving the forest.</p>
      </div>
      <button 
        onClick={onComplete}
        className="mt-12 px-6 py-2 bg-neutral-900 border border-neutral-700 hover:border-white transition-all text-xs"
      >
        RETURN TO MENU
      </button>
    </div>
  );
};
