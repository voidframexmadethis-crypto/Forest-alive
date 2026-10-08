# ===================================================================================
#  Call of Duty-Style Cinematic-to-Gameplay Scene Transition Manager (Godot 4.x GDScript)
#  Engine: Godot 4 (Compatible with 4.0, 4.1, 4.2, 4.3+)
#  Node Tree Setup Requirement:
#  - Node (this script attached)
#    - Camera3D ("CinematicCamera")
#    - CanvasLayer ("SkipOverlay")
#      - Control ("SkipUIGroup")
#        - TextureProgressBar ("SkipProgressRing")
#  Designed for: Threaded non-blocking scene swaps, on-screen progressive skip,
#                and camera handovers.
# ===================================================================================

extends Node

@export_category("Scene Configuration")
## Path to the playable gameplay 3D level scene (.tscn)
@export_file("*.tscn") var gameplay_scene_path: String = "res://levels/pine_forest_dark.tscn"
## Total running time of the cinematic cutscene sequence
@export var cutscene_duration: float = 8.5

@export_category("Hold-to-Skip UI Settings")
## Action name mapped in Input Map, or default key codes
@export var skip_action: String = "ui_accept"  # Spacebar by default
@export var required_hold_time: float = 1.5
## Node references
@onready var cinematic_camera: Camera3D = $CinematicCamera
@onready var skip_ui_group: Control = $SkipOverlay/SkipUIGroup
@onready var skip_progress_ring: TextureProgressBar = $SkipOverlay/SkipUIGroup/SkipProgressRing

# Internal State Variables
var loading_status: int = 0
var progress: Array = []
var cutscene_timer: float = 0.0
var skip_hold_timer: float = 0.0
var cutscene_completed: bool = false
var scene_preloaded: bool = false

func _ready() -> void:
	# Feature 1.2: Disable standard mouse controls and freeze user gameplay actions
	disable_player_input_and_hud()

	# Feature 1.1: Activate the cinematic camera on scene entry
	if cinematic_camera:
		cinematic_camera.make_current()

	# Prepare Skip UI Group visibility and defaults
	if skip_ui_group:
		skip_ui_group.modulate.a = 0.0 # Hidden initially
	if skip_progress_ring:
		skip_progress_ring.value = 0.0
		skip_progress_ring.max_value = required_hold_time

	# Feature 3.1: Trigger multi-threaded async scene load requests
	if ResourceLoader.has_cached(gameplay_scene_path):
		scene_preloaded = true
	else:
		var err = ResourceLoader.load_threaded_request(gameplay_scene_path, "", false)
		if err != OK:
			push_error("SceneTransitionManager: Failed to initiate background thread scene load: %d" % err)

func _process(delta: float) -> void:
	if cutscene_completed:
		return

	# 1. Increment chronological timer
	cutscene_timer += delta
	if cutscene_timer >= cutscene_duration:
		on_cutscene_finished()
		return

	# 2. Track background load progression
	track_async_loading_status()

	# 3. Feature 2.2: Hold-to-skip input listener logic
	handle_hold_to_skip_input(delta)

## Feature 1.2: Hides the mouse, disables HUD layout, and locks player controls.
func disable_player_input_and_hud() -> void:
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)

## Monitors Godot's internal background thread loader.
func track_async_loading_status() -> void:
	if not scene_preloaded:
		loading_status = ResourceLoader.load_threaded_get_status(gameplay_scene_path, progress)
		if loading_status == ResourceLoader.THREAD_LOAD_LOADED:
			scene_preloaded = true

## Feature 2.2: Calculates progressive keyhold duration and animates skip UI.
func handle_hold_to_skip_input(delta: float) -> void:
	var is_holding = Input.is_action_pressed(skip_action) or Input.is_key_pressed(KEY_ESCAPE) or Input.is_key_pressed(KEY_SPACE)

	if is_holding:
		# Fade in hold prompt
		if skip_ui_group and skip_ui_group.modulate.a < 1.0:
			skip_ui_group.modulate.a = move_toward(skip_ui_group.modulate.a, 1.0, delta * 4.0)

		# Add holding time
		skip_hold_timer += delta
		if skip_progress_ring:
			skip_progress_ring.value = skip_hold_timer

		# Skip threshold met!
		if skip_hold_timer >= required_hold_time:
			on_cutscene_finished()
	else:
		# Decay hold meter back to 0
		skip_hold_timer = move_toward(skip_hold_timer, 0.0, delta * 2.0)
		if skip_progress_ring:
			skip_progress_ring.value = skip_hold_timer

		# Fade out hold prompt
		if skip_ui_group and skip_ui_group.modulate.a > 0.0 and skip_hold_timer <= 0.01:
			skip_ui_group.modulate.a = move_toward(skip_ui_group.modulate.a, 0.0, delta * 2.0)

## Optimization callback fired on finish or bypass skip.
func on_cutscene_finished() -> void:
	cutscene_completed = true
	
	if skip_ui_group:
		skip_ui_group.visible = false

	# Execute transition handovers
	execute_transition_handovers()

## Feature 3.2: Handles async resource gathering, camera swap, and locks player.
func execute_transition_handovers() -> void:
	# Ensure scene is preloaded completely
	if not scene_preloaded:
		# Fallback blocking load if background thread is slow
		var loaded_scene_resource = ResourceLoader.load(gameplay_scene_path)
		instantiate_and_swap_scene(loaded_scene_resource)
	else:
		# Gather background loaded scene resource
		var loaded_scene_resource = ResourceLoader.load_threaded_get(gameplay_scene_path)
		instantiate_and_swap_scene(loaded_scene_resource)

func instantiate_and_swap_scene(scene_resource: PackedScene) -> void:
	if not scene_resource:
		push_error("SceneTransitionManager: Failed to resolve level scene resource.")
		return

	# Instance gameplay level
	var gameplay_scene_node = scene_resource.instantiate()
	
	# Fetch root viewport
	var root = get_tree().root
	
	# Feature 3: Asynchronous Scene Transition
	# Add gameplay scene node to root and free the cutscene node
	root.add_child(gameplay_scene_node)
	get_tree().current_scene = gameplay_scene_node
	
	# Feature 4: Enable Player Controller, lock cursor, and activate HUD
	# Search for player controller inside instanced node
	var player = gameplay_scene_node.find_child("Player", true, false)
	if player:
		# Re-enable standard looking and movement variables
		if player.has_method("lock_mouse"):
			player.call("lock_mouse")
		
		# Set player camera active (swapping cinematic perspective)
		var player_camera = player.find_child("Camera3D", true, false)
		if player_camera:
			player_camera.make_current()

		# Enable HUD widgets via signals or direct calls
		var hud = gameplay_scene_node.find_child("HUD", true, false)
		if hud:
			hud.visible = true

	# Finally, release this cutscene transition orchestrator
	queue_free()
	print("SceneTransitionManager: Handover complete. Level gameplay active.")
