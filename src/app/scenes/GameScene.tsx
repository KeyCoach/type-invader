import { Scene } from "phaser";
// import { wordPool } from "../constants/wordPool";
import {
	fetchWordsByLetterAndLength,
	extractWords,
	fetchWordsForFreePlay,
} from "../constants/words-api";
import { colors, hexadecimalColors } from "../constants/colors";
import PauseButton from "../../components/PauseButton";
import { themeManager } from "@/game";

const MULTIPLIER_THRESHOLDS = {
	2: 30,
	3: 75,
	4: 135,
};

interface Asteroid {
	sprite: Phaser.GameObjects.Sprite;
	text: Phaser.GameObjects.Text;
	originalWord: string;
	word: string;
}

const getRequiredCharactersForCurrentLevel = (chars: number): number => {
	if (chars < MULTIPLIER_THRESHOLDS[2]) return 30;
	if (chars < MULTIPLIER_THRESHOLDS[3]) return 45;
	if (chars < MULTIPLIER_THRESHOLDS[4]) return 60;
	return 60; // Max level
};

export class GameScene extends Scene {
	private mode: "free" | "letter" = "free";
	private selectedLetter?: string;
	private wordPool: string[] = [];
	private length: number = 5; // need to figure out how to determine this
	private asteroids: Asteroid[] = [];
	private score: number = 0;
	private scoreText!: Phaser.GameObjects.Text;
	private scoreUpdateText!: Phaser.GameObjects.Text;
	private ship!: Phaser.GameObjects.Sprite;
	// part of resetting the game
	private spawnTimer?: Phaser.Time.TimerEvent;

	// props for adding levels
	private levelText!: Phaser.GameObjects.Text; // New: For displaying the level
	private timerText!: Phaser.GameObjects.Text; // New: For displaying the countdown timer
	private level: number = 1; // New: Tracks the current level
	private timer: number = 30; // New: Tracks remaining time for the level
	private asteroidSpeed: number = 1; // New: Adjusts asteroid fall speed

	// properties for multiplier and progress bar
	private multiplier: number = 1;
	private multiplierText!: Phaser.GameObjects.Text;
	private correctCharacters: number = 0;
	private progressBar!: Phaser.GameObjects.Graphics;
	private progressBarBg!: Phaser.GameObjects.Graphics;

	// props for pausing and advancing levels
	private isPaused: boolean = false;
	private isAdvancingLevel: boolean = false;

	constructor() {
		super({ key: "GameScene" });
	}

	private async loadWordsForLevel(
		letter: string,
		length: number
	): Promise<string[]> {
		try {
			// fetchWordsByLetterAndLength already returns string[]
			return await fetchWordsByLetterAndLength(letter, length);
			// Don't call extractWords here - it's for processing DatamuseWord[], not string[]
		} catch (error) {
			console.error("Error loading words for level:", error);
			return [];
		}
	}

	async init(data: { mode: "free" | "letter"; letter?: string }) {
		this.mode = data.mode;
		this.selectedLetter = data.letter;
		this.score = 0;
		this.multiplier = 1;
		this.correctCharacters = 0;
		this.asteroids = [];

		// Reset the level and pause state
		this.level = 1;
		this.isPaused = false; // Ensure game is not paused when restarting

		// Clear existing game objects
		this.cleanupGameObjects();

		try {
			if (this.mode === "free") {
				this.wordPool = await fetchWordsForFreePlay(this.length); // Use this.length
			} else if (this.mode === "letter" && this.selectedLetter) {
				this.wordPool = await fetchWordsByLetterAndLength(
					this.selectedLetter,
					this.length
				); // Use this.length
			}
		} catch (error) {
			console.error("Error initializing word pool:", error);
			this.wordPool = []; // Prevent crashes if API fails
		}
	}

	private cleanupGameObjects() {
		// Stop the spawn timer if it exists
		if (this.spawnTimer) {
			this.spawnTimer.destroy();
		}

		// Clear any existing asteroids
		this.asteroids.forEach((asteroid) => {
			asteroid.sprite.destroy();
			asteroid.text.destroy();
		});

		// Clear any existing particle systems
		this.children.list
			.filter(
				(child) => child instanceof Phaser.GameObjects.Particles.ParticleEmitter
			)
			.forEach((child) => child.destroy());
	}

