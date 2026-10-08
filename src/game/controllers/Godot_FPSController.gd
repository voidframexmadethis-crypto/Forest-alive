# ===================================================================================
#  Call of Duty-Style 3D First-Person Player Controller (Godot 4.x GDScript)
#  Engine: Godot 4 (Compatible with 4.0, 4.1, 4.2, 4.3+)
#  Node Tree Setup Requirement:
#  - CharacterBody3D (this script attached)
#    - CollisionShape3D
#    - Node3D ("Head" or "CameraPivot")
#      - Camera3D
#  Designed for: High-fidelity FPS motion, cursor locking, and modular mechanics.
# ===================================================================================

class_name Godot_FPSController
extends CharacterBody3D

@export_category("First-Person Mouse Look Settings")
## Dampened Mouse Sensitivity. Adjust to match user DPI.
@export var mouse_sensitivity: float = 0.002
## Filter interpolation factor for looking (yaw/pitch smoothing).
@export var look_smoothing: float = 20.0
## Maximum tilt angle up and down in degrees (80 ensures COD boundary).
@export var max_vertical_angle_deg: float = 80.0

@export_category("Call of Duty-Style Movement Physics")
## Baseline walk speed in meters per second.
@export var walk_speed: float = 6.0
## Tactical sprinting speed multiplier.
@export var sprint_multiplier: float = 1.7
## Accelerative force rate on input press (inertial slide-in).
@export var acceleration_rate: float = 10.0
## Decelerative friction rate on input release (inertial stop drift).
@export var deceleration_rate: float = 8.0
## Upward impulse force applied on jumps.
@export var jump_velocity: float = 8.0

@export_category("Realistic Procedural Head Bobbing")
## Frequency pace of the walking bob cycle.
@export var bob_frequency: float = 8.0
## Sprint bob frequency acceleration scale.
@export var sprint_bob_speed_multiplier: float = 1.6
## Maximum horizontal bob sway (cosine).
@export var bob_amplitude_x: float = 0.03
## Maximum vertical bob bounce (sine).
@export var bob_amplitude_y: float = 0.05
## Return-to-center speed when player stops.
@export var bob_return_speed: float = 10.0

# Node References
@onready var head_node: Node3D = $Head
@onready var camera: Camera3D = $Head/Camera3D

# Internal States
var gravity: float = 24.5  # Realistic gravity constant
var yaw_input: float = 0.0
var pitch_input: float = 0.0
var bob_timer: float = 0.0
var original_camera_pos: Vector3

# Expandability triggers (for reloading or aiming slowdown checks)
var is_reloading: bool = false
var is_aiming_down_sights: bool = false

func _ready() -> void:
	# Verify Node hierarchy layout
	if not head_node or not camera:
		push_error("FPSController: Required child nodes 'Head' or 'Head/Camera3D' missing.")
		return
		
	original_camera_pos = camera.position
	
	# Feature 1.3: Lock and hide the mouse cursor in the center of the game screen on startup
	lock_mouse()

func _unhandled_input(event: InputEvent) -> void:
	# Capture mouse movements for camera look triggers
	if event is InputEventMouseMotion and Input.get_mouse_mode() == Input.MOUSE_MODE_CAPTURED:
		yaw_input -= event.relative.x * mouse_sensitivity
		pitch_input -= event.relative.y * mouse_sensitivity
		
		# Feature 1.2: Vertical head tilting clamp (-80 to +80 degrees mapped to radians)
		var max_pitch_rad = deg_to_rad(max_vertical_angle_deg)
		pitch_input = clamp(pitch_input, -max_pitch_rad, max_pitch_rad)

func _physics_process(delta: float) -> void:
	handle_movement_physics(delta)
	handle_mouse_look(delta)
	handle_procedural_head_bob(delta)

## Capture mouse pointer inside the viewport.
func lock_mouse() -> void:
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)

## Release mouse pointer for menu layouts.
func unlock_mouse() -> void:
	Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)

