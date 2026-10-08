// ===================================================================================
//  Call of Duty-Style Cinematic-to-Gameplay Scene Transition Manager (Unreal Engine C++)
//  Engine: Unreal Engine 5 (Compatible with UE 5.0, 5.1, 5.2, 5.3, 5.4, 5.5)
//  Parent Class Requirement: AActor
//  Designed for: Seamless streaming loads, keyhold skip trackers, UMG circle bindings.
// ===================================================================================

#include "Unreal_SceneTransitionManager.h"
#include "Kismet/GameplayStatics.h"
#include "GameFramework/PlayerController.h"
#include "GameFramework/Character.h"
#include "Camera/CameraComponent.h"
#include "Blueprint/UserWidget.h"

AUnreal_SceneTransitionManager::AUnreal_SceneTransitionManager()
{
    PrimaryActorTick.bCanEverTick = true;

    // Set configuration defaults
    GameplayLevelName = FName(TEXT("Level_PineForest_Dark"));
    CutsceneDuration = 8.5f;

    RequiredHoldTime = 1.5f;
    SkipHoldTimer = 0.0f;
    CutsceneTimer = 0.0f;
    bCutsceneCompleted = false;
    bLevelLoaded = false;
}

void AUnreal_SceneTransitionManager::BeginPlay()
{
    Super::BeginPlay();

    // Feature 1.2: Lock user movement and restrict combat UI overlay immediately on launch
    DisablePlayerInputsAndHUD();

    // Feature 1.1: Transition active viewport to our cinematic camera perspective
    APlayerController* PC = UGameplayStatics::GetPlayerController(GetWorld(), 0);
    if (PC && CinematicCameraActor)
    {
        // Snap camera instantly to cinematic target
        PC->SetViewTargetWithBlend(CinematicCameraActor, 0.0f);
    }

    // Instanciate the Hold-To-Skip Overlay widget
    if (SkipWidgetClass)
    {
        SkipWidgetInstance = CreateWidget<UUserWidget>(GetWorld(), SkipWidgetClass);
        if (SkipWidgetInstance)
        {
            SkipWidgetInstance->AddToViewport();
            // Set opacity of skip UI to hidden initially
            SkipWidgetInstance->SetRenderOpacity(0.0f);
        }
    }

    // Feature 3.1: Kick off Asynchronous Level preloading via Streaming or Package Loaders
    TriggerAsyncLevelLoad();
}

void AUnreal_SceneTransitionManager::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    if (bCutsceneCompleted) return;

    // 1. Advance the chronological cutscene timer
    CutsceneTimer += DeltaTime;
    if (CutsceneTimer >= CutsceneDuration)
    {
        OnCutsceneFinished();
        return;
    }

    // 2. Feature 2.2: Hold-to-skip input listener logic
    HandleHoldToSkipInput(DeltaTime);
}

/// <summary>
/// Feature 1.2: Freezes player pawn input and constraints cursor layout.
/// </summary>
void AUnreal_SceneTransitionManager::DisablePlayerInputsAndHUD()
{
    APlayerController* PC = UGameplayStatics::GetPlayerController(GetWorld(), 0);
    if (PC)
    {
        // Restrict viewport looking/rotation actions
        PC->DisableInput(PC);
        
        // Ensure cursor is locked to viewport but hidden
        FInputModeGameOnly InputMode;
        PC->SetInputMode(InputMode);
        PC->bShowMouseCursor = false;
    }
}

/// <summary>
/// Feature 3: Asynchronous Level Loading
/// Utilizes streaming levels in Unreal to pre-cache assets on background threads.
/// </summary>
void AUnreal_SceneTransitionManager::TriggerAsyncLevelLoad()
{
    FLatentActionInfo LatentInfo;
    LatentInfo.CallbackTarget = this;
    LatentInfo.ExecutionFunction = FName(TEXT("OnLevelAsyncLoadComplete"));
    LatentInfo.Linkage = 1;
    LatentInfo.UUID = 12345;

    // Load stream level asynchronously in background thread
    UGameplayStatics::LoadStreamLevel(this, GameplayLevelName, true, false, LatentInfo);
}

void AUnreal_SceneTransitionManager::OnLevelAsyncLoadComplete()
{
    bLevelLoaded = true;
    UE_LOG(LogTemp, Warning, TEXT("SceneTransitionManager: Playable Map loaded asynchronously. Waiting for cutscene completion."));
}