	async create() {
		const { width, height } = this.cameras.main;

		// Ensure the game is not paused when restarting
		this.isPaused = false;

		// Ensure timer starts correctly when the game restarts
		this.timer = 30;

		// Background and ship
		this.input.keyboard?.on("keydown-ESC", this.togglePause, this);

		themeManager.setScene(this);
		themeManager.createBackground();

		this.ship = this.add.sprite(width / 2, height - 50, "ship").setScale(0.75);

		// Score UI
		const scoreLabel = this.add.text(32, 520, "Score: ", {
			fontSize: "32px",
			fontFamily: "Monospace",
			color: colors.red,
		});

		this.scoreText = this.add.text(
			scoreLabel.x + scoreLabel.width - 2,
			520,
			"0",
			{
				fontSize: "32px",
				fontFamily: "Monospace",
				color: colors.white,
			}
		);

		// Level UI
		this.levelText = this.add
			.text(width / 2, height / 2, "", {
				fontSize: "48px",
				fontFamily: "Monospace",
				color: colors.yellow,
			})
			.setOrigin(0.5)
			.setAlpha(0);

		// Timer UI
		this.timerText = this.add.text(
			width - 110,
			520,
			`00:${String(this.timer).padStart(2, "0")}`,
			{
				fontSize: "32px",
				fontFamily: "Monospace",
				color: colors.white,
			}
		);

		// Pause Button
		new PauseButton(this, 25, 25, this.togglePause.bind(this));

		// Show the starting level
		this.showLevelText();

		// Start the level timer
		this.startLevelTimer();

		try {
			if (!this.wordPool.length) {
				if (this.mode === "free") {
					this.wordPool = await fetchWordsForFreePlay(this.length); // Use this.length
				} else if (this.mode === "letter" && this.selectedLetter) {
					this.wordPool = await fetchWordsByLetterAndLength(
						this.selectedLetter,
						this.length
					); // Use this.length
				}
			}
		} catch (error) {
			console.error("Error fetching words in create():", error);
		}

		// Start spawning asteroids
		this.spawnAsteroids();

		// Multiplier UI
		this.multiplierText = this.add.text(32, 485, "1x", {
			fontSize: "24px",
			fontFamily: "Monospace",
			color: colors.yellow,
		});

		// Set UI elements above asteroids
		scoreLabel.setDepth(2);
		this.scoreText.setDepth(2);
		this.multiplierText.setDepth(2);
		this.timerText.setDepth(2);

		// Progress bar setup
		this.progressBarBg = this.add.graphics();
		this.progressBarBg.fillStyle(0x666666, 0.3);
		this.progressBarBg.fillRect(0, height - 10, width, 10);

		// Create progress bar
		this.progressBar = this.add.graphics();
		this.updateProgressBar();

		// Set up keyboard input
		this.input.keyboard?.on("keydown", this.handleKeyInput, this);

		// Restart asteroid spawning timer
		if (this.spawnTimer) {
			this.spawnTimer.destroy(); // Ensure the previous timer is cleared
		}
		this.spawnTimer = this.time.addEvent({
			delay: 1000,
			callback: this.spawnAsteroid,
			callbackScope: this,
			loop: true,
		});

		// Ensure ESC key is properly set up to toggle pause
		this.input.keyboard?.on("keydown-ESC", this.togglePause, this);
	}

	private showLevelText() {
		if (!this.levelText) {
			console.error("Level text object is not initialized");
			return;
		}

		this.levelText.setText(`Level ${this.level}`).setAlpha(1);
		this.tweens.add({
			targets: this.levelText,
			alpha: 0,
			duration: 2000, // Fades out over 2 seconds before next level begins
		});
	}

	private startLevelTimer() {
		this.time.removeAllEvents(); // Clear previous timers

		this.timer = 30;
		this.timerText.setText(`00:${String(this.timer).padStart(2, "0")}`);

		this.time.addEvent({
			delay: 1000, // 1 second per tick
			callback: () => {
				if (!this.isPaused && this.timer > 0) {
					// Prevents negative numbers
					this.timer -= 1;
					this.timerText.setText(`00:${String(this.timer).padStart(2, "0")}`);

					if (this.timer === 0) {
						// Triggers only ONCE when timer reaches 0
						this.advanceToNextLevel();
					}
				}
			},
			repeat: 29, // Runs for 30 seconds
		});
	}

	private advanceToNextLevel() {
		if (this.isAdvancingLevel) return; // Prevents multiple level increments
		this.isAdvancingLevel = true;

		this.level += 1;
		this.showLevelText();

		// Destroy existing asteroids before the next level starts
		this.clearAsteroids();

		// Pause game momentarily before starting the new level
		this.time.delayedCall(3000, () => {
			this.isAdvancingLevel = false; // Reset flag after delay
			this.increaseDifficulty();
			this.startLevelTimer(); // Restart timer
			this.spawnAsteroids(); // Restart spawning
		});
	}

