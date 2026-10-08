// ===================================================================================
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
        // Feature 1.3: Lock and hide the mouse cursor in the center of the game screen on startup
        LockCursor();
    }

    private void Update()
    {
        // Standard FSM state check & physics loops
        _isGrounded = _characterController.isGrounded;

        HandleMouseLook();
        HandleMovementPhysics();
        HandleProceduralHeadBob();
    }

    /// <summary>
    /// Utility to capture the mouse pointer inside the game window for tactical gameplay.
    /// </summary>
    public void LockCursor()
    {
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
    }

    /// <summary>
    /// Utility to release the mouse cursor for UI interactions.
    /// </summary>
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

        // Fetch inputs multiplied by sensitivity
        float mouseX = Input.GetAxisRaw("Mouse X") * mouseSensitivity;
        float mouseY = Input.GetAxisRaw("Mouse Y") * mouseSensitivity;

        // Feature 1.1: Turn player body horizontally
        _horizontalRotation += mouseX;
        
        // Feature 1.2: Vertical head tilting
        _verticalRotation -= mouseY;
        // Clamp vertical angle to prevent flipping over (-80 to +80 degrees)
        _verticalRotation = Mathf.Clamp(_verticalRotation, -maxVerticalAngle, maxVerticalAngle);

        // Apply smooth interpolation to camera rotation to eliminate mouse hitching
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
        // Grounded check and vertical velocity reset
        if (_isGrounded && _moveVelocity.y < 0)
        {
            _moveVelocity.y = -2.0f; // Soft downward clamp keeping player glued to slopes
        }

        // Fetch directional inputs
        float moveX = Input.GetAxisRaw("Horizontal"); // A, D, Left, Right
        float moveZ = Input.GetAxisRaw("Vertical");   // W, S, Up, Down

        // Feature 2.1: Orient relative to the direction the player is looking
        _targetMoveDirection = (transform.forward * moveZ + transform.right * moveX).normalized;

        // Calculate dynamic maximum speed limit
        float currentMaxSpeed = walkSpeed;

        // Check tactical sprint inputs
        bool isSprinting = Input.GetKey(KeyCode.LeftShift) && moveZ > 0.1f;
        if (isSprinting)
        {
            currentMaxSpeed *= sprintMultiplier;
        }

        // Expandability: Slow down player slightly during reload sequences
        if (isReloading)
        {
            currentMaxSpeed *= 0.6f; // 40% speed penalty
        }

        // Expandability: Slow down player while aiming down sights (ADS)
        if (isAimingDownSights)
        {
            currentMaxSpeed *= 0.45f; // 55% tactical speed penalty
        }

        // Feature 2.2: Acceleration and deceleration smoothing (Inertial Drift)
        float targetSpeedX = _targetMoveDirection.x * currentMaxSpeed;
        float targetSpeedZ = _targetMoveDirection.z * currentMaxSpeed;

        float currentLerpRate = (_targetMoveDirection.sqrMagnitude > 0.01f) ? accelerationRate : decelerationRate;

        _moveVelocity.x = Mathf.Lerp(_moveVelocity.x, targetSpeedX, Time.deltaTime * currentLerpRate);
        _moveVelocity.z = Mathf.Lerp(_moveVelocity.z, targetSpeedZ, Time.deltaTime * currentLerpRate);

        // Jump mechanics
        if (_isGrounded && Input.GetButtonDown("Jump"))
        {
            _moveVelocity.y = jumpForce;
        }

        // Feature 2.3: Standard physics gravity
        _moveVelocity.y -= gravity * Time.deltaTime;

        // Pass composite vector to character controller component
        _characterController.Move(_moveVelocity * Time.deltaTime);
    }

    /// <summary>
    /// Feature 3: Realistic Procedural Head Bobbing
    /// Triggers horizontal and vertical sine waves when walking on ground, smoothly decays on stop.
    /// </summary>
    private void HandleProceduralHeadBob()
    {
        if (playerCamera == null) return;

        // Calculate horizontal moving speed magnitude (ignoring vertical falling)
        Vector3 flatVelocity = new Vector3(_characterController.velocity.x, 0.0f, _characterController.velocity.z);
        float moveSpeedMagnitude = flatVelocity.magnitude;

        // Feature 3.1: Bobbing triggers ONLY when actively moving on ground
        if (moveSpeedMagnitude > 0.15f && _isGrounded)
        {
            // Boost bobbing rate during sprints
            bool isSprinting = Input.GetKey(KeyCode.LeftShift) && Input.GetAxisRaw("Vertical") > 0.1f;
            float currentBobSpeed = isSprinting ? bobSpeed * sprintBobSpeedMultiplier : bobSpeed;

            // Compute bobbing timeline speed scaled by movement intensity
            _bobTimer += Time.deltaTime * currentBobSpeed * (moveSpeedMagnitude / walkSpeed);

            // Sine formula creating classic figure-8 camera gait bounce (bobY runs at 2x rate of bobX)
            float newBobX = Mathf.Cos(_bobTimer * 0.5f) * bobAmountX;
            float newBobY = Mathf.Sin(_bobTimer) * bobAmountY;

            // Offset from original camera coordinates
            Vector3 targetLocalPos = new Vector3(
                _cameraOriginalLocalPosition.x + newBobX,
                _cameraOriginalLocalPosition.y + newBobY,
                _cameraOriginalLocalPosition.z
            );

            playerCamera.localPosition = targetLocalPos;
        }
        else
        {
            // Feature 3.2: Return camera to center smoothly when the player stops walking
            _bobTimer = 0.0f; // Reset timer timeline
            playerCamera.localPosition = Vector3.Lerp(
                playerCamera.localPosition, 
                _cameraOriginalLocalPosition, 
                Time.deltaTime * bobReturnToCenterSpeed
            );
        }
    }
}
