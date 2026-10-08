// ===================================================================================
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
    // Sets default values for this actor's properties
    AUnreal_SceneTransitionManager();

protected:
    // Called when the game starts or when spawned
    virtual void BeginPlay() override;

public:
    // Called every frame
    virtual void Tick(float DeltaTime) override;

    // --- SYSTEMS FLOW METHODS ---
    void DisablePlayerInputsAndHUD();
    void TriggerAsyncLevelLoad();
    void HandleHoldToSkipInput(float DeltaTime);
    void UpdateWidgetProgressRing(float Percentage);
    void OnCutsceneFinished();
    void ExecuteTransitionHandovers();
    void TriggerGameplayHUDActivation();

    // Callback on async level loaded
    UFUNCTION()
    void OnLevelAsyncLoadComplete();

public:
    // --- SCENE PARAMETERS ---
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Transition Configuration")
    FName GameplayLevelName;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Transition Configuration")
    float CutsceneDuration;

    // --- HOLD SKIP CONFIGURATION ---
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Skip Settings")
    float RequiredHoldTime;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Skip Settings")
    TSubclassOf<class UUserWidget> SkipWidgetClass;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Transition Camera")
    AActor* CinematicCameraActor;

private:
    // State indicators
    float SkipHoldTimer;
    float CutsceneTimer;
    bool bCutsceneCompleted;
    bool bLevelLoaded;

    UPROPERTY()
    class UUserWidget* SkipWidgetInstance;
};
