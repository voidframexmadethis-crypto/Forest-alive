import React, { useState } from 'react';
import { Difficulty, ForestType, GameMode } from '../types/game';
import { Play, Shield, Flame, Crosshair, Skull, Volume2, VolumeX, Eye, Radio, BookOpen, X } from 'lucide-react';
import { soundEngine } from '../game/audio';

interface MainMenuProps {
  onStartGame: (mode: GameMode, forest: ForestType, difficulty: Difficulty) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('blood_harvest');
  const [selectedForest, setSelectedForest] = useState<ForestType>('pine_dark');
  const [difficulty, setDifficulty] = useState<Difficulty>('realism');
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getMuted());

  // Tactical Developer Manual State
  const [isManualOpen, setIsManualOpen] = useState<boolean>(false);
  const [manualTab, setManualTab] = useState<'movement' | 'gunplay' | 'blueprints' | 'feedback'>('movement');
  const [engineSelection, setEngineSelection] = useState<'unity' | 'ue5' | 'godot'>('unity');

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const modes = [
    {
      id: 'blood_harvest' as GameMode,
      name: 'BLOOD HARVEST',
      tagline: 'Moving Army Tank Escort & Crying Witch Woods',
      desc: 'Fight through dense foggy woods defending an advancing military tank. Beware of the crying witch hidden in the trees!',
      img: '/src/assets/images/mode_blood_harvest_1790921643597.jpg'
    },
    {
      id: 'death_toll' as GameMode,
      name: 'DEATH TOLL',
      tagline: 'Safehouse Defense & Telescope Sniper Bureau',
      desc: 'Fortify inside safehouses, relax with TV broadcasts during rest timers, then mount the telescope window rifle to pick off Striker Zombies.',
      img: '/src/assets/images/striker_zombie_render_1790925971223.jpg'
    },
    {
      id: 'creature_mode' as GameMode,
      name: 'I CREATURE MODE',
      tagline: 'All Elite Monsters Active Simultaneously',
      desc: 'Ultimate nightmare survival against Double Tanks, 9-Tentacle Jockeys, Flying Phantoms, Cloud Creatures, and Skinwalkers.',
      img: '/src/assets/images/mode_creature_mode_1790921664337.jpg'
    },
    {
      id: 'the_fast_guy' as GameMode,
      name: '⚡ THE FAST GUY',
      tagline: '6000 Bullets Multi-Stream & Extreme Gore Impact',
      desc: 'Unleash a massive 6,000 bullet-per-minute barrage! Watch creatures scream in agony as blood spears erupt from their head, limbs, arms, and legs. Ultra long 3 to 7 hour player endurance!',
      img: '/src/assets/images/military_zombie_v2_1790925959610.jpg'
    }
  ];

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-y-auto select-none font-['Plus_Jakarta_Sans']">
      {/* Dynamic Dark Background Key Art */}
      <div 
        className="fixed inset-0 bg-cover bg-center opacity-35 scale-105 filter blur-sm transition-all duration-700 pointer-events-none"
        style={{ backgroundImage: `url('/src/assets/images/military_zombie_v2_1790925959610.jpg')` }}
      />
      <div className="fixed inset-0 bg-gradient-to-t from-black via-black/70 to-black/40 pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 flex flex-col justify-between min-h-screen">
        
        {/* Header Contract */}
        <header className="flex items-center justify-between border-b border-red-900/30 pb-4">
          <div className="flex items-center gap-3">
            <Flame className="w-8 h-8 text-red-600 animate-pulse" />
            <h1 className="text-3xl font-extrabold tracking-wider text-red-500 font-['Chakra_Petch']">
              DARK FORCE ALIVE
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => { soundEngine.playMechanicalClick(0.6, 1200); setIsManualOpen(true); }}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-950/80 border border-red-800 hover:border-red-500 rounded text-xs font-extrabold text-red-200 tracking-wider transition-colors"
            >
              <BookOpen className="w-4 h-4 text-red-400" />
              <span>TACTICAL FPS MANUAL & BLUEPRINTS</span>
            </button>

            <button
              onClick={handleToggleMute}
              className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/80 border border-neutral-800 rounded text-xs font-semibold hover:border-red-600 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
              <span>{isMuted ? 'AUDIO MUTED' : 'AUDIO ACTIVE'}</span>
            </button>
          </div>
        </header>

        {/* Main Body Grid */}
        <main className="my-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Mode Selection Cards (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-sm font-bold tracking-widest text-neutral-400 uppercase font-['Chakra_Petch'] flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-red-500" /> Select Combat Operations Mode
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {modes.map((m) => {
                const isSelected = selectedMode === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMode(m.id)}
                    className={`relative cursor-pointer overflow-hidden rounded-xl border transition-all duration-300 p-5 flex flex-col md:flex-row gap-5 ${
                      isSelected 
                        ? 'bg-neutral-950/90 border-red-600 shadow-[0_0_25px_rgba(220,38,38,0.25)] scale-[1.01]' 
                        : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/80'
                    }`}
                  >
                    <img 
                      src={m.img} 
                      alt={m.name} 
                      className="w-full md:w-44 h-28 object-cover rounded-lg border border-neutral-800 shrink-0" 
                    />

                    <div className="flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-white font-['Chakra_Petch'] tracking-wide flex items-center gap-2">
                            {m.name}
                          </h3>
                          {isSelected && <span className="text-xs bg-red-600/30 text-red-400 border border-red-500 px-2 py-0.5 rounded font-mono">SELECTED</span>}
                        </div>
                        <p className="text-xs font-semibold text-red-400 mt-0.5">{m.tagline}</p>
                        <p className="text-xs text-neutral-300 mt-2 line-clamp-2">{m.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Environment & Parameters Panel (5 Cols) */}
          <div className="lg:col-span-5 bg-neutral-950/80 border border-neutral-800 rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold tracking-widest text-neutral-400 uppercase font-['Chakra_Petch'] flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-red-500" /> Forest Environment Type
              </h3>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'pine_dark', label: 'Dark Pine', desc: 'Dense misty evergreen' },
                  { id: 'red_mist', label: 'Red Mist', desc: 'Crimson blood fog' },
                  { id: 'dead_winter', label: 'Dead Winter', desc: 'Bare trees & snow' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedForest(f.id as ForestType)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedForest === f.id
                        ? 'bg-red-950/40 border-red-500 text-white'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold font-['Chakra_Petch']">{f.label}</div>
                    <div className="text-[10px] text-neutral-500 mt-1">{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold tracking-widest text-neutral-400 uppercase font-['Chakra_Petch'] flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-red-500" /> Combat Realism Level
              </h3>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'veteran', label: 'VETERAN', desc: 'Standard damage' },
                  { id: 'realism', label: 'REALISM', desc: 'Heavy COD physics' },
                  { id: 'nightmare', label: 'NIGHTMARE', desc: 'One-hit fatal cuts' }
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id as Difficulty)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      difficulty === d.id
                        ? 'bg-red-950/40 border-red-500 text-white'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold font-['Chakra_Petch']">{d.label}</div>
                    <div className="text-[10px] text-neutral-500 mt-1">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tactical Keybind Guide */}
            <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-lg p-4 text-xs space-y-2 text-neutral-300">
              <div className="font-bold font-['Chakra_Petch'] text-red-400 flex items-center gap-2">
                <Radio className="w-3.5 h-3.5" /> TACTICAL CONTROLS & THREAT WARNINGS
              </div>
              <ul className="space-y-1 text-[11px] text-neutral-400 font-mono">
                <li><b className="text-white">WASD:</b> Move | <b className="text-white">SHIFT:</b> Sprint (Pants on fatigue)</li>
                <li><b className="text-white">C / CTRL:</b> Crouch Toggle | <b className="text-white">C during Sprint:</b> Slide</li>
                <li><b className="text-white">Z:</b> Dolphin Dive | <b className="text-white">SPACE:</b> Jump / Stand up</li>
                <li><b className="text-white">LMB:</b> Fire | <b className="text-white">RMB:</b> Aim Down Sights (ADS)</li>
                <li><b className="text-white">R:</b> Reload | <b className="text-white">F:</b> Flashlight Toggle</li>
                <li><b className="text-white">E:</b> Board Tank Cannon / Telescope Window Slot</li>
                <li className="text-amber-400 font-sans mt-2 font-semibold">
                  ⚠️ WARNING: Crouching/diving alters your hit profile. High-frequency footsteps make noise. Slide to evade heavy blows!
                </li>
              </ul>
            </div>

            {/* Deploy Button */}
            <button
              onClick={() => onStartGame(selectedMode, selectedForest, difficulty)}
              className="w-full py-4 bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-extrabold text-base tracking-widest rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-all transform active:scale-95 flex items-center justify-center gap-3 font-['Chakra_Petch']"
            >
              <Play className="w-5 h-5 fill-white" /> DEPLOY TO SURVIVAL ZONE
            </button>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-neutral-900 pt-4 text-center text-xs text-neutral-500 font-mono">
          DARK FORCE ALIVE · ULTRA-REALISTIC 3D HORROR SURVIVAL SHOOTER
        </footer>
      </div>

      {/* ========================================== */}
      {/* 3D FPS GAMEPLAY DEVELOPER MANUAL MODAL    */}
      {/* ========================================== */}
      {isManualOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8 overflow-hidden font-['Plus_Jakarta_Sans'] select-text pointer-events-auto">
          <div className="max-w-5xl w-full h-[90vh] bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col shadow-[0_0_60px_rgba(220,38,38,0.2)]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 p-5 shrink-0">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-red-500" />
                <div>
                  <h3 className="text-xl font-extrabold font-['Chakra_Petch'] tracking-wide text-white">
                    TACTICAL 3D FPS BLUEPRINT MANUAL
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono">
                    Call of Duty Architecture & Implementation Guides (Unity / UE5 / Godot)
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { soundEngine.playMechanicalClick(0.5, 900); setIsManualOpen(false); }}
                className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-red-500 text-neutral-400 hover:text-white rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="flex bg-neutral-900/40 border-b border-neutral-800 shrink-0 p-1 overflow-x-auto">
              {[
                { id: 'movement' as const, label: '01. CORE MOVEMENT' },
                { id: 'gunplay' as const, label: '02. BALLISTICS & ADS' },
                { id: 'blueprints' as const, label: '03. SYSTEM BLUEPRINTS' },
                { id: 'feedback' as const, label: '04. RECOIL & JUICE' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { soundEngine.playMechanicalClick(0.4, 1100); setManualTab(tab.id); }}
                  className={`px-4 py-2.5 text-xs font-extrabold font-['Chakra_Petch'] tracking-wider whitespace-nowrap rounded-lg transition-all ${
                    manualTab === tab.id 
                      ? 'bg-red-950/60 border border-red-500/40 text-red-400 shadow-inner' 
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 text-neutral-300 leading-relaxed text-sm">
              
              {/* TAB 1: CORE PLAYER CONTROLLER & MOVEMENT */}
              {manualTab === 'movement' && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h4 className="text-lg font-bold font-['Chakra_Petch'] text-white border-b border-neutral-800 pb-2 mb-3">
                      Core 3D FPS Movement Architecture
                    </h4>
                    <p className="text-neutral-400 mb-4">
                      A Call of Duty standard controller requires a tight finite-state machine (FSM) determining the stance and velocities of the player. Standard stances include <b>Standing</b>, <b>Crouching</b>, and <b>Prone</b>. Transitions must smoothly lerp the camera position, collision capsule heights, and speed parameters to ensure fluid arcade gameplay.
                    </p>

                    {/* Stance Heights Diagram */}
                    <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-800 font-mono text-xs text-neutral-400 space-y-2 mb-6">
                      <div className="text-red-400 font-bold mb-1 font-sans">STANCE CAMERA HEIGHTS & PHYSICS SENSORS:</div>
                      <div>[Standing]   Camera Eye: 1.7m  · speed 6.0m/s (sprint 10.2m/s)  · Capsule height: 2.0m</div>
                      <div>[Crouched]   Camera Eye: 0.9m  · speed 2.8m/s (sprint locked)    · Capsule height: 1.2m</div>
                      <div>[Prone]      Camera Eye: 0.4m  · speed 1.5m/s (sprint locked)    · Capsule height: 0.6m</div>
                    </div>
                  </div>

                  {/* Slider & Dolphin Dive Mechanics */}
                  <div>
                    <h5 className="font-bold text-white mb-2 text-base font-['Chakra_Petch']">Tactical Sliding & Dolphin Diving Formulas</h5>
                    <p className="text-neutral-400 mb-4">
                      <b>Tactical Sliding:</b> Triggered when the player inputs a Crouch action while in a high-speed Sprint state. It applies a temporary friction override and a decaying forward velocity boost.
                      <br />
                      <code className="text-red-400 font-mono text-xs block bg-neutral-900 px-3 py-1.5 rounded mt-2">
                        Velocity_Slide(t) = Direction_Forward * Base_Speed * (1.0 + Kick_Factor * (Time_Remaining / Slide_Duration))
                      </code>
                    </p>
                    <p className="text-neutral-400">
                      <b>Dolphin Diving:</b> A legacy classic! Launched when sprinting and diving (by key input). The controller disables ground friction, calculates an upward trajectory vector, and pushes the character through an aerial parabolic curve, ending flat on the ground in a prone state.
                    </p>
                  </div>

                  {/* Engine Selection for Code block */}
                  <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/30">
                    <div className="bg-neutral-900 p-3 flex items-center justify-between border-b border-neutral-800">
                      <span className="text-xs font-bold text-white font-['Chakra_Petch']">CHOOSE SCRIPT PATTERN:</span>
                      <div className="flex gap-1">
                        {['unity', 'ue5', 'godot'].map((eng) => (
                          <button
                            key={eng}
                            onClick={() => setEngineSelection(eng as any)}
                            className={`px-3 py-1 rounded text-[10px] font-bold font-mono transition-all ${
                              engineSelection === eng 
                                ? 'bg-red-700 text-white' 
                                : 'bg-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                          >
                            {eng.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 font-mono text-[11px] bg-black/60 overflow-x-auto text-neutral-300 max-h-96">
                      {engineSelection === 'unity' && (
                        <pre>{`// Unity Smooth Crouch & Slide Character Controller
using UnityEngine;

[RequireComponent(typeof(CharacterController))]
public class FPSController : MonoBehaviour {
    [Header("Heights")]
    public float standHeight = 2.0f;
    public float crouchHeight = 1.1f;
    public float proneHeight = 0.6f;
    public Transform playerCamera;

    [Header("Speeds")]
    public float walkSpeed = 6.0f;
    public float sprintSpeed = 10.0f;
    public float slideDuration = 0.7f;

    private CharacterController controller;
    private float targetHeight;
    private float cameraTargetY;
    private float slideTimer;
    private Vector3 slideDirection;
    private bool isSprinting;

    void Start() {
        controller = GetComponent<CharacterController>();
        targetHeight = standHeight;
    }

    void Update() {
        HandleStanceHeight();
        HandleMovement();
    }

    void HandleStanceHeight() {
        // Interpolate character capsule height
        controller.height = Mathf.Lerp(controller.height, targetHeight, Time.deltaTime * 12.0f);
        
        // Smoothly interpolate Camera view height (Eye position)
        float currentCamY = playerCamera.localPosition.y;
        float desiredCamY = (targetHeight == standHeight) ? 1.7f : (targetHeight == crouchHeight ? 0.9f : 0.4f);
        playerCamera.localPosition = new Vector3(
            playerCamera.localPosition.x,
            Mathf.Lerp(currentCamY, desiredCamY, Time.deltaTime * 12.0f),
            playerCamera.localPosition.z
        );
    }

    void HandleMovement() {
        if (slideTimer > 0) {
            slideTimer -= Time.deltaTime;
            float slideSpeedMultiplier = 1.0f + 1.2f * (slideTimer / slideDuration);
            controller.Move(slideDirection * walkSpeed * slideSpeedMultiplier * Time.deltaTime);
            return;
        }

        // Standard movement logic ...
    }

    public void TriggerSlide() {
        if (isSprinting && controller.isGrounded) {
            slideTimer = slideDuration;
            slideDirection = transform.forward;
            targetHeight = crouchHeight;
        }
    }
}`}</pre>
                      )}

                      {engineSelection === 'ue5' && (
                        <pre>{`// Unreal Engine 5 C++ (Character Movement Component override)
void AMyFPSCharacter::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    // Lerp Camera Height smoothly
    float TargetCamZ = bIsCrouched ? CrouchCamZ : (bIsProne ? ProneCamZ : StandCamZ);
    FVector CamPos = CameraComp->GetRelativeLocation();
    CamPos.Z = FMath::FInterpTo(CamPos.Z, TargetCamZ, DeltaTime, 12.0f);
    CameraComp->SetRelativeLocation(CamPos);

    // Decaying slide force
    if (bIsSliding)
    {
        SlideTimer -= DeltaTime;
        if (SlideTimer <= 0.0f)
        {
            StopSliding();
        }
        else
        {
            float CurrentSlideFriction = FMath::Lerp(0.01f, 0.4f, 1.0f - (SlideTimer / MaxSlideDuration));
            GetCharacterMovement()->GroundFriction = CurrentSlideFriction;
        }
    }
}

void AMyFPSCharacter::TriggerDolphinDive()
{
    if (GetCharacterMovement()->IsSprinting())
    {
        bIsDolphinDiving = true;
        
        // Launch vector (Combine Forward momentum and upward arch)
        FVector LaunchVel = GetActorForwardVector() * 1000.0f + FVector(0, 0, 350.0f);
        LaunchCharacter(LaunchVel, true, true);
        
        // Timer to land and lock into Prone stance
        GetWorld()->GetTimerManager().SetTimer(DiveTimerHandle, this, &AMyFPSCharacter::OnDiveLanded, 0.8f, false);
    }
}`}</pre>
                      )}

                      {engineSelection === 'godot' && (
                        <pre>{`# Godot 4.x Stance Height & Sliding Controller
extends CharacterBody3D

@onready var cam = $Camera3D
@onready var collision = $CollisionShape3D

var target_height = 1.7
var eye_height = 1.7
var is_sliding = false
var slide_timer = 0.0
var slide_dir = Vector3.ZERO

func _physics_process(delta):
    # Stance height lerping
    eye_height = lerp(eye_height, target_height, delta * 12.0)
    cam.position.y = eye_height

    if is_sliding:
        slide_timer -= delta
        if slide_timer <= 0:
            is_sliding = false
            
        var speed = 6.0 * (1.0 + 1.2 * (slide_timer / 0.7))
        velocity.x = slide_dir.x * speed
        velocity.z = slide_dir.z * speed
    else:
        # standard walking inputs ...
        pass
        
    move_and_slide()

func trigger_slide():
    if is_sprinting and is_on_floor():
        is_sliding = true
        slide_timer = 0.7
        slide_dir = -global_transform.basis.z
        target_height = 0.9`}</pre>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: GUNPLAY MECHANICS & FEEL */}
              {manualTab === 'gunplay' && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h4 className="text-lg font-bold font-['Chakra_Petch'] text-white border-b border-neutral-800 pb-2 mb-3">
                      Hitscan vs. Projectile Ballistics
                    </h4>
                    <p className="text-neutral-400 mb-4">
                      Modern arcade shooters use different calculation models for different firearms. Call of Duty primarily implements high-speed <b>Hitscan</b> for rifles and shotguns to achieve tight, instantaneous gunplay. However, heavy projectiles (like tanks, launchers, or long-range snipers) require physical <b>Projectile</b> ballistics to simulate bullet drop and travel times.
                    </p>

                    <div className="overflow-x-auto border border-neutral-800 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-neutral-900 border-b border-neutral-800 text-neutral-400">
                            <th className="p-3 font-semibold">Parameter</th>
                            <th className="p-3 font-semibold text-red-400">Hitscan Raycasting</th>
                            <th className="p-3 font-semibold text-amber-500">Projectile Ballistics</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800 bg-neutral-950">
                          <tr>
                            <td className="p-3 font-semibold text-white">Travel Time</td>
                            <td className="p-3 font-mono text-neutral-400">Instantaneous (0 frames)</td>
                            <td className="p-3 font-mono text-neutral-400">Simulated speed (m/s)</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-semibold text-white">Gravity Drop</td>
                            <td className="p-3 font-mono text-neutral-400">None (Perfect straight line)</td>
                            <td className="p-3 font-mono text-neutral-400">Calculated (y -= g * delta)</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-semibold text-white">Network Load</td>
                            <td className="p-3 font-mono text-neutral-400">Extremely Low (Client ray)</td>
                            <td className="p-3 font-mono text-neutral-400">High (Entity synchronization)</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-semibold text-white">Ideal Weapons</td>
                            <td className="p-3 font-sans text-neutral-400">Assault Rifles, SMGs, Pistols</td>
                            <td className="p-3 font-sans text-neutral-400">Tanks, RPGs, Heavy Grenades</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold font-['Chakra_Petch'] text-white border-b border-neutral-800 pb-2 mb-3">
                      Aim Down Sights (ADS) Math
                    </h4>
                    <p className="text-neutral-400 mb-3">
                      The ADS feel is what makes military shooters satisfying. Translating hip-fire offsets to the screen center requires interpolating relative camera matrices.
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-neutral-400">
                      <li><b>FOV Squeezing:</b> Shrinking the FOV from the normal 75° down to 45° (1.6x zoom) or 20° (Sniper scopes).</li>
                      <li><b>Weapon Alignment:</b> Lerp the local 3D weapon model from its hip-fire right-hand coordinates <code className="text-neutral-200 bg-neutral-900 px-1 py-0.5 rounded font-mono">(0.22, -0.2, -0.45)</code> to exact screenspace eye-alignment <code className="text-neutral-200 bg-neutral-900 px-1 py-0.5 rounded font-mono">(0.0, -0.09, -0.3)</code>.</li>
                      <li><b>Dynamic Sensitivity:</b> Reducing mouse yaw/pitch sensitivity proportional to FOV zoom factor to allow pinpoint micro-adjustments.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold font-['Chakra_Petch'] text-white border-b border-neutral-800 pb-2 mb-3">
                      Weapon Sway & Inertia Drift
                    </h4>
                    <p className="text-neutral-400">
                      A weapon model should never feel glued to the center of the viewport. Mouse movement yaw/pitch should add delayed offset translations and opposite rotations (swaying) that slowly catch up to center via spring damps.
                    </p>
                    <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 mt-3 font-mono text-xs text-neutral-400 space-y-1">
                      <div>Sway_Offset_X = -Mouse_Delta_X * Sway_Scale;</div>
                      <div>Sway_Offset_Y = Mouse_Delta_Y * Sway_Scale;</div>
                      <div>Gun_Position = Lerp(Gun_Position, Neutral_Position + Sway_Offset, Time.delta * Recovery_Speed);</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CODES & COMPONENT ARCHITECTURE */}
              {manualTab === 'blueprints' && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h4 className="text-lg font-bold font-['Chakra_Petch'] text-white border-b border-neutral-800 pb-2 mb-3">
                      Clean Component Architecture
                    </h4>
                    <p className="text-neutral-400 mb-4">
                      Best performance practices call for strict decoupling of physics (movement components), gameplay state (stamina, posture stats), and firearms handling (raycasters, bullet offsets). The <b>Weapon Manager</b> handles magazine count and shooting calls, while communicating hits back to the user through events.
                    </p>

                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 max-h-96 overflow-y-auto font-mono text-xs text-neutral-300">
                      <div className="text-emerald-400 font-bold mb-2 font-sans text-sm">PRODUCION STARTER SKELETON (Unity C# Example):</div>
                      <pre>{`// Optimized WeaponManager and GunController
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class WeaponManager : MonoBehaviour {
    [System.Serializable]
    public class WeaponData {
        public string weaponName;
        public int damage = 35;
        public int clipSize = 30;
        public float fireRate = 0.1f; // Seconds between shots
        public int reserveAmmo = 240;
    }

    public List<WeaponData> inventory;
    private int currentWeaponIndex = 0;
    private int currentClipAmmo;
    private float lastFireTime;
    private bool isReloading;

    public Camera playerCamera;
    public ParticleSystem muzzleFlash;
    public AudioSource gunshotAudio;

    void Start() {
        if(inventory.Count > 0) {
            currentClipAmmo = inventory[currentWeaponIndex].clipSize;
        }
    }

    public void FireWeapon() {
        if (isReloading || currentClipAmmo <= 0 || Time.time - lastFireTime < inventory[currentWeaponIndex].fireRate) {
            return;
        }

        lastFireTime = Time.time;
        currentClipAmmo--;
        
        // Visual effects
        muzzleFlash.Play();
        gunshotAudio.PlayOneShot(gunshotAudio.clip);

        // Raycast Hit Scan
        RaycastHit hit;
        Vector3 rayOrigin = playerCamera.ViewportToWorldPoint(new Vector3(0.5f, 0.5f, 0.0f));
        if (Physics.Raycast(rayOrigin, playerCamera.transform.forward, out hit, 150.0f)) {
            // Check if object is an enemy
            IDamageable target = hit.transform.GetComponent<IDamageable>();
            if (target != null) {
                bool isHeadshot = hit.collider.CompareTag("HeadshotZone");
                int finalDamage = isHeadshot ? inventory[currentWeaponIndex].damage * 2 : inventory[currentWeaponIndex].damage;
                target.TakeDamage(finalDamage, isHeadshot);
            }
        }
    }

    public IEnumerator Reload() {
        if (isReloading || currentClipAmmo == inventory[currentWeaponIndex].clipSize) yield break;
        isReloading = true;

        yield return new WaitForSeconds(2.0f); // reload animation duration

        int needed = inventory[currentWeaponIndex].clipSize - currentClipAmmo;
        int filled = Mathf.Min(needed, inventory[currentWeaponIndex].reserveAmmo);
        currentClipAmmo += filled;
        inventory[currentWeaponIndex].reserveAmmo -= filled;

        isReloading = false;
    }
}`}</pre>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: RECOIL & FEEDBACK JUICE */}
              {manualTab === 'feedback' && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h4 className="text-lg font-bold font-['Chakra_Petch'] text-white border-b border-neutral-800 pb-2 mb-3">
                      Achieving "High-Impact" Tactical Juice
                    </h4>
                    <p className="text-neutral-400 mb-4">
                      The secret to CoD's satisfying gunplay isn't just the damage numbers, it's the micro-sensory feedback loop that rewards shooting success. You must coordinate multiple audio-visual components on every bullet trigger.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-xl space-y-2">
                        <div className="text-red-400 font-bold font-['Chakra_Petch'] text-sm">1. CAMERA SHAKE ON FIRE</div>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          On bullet trigger, translate the camera position on all 3 axes by a small randomized factor proportional to weapon recoil, decaying exponentially.
                        </p>
                        <code className="text-[11px] block text-neutral-400 font-mono bg-black/40 p-2 rounded whitespace-pre-wrap">
                          {`Shake_Offset = Random.insideUnitSphere * Recoil_Intensity;
Shake_Offset *= exp(-delta * Recovery_Speed);`}
                        </code>
                      </div>

                      <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-xl space-y-2">
                        <div className="text-red-400 font-bold font-['Chakra_Petch'] text-sm">2. HITMARKER FEEDBACK</div>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          Confirming hit scanner collisions instantly with a brief 150ms screen center visual (X cross) and a clean, high-frequency sound cue ("tick") dramatically enhances stopping satisfaction.
                        </p>
                        <code className="text-[11px] block text-neutral-400 font-mono bg-black/40 p-2 rounded whitespace-pre-wrap">
                          {`Hit_Registered() -> 
Play_Synthesized_Tick(f = 2200Hz -> 900Hz);`}
                        </code>
                      </div>

                      <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-xl space-y-2">
                        <div className="text-red-400 font-bold font-['Chakra_Petch'] text-sm">3. PROCEDURAL RECOIL PATTERNS</div>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          Do not rely purely on snapping camera pitch. Create physical weapon push-backs: translate the gun model backward and rotate it upward around its grip, springing back over time using Hooke's Law:
                        </p>
                        <code className="text-[11px] block text-neutral-400 font-mono bg-black/40 p-2 rounded whitespace-pre-wrap">
                          {`F = -k * displacement;
Recoil_Pitch_Velocity += Fire_Kick;`}
                        </code>
                      </div>

                      <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-xl space-y-2">
                        <div className="text-red-400 font-bold font-['Chakra_Petch'] text-sm">4. MUZZLE FLASH ALIGNMENT</div>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          Place a point light directly at the weapon barrel socket. Illuminate it for only 0.05s (1 frame) to cast dynamic shadows into the fog, creating intense, hyper-realistic muzzle flash shadows.
                        </p>
                        <code className="text-[11px] block text-neutral-400 font-mono bg-black/40 p-2 rounded whitespace-pre-wrap">
                          {`Muzzle_PointLight.intensity = 5.0;
Disable_Light_After_Frame(0.05f);`}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="border-t border-neutral-800 p-5 bg-neutral-900/20 flex items-center justify-between shrink-0">
              <span className="text-xs text-neutral-500 font-mono">
                Author: Senior Gameplay Programmer · Google AI Studio Build Game Lab
              </span>
              <button
                onClick={() => { soundEngine.playMechanicalClick(0.5, 900); setIsManualOpen(false); }}
                className="px-5 py-2 bg-red-700 hover:bg-red-800 rounded-lg text-xs font-bold tracking-wider font-['Chakra_Petch'] text-white transition-all active:scale-95"
              >
                CLOSE MANUAL
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