## Feature 1: First-Person Mouse Look
## Smoothly interpolates head tilting and player body rotation.
func handle_mouse_look(delta: float) -> void:
	if Input.get_mouse_mode() != Input.MOUSE_MODE_CAPTURED:
		return
		
	# Smoothly rotate the player body horizontally (yaw turns the CharacterBody3D node)
	rotation.y = lerp_angle(rotation.y, yaw_input, delta * look_smoothing)
	
	# Smoothly tilt the head vertically (pitch tilts the Head Node3D parent of camera)
	head_node.rotation.x = lerp_angle(head_node.rotation.x, pitch_input, delta * look_smoothing)

## Feature 2: Call of Duty-Style Walking Mechanics
## Translates WASD keys, adds sliding deceleration, and processes standard gravity.
func handle_movement_physics(delta: float) -> void:
	# Feature 2.3: Standard physics gravity
	if not is_on_floor():
		velocity.y -= gravity * delta
	else:
		velocity.y = clamp(velocity.y, -2.0, 999.0) # lock downward sliding on slopes

	# Process Jump trigger
	if Input.is_action_just_pressed("ui_accept") and is_on_floor():
		velocity.y = jump_velocity

	# Get WASD input vectors
	var input_dir: Vector2 = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	
	# Feature 2.1: Orient relative to the direction the player is looking
	# global_transform.basis allows relative alignment based on current yaw rotation
	var direction: Vector3 = (global_transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()

	# Define maximum speed limit with standard COD tactical sprint multiplier
	var target_speed: float = walk_speed
	var is_sprinting: bool = Input.is_key_pressed(KEY_SHIFT) and input_dir.y < -0.1
	
	if is_sprinting:
		target_speed *= sprint_multiplier
		
	# Expandability: Slow down player during reload state
	if is_reloading:
		target_speed *= 0.6  # 40% reload speed penalty
		
	# Expandability: Slow down player while Aiming Down Sights (ADS)
	if is_aiming_down_sights:
		target_speed *= 0.45 # 55% ADS speed penalty

	# Feature 2.2: Acceleration and deceleration smoothing (Inertial Drift)
	var target_vel_x: float = direction.x * target_speed
	var target_vel_z: float = direction.z * target_speed
	
	# Select appropriate interpolation rate based on active input
	var active_interpolation = acceleration_rate if direction.length_squared() > 0.01 else deceleration_rate

	velocity.x = lerp(velocity.x, target_vel_x, delta * active_interpolation)
	velocity.z = lerp(velocity.z, target_vel_z, delta * active_interpolation)

	# Execute actual motion and solve collisions
	move_and_slide()

## Feature 3: Realistic Procedural Head Bobbing
## Computes an exact sine-wave bobbing sequence when moving, returning smoothly to center on halt.
func handle_procedural_head_bob(delta: float) -> void:
	# Calculate flat horizontal velocity magnitude
	var flat_velocity: Vector3 = Vector3(velocity.x, 0.0, velocity.z)
	var move_speed_magnitude: float = flat_velocity.length()

	# Feature 3.1: Bobbing triggers ONLY when moving on the ground
	if move_speed_magnitude > 0.15 and is_on_floor():
		var is_sprinting: bool = Input.is_key_pressed(KEY_SHIFT) and velocity.dot(-global_transform.basis.z) > 0.5
		var current_bob_frequency = bob_frequency * sprint_bob_speed_multiplier if is_sprinting else bob_frequency
		
		# Progress bobbing timeline scaled by velocity intensity
		bob_timer += delta * current_bob_frequency * (move_speed_magnitude / walk_speed)

		# Traditional figure-8 camera bounce: Cosine for horizontal sway, Sine for vertical hop
		var bob_x: float = cos(bob_timer * 0.5) * bob_amplitude_x
		var bob_y: float = sin(bob_timer) * bob_amplitude_y

		# Set localized camera positions offset by original heights
		camera.position.x = original_camera_pos.x + bob_x
		camera.position.y = original_camera_pos.y + bob_y
	else:
		# Feature 3.2: Return camera to center smoothly when the player stops walking
		bob_timer = 0.0
		camera.position = camera.position.lerp(original_camera_pos, delta * bob_return_speed)