	private clearAsteroids() {
		// Destroy all existing asteroids when a new level starts
		this.asteroids.forEach((asteroid) => {
			asteroid.sprite.destroy();
			asteroid.text.destroy();
		});

		this.asteroids = []; // Clear the list
	}

	private increaseDifficulty() {
		// Increase asteroid speed
		this.asteroidSpeed = 1 + (this.level - 1) * 0.2; // Starts at 1 and increases

		// Increase word length after every few levels
		if (this.level % 3 === 0 && this.length < 10) {
			this.length += 1; // Increase word length cap
		}
	}

	private spawnAsteroids() {
		let spawnRate = 2000; // Default for level 1 (slower spawn rate)

		if (this.level > 1) {
			spawnRate = Math.max(800, 2000 - this.level * 100); // Faster spawns
		}

		if (this.spawnTimer) {
			this.spawnTimer.destroy(); // Destroy old timer before creating a new one
		}

		this.spawnTimer = this.time.addEvent({
			delay: spawnRate,
			callback: () => {
				if (!this.isPaused && this.asteroids.length < 5) {
					this.spawnAsteroid(); // Limit to 5 asteroids at a time
				}
			},
			callbackScope: this,
			loop: true,
		});
	}

	update() {
		if (this.isPaused) return; // Stop all updates if paused

		for (let i = this.asteroids.length - 1; i >= 0; i--) {
			const asteroid = this.asteroids[i];
			asteroid.sprite.y += this.asteroidSpeed;
			asteroid.text.y = asteroid.sprite.y;

			if (asteroid.sprite.y > this.cameras.main.height) {
				this.gameOver();
				break;
			}
		}
	}

	private togglePause() {
		this.isPaused = !this.isPaused;

		if (this.isPaused) {
			this.physics.world.isPaused = true;
			if (this.spawnTimer) this.spawnTimer.paused = true;
			this.time.paused = true;
			this.tweens.pauseAll();
			this.anims.pauseAll();
			this.scene.launch("PauseScene", { mainScene: this.scene.key });
		} else {
			this.physics.world.isPaused = false;
			if (this.spawnTimer) this.spawnTimer.paused = false;
			this.time.paused = false;
			this.tweens.resumeAll();
			this.anims.resumeAll();
			this.scene.stop("PauseScene");
		}
	}

	private updateProgressBar() {
		const { width, height } = this.cameras.main;

		const requiredChars = getRequiredCharactersForCurrentLevel(
			this.correctCharacters
		);

		let levelStartChars = 0;

		// Assigns the width and characters required for the current multiplier level
		if (this.correctCharacters >= MULTIPLIER_THRESHOLDS[3]) {
			levelStartChars = MULTIPLIER_THRESHOLDS[3];
		} else if (this.correctCharacters >= MULTIPLIER_THRESHOLDS[2]) {
			levelStartChars = MULTIPLIER_THRESHOLDS[2];
		}

		const levelProgress = this.correctCharacters - levelStartChars;
		const progress = Math.min(1, levelProgress / requiredChars);
		const barWidth = width * progress;

		this.progressBar.clear();
		this.progressBar.fillStyle(hexadecimalColors.teal, 0.5);
		this.progressBar.fillRect(0, height - 6, barWidth, 6);
	}

	private updateMultiplier() {
		this.correctCharacters++;

		let newMultiplier = 1;
		if (this.correctCharacters >= MULTIPLIER_THRESHOLDS[4]) {
			newMultiplier = 4;
		} else if (this.correctCharacters >= MULTIPLIER_THRESHOLDS[3]) {
			newMultiplier = 3;
		} else if (this.correctCharacters >= MULTIPLIER_THRESHOLDS[2]) {
			newMultiplier = 2;
		}

		if (newMultiplier !== this.multiplier) {
			this.multiplier = newMultiplier;
			this.multiplierText.setText(`${this.multiplier}x`);
			this.tweens.add({
				targets: this.multiplierText,
				scale: { from: 1.5, to: 1 },
				duration: 200,
				ease: "Bounce",
			});
		}

		this.updateProgressBar();
	}

	private resetMultiplierProgress() {
		this.correctCharacters = 0;
		this.multiplier = 1;
		this.multiplierText.setText("1x");
		this.updateProgressBar();
	}