/// <summary>
/// Feature 2.2: Calculates dynamic skip inputs, lerps widget rings, and triggers finish.
/// </summary>
void AUnreal_SceneTransitionManager::HandleHoldToSkipInput(float DeltaTime)
{
    APlayerController* PC = UGameplayStatics::GetPlayerController(GetWorld(), 0);
    if (!PC) return;

    // Check if the Spacebar or Escape keys are pressed in this frame
    bool bIsHoldingSkip = PC->IsInputKeyDown(EKeys::SpaceBar) || PC->IsInputKeyDown(EKeys::Escape);

    if (bIsHoldingSkip)
    {
        // Fade in UMG widget prompt smoothly if hidden
        if (SkipWidgetInstance && SkipWidgetInstance->GetRenderOpacity() < 1.0f)
        {
            float NewOpacity = FMath::FInterpTo(SkipWidgetInstance->GetRenderOpacity(), 1.0f, DeltaTime, 4.0f);
            SkipWidgetInstance->SetRenderOpacity(NewOpacity);
        }

        // Advance skip holding progress
        SkipHoldTimer += DeltaTime;
        float ProgressPct = FMath::Clamp(SkipHoldTimer / RequiredHoldTime, 0.0f, 1.0f);

        // Update progress bar parameter in UMG Widget Blueprint
        UpdateWidgetProgressRing(ProgressPct);

        // Skiped! Handover controls instantly
        if (SkipHoldTimer >= RequiredHoldTime)
        {
            OnCutsceneFinished();
        }
    }
    else
    {
        // Drain hold meter back to 0
        SkipHoldTimer = FMath::FInterpTo(SkipHoldTimer, 0.0f, DeltaTime, 2.0f);
        float ProgressPct = FMath::Clamp(SkipHoldTimer / RequiredHoldTime, 0.0f, 1.0f);

        UpdateWidgetProgressRing(ProgressPct);

        // Fade out widget prompt smoothly once completely drained
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
        // Calls the custom UFUNCTION of SkipWidget Blueprint to set radial brush material values
        FOutputDeviceNull Ar;
        FString Cmd = FString::Printf(TEXT("SetProgressRingPercent %f"), Percentage);
        SkipWidgetInstance->CallFunctionByNameWithArguments(*Cmd, Ar, NULL, true);
    }
}

/// <summary>
/// Optimization callback indicating cutscene completion.
/// </summary>
void AUnreal_SceneTransitionManager::OnCutsceneFinished()
{
    bCutsceneCompleted = true;

    if (SkipWidgetInstance)
    {
        SkipWidgetInstance->RemoveFromParent();
    }

    ExecuteTransitionHandovers();
}

/// <summary>
/// Feature 3.2: Seamless camera blend target and controller handover logic.
/// </summary>
void AUnreal_SceneTransitionManager::ExecuteTransitionHandovers()
{
    APlayerController* PC = UGameplayStatics::GetPlayerController(GetWorld(), 0);
    if (!PC) return;

    // Fetch spawned Gameplay Player Character
    ACharacter* PlayerChar = UGameplayStatics::GetPlayerCharacter(GetWorld(), 0);

    if (PlayerChar)
    {
        // Feature 3.2: Blend the active viewport view target from cinematic camera to player camera smoothly (0.5s blend)
        PC->SetViewTargetWithBlend(PlayerChar, 0.5f, VTBlend_Cubic);

        // Wait for blend completion before transferring input authority
        FTimerHandle InputTimerHandle;
        GetWorldTimerManager().SetTimer(InputTimerHandle, [this, PC, PlayerChar]()
        {
            // Feature 4: Enable Player Controller, lock cursor, and activate HUD
            PC->EnableInput(PC);

            // Re-enforce gameplay pointer lock criteria
            FInputModeGameOnly InputMode;
            PC->SetInputMode(InputMode);
            PC->bShowMouseCursor = false;

            // Trigger HUD blueprint widgets
            TriggerGameplayHUDActivation();

            // Finally, destroy this orchestrator actor instance
            this->Destroy();

        }, 0.5f, false);
    }
}

void AUnreal_SceneTransitionManager::TriggerGameplayHUDActivation()
{
    // Custom execution triggering screen widgets on player UI
    UE_LOG(LogTemp, Log, TEXT("SceneTransitionManager: HUD activated. Controls handed over to player."));
}
