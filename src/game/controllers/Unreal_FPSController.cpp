// ===================================================================================
//  Call of Duty-Style 3D First-Person Player Character Controller (Unreal Engine C++)
//  Engine: Unreal Engine 5 (Compatible with UE 5.0, 5.1, 5.2, 5.3, 5.4, 5.5)
//  Parent Class Requirement: ACharacter (provides UCharacterMovementComponent)
//  Designed for: Low-latency mouse tracking, custom physics friction, and eye-level bob.
// ===================================================================================

#include "Unreal_FPSController.h"
#include "Camera/CameraComponent.h"
#include "Components/CapsuleComponent.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "GameFramework/PlayerController.h"

// Set baseline parameter defaults in constructor
AUnreal_FPSController::AUnreal_FPSController()
{
    // Set this character to call Tick() every frame.
    PrimaryActorTick.bCanEverTick = true;

    // Set standard size for collision capsule
    GetCapsuleComponent()->InitCapsuleSize(40.f, 95.f);

    // Feature 1.1: Turn player body horizontally
    // Don't rotate camera pitch when the controller rotates - let the controller rotation handle the yaw body, but not pitch
    bUseControllerRotationPitch = false;
    bUseControllerRotationYaw = true;
    bUseControllerRotationRoll = false;

    // Configure character movement physics defaults
    UCharacterMovementComponent* MoveComp = GetCharacterMovement();
    if (MoveComp)
    {
        // Feature 2.2: Acceleration and deceleration smoothing (Inertial Drift)
        MoveComp->MaxWalkSpeed = 600.f;              // meters/sec scale (6.0m/s in UE cm/s)
        MoveComp->MaxAcceleration = 2048.f;         // Fast snappy pickup
        MoveComp->BrakingDecelerationWalking = 1600.f; // Smooth drift stop
        MoveComp->GroundFriction = 8.0f;             // Call of Duty sliding traction
        MoveComp->GravityScale = 2.5f;               // Standard heavy COD gravity scale
        MoveComp->JumpZVelocity = 800.f;             // Snappy vertical jump impulse
        MoveComp->AirControl = 0.35f;                // Air control restriction
        MoveComp->bCanWalkOffLedgesWhenCrouching = true;
    }

    // Create the First-Person Camera Component
    FPSCameraComponent = CreateDefaultSubobject<UCameraComponent>(TEXT("FirstPersonCamera"));
    if (FPSCameraComponent)
    {
        FPSCameraComponent->SetupAttachment(GetCapsuleComponent());
        // Set camera eye level (1.7 meters = 170cm height)
        FPSCameraComponent->SetRelativeLocation(FVector(0.f, 0.f, 70.f)); 
        // Feature 1.2: Camera tilts up and down relative to player body
        FPSCameraComponent->bUsePawnControlRotation = true;
    }

    // Initialize procedural defaults
    MouseSensitivity = 1.0f;
    LookSmoothing = 15.0f;
    MaxVerticalAngle = 80.0f;

    WalkSpeedUE = 600.0f;
    SprintMultiplier = 1.7f;

    BobFrequency = 8.0f;
    SprintBobMultiplier = 1.6f;
    BobAmplitudeX = 3.0f;  // Translate to Unreal Centimeters (3cm)
    BobAmplitudeY = 5.0f;  // Translate to Unreal Centimeters (5cm)
    BobReturnSpeed = 10.0f;

    BobTimer = 0.0f;
    bIsReloading = false;
    bIsAimingDownSights = false;
}

