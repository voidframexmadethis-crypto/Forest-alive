// ===================================================================================
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
    [Tooltip("The name of the playable gameplay level scene to load asynchronously.")]
    public string gameplaySceneName = "Level_PineForest_Dark";
    [Tooltip("Total duration of the introductory cutscene in seconds.")]
    public float cutsceneDuration = 8.5f;

    [Header("Hold-to-Skip UI Settings")]
    [Tooltip("Key which must be held down to skip the cutscene.")]
    public KeyCode skipKeySpace = KeyCode.Space;
    public KeyCode skipKeyEscape = KeyCode.Escape;
    [Tooltip("Time in seconds the skip key must be continuously held.")]
    public float requiredHoldTime = 1.5f;
    [Tooltip("Visual UI image representing the filling progress circle/ring.")]
    public Image skipProgressRing;
    [Tooltip("Canvas group containing the hold-to-skip UI elements for smooth fading.")]
    public CanvasGroup skipUiGroup;

    [Header("Camera & Controller Handovers")]
    [Tooltip("The camera used for rendering the cinematic cutscene.")]
    public Camera cinematicCamera;
    [Tooltip("The player character controller object in the gameplay scene (or local prefab).")]
    public GameObject playerControllerPrefab;
    [Tooltip("Dynamic reference to player controller once spawned or found.")]
    private MonoBehaviour _spawnedPlayerController;

    // --- Internal States & Async Operations ---
    private AsyncOperation _asyncLoadOperation;
    private float _cutsceneTimer = 0.0f;
    private float _skipHoldTimer = 0.0f;
    private bool _cutsceneCompleted = false;
    private bool _loadingTriggered = false;

    private void Start()
    {
        // Feature 1.2: Lock user inputs, hide standard combat/HUD overlays, and set mouse cursor constraints
        DisablePlayerInputAndHUD();

        // Feature 1.1: Activate cinematic perspective on startup
        if (cinematicCamera != null)
        {
            cinematicCamera.enabled = true;
        }

        if (skipUiGroup != null)
        {
            skipUiGroup.alpha = 0.0f; // Hide skip prompt until user taps a key
        }

        if (skipProgressRing != null)
        {
            skipProgressRing.fillAmount = 0.0f;
        }

        // Feature 3.1: Start Asynchronous background load of the playable map immediately
        StartCoroutine(StartBackgroundMapLoad());
    }

    private void Update()
    {
        if (_cutsceneCompleted) return;

        // 1. Process Cutscene duration progression
        _cutsceneTimer += Time.deltaTime;
        if (_cutsceneTimer >= cutsceneDuration)
        {
            OnCutsceneFinished();
            return;
        }

        // 2. Feature 2.2: Process hold-to-skip listener logic
        HandleHoldToSkipInput();
    }

    /// <summary>
    /// Feature 1.2: Disables player actions, locks camera control, and ensures a clean screen on boot.
    /// </summary>
    private void DisablePlayerInputAndHUD()
    {
        // Lock cursor centered for look setup transitions
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;

        // If player controller exists in the scene, disable its movement scripts
        if (playerControllerPrefab != null)
        {
            playerControllerPrefab.SetActive(false);
        }
    }

    /// <summary>
    /// Feature 3: Asynchronous Scene Transition
    /// Loads the main playable level in a separate thread without stuttering.
    /// </summary>
    private IEnumerator StartBackgroundMapLoad()
    {
        yield return new WaitForSeconds(0.5f); // Give the renderer a frame to stabilize

        _asyncLoadOperation = SceneManager.LoadSceneAsync(gameplaySceneName, LoadSceneMode.Single);
        
        // Prevent scene from instantly displaying while cutscene is running
        _asyncLoadOperation.allowSceneActivation = false;
        _loadingTriggered = true;

        while (!_asyncLoadOperation.isDone)
        {
            // Progress represents 0 to 0.9. At 0.9, the scene is fully loaded and waiting for allowSceneActivation = true.
            float loadProgress = Mathf.Clamp01(_asyncLoadOperation.progress / 0.9f);
            
            // Expandability: Sync loadProgress with a loading slide bar if needed
            yield return null;
        }
    }

    /// <summary>
    /// Feature 2.2: Monitors key hold states and displays a circular progress ring.
    /// </summary>
    private void HandleHoldToSkipInput()
    {
        bool isHoldingSkip = Input.GetKey(skipKeySpace) || Input.GetKey(skipKeyEscape);

        if (isHoldingSkip)
        {
            // Smoothly fade in holding UI if hidden
            if (skipUiGroup != null && skipUiGroup.alpha < 1.0f)
            {
                skipUiGroup.alpha = Mathf.MoveTowards(skipUiGroup.alpha, 1.0f, Time.deltaTime * 4.0f);
            }

            // Increment key hold timer
            _skipHoldTimer += Time.deltaTime;
            float fillPct = Mathf.Clamp01(_skipHoldTimer / requiredHoldTime);

            if (skipProgressRing != null)
            {
                skipProgressRing.fillAmount = fillPct;
            }

            // If threshold is reached, skip immediately
            if (_skipHoldTimer >= requiredHoldTime)
            {
                OnCutsceneFinished();
            }
        }
        else
        {
            // Decresing fade: smoothly drain progress bar if user releases key early
            _skipHoldTimer = Mathf.MoveTowards(_skipHoldTimer, 0.0f, Time.deltaTime * 2.0f);
            float fillPct = Mathf.Clamp01(_skipHoldTimer / requiredHoldTime);

            if (skipProgressRing != null)
            {
                skipProgressRing.fillAmount = fillPct;
            }

            // Smoothly fade out skip UI overlay when inactive
            if (skipUiGroup != null && skipUiGroup.alpha > 0.0f && _skipHoldTimer <= 0.01f)
            {
                skipUiGroup.alpha = Mathf.MoveTowards(skipUiGroup.alpha, 0.0f, Time.deltaTime * 2.0f);
            }
        }
    }

    /// <summary>
    /// Optimization callback triggered when cutscene finishes or is skipped.
    /// </summary>
    private void OnCutsceneFinished()
    {
        _cutsceneCompleted = true;
        
        if (skipUiGroup != null)
        {
            skipUiGroup.alpha = 0.0f;
        }

        StartCoroutine(ExecuteTransitionHandovers());
    }

    /// <summary>
    /// Feature 3.2: Seamlessly transitions camera view and activates player controls on level loaded.
    /// </summary>
    private IEnumerator ExecuteTransitionHandovers()
    {
        // Ensure background load is initialized
        if (!_loadingTriggered)
        {
            _asyncLoadOperation = SceneManager.LoadSceneAsync(gameplaySceneName);
            _asyncLoadOperation.allowSceneActivation = true;
        }
        else
        {
            // Feature 3.1: Activate the pre-loaded scene instantly
            _asyncLoadOperation.allowSceneActivation = true;
        }

        // Wait until scene loads completely
        while (!_asyncLoadOperation.isDone)
        {
            yield return null;
        }

        // Playable level scene loaded! Search for the player or instantiate controller
        GameObject playerObj = GameObject.FindGameObjectWithTag("Player");
        if (playerObj == null && playerControllerPrefab != null)
        {
            playerObj = Instantiate(playerControllerPrefab, Vector3.zero, Quaternion.identity);
        }

        if (playerObj != null)
        {
            // Feature 3.2: Transition camera view by disabling cinematic and enabling player camera
            if (cinematicCamera != null)
            {
                cinematicCamera.enabled = false;
            }

            // Feature 4: Enable Player Controller, lock cursor, and activate HUD
            playerObj.SetActive(true);
            
            // Search for custom script components on player controller
            _spawnedPlayerController = playerObj.GetComponent<MonoBehaviour>(); // Substitute with your specific FPS controller class
            if (_spawnedPlayerController != null)
            {
                _spawnedPlayerController.enabled = true;
            }

            // Lock and center cursor for gameplay
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;

            // Trigger HUD Activation via static event or broadcast
            GameHUDManager.ActivateGameplayHUD(); // Substitute with your specific UI callback
        }

        Debug.Log("SceneTransitionManager: Transition handover complete. Player has full control.");
    }
}

// Dummy interface representational class for compile checks
public static class GameHUDManager
{
    public static void ActivateGameplayHUD()
    {
        // Implementation enabling Canvas, Crosshairs, Stamina sliders etc.
    }
}