	private spawnAsteroid() {
		if (this.asteroids.length >= 5) {
			return; // Don't exceed 5 asteroids at a time
		}

		let x: number = 0,
			y: number = 0;
		let safeSpawn: boolean;
		const maxAttempts = 10; // Limit attempts to prevent infinite loops
		let attempts = 0;

		do {
			x = this.getAsteroidSpawnX();
			y = -50; // Spawn just above the screen
			safeSpawn = this.asteroids.every(
				(asteroid) =>
					Phaser.Math.Distance.Between(
						x,
						y,
						asteroid.sprite.x,
						asteroid.sprite.y
					) > 80
			);
			attempts++;
		} while (!safeSpawn && attempts < maxAttempts);

		if (!safeSpawn) return; // If no safe spot found after max attempts, skip spawning

		const word = this.getAsteroidWord();
		const originalWord = word;

		const text = this.createAsteroidText(x, word);
		const sprite = this.createAsteroidSprite(x, text.width);

		// Ensure the text appears on top of the asteroid
		sprite.setDepth(1);
		text.setDepth(2);

		this.asteroids.push({ sprite, text, word, originalWord });
	}

	private getAsteroidSpawnX(): number {
		const { width } = this.cameras.main;
		const maxAsteroids = Math.floor(width / 100);
		let xPositions = Array.from(
			{ length: maxAsteroids },
			(_, i) => (i + 1) * (width / (maxAsteroids + 1))
		);

		Phaser.Utils.Array.Shuffle(xPositions);

		const minDistance = 100;
		this.asteroids.forEach((asteroid) => {
			xPositions = xPositions.filter(
				(x) => Math.abs(x - asteroid.sprite.x) > minDistance
			);
		});

		return xPositions.length > 0
			? xPositions[0]
			: Phaser.Math.Between(50, width - 50);
	}

	private getAsteroidWord(): string {
		// Early check for empty word pool
		if (!this.wordPool || this.wordPool.length === 0) {
			console.warn("Word pool is empty! Attempting to refill...");
			// Try to refill the word pool asynchronously
			this.refillWordPool();
			// Return a generic word as fallback
			return ["asteroid", "meteor", "comet", "planet", "galaxy"][
				Math.floor(Math.random() * 5)
			];
		}

		// Get current letters in use to avoid duplicates
		const currentStartLetters = this.asteroids.map((asteroid) =>
			asteroid.word.charAt(0).toLowerCase()
		);

		// Try to find words that don't start with same letters as current asteroids
		let availablePhrases = this.wordPool.filter(
			(phrase) =>
				!currentStartLetters.includes(phrase.charAt(0).toLowerCase()) &&
				!this.asteroids.some((asteroid) => asteroid.word === phrase)
		);

		// If we couldn't find any words with different starting letters,
		// just exclude words that are already in use
		if (availablePhrases.length === 0) {
			availablePhrases = this.wordPool.filter(
				(phrase) => !this.asteroids.some((asteroid) => asteroid.word === phrase)
			);
		}

		// If we still have no available words, shuffle the word pool and take any word
		if (availablePhrases.length === 0) {
			// Clone and shuffle the word pool
			const shuffledPool = [...this.wordPool].sort(() => Math.random() - 0.5);
			return shuffledPool[0];
		}

		// Pick a random word from available phrases
		return availablePhrases[
			Math.floor(Math.random() * availablePhrases.length)
		];
	}

	// Add this helper method to refill the word pool when it's depleted
	private async refillWordPool() {
		try {
			if (this.mode === "free") {
				const newWords = await fetchWordsForFreePlay(this.length);
				// Add new words but avoid duplicates
				this.wordPool = [...new Set([...this.wordPool, ...newWords])];
			} else if (this.mode === "letter" && this.selectedLetter) {
				const newWords = await fetchWordsByLetterAndLength(
					this.selectedLetter,
					this.length
				);
				// Add new words but avoid duplicates
				this.wordPool = [...new Set([...this.wordPool, ...newWords])];
			}
			console.log(`Refilled word pool. New size: ${this.wordPool.length}`);
		} catch (error) {
			console.error("Failed to refill word pool:", error);
		}
	}

