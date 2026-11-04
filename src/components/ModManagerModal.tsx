import React, { useRef, useState } from 'react';
import { ModManager, ModPackage, GunModConfig, SAMPLE_MODS } from '../game/modManager';
import { Upload, FolderPlus, Download, Trash2, CheckCircle, AlertCircle, Plus, FileCode, Box, Music, Sparkles, X, ToggleLeft, ToggleRight, Crosshair, Zap, ShieldAlert, Cpu } from 'lucide-react';
import { soundEngine } from '../game/audio';

interface ModManagerModalProps {
  onClose: () => void;
  onModsUpdated?: () => void;
}

export const ModManagerModal: React.FC<ModManagerModalProps> = ({ onClose, onModsUpdated }) => {
  const [activeTab, setActiveTab] = useState<'installed' | 'create'>('installed');
  const [installedMods, setInstalledMods] = useState<ModPackage[]>(ModManager.getInstalledMods());
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for custom gun creator
  const [gunName, setGunName] = useState<string>('PLASMA OBLITERATOR 9000');
  const [gunCategory, setGunCategory] = useState<string>('Custom Heavy Energy');
  const [gunDamage, setGunDamage] = useState<number>(350);
  const [gunFireRate, setGunFireRate] = useState<number>(100);
  const [gunClipSize, setGunClipSize] = useState<number>(50);
  const [gunColor, setGunColor] = useState<string>('#00ffcc');
  const [gunSound, setGunSound] = useState<string>('tank_turret');
  const [gunDesc, setGunDesc] = useState<string>('Custom crafted gun mod created right in the Mod Engine.');

  const refreshList = () => {
    const list = ModManager.getInstalledMods();
    setInstalledMods([...list]);
    if (onModsUpdated) onModsUpdated();
  };

  const triggerFileInput = () => {
    soundEngine.playMechanicalClick();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      soundEngine.playReloadSound();
      const imported = await ModManager.importFile(file);
      setNotification({
        type: 'success',
        message: `Successfully imported "${imported.name}" from ${file.name}!`
      });
      refreshList();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to parse mod file. Ensure it is a valid JSON, GLB 3D model, or audio file.'
      });
    }

    // Reset input so same file can be chosen again if needed
    e.target.value = '';
  };

  const handleToggleMod = (modId: string) => {
    soundEngine.playMechanicalClick();
    ModManager.toggleMod(modId);
    refreshList();
  };

  const handleDeleteMod = (modId: string) => {
    soundEngine.playMechanicalClick();
    ModManager.deleteMod(modId);
    setNotification({ type: 'success', message: 'Mod removed successfully.' });
    refreshList();
  };

  const handleExportMod = (pkg: ModPackage) => {
    soundEngine.playMechanicalClick();
    ModManager.exportModToJSON(pkg);
    setNotification({ type: 'success', message: `Exported "${pkg.name}" to downloadable .json mod file!` });
  };

  const handleInstallSampleMod = (pkg: ModPackage) => {
    soundEngine.playReloadSound();
    ModManager.addModPackage({ ...pkg, id: `mod_${Date.now()}_${pkg.id}` });
    setNotification({ type: 'success', message: `Installed sample mod "${pkg.name}"!` });
    refreshList();
  };

  const handleCreateCustomGun = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playVictoryFanfare();

    const customId = `mod_custom_${Date.now()}`;
    const newPkg: ModPackage = {
      id: `pkg_${customId}`,
      name: gunName,
      author: 'In-Game Mod Creator',
      version: '1.0.0',
      description: gunDesc,
      dateAdded: new Date().toISOString().split('T')[0],
      enabled: true,
      guns: [{
        id: customId,
        name: gunName,
        category: gunCategory,
        damage: Number(gunDamage),
        fireRate: Number(gunFireRate),
        clipSize: Number(gunClipSize),
        totalReserve: Number(gunClipSize) * 10,
        reloadTime: 1400,
        recoil: 0.02,
        adsZoom: 0.75,
        soundName: gunSound,
        description: gunDesc,
        colorHex: gunColor,
        laserColorHex: gunColor,
        isCustomMod: true
      }]
    };

    ModManager.addModPackage(newPkg);
    setNotification({ type: 'success', message: `Successfully created and imported "${gunName}" into your loadout!` });
    refreshList();
    setActiveTab('installed');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-sans animate-fade-in">
      {/* Hidden File Input for Device Files App / Windows File Explorer */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".json,.glb,.gltf,.png,.jpg,.mp3,.wav" 
        className="hidden" 
      />

      <div className="relative w-full max-w-4xl max-h-[90vh] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-[0_0_80px_rgba(220,38,38,0.2)] flex flex-col overflow-hidden text-neutral-100">
        
        {/* Header Bar */}
        <div className="p-6 bg-neutral-900/80 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/20 border border-red-500/40 rounded-xl text-red-500">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider font-['Chakra_Petch'] text-white flex items-center gap-2">
                MODDING ENGINE & FILE IMPORTER
                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-mono font-bold">V2.5 UNLOCKED</span>
              </h1>
              <p className="text-xs text-neutral-400 font-mono">
                Import custom gun mods, 3D models (.glb), and audio files from your Files app or Windows Explorer.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Import Action Banner */}
        <div className="p-4 bg-gradient-to-r from-red-950/40 via-neutral-900/60 to-neutral-950 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-300">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>SUPPORTED FILE FORMATS: <strong className="text-amber-400">.JSON</strong> (Gun Mod Configs), <strong className="text-cyan-400">.GLB / .GLTF</strong> (3D Models), <strong className="text-purple-400">.MP3 / .WAV</strong> (Sounds)</span>
          </div>

          <button
            onClick={triggerFileInput}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-900/30 transition-all transform hover:scale-105"
          >
            <Upload className="w-4 h-4" />
            <span>📥 IMPORT MOD FILE FROM DEVICE</span>
          </button>
        </div>

        {/* Notification Alert */}
        {notification && (
          <div className={`px-6 py-3 text-xs font-mono flex items-center justify-between ${
            notification.type === 'success' ? 'bg-emerald-950/80 border-b border-emerald-800 text-emerald-300' : 'bg-red-950/80 border-b border-red-800 text-red-300'
          }`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="underline hover:text-white text-[10px]">DISMISS</button>
          </div>
        )}

        {/* Tab Selector Header */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/40 shrink-0">
          <button
            onClick={() => { setActiveTab('installed'); soundEngine.playMechanicalClick(); }}
            className={`flex-1 py-3 px-6 text-xs font-bold font-['Chakra_Petch'] tracking-wider uppercase transition-colors flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'installed' ? 'border-red-500 bg-neutral-900/80 text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FolderPlus className="w-4 h-4" /> INSTALLED MODS ({installedMods.length})
          </button>

          <button
            onClick={() => { setActiveTab('create'); soundEngine.playMechanicalClick(); }}
            className={`flex-1 py-3 px-6 text-xs font-bold font-['Chakra_Petch'] tracking-wider uppercase transition-colors flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'create' ? 'border-red-500 bg-neutral-900/80 text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Plus className="w-4 h-4" /> GUN MOD CREATOR ENGINE
          </button>
        </div>

        {/* Content Body Scroll Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {activeTab === 'installed' && (
            <div className="space-y-6">
              
              {/* Installed Mod Cards List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold tracking-widest text-neutral-400 uppercase font-['Chakra_Petch'] flex items-center gap-2">
                  <Box className="w-4 h-4 text-red-500" /> Active Mod Packages
                </h3>

                {installedMods.length === 0 ? (
                  <div className="p-8 text-center bg-neutral-900/50 border border-dashed border-neutral-800 rounded-xl space-y-3">
                    <FileCode className="w-8 h-8 text-neutral-600 mx-auto" />
                    <p className="text-sm font-semibold text-neutral-400">No Mods Currently Installed</p>
                    <p className="text-xs text-neutral-500 font-mono">Click "Import Mod File" above to load `.json` or `.glb` files from your Files app or Windows Explorer.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {installedMods.map((mod) => (
                      <div 
                        key={mod.id} 
                        className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                          mod.enabled ? 'bg-neutral-900/80 border-neutral-700 shadow-md' : 'bg-neutral-950/50 border-neutral-900 opacity-60'
                        }`}
                      >
                        <div className="space-y-1.5 max-w-xl">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-white font-['Chakra_Petch']">{mod.name}</h4>
                            <span className="text-[10px] bg-neutral-800 text-neutral-300 font-mono px-2 py-0.5 rounded">v{mod.version}</span>
                            <span className="text-[10px] bg-red-950 text-red-400 border border-red-800 font-mono px-2 py-0.5 rounded">by {mod.author}</span>
                          </div>
                          <p className="text-xs text-neutral-400 leading-relaxed">{mod.description}</p>
                          
                          {/* Guns contained in mod */}
                          {mod.guns && mod.guns.length > 0 && (
                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              {mod.guns.map(g => (
                                <span key={g.id} className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-amber-300 border border-neutral-700 flex items-center gap-1">
                                  <Crosshair className="w-3 h-3 text-red-400" /> {g.name} (DMG: {g.damage})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                          <button
                            onClick={() => handleToggleMod(mod.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                              mod.enabled ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-600/30' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                          >
                            {mod.enabled ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4" />}
                            <span>{mod.enabled ? 'ENABLED' : 'DISABLED'}</span>
                          </button>

                          <button
                            onClick={() => handleExportMod(mod)}
                            title="Export Mod JSON File"
                            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteMod(mod.id)}
                            title="Delete Mod"
                            className="p-2 bg-neutral-800 hover:bg-red-900/60 text-neutral-400 hover:text-red-300 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sample Mod Store Preset Cards */}
              <div className="space-y-3 pt-4 border-t border-neutral-800">
                <h3 className="text-xs font-bold tracking-widest text-neutral-400 uppercase font-['Chakra_Petch'] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" /> 1-Click Sample Gun Mod Library
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {SAMPLE_MODS.map((sample) => {
                    const isAlreadyInstalled = installedMods.some(m => m.name === sample.name);
                    return (
                      <div key={sample.id} className="p-4 bg-neutral-900/40 border border-neutral-800/80 rounded-xl space-y-3 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h4 className="font-bold text-xs text-amber-300 font-['Chakra_Petch']">{sample.name}</h4>
                          <p className="text-[11px] text-neutral-400 leading-snug">{sample.description}</p>
                        </div>

                        <button
                          onClick={() => handleInstallSampleMod(sample)}
                          className="w-full py-2 bg-neutral-800 hover:bg-amber-600 text-neutral-200 hover:text-white text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 uppercase font-mono"
                        >
                          <Plus className="w-3.5 h-3.5" /> {isAlreadyInstalled ? 'INSTALL AGAIN' : 'INSTALL SAMPLE MOD'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreateCustomGun} className="space-y-6 max-w-2xl mx-auto">
              <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-xl flex items-center gap-3">
                <Zap className="w-6 h-6 text-amber-400 shrink-0" />
                <p className="text-xs text-neutral-300 leading-relaxed font-mono">
                  Build your custom gun mod parameters below. When saved, it will be injected into the game's weapon arsenal and stored in your mod manager.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300 uppercase font-mono">Weapon Name</label>
                  <input 
                    type="text" 
                    value={gunName} 
                    onChange={(e) => setGunName(e.target.value)} 
                    required 
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white font-mono focus:border-red-500 focus:outline-none" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300 uppercase font-mono">Category Tag</label>
                  <input 
                    type="text" 
                    value={gunCategory} 
                    onChange={(e) => setGunCategory(e.target.value)} 
                    required 
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white font-mono focus:border-red-500 focus:outline-none" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300 uppercase font-mono">Damage per Shot ({gunDamage})</label>
                  <input 
                    type="range" 
                    min="20" 
                    max="1500" 
                    step="10" 
                    value={gunDamage} 
                    onChange={(e) => setGunDamage(Number(e.target.value))} 
                    className="w-full accent-red-500" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300 uppercase font-mono">Fire Rate ms ({gunFireRate}ms)</label>
                  <input 
                    type="range" 
                    min="15" 
                    max="1000" 
                    step="5" 
                    value={gunFireRate} 
                    onChange={(e) => setGunFireRate(Number(e.target.value))} 
                    className="w-full accent-red-500" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300 uppercase font-mono">Magazine Clip Size ({gunClipSize})</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="999" 
                    value={gunClipSize} 
                    onChange={(e) => setGunClipSize(Number(e.target.value))} 
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white font-mono focus:border-red-500 focus:outline-none" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300 uppercase font-mono">Primary Color Glow</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={gunColor} 
                      onChange={(e) => setGunColor(e.target.value)} 
                      className="w-10 h-9 bg-neutral-900 border border-neutral-800 rounded cursor-pointer" 
                    />
                    <input 
                      type="text" 
                      value={gunColor} 
                      onChange={(e) => setGunColor(e.target.value)} 
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white font-mono" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-neutral-300 uppercase font-mono">Gunshot Sound Audio</label>
                  <select 
                    value={gunSound} 
                    onChange={(e) => setGunSound(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white font-mono focus:border-red-500 focus:outline-none"
                  >
                    <option value="m4a1">M4A1 Assault Rifle</option>
                    <option value="ak47">AK-47 Heavy Rifle</option>
                    <option value="shotgun">Shotgun Blast</option>
                    <option value="sniper">Sniper Cannon</option>
                    <option value="minigun">Minigun Vulcan</option>
                    <option value="tank_turret">Tank Turret Blast</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-neutral-300 uppercase font-mono">Description</label>
                  <textarea 
                    value={gunDesc} 
                    onChange={(e) => setGunDesc(e.target.value)} 
                    rows={2} 
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white font-mono focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-900/30 transition-all font-['Chakra_Petch'] flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> CREATE & IMPORT GUN MOD INTO GAME
              </button>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-900/60 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-500 font-mono shrink-0">
          <span>FOREST ALIVE MOD ENGINE V2.5</span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold uppercase transition-colors"
          >
            CLOSE
          </button>
        </div>

      </div>
    </div>
  );
};