void AUnreal_FPSController::BeginPlay()
{
    Super::BeginPlay();

    // Feature 1.3: Lock and hide the mouse cursor in the center of the game screen on startup
    APlayerController* PC = Cast<APlayerController>(GetController());
    if (PC)
    {
        FInputModeGameOnly InputMode;
        PC->SetInputMode(InputMode);
        PC->bShowMouseCursor = false;

        // Customise PlayerCameraManager vertical clamp limits (-80 to 80 degrees)
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

// Bind movement triggers (Enhanced Input or traditional legacy axis keys)
void AUnreal_FPSController::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
    Super::SetupPlayerInputComponent(PlayerInputComponent);

    // Bind WASD core actions
    PlayerInputComponent->BindAxis("MoveForward", this, &AUnreal_FPSController::MoveForward);
    PlayerInputComponent->BindAxis("MoveRight", this, &AUnreal_FPSController::MoveRight);

    // Bind Axis turn trackers
    PlayerInputComponent->BindAxis("Turn", this, &AUnreal_FPSController::LookRight);
    PlayerInputComponent->BindAxis("LookUp", this, &AUnreal_FPSController::LookUp);

    // Bind Jump impulse keys
    PlayerInputComponent->BindAction("Jump", IE_Pressed, this, &ACharacter::Jump);
    PlayerInputComponent->BindAction("Jump", IE_Released, this, &ACharacter::StopJumping);
}

/// <summary>
/// Feature 1: First-Person Mouse Look
/// Yaw turns character body, Pitch tilts head, locked into clamps.
/// </summary>
void AUnreal_FPSController::LookRight(float Value)
{
    // Apply yaw rotation turning the physical body
    AddControllerYawInput(Value * MouseSensitivity);
}

void AUnreal_FPSController::LookUp(float Value)
{
    // Apply pitch rotation tilting camera up and down (clamped inside PlayerCameraManager automatically)
    AddControllerPitchInput(Value * MouseSensitivity);
}

/// <summary>
/// Feature 2: Call of Duty-Style Walking Mechanics
/// Calculates relative camera directions to feed movement components.
/// </summary>
void AUnreal_FPSController::MoveForward(float Value)
{
    if (Value != 0.0f && Controller)
    {
        // Feature 2.1: Orient relative to the direction the player is looking
        // Find forward direction using the yaw angle only
        const FRotator Rotation = Controller->GetControlRotation();
        const FRotator YawRotation(0, Rotation.Yaw, 0);

        // Get forward vector
        const FVector Direction = FRotationMatrix(YawRotation).GetUnitAxis(EAxis::X);
        AddMovementInput(Direction, Value);
    }
}

void AUnreal_FPSController::MoveRight(float Value)
{
    if (Value != 0.0f && Controller)
    {
        // Find right direction using the yaw angle only
        const FRotator Rotation = Controller->GetControlRotation();
        const FRotator YawRotation(0, Rotation.Yaw, 0);

        // Get right vector
        const FVector Direction = FRotationMatrix(YawRotation).GetUnitAxis(EAxis::Y);
        AddMovementInput(Direction, Value);
    }
}

/// <summary>
/// Handles real-time adjustments for reloading, sprinting, or aiming state adjustments.
/// </summary>
void AUnreal_FPSController::HandleDynamicSpeeds()
{
    UCharacterMovementComponent* MoveComp = GetCharacterMovement();
    if (!MoveComp) return;

    float CurrentMaxSpeed = WalkSpeedUE;

    // Check tactical sprint speed adjustments
    if (bIsSprinting && MoveComp->IsMovingOnGround())
    {
        CurrentMaxSpeed *= SprintMultiplier;
    }

    // Expandability: Slow down player by 40% during reloading state
    if (bIsReloading)
    {
        CurrentMaxSpeed *= 0.60f;
    }

    // Expandability: Slow down player by 55% during Aim Down Sights (ADS) state
    if (bIsAimingDownSights)
    {
        CurrentMaxSpeed *= 0.45f;
    }

    MoveComp->MaxWalkSpeed = CurrentMaxSpeed;
}

/// <summary>
/// Feature 3: Realistic Procedural Head Bobbing
/// Sine wave camera calculations that stop and center smoothly upon halting.
/// </summary>
void AUnreal_FPSController::HandleProceduralHeadBob(float DeltaTime)
{
    if (!FPSCameraComponent) return;

    FVector Velocity = GetVelocity();
    FVector FlatVelocity = FVector(Velocity.X, Velocity.Y, 0.0f);
    float SpeedMagnitude = FlatVelocity.Size();

    UCharacterMovementComponent* MoveComp = GetCharacterMovement();

    // Feature 3.1: Bobbing triggers ONLY when actively moving on ground
    if (SpeedMagnitude > 15.0f && MoveComp && MoveComp->IsMovingOnGround())
    {
        float CurrentBobFrequency = bIsSprinting ? BobFrequency * SprintBobMultiplier : BobFrequency;

        // Progress bobbing timeline scaled by velocity intensity
        BobTimer += DeltaTime * CurrentBobFrequency * (SpeedMagnitude / WalkSpeedUE);

        // Figure-8 camera bounce: Cosine for horizontal sway, Sine for vertical hop
        float BobX = FMath::Cos(BobTimer * 0.5f) * BobAmplitudeX;
        float BobY = FMath::Sin(BobTimer) * BobAmplitudeY;

        // Apply visual offsets
        FVector TargetRelativePos = OriginalCameraRelativePos;
        TargetRelativePos.X += BobX; // Sway forward/backward or left/right depending on preference
        TargetRelativePos.Z += BobY; // Bounce vertical height

        FPSCameraComponent->SetRelativeLocation(TargetRelativePos);
    }
    else
    {
        // Feature 3.2: Return camera to center smoothly when the player stops walking
        BobTimer = 0.0f;
        FVector CurrentRelativePos = FPSCameraComponent->GetRelativeLocation();
        FVector CleanTargetPos = FMath::VInterpTo(CurrentRelativePos, OriginalCameraRelativePos, DeltaTime, BobReturnSpeed);
        FPSCameraComponent->SetRelativeLocation(CleanTargetPos);
    }
}
