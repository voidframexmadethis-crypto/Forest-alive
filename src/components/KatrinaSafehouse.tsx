import React from 'react';
import { Heart, MessageCircle, Baby, ShieldAlert } from 'lucide-react';
import { soundEngine } from '../game/audio';

interface KatrinaSafehouseProps {
  isPostLabor: boolean;
  onClose: () => void;
}

export const KatrinaSafehouse: React.FC<KatrinaSafehouseProps> = ({ isPostLabor, onClose }) => {
  const [dialogue, setDialogue] = React.useState<string>(
    isPostLabor ? "I'm tired, but the little one is safe. You need to keep going." : "I'm doing okay. Just waiting for the right moment."
  );

  const handleInteract = () => {
    soundEngine.playMechanicalClick();
    const options = isPostLabor 
      ? ["Rest well, Katrina.", "How is the baby?", "We're holding them back for you."]
      : ["Keep staying safe.", "Need any help?", "We'll be back soon."];
    setDialogue(options[Math.floor(Math.random() * options.length)]);
  };

  return (
    <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm p-6 flex flex-col justify-center items-center">
      <div className="bg-neutral-900 border border-emerald-900 rounded-2xl p-6 max-w-sm w-full space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-950/50 rounded-full flex items-center justify-center text-emerald-400">
            {isPostLabor ? <Baby className="w-6 h-6" /> : <Heart className="w-6 h-6" />}
          </div>
          <h3 className="text-lg font-bold font-['Chakra_Petch'] text-emerald-400">
            {isPostLabor ? "Katrina & Baby" : "Katrina"}
          </h3>
        </div>
        <p className="text-sm text-neutral-300 font-mono italic">"{dialogue}"</p>
        <div className="flex gap-2">
          <button onClick={handleInteract} className="flex-1 px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-emerald-100 rounded-lg text-xs font-bold">
            <MessageCircle className="w-3.5 h-3.5 inline mr-1" /> Talk
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold">
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};
