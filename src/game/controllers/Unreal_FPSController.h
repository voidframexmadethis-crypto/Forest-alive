// ===================================================================================
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
    // Sets default values for this character's properties
    AUnreal_FPSController();

protected:
    // Called when the game starts or when spawned
    virtual void BeginPlay() override;

public:	
    // Called every frame
    virtual void Tick(float DeltaTime) override;

    // Called to bind functionality to input
    virtual void SetupPlayerInputComponent(class UInputComponent* PlayerInputComponent) override;

    // --- LOOK ROTATION LOGIC ---
    void LookRight(float Value);
    void LookUp(float Value);

    // --- MOVEMENT LOGIC ---
    void MoveForward(float Value);
    void MoveRight(float Value);

    // --- SUB-FUNCTIONS ---
    void HandleDynamicSpeeds();
    void HandleProceduralHeadBob(float DeltaTime);

public:
    // --- LOOK PROPERTIES ---
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "FPS Look")
    float MouseSensitivity;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "FPS Look")
    float LookSmoothing;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "FPS Look")
    float MaxVerticalAngle;

    // --- PHYSICS SPEEDS ---
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "FPS Movement")
    float WalkSpeedUE;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "FPS Movement")
    float SprintMultiplier;

    // --- PROCEDURAL BOBBING ---
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

    // --- STATE TOGGLES ---
    UPROPERTY(BlueprintReadWrite, Category = "FPS Weapon State")
    bool bIsReloading;

    UPROPERTY(BlueprintReadWrite, Category = "FPS Weapon State")
    bool bIsAimingDownSights;

    UPROPERTY(BlueprintReadWrite, Category = "FPS Movement State")
    bool bIsSprinting;

private:
    // Camera references
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Camera", meta = (AllowPrivateAccess = "true"))
    class UCameraComponent* FPSCameraComponent;

    // Saved coordinates
    FVector OriginalCameraRelativePos;
    float BobTimer;
};
