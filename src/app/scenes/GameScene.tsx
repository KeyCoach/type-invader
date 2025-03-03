// GameScene.tsx (partial update with sound implementation)
import { Scene } from "phaser";
import { themeManager, soundManager } from "@/game";
import { GameMechanics } from "../../utils/GameMechanics";
import { GameUI } from "../../utils/GameUI";
import { MultiplierInfo } from "../constants/definitions";

export class GameScene extends Scene {
	private mode: "free" | "letter" = "free";
	private selectedLetter?: string;
	private isPaused: boolean = false;
	private isAdvancingLevel: boolean = false;
	private timer: number = 30;
	private spawnTimer?: Phaser.Time.TimerEvent;
	private ship!: Phaser.GameObjects.Sprite;

	// Our two main components
	private mechanics!: GameMechanics;
	private ui!: GameUI;

	constructor() {
		super({ key: "GameScene" });
	}

	async init(data: { mode: "free" | "letter"; letter?: string }) {
		this.mode = data.mode;
		this.selectedLetter = data.letter;
		this.isPaused = false;
		this.isAdvancingLevel = false;
		this.timer = 30;

		// Clean up any existing objects from previous games
		this.cleanupGameObjects();
	}

	private cleanupGameObjects() {
		// Stop the spawn timer if it exists
		if (this.spawnTimer) {
			this.spawnTimer.destroy();
			this.spawnTimer = undefined;
		}

		// Clear any existing timers
		this.time.removeAllEvents();
	}

	async create() {
		// Set up the theme and background
		themeManager.setScene(this);
		soundManager.setScene(this);

		// Switch from menu music to game music
		soundManager.playMusic("game");

		themeManager.createBackground();

		// Create the ship sprite
		const { width, height } = this.cameras.main;
		this.ship = this.add.sprite(width / 2, height - 50, "ship").setScale(0.75);

		// Initialize core systems
		this.mechanics = new GameMechanics(this);
		await this.mechanics.init(this.mode, this.selectedLetter);

		this.ui = new GameUI(this, this.togglePause.bind(this));

		// Set up keyboard input
		this.input.keyboard?.on("keydown", this.handleKeyInput, this);
		this.input.keyboard?.on("keydown-ESC", this.togglePause, this);

		// Show level text and start the game
		this.ui.showLevelText(1);
		this.startLevelTimer();
		this.startAsteroidSpawning();
	}

	update() {
		if (this.isPaused || this.isAdvancingLevel) return;

		// Update game mechanics
		const gameStatus = this.mechanics.update();

		// Check for game over condition
		if (!gameStatus) {
			this.gameOver();
		}
	}

	private handleKeyInput = (event: KeyboardEvent) => {
		if (this.isPaused || this.isAdvancingLevel) return;

		// Get result of key press
		const result = this.mechanics.handleKeyInput(event);

		if (result.isCorrect) {
			// Fire a missile at the asteroid
			if (result.asteroidX !== undefined && result.asteroidY !== undefined) {
				this.ui.createMissile(
					this.ship.x,
					this.ship.y,
					result.asteroidX,
					result.asteroidY
				);

				// Play missile fire sound
				soundManager.playMissileFire();
			}

			// If an asteroid was destroyed, update score display and play explosion
			if (result.destroyedAsteroid) {
				// Play explosion sound
				soundManager.playExplosion();

				const scoreResult = this.mechanics.getScore();
				this.ui.updateScore(scoreResult);
			}
		}

		// Update multiplier and progress bar display
		const multiplierInfo: MultiplierInfo = result.isCorrect
			? this.mechanics.updateMultiplier()
			: this.mechanics.resetMultiplierProgress();

		// Check if multiplierChanged exists and is true, or if we're resetting the multiplier
		if (multiplierInfo.multiplierChanged || !result.isCorrect) {
			this.ui.updateMultiplier(multiplierInfo.multiplier, true);
		}

		this.ui.updateProgressBar(multiplierInfo.progress);
	};

	private startLevelTimer() {
		this.time.removeAllEvents(); // Clear previous timers

		this.timer = 30;
		this.ui.updateTimer(this.timer);

		this.time.addEvent({
			delay: 1000,
			callback: () => {
				if (!this.isPaused && this.timer > 0) {
					this.timer -= 1;
					this.ui.updateTimer(this.timer);

					if (this.timer === 0) {
						this.advanceToNextLevel();
					}
				}
			},
			repeat: 29, // Runs for 30 seconds
		});
	}

	private startAsteroidSpawning() {
		if (this.spawnTimer) {
			this.spawnTimer.destroy();
		}

		// Calculate spawn rate based on level
		const level = this.mechanics.getLevel();
		const spawnRate = Math.max(800, 2000 - level * 100);

		this.spawnTimer = this.time.addEvent({
			delay: spawnRate,
			callback: () => {
				if (!this.isPaused && !this.isAdvancingLevel) {
					this.mechanics.spawnAsteroid();
				}
			},
			callbackScope: this,
			loop: true,
		});
	}

	private advanceToNextLevel() {
		if (this.isAdvancingLevel) return;
		this.isAdvancingLevel = true;

		// Show typing stats between levels
		const stats = this.mechanics.getTypingStats();
		const statsUI = this.ui.showStats(stats);

		statsUI.continueButton.on("pointerdown", () => {
			statsUI.destroy();

			// Clear asteroids and advance to the next level
			this.mechanics.clearAsteroids();

			// Update the level
			const newLevel = this.mechanics.advanceToNextLevel();
			this.ui.showLevelText(newLevel);

			this.time.delayedCall(2000, () => {
				this.isAdvancingLevel = false;
				this.startLevelTimer();
				this.startAsteroidSpawning();
			});
		});
	}

	togglePause = () => {
		this.isPaused = !this.isPaused;

		if (this.isPaused) {
			// Pause game systems
			this.physics.world.isPaused = true;
			if (this.spawnTimer) this.spawnTimer.paused = true;
			this.time.paused = true;
			this.tweens.pauseAll();
			this.anims.pauseAll();
			this.scene.launch("PauseScene", { mainScene: this.scene.key });

			// Pause the sound
			this.sound.pauseAll();
		} else {
			// Resume game systems
			this.physics.world.isPaused = false;
			if (this.spawnTimer) this.spawnTimer.paused = false;
			this.time.paused = false;
			this.tweens.resumeAll();
			this.anims.resumeAll();
			this.scene.stop("PauseScene");

			// Resume sound
			this.sound.resumeAll();
		}
	};

	gameOver() {
		// Get final stats before game over
		const finalStats = this.mechanics.getTypingStats();

		// Start game over scene with score and stats
		this.scene.start("GameOverScene", {
			score: this.mechanics.getScore(),
			stats: finalStats,
		});
	}

	shutdown() {
		// Clean up
		this.input.keyboard?.off("keydown", this.handleKeyInput, this);
		this.input.keyboard?.off("keydown-ESC", this.togglePause, this);
		this.scene.stop("PauseScene");

		this.isPaused = false;

		if (this.spawnTimer) {
			this.spawnTimer.destroy();
			this.spawnTimer = undefined;
		}
		this.time.removeAllEvents();
	}
}