	// updated to base the scale of the sprite on the width of the word
	private createAsteroidSprite(
		x: number,
		wordWidth: number
	): Phaser.GameObjects.Sprite {
		const sprite = this.add.sprite(x, -50, themeManager.getAsset("asteroid"));

		const baseSize = 2000; // Base size for the asteroid
		const padding = 7; // Additional size to ensure sprite is bigger than text
		const scale = (wordWidth + padding) / baseSize;
		sprite.setScale(scale);

		// Get the current animation type from the theme manager
		const animationType = themeManager.getAsset("animation");
    console.log(animationType);

		// Apply different animations based on the theme
		switch (animationType) {
			case "spin":
				// Original spin animation for asteroids
				sprite.angle = Phaser.Math.Between(0, 360);
				const spinSpeed = Phaser.Math.Between(2000, 4000);
				const spinDirection = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;

				this.tweens.add({
					targets: sprite,
					angle: sprite.angle + spinDirection * 360,
					duration: spinSpeed,
					repeat: -1,
				});
				break;

			case "sway":
				// Gentle swaying animation for balloons
				const swayAmount = Phaser.Math.Between(5, 15);
				const swaySpeed = Phaser.Math.Between(1500, 3000);

				this.tweens.add({
					targets: sprite,
					x: {
						value: x + swayAmount,
						duration: swaySpeed,
						ease: "Sine.easeInOut",
						yoyo: true,
						repeat: -1,
					},
					angle: {
						value: Phaser.Math.Between(-10, 10),
						duration: swaySpeed * 1.2,
						ease: "Sine.easeInOut",
						yoyo: true,
						repeat: -1,
					},
				});
				break;

			case "kick":
				// Soccer ball bouncing/spinning animation
				sprite.angle = Phaser.Math.Between(0, 360);

				// Faster spin for soccer balls
				this.tweens.add({
					targets: sprite,
					angle: sprite.angle + 720, // Two full rotations
					duration: Phaser.Math.Between(1000, 2000),
					repeat: -1,
				});

				// Add a slight horizontal wobble to simulate air resistance
				this.tweens.add({
					targets: sprite,
					x: {
						value: x + Phaser.Math.Between(-20, 20),
						duration: Phaser.Math.Between(800, 1500),
						ease: "Sine.easeInOut",
						yoyo: true,
						repeat: -1,
					},
				});
				break;

			case "ride":
				// Coconut falling with a wave-like motion
				const waveAmount = Phaser.Math.Between(15, 30);
				const waveDuration = Phaser.Math.Between(1200, 2500);

				// Add wave-like horizontal motion
				this.tweens.add({
					targets: sprite,
					x: {
						value: x + waveAmount,
						duration: waveDuration,
						ease: "Sine.easeInOut",
						yoyo: true,
						repeat: -1,
					},
					angle: {
						value: Phaser.Math.Between(-20, 20),
						duration: waveDuration * 0.8,
						ease: "Sine.easeInOut",
						yoyo: true,
						repeat: -1,
					},
				});
				break;

			default:
				// Fallback to original rotation animation
				sprite.angle = Phaser.Math.Between(0, 360);
				this.tweens.add({
					targets: sprite,
					angle: sprite.angle + 360,
					duration: Phaser.Math.Between(2000, 4000),
					repeat: -1,
				});
		}

		return sprite;
	}

	private createAsteroidText(x: number, word: string): Phaser.GameObjects.Text {
		const text = this.add
			.text(x, -50, word, {
				fontSize: "20px",
				color: colors.white,
			})
			.setOrigin(0.5);

		return text;
	}

	private shootMissile(targetX: number, targetY: number) {
		const missile = this.add.ellipse(
			this.ship.x,
			this.ship.y - 20,
			8,
			16,
			hexadecimalColors.green
		);

		// Calculate angle between ship and target
		const angle = Phaser.Math.Angle.Between(
			missile.x,
			missile.y,
			targetX,
			targetY
		);

		// Rotate missile to point at target
		missile.rotation = angle - Math.PI / 2;

		// Animate missile
		this.tweens.add({
			targets: missile,
			x: targetX,
			y: targetY,
			duration: 200, // Adjust speed as needed
			onComplete: () => {
				// Create small impact effect
				const impact = this.add.particles(targetX, targetY, "particle", {
					speed: { min: 20, max: 40 },
					scale: { start: 0.4, end: 0 },
					lifespan: 200,
					quantity: 3,
					blendMode: "ADD",
				});

				// Clean up impact and missile
				this.time.delayedCall(200, () => {
					impact.destroy();
					missile.destroy();
				});
			},
		});
	}

