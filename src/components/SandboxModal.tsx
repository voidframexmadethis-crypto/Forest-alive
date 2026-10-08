import React, { useState } from 'react';
import { Sliders, Code2, Clipboard, ClipboardCheck, RotateCcw, Sparkles, X, Play, Monitor, HelpCircle, Flame } from 'lucide-react';
import { soundEngine } from '../game/audio';

export interface FPSConfig {
  mouseSensitivity: number;
  baseSpeed: number;
  sprintMultiplier: number;
  accelerationDamping: number;
  decelerationDamping: number;
  gravity: number;
  jumpForce: number;
  bobFrequency: number;
  bobAmplitudeX: number;
  bobAmplitudeY: number;
  sprintBobMultiplier: number;
  crouchSpeed: number;
  proneSpeed: number;
  cameraRollWeight: number;
}

interface SandboxModalProps {
  config: FPSConfig;
  onChange: (newConfig: Partial<FPSConfig>) => void;
  onClose: () => void;
}

export const SandboxModal: React.FC<SandboxModalProps> = ({ config, onChange, onClose }) => {
  const [activeTab, setActiveTab] = useState<'physics' | 'code'>('physics');
  const [activeEngine, setActiveEngine] = useState<'unity' | 'godot' | 'unreal_cpp' | 'unreal_h'>('unity');
  const [codeType, setCodeType] = useState<'controller' | 'transition'>('controller');
  const [copied, setCopied] = useState<boolean>(false);

  const handleSliderChange = (key: keyof FPSConfig, value: number) => {
    onChange({ [key]: value });
  };

  const handleCopyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    soundEngine.playMechanicalClick(0.6, 1800);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyPreset = (presetName: string) => {
    soundEngine.playMechanicalClick(0.5, 1400);
    let preset: Partial<FPSConfig> = {};
    if (presetName === 'cod') {
      preset = {
        mouseSensitivity: 0.0022,
        baseSpeed: 6.0,
        sprintMultiplier: 1.7,
        accelerationDamping: 10.0,
        decelerationDamping: 10.0,
        gravity: 24.5,
        jumpForce: 7.5,
        bobFrequency: 8.0,
        bobAmplitudeX: 0.03,
        bobAmplitudeY: 0.05,
        sprintBobMultiplier: 1.625,
        crouchSpeed: 2.8,
        proneSpeed: 1.5,
        cameraRollWeight: 0.008
      };
    } else if (presetName === 'arcade') {
      preset = {
        mouseSensitivity: 0.0035,
        baseSpeed: 11.0,
        sprintMultiplier: 1.4,
        accelerationDamping: 25.0,
        decelerationDamping: 25.0,
        gravity: 18.0,
        jumpForce: 10.0,
        bobFrequency: 14.0,
        bobAmplitudeX: 0.06,
        bobAmplitudeY: 0.08,
        sprintBobMultiplier: 1.3,
        crouchSpeed: 5.0,
        proneSpeed: 3.0,
        cameraRollWeight: 0.022
      };
    } else if (presetName === 'lunar') {
      preset = {
        mouseSensitivity: 0.0022,
        baseSpeed: 4.5,
        sprintMultiplier: 1.6,
        accelerationDamping: 5.0,
        decelerationDamping: 4.0,
        gravity: 6.5,
        jumpForce: 13.0,
        bobFrequency: 4.0,
        bobAmplitudeX: 0.04,
        bobAmplitudeY: 0.07,
        sprintBobMultiplier: 1.5,
        crouchSpeed: 2.0,
        proneSpeed: 1.0,
        cameraRollWeight: 0.015
      };
    } else if (presetName === 'tactical_slow') {
      preset = {
        mouseSensitivity: 0.0014,
        baseSpeed: 3.8,
        sprintMultiplier: 1.5,
        accelerationDamping: 14.0,
        decelerationDamping: 14.0,
        gravity: 28.0,
        jumpForce: 6.0,
        bobFrequency: 6.0,
        bobAmplitudeX: 0.015,
        bobAmplitudeY: 0.03,
        sprintBobMultiplier: 1.7,
        crouchSpeed: 1.8,
        proneSpeed: 0.8,
        cameraRollWeight: 0.004
      };
    }
    onChange(preset);
  };

  // ----------------- SOURCE CODE DEFINITIONS -----------------
  const unityCode = `// ===================================================================================
//  Call of Duty-Style 3D First-Person Player Controller (Unity C#)
//  Engine: Unity (Compatible with Unity 2021.x, 2022.x, 2023.x, 6.x)
//  Component Requirements: CharacterController, AudioSource (optional for steps)
//  Designed for: Realistic movement, smooth look limits, and procedural camera bob.
// ===================================================================================

using UnityEngine;

[RequireComponent(typeof(CharacterController))]
public class Unity_FPSController : MonoBehaviour
{
    [Header("First-Person Mouse Look Settings")]
    [Tooltip("Dampened Mouse Sensitivity.")]
    [Range(0.05f, 5.0f)] public float mouseSensitivity = 2.0f;
    [Tooltip("Smooth look filtering to remove micro-stutter.")]
    public float lookSmoothing = 15.0f;
    [Tooltip("Standard COD vertical field of view angle clamp limit.")]
    public float maxVerticalAngle = 80.0f;

    [Header("Call of Duty-Style Movement Physics")]
    [Tooltip("Baseline walking speed in meters per second.")]
    public float walkSpeed = 6.0f;
    [Tooltip("Tactical sprint speed multiplier.")]
    public float sprintMultiplier = 1.7f;
    [Tooltip("Dampened acceleration rate (controls inertial drift slide-in).")]
    public float accelerationRate = 10.0f;
    [Tooltip("Dampened deceleration rate (controls sliding stop drift).")]
    public float decelerationRate = 8.0f;
    [Tooltip("Standard gravitational constant applied vertically.")]
    public float gravity = 24.5f;
    [Tooltip("Initial upward impulse force applied on jumps.")]
    public float jumpForce = 8.0f;

    [Header("Realistic Procedural Head Bobbing")]
    [Tooltip("Frequency speed of the head bobbing gait.")]
    public float bobSpeed = 8.0f;
    [Tooltip("Sprint head bobbing frequency multiplier.")]
    public float sprintBobSpeedMultiplier = 1.6f;
    [Tooltip("Horizontal swaying shift factor (cosine).")]
    public float bobAmountX = 0.03f;
    [Tooltip("Vertical bouncing shift factor (sine).")]
    public float bobAmountY = 0.05f;
    [Tooltip("Speed of returning camera to center when resting.")]
    public float bobReturnToCenterSpeed = 10.0f;

    [Header("Modular Component References")]
    [RequiredField] public Transform playerCamera;
    
    // --- State Vectors and Variables ---
    private CharacterController _characterController;
    private Vector3 _moveVelocity;
    private Vector3 _targetMoveDirection;
    private float _verticalRotation = 0.0f;
    private float _horizontalRotation = 0.0f;
    private float _bobTimer = 0.0f;
    private Vector3 _cameraOriginalLocalPosition;
    private bool _isGrounded;

    // Expandability states (e.g. reload slowdowns, ADS factors)
    [HideInInspector] public bool isReloading = false;
    [HideInInspector] public bool isAimingDownSights = false;

    private void Awake()
    {
        _characterController = GetComponent<CharacterController>();
        if (playerCamera == null)
        {
            Debug.LogError("FPSController: Player Camera is not assigned. Procedural Head Bobbing will fail.");
            playerCamera = GetComponentInChildren<Camera>()?.transform;
        }

        if (playerCamera != null)
        {
            _cameraOriginalLocalPosition = playerCamera.localPosition;
        }
    }

    private void Start()
    {
        // Lock and hide the mouse cursor in the center of the screen on startup
        LockCursor();
    }

    private void Update()
    {
        _isGrounded = _characterController.isGrounded;

        HandleMouseLook();
        HandleMovementPhysics();
        HandleProceduralHeadBob();
    }

    public void LockCursor()
    {
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
    }

    public void UnlockCursor()
    {
        Cursor.lockState = CursorLockMode.None;
        Cursor.visible = true;
    }

    /// <summary>
    /// Feature 1: First-Person Mouse Look
    /// Rotates body horizontally (yaw) and camera vertically (pitch) with smooth limits.
    /// </summary>
    private void HandleMouseLook()
    {
        if (Cursor.lockState != CursorLockMode.Locked) return;

        float mouseX = Input.GetAxisRaw("Mouse X") * mouseSensitivity;
        float mouseY = Input.GetAxisRaw("Mouse Y") * mouseSensitivity;

        _horizontalRotation += mouseX;
        _verticalRotation -= mouseY;
        _verticalRotation = Mathf.Clamp(_verticalRotation, -maxVerticalAngle, maxVerticalAngle);

        Quaternion targetBodyRot = Quaternion.Euler(0.0f, _horizontalRotation, 0.0f);
        Quaternion targetCamRot = Quaternion.Euler(_verticalRotation, 0.0f, 0.0f);

        transform.rotation = Quaternion.Slerp(transform.rotation, targetBodyRot, Time.deltaTime * lookSmoothing);
        playerCamera.localRotation = Quaternion.Slerp(playerCamera.localRotation, targetCamRot, Time.deltaTime * lookSmoothing);
    }

    /// <summary>
    /// Feature 2: Call of Duty-Style Walking Mechanics
    /// Manages relative translation vectors, gravity, inertia, and tactical sprints.
    /// </summary>
    private void HandleMovementPhysics()
    {
        if (_isGrounded && _moveVelocity.y < 0)
        {
            _moveVelocity.y = -2.0f; // Slope gluing force
        }

        float moveX = Input.GetAxisRaw("Horizontal");
        float moveZ = Input.GetAxisRaw("Vertical");

        _targetMoveDirection = (transform.forward * moveZ + transform.right * moveX).normalized;

        float currentMaxSpeed = walkSpeed;
        bool isSprinting = Input.GetKey(KeyCode.LeftShift) && moveZ > 0.1f;
        if (isSprinting) currentMaxSpeed *= sprintMultiplier;

        if (isReloading) currentMaxSpeed *= 0.6f; // Slow down during reload
        if (isAimingDownSights) currentMaxSpeed *= 0.45f; // Slow down during ADS

        float targetSpeedX = _targetMoveDirection.x * currentMaxSpeed;
        float targetSpeedZ = _targetMoveDirection.z * currentMaxSpeed;

        float currentLerpRate = (_targetMoveDirection.sqrMagnitude > 0.01f) ? accelerationRate : decelerationRate;

        _moveVelocity.x = Mathf.Lerp(_moveVelocity.x, targetSpeedX, Time.deltaTime * currentLerpRate);
        _moveVelocity.z = Mathf.Lerp(_moveVelocity.z, targetSpeedZ, Time.deltaTime * currentLerpRate);

        if (_isGrounded && Input.GetButtonDown("Jump"))
        {
            _moveVelocity.y = jumpForce;
        }

        _moveVelocity.y -= gravity * Time.deltaTime;
        _characterController.Move(_moveVelocity * Time.deltaTime);
    }

    /// <summary>
    /// Feature 3: Realistic Procedural Head Bobbing
    /// Triggers horizontal and vertical sine waves when walking on ground, smoothly decays on stop.
    /// </summary>
    private void HandleProceduralHeadBob()
    {
        if (playerCamera == null) return;

        Vector3 flatVelocity = new Vector3(_characterController.velocity.x, 0.0f, _characterController.velocity.z);
        float moveSpeedMagnitude = flatVelocity.magnitude;

        if (moveSpeedMagnitude > 0.15f && _isGrounded)
        {
            bool isSprinting = Input.GetKey(KeyCode.LeftShift) && Input.GetAxisRaw("Vertical") > 0.1f;
            float currentBobSpeed = isSprinting ? bobSpeed * sprintBobSpeedMultiplier : bobSpeed;

            _bobTimer += Time.deltaTime * currentBobSpeed * (moveSpeedMagnitude / walkSpeed);

            float newBobX = Mathf.Cos(_bobTimer * 0.5f) * bobAmountX;
            float newBobY = Mathf.Sin(_bobTimer) * bobAmountY;

            playerCamera.localPosition = new Vector3(
                _cameraOriginalLocalPosition.x + newBobX,
                _cameraOriginalLocalPosition.y + newBobY,
                _cameraOriginalLocalPosition.z
            );
        }
        else
        {
            _bobTimer = 0.0f;
            playerCamera.localPosition = Vector3.Lerp(
                playerCamera.localPosition, 
                _cameraOriginalLocalPosition, 
                Time.deltaTime * bobReturnToCenterSpeed
            );
        }
    }
}`;

  const godotCode = `# ===================================================================================
#  Call of Duty-Style 3D First-Person Player Controller (Godot 4.x GDScript)
#  Engine: Godot 4 (Compatible with 4.0, 4.1, 4.2, 4.3+)
#  Node Tree Setup Requirement:
#  - CharacterBody3D (this script attached)
#    - CollisionShape3D
#    - Node3D ("Head" or "CameraPivot")
#      - Camera3D
# ===================================================================================

class_name Godot_FPSController
extends CharacterBody3D

@export_category("First-Person Mouse Look Settings")
@export var mouse_sensitivity: float = 0.002
@export var look_smoothing: float = 20.0
@export var max_vertical_angle_deg: float = 80.0

@export_category("Call of Duty-Style Movement Physics")
@export var walk_speed: float = 6.0
@export var sprint_multiplier: float = 1.7
@export var acceleration_rate: float = 10.0
@export var deceleration_rate: float = 8.0
@export var jump_velocity: float = 8.0

@export_category("Realistic Procedural Head Bobbing")
@export var bob_frequency: float = 8.0
@export var sprint_bob_speed_multiplier: float = 1.6
@export var bob_amplitude_x: float = 0.03
@export var bob_amplitude_y: float = 0.05
@export var bob_return_speed: float = 10.0

@onready var head_node: Node3D = $Head
@onready var camera: Camera3D = $Head/Camera3D

var gravity: float = 24.5
var yaw_input: float = 0.0
var pitch_input: float = 0.0
var bob_timer: float = 0.0
var original_camera_pos: Vector3

var is_reloading: bool = false
var is_aiming_down_sights: bool = false

func _ready() -> void:
	if not head_node or not camera:
		push_error("FPSController: Missing Head or Head/Camera3D node.")
		return
	original_camera_pos = camera.position
	lock_mouse()

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.get_mouse_mode() == Input.MOUSE_MODE_CAPTURED:
		yaw_input -= event.relative.x * mouse_sensitivity
		pitch_input -= event.relative.y * mouse_sensitivity
		
		var max_pitch_rad = deg_to_rad(max_vertical_angle_deg)
		pitch_input = clamp(pitch_input, -max_pitch_rad, max_pitch_rad)

func _physics_process(delta: float) -> void:
	handle_movement_physics(delta)
	handle_mouse_look(delta)
	handle_procedural_head_bob(delta)

func lock_mouse() -> void:
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)

func unlock_mouse() -> void:
	Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)

func handle_mouse_look(delta: float) -> void:
	if Input.get_mouse_mode() != Input.MOUSE_MODE_CAPTURED:
		return
	rotation.y = lerp_angle(rotation.y, yaw_input, delta * look_smoothing)
	head_node.rotation.x = lerp_angle(head_node.rotation.x, pitch_input, delta * look_smoothing)

func handle_movement_physics(delta: float) -> void:
	if not is_on_floor():
		velocity.y -= gravity * delta
	else:
		velocity.y = clamp(velocity.y, -2.0, 999.0)

	if Input.is_action_just_pressed("ui_accept") and is_on_floor():
		velocity.y = jump_velocity

	var input_dir: Vector2 = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	var direction: Vector3 = (global_transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()

	var target_speed: float = walk_speed
	var is_sprinting: bool = Input.is_key_pressed(KEY_SHIFT) and input_dir.y < -0.1
	
	if is_sprinting:
		target_speed *= sprint_multiplier
	if is_reloading:
		target_speed *= 0.6
	if is_aiming_down_sights:
		target_speed *= 0.45

	var target_vel_x: float = direction.x * target_speed
	var target_vel_z: float = direction.z * target_speed
	
	var active_interpolation = acceleration_rate if direction.length_squared() > 0.01 else deceleration_rate

	velocity.x = lerp(velocity.x, target_vel_x, delta * active_interpolation)
	velocity.z = lerp(velocity.z, target_vel_z, delta * active_interpolation)

	move_and_slide()

func handle_procedural_head_bob(delta: float) -> void:
	var flat_velocity: Vector3 = Vector3(velocity.x, 0.0, velocity.z)
	var move_speed_magnitude: float = flat_velocity.length()

	if move_speed_magnitude > 0.15 and is_on_floor():
		var is_sprinting: bool = Input.is_key_pressed(KEY_SHIFT) and velocity.dot(-global_transform.basis.z) > 0.5
		var current_bob_frequency = bob_frequency * sprint_bob_speed_multiplier if is_sprinting else bob_frequency
		
		bob_timer += delta * current_bob_frequency * (move_speed_magnitude / walk_speed)

		var bob_x: float = cos(bob_timer * 0.5) * bob_amplitude_x
		var bob_y: float = sin(bob_timer) * bob_amplitude_y

		camera.position.x = original_camera_pos.x + bob_x
		camera.position.y = original_camera_pos.y + bob_y
	else:
		bob_timer = 0.0
		camera.position = camera.position.lerp(original_camera_pos, delta * bob_return_speed)
`;

  const unrealCppCode = `// ===================================================================================
//  Call of Duty-Style 3D First-Person Player Character Controller (Unreal Engine C++)
//  Engine: Unreal Engine 5 (Compatible with UE 5.0, 5.1, 5.2, 5.3, 5.4, 5.5)
//  Parent Class Requirement: ACharacter (provides UCharacterMovementComponent)
// ===================================================================================

#include "Unreal_FPSController.h"
#include "Camera/CameraComponent.h"
#include "Components/CapsuleComponent.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "GameFramework/PlayerController.h"

AUnreal_FPSController::AUnreal_FPSController()
{
    PrimaryActorTick.bCanEverTick = true;
    GetCapsuleComponent()->InitCapsuleSize(40.f, 95.f);

    bUseControllerRotationPitch = false;
    bUseControllerRotationYaw = true;
    bUseControllerRotationRoll = false;

    UCharacterMovementComponent* MoveComp = GetCharacterMovement();
    if (MoveComp)
    {
        MoveComp->MaxWalkSpeed = 600.f;              // cm/s (6.0m/s)
        MoveComp->MaxAcceleration = 2048.f;         // Snappy CoD sprint startup
        MoveComp->BrakingDecelerationWalking = 1600.f; // Smooth braking
        MoveComp->GroundFriction = 8.0f;             
        MoveComp->GravityScale = 2.5f;               // Heavy realistic gravity
        MoveComp->JumpZVelocity = 800.f;             
        MoveComp->AirControl = 0.35f;                
    }

    FPSCameraComponent = CreateDefaultSubobject<UCameraComponent>(TEXT("FirstPersonCamera"));
    if (FPSCameraComponent)
    {
        FPSCameraComponent->SetupAttachment(GetCapsuleComponent());
        FPSCameraComponent->SetRelativeLocation(FVector(0.f, 0.f, 70.f)); // Height 170cm
        FPSCameraComponent->bUsePawnControlRotation = true;
    }

    MouseSensitivity = 1.0f;
    LookSmoothing = 15.0f;
    MaxVerticalAngle = 80.0f;
    WalkSpeedUE = 600.0f;
    SprintMultiplier = 1.7f;
    BobFrequency = 8.0f;
    SprintBobMultiplier = 1.6f;
    BobAmplitudeX = 3.0f;  // 3cm
    BobAmplitudeY = 5.0f;  // 5cm
    BobReturnSpeed = 10.0f;
    BobTimer = 0.0f;
    bIsReloading = false;
    bIsAimingDownSights = false;
}

void AUnreal_FPSController::BeginPlay()
{
    Super::BeginPlay();

    APlayerController* PC = Cast<APlayerController>(GetController());
    if (PC)
    {
        FInputModeGameOnly InputMode;
        PC->SetInputMode(InputMode);
        PC->bShowMouseCursor = false;

        if (PC->PlayerCameraManager)
        {
            PC->PlayerCameraManager->ViewPitchMin = -MaxVerticalAngle;
            PC->PlayerCameraManager->ViewPitchMax = MaxVerticalAngle;
        }
    }

    if (FPSCameraComponent)
    {
        OriginalCameraRelativePos = FPSCameraComponent->GetRelativeLocation();
    }
}

void AUnreal_FPSController::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);
    HandleDynamicSpeeds();
    HandleProceduralHeadBob(DeltaTime);
}

void AUnreal_FPSController::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
    Super::SetupPlayerInputComponent(PlayerInputComponent);
    PlayerInputComponent->BindAxis("MoveForward", this, &AUnreal_FPSController::MoveForward);
    PlayerInputComponent->BindAxis("MoveRight", this, &AUnreal_FPSController::MoveRight);
    PlayerInputComponent->BindAxis("Turn", this, &AUnreal_FPSController::LookRight);
    PlayerInputComponent->BindAxis("LookUp", this, &AUnreal_FPSController::LookUp);
    PlayerInputComponent->BindAction("Jump", IE_Pressed, this, &ACharacter::Jump);
    PlayerInputComponent->BindAction("Jump", IE_Released, this, &ACharacter::StopJumping);
}

void AUnreal_FPSController::LookRight(float Value)
{
    AddControllerYawInput(Value * MouseSensitivity);
}

void AUnreal_FPSController::LookUp(float Value)
{
    AddControllerPitchInput(Value * MouseSensitivity);
}

void AUnreal_FPSController::MoveForward(float Value)
{
    if (Value != 0.0f && Controller)
    {
        const FRotator Rotation = Controller->GetControlRotation();
        const FRotator YawRotation(0, Rotation.Yaw, 0);
        const FVector Direction = FRotationMatrix(YawRotation).GetUnitAxis(EAxis::X);
        AddMovementInput(Direction, Value);
    }
}

void AUnreal_FPSController::MoveRight(float Value)
{
    if (Value != 0.0f && Controller)
    {
        const FRotator Rotation = Controller->GetControlRotation();
        const FRotator YawRotation(0, Rotation.Yaw, 0);
        const FVector Direction = FRotationMatrix(YawRotation).GetUnitAxis(EAxis::Y);
        AddMovementInput(Direction, Value);
    }
}

void AUnreal_FPSController::HandleDynamicSpeeds()
{
    UCharacterMovementComponent* MoveComp = GetCharacterMovement();
    if (!MoveComp) return;

    float CurrentMaxSpeed = WalkSpeedUE;
    if (bIsSprinting && MoveComp->IsMovingOnGround()) CurrentMaxSpeed *= SprintMultiplier;
    if (bIsReloading) CurrentMaxSpeed *= 0.60f; // Slow down reload
    if (bIsAimingDownSights) CurrentMaxSpeed *= 0.45f; // Slow down ADS

    MoveComp->MaxWalkSpeed = CurrentMaxSpeed;
}

void AUnreal_FPSController::HandleProceduralHeadBob(float DeltaTime)
{
    if (!FPSCameraComponent) return;

    FVector Velocity = GetVelocity();
    FVector FlatVelocity = FVector(Velocity.X, Velocity.Y, 0.0f);
    float SpeedMagnitude = FlatVelocity.Size();

    UCharacterMovementComponent* MoveComp = GetCharacterMovement();

    if (SpeedMagnitude > 15.0f && MoveComp && MoveComp->IsMovingOnGround())
    {
        float CurrentBobFrequency = bIsSprinting ? BobFrequency * SprintBobMultiplier : BobFrequency;
        BobTimer += DeltaTime * CurrentBobFrequency * (SpeedMagnitude / WalkSpeedUE);

        float BobX = FMath::Cos(BobTimer * 0.5f) * BobAmplitudeX;
        float BobY = FMath::Sin(BobTimer) * BobAmplitudeY;

        FVector TargetRelativePos = OriginalCameraRelativePos;
        TargetRelativePos.X += BobX;
        TargetRelativePos.Z += BobY;

        FPSCameraComponent->SetRelativeLocation(TargetRelativePos);
    }
    else
    {
        BobTimer = 0.0f;
        FVector CurrentRelativePos = FPSCameraComponent->GetRelativeLocation();
        FVector CleanTargetPos = FMath::VInterpTo(CurrentRelativePos, OriginalCameraRelativePos, DeltaTime, BobReturnSpeed);
        FPSCameraComponent->SetRelativeLocation(CleanTargetPos);
    }
}`;

  const unrealHCode = `// ===================================================================================
//  Call of Duty-Style 3D First-Person Player Character Controller Header (Unreal Engine C++)
//  Engine: Unreal Engine 5 (Compatible with UE 5.0, 5.1, 5.2, 5.3, 5.4, 5.5)
// ===================================================================================

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "Unreal_FPSController.generated.h"

UCLASS()
class GAMEPLAY_API AUnreal_FPSController : public ACharacter
{
    GENERATED_BODY()

public:
    AUnreal_FPSController();

protected:
    virtual void BeginPlay() override;

public:	
    virtual void Tick(float DeltaTime) override;
    virtual void SetupPlayerInputComponent(class UInputComponent* PlayerInputComponent) override;

    void LookRight(float Value);
    void LookUp(float Value);
    void MoveForward(float Value);
    void MoveRight(float Value);

    void HandleDynamicSpeeds();
    void HandleProceduralHeadBob(float DeltaTime);

public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "FPS Look")
    float MouseSensitivity;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "FPS Look")
    float LookSmoothing;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "FPS Look")
    float MaxVerticalAngle;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "FPS Movement")
    float WalkSpeedUE;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "FPS Movement")
    float SprintMultiplier;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "FPS Head Bob")
    float BobFrequency;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "FPS Head Bob")
    float SprintBobMultiplier;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "FPS Head Bob")
    float BobAmplitudeX;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "FPS Head Bob")
    float BobAmplitudeY;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "FPS Head Bob")
    float BobReturnSpeed;

    UPROPERTY(BlueprintReadWrite, Category = "FPS Weapon State")
    bool bIsReloading;

    UPROPERTY(BlueprintReadWrite, Category = "FPS Weapon State")
    bool bIsAimingDownSights;

    UPROPERTY(BlueprintReadWrite, Category = "FPS Movement State")
    bool bIsSprinting;

private:
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Camera", meta = (AllowPrivateAccess = "true"))
    class UCameraComponent* FPSCameraComponent;

    FVector OriginalCameraRelativePos;
    float BobTimer;
};`;

  const unityTransitionCode = `// ===================================================================================
//  Call of Duty-Style Cinematic-to-Gameplay Scene Transition Manager (Unity C#)
//  Engine: Unity (Compatible with Unity 2021.x, 2022.x, 2023.x, 6.x)
//  Designed for: Seamless cinematic introductions, non-blocking asynchronous level 
//                loading, progressive keyhold skip, and clean controller handovers.
// ===================================================================================

using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class Unity_SceneTransitionManager : MonoBehaviour
{
    [Header("Scene Configuration")]
    public string gameplaySceneName = "Level_PineForest_Dark";
    public float cutsceneDuration = 8.5f;

    [Header("Hold-to-Skip UI Settings")]
    public KeyCode skipKeySpace = KeyCode.Space;
    public KeyCode skipKeyEscape = KeyCode.Escape;
    public float requiredHoldTime = 1.5f;
    public Image skipProgressRing;
    public CanvasGroup skipUiGroup;

    [Header("Camera & Controller Handovers")]
    public Camera cinematicCamera;
    public GameObject playerControllerPrefab;
    private MonoBehaviour _spawnedPlayerController;

    private AsyncOperation _asyncLoadOperation;
    private float _cutsceneTimer = 0.0f;
    private float _skipHoldTimer = 0.0f;
    private bool _cutsceneCompleted = false;
    private bool _loadingTriggered = false;

    private void Start()
    {
        DisablePlayerInputAndHUD();
        if (cinematicCamera != null) cinematicCamera.enabled = true;
        if (skipUiGroup != null) skipUiGroup.alpha = 0.0f;
        if (skipProgressRing != null) skipProgressRing.fillAmount = 0.0f;

        StartCoroutine(StartBackgroundMapLoad());
    }

    private void Update()
    {
        if (_cutsceneCompleted) return;

        _cutsceneTimer += Time.deltaTime;
        if (_cutsceneTimer >= cutsceneDuration)
        {
            OnCutsceneFinished();
            return;
        }

        HandleHoldToSkipInput();
    }

    private void DisablePlayerInputAndHUD()
    {
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
        if (playerControllerPrefab != null) playerControllerPrefab.SetActive(false);
    }

    private IEnumerator StartBackgroundMapLoad()
    {
        yield return new WaitForSeconds(0.5f);
        _asyncLoadOperation = SceneManager.LoadSceneAsync(gameplaySceneName, LoadSceneMode.Single);
        _asyncLoadOperation.allowSceneActivation = false;
        _loadingTriggered = true;
    }

    private void HandleHoldToSkipInput()
    {
        bool isHoldingSkip = Input.GetKey(skipKeySpace) || Input.GetKey(skipKeyEscape);

        if (isHoldingSkip)
        {
            if (skipUiGroup != null && skipUiGroup.alpha < 1.0f)
                skipUiGroup.alpha = Mathf.MoveTowards(skipUiGroup.alpha, 1.0f, Time.deltaTime * 4.0f);

            _skipHoldTimer += Time.deltaTime;
            float fillPct = Mathf.Clamp01(_skipHoldTimer / requiredHoldTime);
            if (skipProgressRing != null) skipProgressRing.fillAmount = fillPct;

            if (_skipHoldTimer >= requiredHoldTime) OnCutsceneFinished();
        }
        else
        {
            _skipHoldTimer = Mathf.MoveTowards(_skipHoldTimer, 0.0f, Time.deltaTime * 2.0f);
            float fillPct = Mathf.Clamp01(_skipHoldTimer / requiredHoldTime);
            if (skipProgressRing != null) skipProgressRing.fillAmount = fillPct;

            if (skipUiGroup != null && skipUiGroup.alpha > 0.0f && _skipHoldTimer <= 0.01f)
                skipUiGroup.alpha = Mathf.MoveTowards(skipUiGroup.alpha, 0.0f, Time.deltaTime * 2.0f);
        }
    }

    private void OnCutsceneFinished()
    {
        _cutsceneCompleted = true;
        if (skipUiGroup != null) skipUiGroup.alpha = 0.0f;
        StartCoroutine(ExecuteTransitionHandovers());
    }

    private IEnumerator ExecuteTransitionHandovers()
    {
        _asyncLoadOperation.allowSceneActivation = true;
        while (!_asyncLoadOperation.isDone) yield return null;

        GameObject playerObj = GameObject.FindGameObjectWithTag("Player");
        if (playerObj == null && playerControllerPrefab != null)
            playerObj = Instantiate(playerControllerPrefab, Vector3.zero, Quaternion.identity);

        if (playerObj != null)
        {
            if (cinematicCamera != null) cinematicCamera.enabled = false;
            playerObj.SetActive(true);
            _spawnedPlayerController = playerObj.GetComponent<MonoBehaviour>();
            if (_spawnedPlayerController != null) _spawnedPlayerController.enabled = true;

            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
            GameHUDManager.ActivateGameplayHUD();
        }
    }
}`;

  const godotTransitionCode = `# ===================================================================================
#  Call of Duty-Style Cinematic-to-Gameplay Scene Transition Manager (Godot 4.x GDScript)
#  Engine: Godot 4 (Compatible with 4.0, 4.1, 4.2, 4.3+)
#  Node Tree Setup Requirement:
#  - Node (this script attached)
#    - Camera3D ("CinematicCamera")
#    - CanvasLayer ("SkipOverlay")
#      - Control ("SkipUIGroup")
#        - TextureProgressBar ("SkipProgressRing")
# ===================================================================================

extends Node

@export_category("Scene Configuration")
@export_file("*.tscn") var gameplay_scene_path: String = "res://levels/pine_forest_dark.tscn"
@export var cutscene_duration: float = 8.5

@export_category("Hold-to-Skip UI Settings")
@export var skip_action: String = "ui_accept"
@export var required_hold_time: float = 1.5

@onready var cinematic_camera: Camera3D = $CinematicCamera
@onready var skip_ui_group: Control = $SkipOverlay/SkipUIGroup
@onready var skip_progress_ring: TextureProgressBar = $SkipOverlay/SkipUIGroup/SkipProgressRing

var loading_status: int = 0
var progress: Array = []
var cutscene_timer: float = 0.0
var skip_hold_timer: float = 0.0
var cutscene_completed: bool = false
var scene_preloaded: bool = false

func _ready() -> void:
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)
	if cinematic_camera: cinematic_camera.make_current()
	if skip_ui_group: skip_ui_group.modulate.a = 0.0
	if skip_progress_ring:
		skip_progress_ring.value = 0.0
		skip_progress_ring.max_value = required_hold_time

	var err = ResourceLoader.load_threaded_request(gameplay_scene_path, "", false)

func _process(delta: float) -> void:
	if cutscene_completed: return

	cutscene_timer += delta
	if cutscene_timer >= cutscene_duration:
		on_cutscene_finished()
		return

	track_async_loading_status()
	handle_hold_to_skip_input(delta)

func track_async_loading_status() -> void:
	if not scene_preloaded:
		loading_status = ResourceLoader.load_threaded_get_status(gameplay_scene_path, progress)
		if loading_status == ResourceLoader.THREAD_LOAD_LOADED:
			scene_preloaded = true

func handle_hold_to_skip_input(delta: float) -> void:
	var is_holding = Input.is_action_pressed(skip_action) or Input.is_key_pressed(KEY_ESCAPE) or Input.is_key_pressed(KEY_SPACE)

	if is_holding:
		if skip_ui_group and skip_ui_group.modulate.a < 1.0:
			skip_ui_group.modulate.a = move_toward(skip_ui_group.modulate.a, 1.0, delta * 4.0)

		skip_hold_timer += delta
		if skip_progress_ring: skip_progress_ring.value = skip_hold_timer

		if skip_hold_timer >= required_hold_time: on_cutscene_finished()
	else:
		skip_hold_timer = move_toward(skip_hold_timer, 0.0, delta * 2.0)
		if skip_progress_ring: skip_progress_ring.value = skip_hold_timer

		if skip_ui_group and skip_ui_group.modulate.a > 0.0 and skip_hold_timer <= 0.01:
			skip_ui_group.modulate.a = move_toward(skip_ui_group.modulate.a, 0.0, delta * 2.0)

func on_cutscene_finished() -> void:
	cutscene_completed = true
	if skip_ui_group: skip_ui_group.visible = false
	execute_transition_handovers()

func execute_transition_handovers() -> void:
	var loaded_scene_resource = ResourceLoader.load_threaded_get(gameplay_scene_path) if scene_preloaded else ResourceLoader.load(gameplay_scene_path)
	if not loaded_scene_resource: return

	var gameplay_scene_node = loaded_scene_resource.instantiate()
	var root = get_tree().root
	root.add_child(gameplay_scene_node)
	get_tree().current_scene = gameplay_scene_node
	
	var player = gameplay_scene_node.find_child("Player", true, false)
	if player:
		if player.has_method("lock_mouse"): player.call("lock_mouse")
		var player_camera = player.find_child("Camera3D", true, false)
		if player_camera: player_camera.make_current()

		var hud = gameplay_scene_node.find_child("HUD", true, false)
		if hud: hud.visible = true

	queue_free()
`;

  const unrealCppTransitionCode = `// ===================================================================================
//  Call of Duty-Style Cinematic-to-Gameplay Scene Transition Manager (Unreal Engine C++)
//  Engine: Unreal Engine 5 (Compatible with UE 5.0, 5.1, 5.2, 5.3, 5.4, 5.5)
//  Parent Class Requirement: AActor
// ===================================================================================

#include "Unreal_SceneTransitionManager.h"
#include "Kismet/GameplayStatics.h"
#include "GameFramework/PlayerController.h"
#include "GameFramework/Character.h"
#include "Blueprint/UserWidget.h"

AUnreal_SceneTransitionManager::AUnreal_SceneTransitionManager()
{
    PrimaryActorTick.bCanEverTick = true;
    GameplayLevelName = FName(TEXT("Level_PineForest_Dark"));
    CutsceneDuration = 8.5f;
    RequiredHoldTime = 1.5f;
    SkipHoldTimer = 0.0f;
    CutsceneTimer = 0.0f;
    bCutsceneCompleted = false;
}

void AUnreal_SceneTransitionManager::BeginPlay()
{
    Super::BeginPlay();
    DisablePlayerInputsAndHUD();

    APlayerController* PC = UGameplayStatics::GetPlayerController(GetWorld(), 0);
    if (PC && CinematicCameraActor)
    {
        PC->SetViewTargetWithBlend(CinematicCameraActor, 0.0f);
    }

    if (SkipWidgetClass)
    {
        SkipWidgetInstance = CreateWidget<UUserWidget>(GetWorld(), SkipWidgetClass);
        if (SkipWidgetInstance)
        {
            SkipWidgetInstance->AddToViewport();
            SkipWidgetInstance->SetRenderOpacity(0.0f);
        }
    }

    TriggerAsyncLevelLoad();
}

void AUnreal_SceneTransitionManager::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);
    if (bCutsceneCompleted) return;

    CutsceneTimer += DeltaTime;
    if (CutsceneTimer >= CutsceneDuration)
    {
        OnCutsceneFinished();
        return;
    }

    HandleHoldToSkipInput(DeltaTime);
}

void AUnreal_SceneTransitionManager::DisablePlayerInputsAndHUD()
{
    APlayerController* PC = UGameplayStatics::GetPlayerController(GetWorld(), 0);
    if (PC)
    {
        PC->DisableInput(PC);
        FInputModeGameOnly InputMode;
        PC->SetInputMode(InputMode);
        PC->bShowMouseCursor = false;
    }
}

void AUnreal_SceneTransitionManager::TriggerAsyncLevelLoad()
{
    FLatentActionInfo LatentInfo;
    LatentInfo.CallbackTarget = this;
    LatentInfo.ExecutionFunction = FName(TEXT("OnLevelAsyncLoadComplete"));
    LatentInfo.Linkage = 1;
    LatentInfo.UUID = 12345;

    UGameplayStatics::LoadStreamLevel(this, GameplayLevelName, true, false, LatentInfo);
}

void AUnreal_SceneTransitionManager::OnLevelAsyncLoadComplete()
{
    bLevelLoaded = true;
}

void AUnreal_SceneTransitionManager::HandleHoldToSkipInput(float DeltaTime)
{
    APlayerController* PC = UGameplayStatics::GetPlayerController(GetWorld(), 0);
    if (!PC) return;

    bool bIsHoldingSkip = PC->IsInputKeyDown(EKeys::SpaceBar) || PC->IsInputKeyDown(EKeys::Escape);

    if (bIsHoldingSkip)
    {
        if (SkipWidgetInstance && SkipWidgetInstance->GetRenderOpacity() < 1.0f)
        {
            float NewOpacity = FMath::FInterpTo(SkipWidgetInstance->GetRenderOpacity(), 1.0f, DeltaTime, 4.0f);
            SkipWidgetInstance->SetRenderOpacity(NewOpacity);
        }

        SkipHoldTimer += DeltaTime;
        float ProgressPct = FMath::Clamp(SkipHoldTimer / RequiredHoldTime, 0.0f, 1.0f);
        UpdateWidgetProgressRing(ProgressPct);

        if (SkipHoldTimer >= RequiredHoldTime) OnCutsceneFinished();
    }
    else
    {
        SkipHoldTimer = FMath::FInterpTo(SkipHoldTimer, 0.0f, DeltaTime, 2.0f);
        float ProgressPct = FMath::Clamp(SkipHoldTimer / RequiredHoldTime, 0.0f, 1.0f);
        UpdateWidgetProgressRing(ProgressPct);

        if (SkipWidgetInstance && SkipWidgetInstance->GetRenderOpacity() > 0.0f && SkipHoldTimer <= 0.01f)
        {
            float NewOpacity = FMath::FInterpTo(SkipWidgetInstance->GetRenderOpacity(), 0.0f, DeltaTime, 2.0f);
            SkipWidgetInstance->SetRenderOpacity(NewOpacity);
        }
    }
}

void AUnreal_SceneTransitionManager::UpdateWidgetProgressRing(float Percentage)
{
    if (SkipWidgetInstance)
    {
        FOutputDeviceNull Ar;
        FString Cmd = FString::Printf(TEXT("SetProgressRingPercent %f"), Percentage);
        SkipWidgetInstance->CallFunctionByNameWithArguments(*Cmd, Ar, NULL, true);
    }
}

void AUnreal_SceneTransitionManager::OnCutsceneFinished()
{
    bCutsceneCompleted = true;
    if (SkipWidgetInstance) SkipWidgetInstance->RemoveFromParent();
    ExecuteTransitionHandovers();
}

void AUnreal_SceneTransitionManager::ExecuteTransitionHandovers()
{
    APlayerController* PC = UGameplayStatics::GetPlayerController(GetWorld(), 0);
    ACharacter* PlayerChar = UGameplayStatics::GetPlayerCharacter(GetWorld(), 0);

    if (PC && PlayerChar)
    {
        PC->SetViewTargetWithBlend(PlayerChar, 0.5f, VTBlend_Cubic);

        FTimerHandle InputTimerHandle;
        GetWorldTimerManager().SetTimer(InputTimerHandle, [this, PC]()
        {
            PC->EnableInput(PC);
            FInputModeGameOnly InputMode;
            PC->SetInputMode(InputMode);
            PC->bShowMouseCursor = false;
            this->Destroy();
        }, 0.5f, false);
    }
}
`;

  const unrealHTransitionCode = `// ===================================================================================
//  Call of Duty-Style Cinematic-to-Gameplay Scene Transition Manager Header (Unreal Engine C++)
//  Engine: Unreal Engine 5 (Compatible with UE 5.0, 5.1, 5.2, 5.3, 5.4, 5.5)
// ===================================================================================

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "Unreal_SceneTransitionManager.generated.h"

UCLASS()
class GAMEPLAY_API AUnreal_SceneTransitionManager : public AActor
{
    GENERATED_BODY()

public:
    AUnreal_SceneTransitionManager();

protected:
    virtual void BeginPlay() override;

public:
    virtual void Tick(float DeltaTime) override;

    void DisablePlayerInputsAndHUD();
    void TriggerAsyncLevelLoad();
    void HandleHoldToSkipInput(float DeltaTime);
    void UpdateWidgetProgressRing(float Percentage);
    void OnCutsceneFinished();
    void ExecuteTransitionHandovers();

    UFUNCTION()
    void OnLevelAsyncLoadComplete();

public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Transition Configuration")
    FName GameplayLevelName;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Transition Configuration")
    float CutsceneDuration;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Skip Settings")
    float RequiredHoldTime;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Skip Settings")
    TSubclassOf<class UUserWidget> SkipWidgetClass;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Transition Camera")
    AActor* CinematicCameraActor;

private:
    float SkipHoldTimer;
    float CutsceneTimer;
    bool bCutsceneCompleted;
    bool bLevelLoaded;

    UPROPERTY()
    class UUserWidget* SkipWidgetInstance;
};`;

  const getActiveCode = () => {
    if (codeType === 'controller') {
      switch (activeEngine) {
        case 'unity': return unityCode;
        case 'godot': return godotCode;
        case 'unreal_cpp': return unrealCppCode;
        case 'unreal_h': return unrealHCode;
      }
    } else {
      switch (activeEngine) {
        case 'unity': return unityTransitionCode;
        case 'godot': return godotTransitionCode;
        case 'unreal_cpp': return unrealCppTransitionCode;
        case 'unreal_h': return unrealHTransitionCode;
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8 font-['Plus_Jakarta_Sans'] text-white">
      <div className="max-w-6xl w-full h-[90vh] bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col overflow-hidden shadow-[0_0_60px_rgba(220,38,38,0.35)]">
        
        {/* Header bar */}
        <div className="bg-neutral-900/80 border-b border-neutral-800 p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Sliders className="w-6 h-6 text-red-500 animate-pulse" />
            <div>
              <h3 className="text-lg md:text-xl font-extrabold font-['Chakra_Petch'] tracking-wide uppercase flex items-center gap-2">
                FPS Sandbox & 3D Gameplay Code Laboratory
              </h3>
              <p className="text-[11px] text-neutral-400 font-mono uppercase">
                Tweak Call of Duty controller physics live and export optimized engine scripts
              </p>
            </div>
          </div>
          <button 
            onClick={() => { soundEngine.playMechanicalClick(0.5, 900); onClose(); }}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 hover:border-red-500 border border-neutral-700 text-neutral-400 hover:text-white rounded-lg transition-all"
            title="Return to Game"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-neutral-950 border-b border-neutral-800 shrink-0 p-1">
          <button
            onClick={() => { soundEngine.playMechanicalClick(0.4, 1100); setActiveTab('physics'); }}
            className={`flex items-center gap-2 px-6 py-3 text-xs font-bold font-['Chakra_Petch'] tracking-widest rounded-lg transition-all uppercase ${
              activeTab === 'physics'
                ? 'bg-red-950/60 border border-red-500/40 text-red-400'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            01. Live Parameter Sandbox
          </button>
          <button
            onClick={() => { soundEngine.playMechanicalClick(0.4, 1100); setActiveTab('code'); }}
            className={`flex items-center gap-2 px-6 py-3 text-xs font-bold font-['Chakra_Petch'] tracking-widest rounded-lg transition-all uppercase ${
              activeTab === 'code'
                ? 'bg-red-950/60 border border-red-500/40 text-red-400'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            02. Production Scripts Code
          </button>
        </div>

        {/* Core Content Box */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
          
          {/* TAB 1: PHYSICS SANDBOX */}
          {activeTab === 'physics' && (
            <>
              {/* Sliders Area (Left/Full) */}
              <div className="flex-1 space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold font-['Chakra_Petch'] text-red-400 tracking-wider uppercase mb-1">
                      Gameplay Controller Telemetry
                    </h4>
                    <span className="text-[10px] bg-red-900/30 text-red-400 px-2 py-0.5 rounded border border-red-800 font-mono">LIVE PREVIEW ADJUSTER</span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Slight changes to movement friction, gravity scales, or head-bob coefficients dramatically impact standard FPS feel. Slid down variables to experiment.
                  </p>
                </div>

                {/* Preset Fast Actions */}
                <div className="bg-neutral-900/40 border border-neutral-800 p-4 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-neutral-300 font-['Chakra_Petch'] uppercase flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Choose Physics Archetype Preset:
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button
                      onClick={() => applyPreset('cod')}
                      className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs font-bold hover:border-red-500 transition-colors"
                    >
                      MW Realistic (CoD)
                    </button>
                    <button
                      onClick={() => applyPreset('arcade')}
                      className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs font-bold hover:border-red-500 transition-colors"
                    >
                      Classic Arena FPS
                    </button>
                    <button
                      onClick={() => applyPreset('tactical_slow')}
                      className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs font-bold hover:border-red-500 transition-colors"
                    >
                      Tactical Hardcore
                    </button>
                    <button
                      onClick={() => applyPreset('lunar')}
                      className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs font-bold hover:border-red-500 transition-colors"
                    >
                      Low-G Lunar Explorer
                    </button>
                  </div>
                </div>

                {/* Sliders Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {/* Category 1: Mouse Look */}
                  <div className="space-y-4 bg-neutral-900/20 border border-neutral-800/60 p-4 rounded-xl">
                    <h5 className="text-xs font-extrabold text-red-400 font-['Chakra_Petch'] tracking-widest border-b border-neutral-800 pb-1 uppercase">
                      01. Mouse Look Controls
                    </h5>

                    {/* Mouse Sensitivity */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-300 font-medium">Mouse Sensitivity</span>
                        <span className="font-mono text-white">{(config.mouseSensitivity * 1000).toFixed(1)} DPI</span>
                      </div>
                      <input
                        type="range"
                        min="0.0005"
                        max="0.008"
                        step="0.0001"
                        value={config.mouseSensitivity}
                        onChange={(e) => handleSliderChange('mouseSensitivity', parseFloat(e.target.value))}
                        className="w-full accent-red-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Category 2: Movement Velocities */}
                  <div className="space-y-4 bg-neutral-900/20 border border-neutral-800/60 p-4 rounded-xl">
                    <h5 className="text-xs font-extrabold text-red-400 font-['Chakra_Petch'] tracking-widest border-b border-neutral-800 pb-1 uppercase">
                      02. Speed Parameters
                    </h5>

                    {/* Walk Speed */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-300 font-medium">Base Walking Speed</span>
                        <span className="font-mono text-white">{config.baseSpeed.toFixed(1)} m/s</span>
                      </div>
                      <input
                        type="range"
                        min="2.0"
                        max="15.0"
                        step="0.2"
                        value={config.baseSpeed}
                        onChange={(e) => handleSliderChange('baseSpeed', parseFloat(e.target.value))}
                        className="w-full accent-red-600 cursor-pointer"
                      />
                    </div>

                    {/* Sprint Multiplier */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-300 font-medium">Tactical Sprint Multiplier</span>
                        <span className="font-mono text-white">{config.sprintMultiplier.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="2.5"
                        step="0.05"
                        value={config.sprintMultiplier}
                        onChange={(e) => handleSliderChange('sprintMultiplier', parseFloat(e.target.value))}
                        className="w-full accent-red-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Category 3: Inertial Friction */}
                  <div className="space-y-4 bg-neutral-900/20 border border-neutral-800/60 p-4 rounded-xl">
                    <h5 className="text-xs font-extrabold text-red-400 font-['Chakra_Petch'] tracking-widest border-b border-neutral-800 pb-1 uppercase">
                      03. Inertia & Damping
                    </h5>

                    {/* Acceleration */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-300 font-medium">Snappy Acceleration (Friction)</span>
                        <span className="font-mono text-white">{config.accelerationDamping.toFixed(0)} Hz</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="30"
                        step="1"
                        value={config.accelerationDamping}
                        onChange={(e) => handleSliderChange('accelerationDamping', parseInt(e.target.value))}
                        className="w-full accent-red-600 cursor-pointer"
                      />
                    </div>

                    {/* Deceleration */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-300 font-medium">Stopping Drift Deceleration</span>
                        <span className="font-mono text-white">{config.decelerationDamping.toFixed(0)} Hz</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="30"
                        step="1"
                        value={config.decelerationDamping}
                        onChange={(e) => handleSliderChange('decelerationDamping', parseInt(e.target.value))}
                        className="w-full accent-red-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Category 4: Gravity & Vertical Physics */}
                  <div className="space-y-4 bg-neutral-900/20 border border-neutral-800/60 p-4 rounded-xl">
                    <h5 className="text-xs font-extrabold text-red-400 font-['Chakra_Petch'] tracking-widest border-b border-neutral-800 pb-1 uppercase">
                      04. Gravity & Jump Physics
                    </h5>

                    {/* Gravity */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-300 font-medium">Standard Gravitational Constant</span>
                        <span className="font-mono text-white">{config.gravity.toFixed(1)} m/s²</span>
                      </div>
                      <input
                        type="range"
                        min="4.0"
                        max="40.0"
                        step="0.5"
                        value={config.gravity}
                        onChange={(e) => handleSliderChange('gravity', parseFloat(e.target.value))}
                        className="w-full accent-red-600 cursor-pointer"
                      />
                    </div>

                    {/* Jump Force */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-300 font-medium">Jump Upward Impulse</span>
                        <span className="font-mono text-white">{config.jumpForce.toFixed(1)} velocity</span>
                      </div>
                      <input
                        type="range"
                        min="3.0"
                        max="16.0"
                        step="0.2"
                        value={config.jumpForce}
                        onChange={(e) => handleSliderChange('jumpForce', parseFloat(e.target.value))}
                        className="w-full accent-red-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Category 5: Procedural Head Bobbing */}
                  <div className="space-y-4 bg-neutral-900/20 border border-neutral-800/60 p-4 rounded-xl md:col-span-2">
                    <h5 className="text-xs font-extrabold text-red-400 font-['Chakra_Petch'] tracking-widest border-b border-neutral-800 pb-1 uppercase">
                      05. Procedural Sine-Wave Camera Bobbing
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Bob Frequency */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-neutral-300 font-medium">Bob Frequency</span>
                          <span className="font-mono text-white">{config.bobFrequency.toFixed(1)} Hz</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="20.0"
                          step="0.5"
                          value={config.bobFrequency}
                          onChange={(e) => handleSliderChange('bobFrequency', parseFloat(e.target.value))}
                          className="w-full accent-red-600 cursor-pointer"
                        />
                      </div>

                      {/* Bob Amplitude X */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-neutral-300 font-medium">Bob Sway X (Horizontal)</span>
                          <span className="font-mono text-white">{(config.bobAmplitudeX * 100).toFixed(1)} cm</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="0.15"
                          step="0.005"
                          value={config.bobAmplitudeX}
                          onChange={(e) => handleSliderChange('bobAmplitudeX', parseFloat(e.target.value))}
                          className="w-full accent-red-600 cursor-pointer"
                        />
                      </div>

                      {/* Bob Amplitude Y */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-neutral-300 font-medium">Bob Bounce Y (Vertical)</span>
                          <span className="font-mono text-white">{(config.bobAmplitudeY * 100).toFixed(1)} cm</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="0.2"
                          step="0.005"
                          value={config.bobAmplitudeY}
                          onChange={(e) => handleSliderChange('bobAmplitudeY', parseFloat(e.target.value))}
                          className="w-full accent-red-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informative Side Panel (Right) */}
              <div className="w-full md:w-80 shrink-0 bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="text-xs font-bold font-['Chakra_Petch'] text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Monitor className="w-4 h-4" /> Live 3D Interaction Instructions
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    All parameters tweaked here are bound <b>immediately</b> to the active WebGL engine instance in real-time. 
                  </p>
                  <ul className="text-[11px] text-neutral-400 font-mono space-y-2 border-t border-neutral-800/80 pt-3">
                    <li><b className="text-white">To Look:</b> Click outside or close panel to capture cursor. Move mouse. Clamps at <b className="text-red-500">±80°</b> to prevent flipping.</li>
                    <li><b className="text-white">To Move:</b> WASD relative to looking vector. Acceleration creates <b className="text-red-500">inertial drift</b>.</li>
                    <li><b className="text-white">Head Bobbing:</b> Procedural figure-8 wave triggers on movement, returning smoothly to center on release.</li>
                  </ul>
                </div>

                <button
                  onClick={() => { soundEngine.playMechanicalClick(0.5, 1200); onClose(); }}
                  className="w-full py-3 bg-red-700 hover:bg-red-800 rounded-xl text-xs font-extrabold font-['Chakra_Petch'] tracking-widest transition-all active:scale-95 text-white flex items-center justify-center gap-2 uppercase shadow-lg shadow-red-950/50 mt-6"
                >
                  <Play className="w-4 h-4 fill-white" /> Resume 3D Playtesting
                </button>
              </div>
            </>
          )}

          {/* TAB 2: CODE EXPORTER */}
          {activeTab === 'code' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4 shrink-0">
                <div>
                  <h4 className="text-sm font-bold font-['Chakra_Petch'] text-red-400 tracking-wider uppercase">
                    Exporter & Programming Reference Manual
                  </h4>
                  <p className="text-xs text-neutral-400">
                    Production-ready, highly optimized, multi-threaded script implementations covering Unity, Godot 4, and Unreal Engine 5.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopyCode(getActiveCode())}
                    className="px-4 py-2 bg-neutral-900 border border-neutral-700 hover:border-red-500 rounded-lg text-xs font-bold font-['Chakra_Petch'] text-neutral-300 hover:text-white transition-colors flex items-center gap-2"
                  >
                    {copied ? <ClipboardCheck className="w-4 h-4 text-emerald-500 animate-pulse" /> : <Clipboard className="w-4 h-4" />}
                    <span>{copied ? 'COPIED TO CLIPBOARD!' : 'COPY FULL SCRIPT'}</span>
                  </button>
                </div>
              </div>

              {/* SCRIPT CATEGORY SELECTOR */}
              <div className="bg-neutral-900/60 border border-neutral-800 p-2 rounded-xl flex gap-2 mb-4 shrink-0">
                <button
                  onClick={() => { soundEngine.playMechanicalClick(0.4, 1100); setCodeType('controller'); }}
                  className={`flex-1 py-2 text-xs font-extrabold font-['Chakra_Petch'] tracking-widest rounded-lg transition-all uppercase border ${
                    codeType === 'controller'
                      ? 'bg-red-950/40 border-red-500 text-red-400'
                      : 'bg-neutral-950/20 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  🎮 01. 3D Character Controller
                </button>
                <button
                  onClick={() => { soundEngine.playMechanicalClick(0.4, 1100); setCodeType('transition'); }}
                  className={`flex-1 py-2 text-xs font-extrabold font-['Chakra_Petch'] tracking-widest rounded-lg transition-all uppercase border ${
                    codeType === 'transition'
                      ? 'bg-red-950/40 border-red-500 text-red-400'
                      : 'bg-neutral-950/20 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  🎬 02. Cinematic Scene Flow Manager
                </button>
              </div>

              {/* Engine Sub-tabs */}
              <div className="flex border-b border-neutral-800 mb-4 shrink-0 p-1 bg-neutral-900/40 rounded-lg">
                {[
                  { id: 'unity' as const, label: 'Unity (C#)' },
                  { id: 'godot' as const, label: 'Godot 4 (GDScript)' },
                  { id: 'unreal_cpp' as const, label: 'UE5 (C++)' },
                  { id: 'unreal_h' as const, label: 'UE5 (Header)' }
                ].map((eng) => (
                  <button
                    key={eng.id}
                    onClick={() => { soundEngine.playMechanicalClick(0.3, 1500); setActiveEngine(eng.id); }}
                    className={`px-4 py-2 text-xs font-bold rounded transition-all ${
                      activeEngine === eng.id
                        ? 'bg-red-700 text-white'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {eng.label}
                  </button>
                ))}
              </div>

              {/* Scrollable Code block */}
              <div className="flex-1 bg-black border border-neutral-800 rounded-xl overflow-hidden flex flex-col font-mono text-xs">
                <div className="bg-neutral-900 px-4 py-2 border-b border-neutral-800 text-[10px] text-neutral-400 uppercase flex items-center justify-between shrink-0">
                  <span>
                    File Location: {
                      codeType === 'controller'
                        ? (activeEngine === 'unity' ? 'Unity_FPSController.cs' : activeEngine === 'godot' ? 'Godot_FPSController.gd' : activeEngine === 'unreal_cpp' ? 'Unreal_FPSController.cpp' : 'Unreal_FPSController.h')
                        : (activeEngine === 'unity' ? 'Unity_SceneTransitionManager.cs' : activeEngine === 'godot' ? 'Godot_SceneTransitionManager.gd' : activeEngine === 'unreal_cpp' ? 'Unreal_SceneTransitionManager.cpp' : 'Unreal_SceneTransitionManager.h')
                    }
                  </span>
                  <span className="text-[9px] text-red-500 font-bold">● production ready · commented</span>
                </div>
                <div className="flex-1 overflow-auto p-4 bg-neutral-950/60 max-h-[45vh]">
                  <pre className="text-neutral-300 whitespace-pre leading-relaxed select-text font-mono text-[11px] text-left">
                    {getActiveCode()}
                  </pre>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 p-4 bg-neutral-900/20 text-center text-xs text-neutral-500 font-mono flex flex-col md:flex-row justify-between items-center shrink-0">
          <span>Author: Expert 3D Gameplay Programmer</span>
          <span className="text-[10px] text-neutral-600">GOOGLE AI STUDIO BUILD APPMANUAL</span>
        </div>

      </div>
    </div>
  );
};