	private handleKeyInput(event: KeyboardEvent) {
		const char = event.key.toLowerCase();

		// Ignore ESC key presses (prevent multiplier reset)
		if (char === "escape") return;

		// Find an asteroid that has already been partially typed
		let targetedAsteroidIndex = this.asteroids.findIndex(
			(asteroid) => asteroid.word.length < asteroid.originalWord.length
		);

		// If no asteroid is partially typed, find one that starts with the typed character
		if (targetedAsteroidIndex === -1) {
			targetedAsteroidIndex = this.asteroids.findIndex((asteroid) =>
				asteroid.word.toLowerCase().startsWith(char)
			);
		}

		// If no valid asteroid is found, reset the multiplier and return
		if (targetedAsteroidIndex === -1) {
			this.resetMultiplierProgress();
			return;
		}

		// Get the targeted asteroid and set the text stroke to red
		const asteroid = this.asteroids[targetedAsteroidIndex];
		asteroid.text.setStroke("red", 2);

		// If the typed character matches the asteroid's first letter
		if (asteroid.word.toLowerCase().startsWith(char)) {
			this.shootMissile(asteroid.sprite.x, asteroid.sprite.y);
			this.updateMultiplier(); // Update multiplier on correct keystroke

			// If only one letter remains, destroy the asteroid
			if (asteroid.word.length === 1) {
				this.destroyAsteroid(targetedAsteroidIndex);
			} else {
				// Otherwise, remove the first letter and update the text
				asteroid.word = asteroid.word.slice(1);
				asteroid.text.setText(asteroid.word);
			}
		} else {
			this.resetMultiplierProgress(); // Reset multiplier on incorrect keystroke
		}
	}

	private updateScore(wordLength: number) {
		const scoreUpdateX = Phaser.Math.Between(80, 220);
		const scoreUpdateY = Phaser.Math.Between(495, 505);
		const scoreUpdateTravelDistance = Phaser.Math.Between(80, 100);

		// Apply multiplier to score
		const scoreIncrease = wordLength * this.multiplier;
		this.score += scoreIncrease;

		this.scoreUpdateText = this.add.text(
			scoreUpdateX,
			scoreUpdateY,
			`+${scoreIncrease}`,
			{
				fontSize: "22px",
				color: colors.green,
			}
		);

		// Add multiplier indicator if multiplier > 1
		if (this.multiplier > 1) {
			const multiplierIndicator = this.add.text(
				this.scoreUpdateText.x + this.scoreUpdateText.width + 5,
				scoreUpdateY,
				`(${this.multiplier}x)`,
				{
					fontSize: "18px",
					color: colors.yellow,
				}
			);

			this.tweens.add({
				targets: multiplierIndicator,
				y: scoreUpdateY - scoreUpdateTravelDistance,
				alpha: 0,
				duration: 1000,
				onComplete: () => {
					multiplierIndicator.destroy();
				},
			});
		}

		this.scoreUpdateText.rotation = Phaser.Math.DegToRad(
			Phaser.Math.Between(-30, 30)
		);

		this.tweens.add({
			targets: this.scoreUpdateText,
			y: scoreUpdateY - scoreUpdateTravelDistance,
			alpha: 0,
			duration: 1000,
			onComplete: () => {
				this.scoreUpdateText.destroy();
			},
		});

		this.scoreText.setText(`${this.score}`);
	}

	private destroyAsteroid(index: number) {
		const asteroid = this.asteroids[index];

		const particles = this.add.particles(
			asteroid.sprite.x,
			asteroid.sprite.y,
			"particle",
			{
				speed: { min: 50, max: 150 },
				lifespan: 1000,
				scale: { start: 0.8, end: 0 },
				quantity: 5,
				rotate: { min: 0, max: 360 },
				alpha: { start: 1, end: 0 },
				blendMode: "ADD",
			}
		);

		// Set timer to destroy the emitter
		this.time.delayedCall(750, () => {
			particles.destroy();
		});

		// Remove asteroid
		asteroid.sprite.destroy();
		asteroid.text.destroy();
		this.asteroids.splice(index, 1);

		// Update score
		this.updateScore(asteroid.originalWord.length);
	}

	private gameOver() {
		this.scene.start("GameOverScene", { score: this.score });
	}

	shutdown() {
		this.cleanupGameObjects();
		this.input.keyboard?.off("keydown", this.handleKeyInput, this);
		this.input.keyboard?.off("keydown-ESC", this.togglePause, this);
		this.scene.stop("PauseScene");

		// Reset pause state
		this.isPaused = false;

		// Destroy timers so they don't persist
		if (this.spawnTimer) {
			this.spawnTimer.destroy();
			this.spawnTimer = undefined;
		}
		this.time.removeAllEvents();
	}
}
