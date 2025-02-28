// GameMechanics.ts
import { Scene } from "phaser";
import { themeManager } from "@/game";
import { colors, hexadecimalColors } from "../app/constants/colors";
import {
	fetchWordsByLetterAndLength,
	fetchWordsForFreePlay,
} from "../app/constants/words-api";

interface Asteroid {
	sprite: Phaser.GameObjects.Sprite;
	text: Phaser.GameObjects.Text;
	textBackground?: Phaser.GameObjects.Rectangle;
	originalWord: string;
	word: string;
}

const MULTIPLIER_THRESHOLDS = {
	2: 30,
	3: 75,
	4: 135,
};

const getRequiredCharactersForCurrentLevel = (chars: number): number => {
	if (chars < MULTIPLIER_THRESHOLDS[2]) return 30;
	if (chars < MULTIPLIER_THRESHOLDS[3]) return 45;
	if (chars < MULTIPLIER_THRESHOLDS[4]) return 60;
	return 60; // Max level
};

export class GameMechanics {
	private scene: Scene;
	private asteroids: Asteroid[] = [];
	private wordPool: string[] = [];
	private length: number = 5;
	private mode: "free" | "letter" = "free";
	private selectedLetter?: string;

	private score: number = 0;
	private level: number = 1;
	private multiplier: number = 1;
	private correctCharacters: number = 0;
	private asteroidSpeed: number = 1;

	// Typing statistics
	private typingStats = {
		totalKeysPressed: 0,
		correctKeysPressed: 0,
		startTime: 0,
		wordCompletions: 0,
		characterErrors: new Map<string, number>(),
		wordErrors: new Map<string, number>(),
		wordAttempts: new Map<string, { total: number; errors: number }>(),
	};

	constructor(scene: Scene) {
		this.scene = scene;
		this.typingStats.startTime = this.scene.time.now;
	}

	getLevel(): number {
		return this.level;
	}

	getScore(): number {
		return this.score;
	}

	getMultiplier(): number {
		return this.multiplier;
	}

	getAsteroids(): Asteroid[] {
		return this.asteroids;
	}

	// Initialize words based on the game mode
	async init(mode: "free" | "letter", letter?: string, length: number = 5) {
		this.mode = mode;
		this.selectedLetter = letter;
		this.length = length;
		this.score = 0;
		this.multiplier = 1;
		this.correctCharacters = 0;
		this.level = 1;
		this.asteroids = [];
		this.resetTypingStats();

		try {
			if (mode === "free") {
				this.wordPool = await fetchWordsForFreePlay(this.length);
			} else if (mode === "letter" && letter) {
				this.wordPool = await fetchWordsByLetterAndLength(letter, this.length);
			}
		} catch (error) {
			console.error("Error initializing word pool:", error);
			this.wordPool = []; // Prevent crashes if API fails
		}
	}

	// Typing statistics methods
	resetTypingStats() {
		this.typingStats = {
			totalKeysPressed: 0,
			correctKeysPressed: 0,
			startTime: this.scene.time.now,
			wordCompletions: 0,
			characterErrors: new Map<string, number>(),
			wordErrors: new Map<string, number>(),
			wordAttempts: new Map<string, { total: number; errors: number }>(),
		};
	}

	recordTypingError(char: string) {
		if (!this.typingStats.characterErrors.has(char)) {
			this.typingStats.characterErrors.set(char, 0);
		}
		this.typingStats.characterErrors.set(
			char,
			this.typingStats.characterErrors.get(char)! + 1
		);
	}

	recordWordAttempt(word: string, errorCount: number) {
		if (!this.typingStats.wordAttempts.has(word)) {
			this.typingStats.wordAttempts.set(word, { total: 0, errors: 0 });
		}

		const stats = this.typingStats.wordAttempts.get(word)!;
		stats.total += 1;
		stats.errors += errorCount;

		this.typingStats.wordAttempts.set(word, stats);

		if (errorCount > 0) {
			if (!this.typingStats.wordErrors.has(word)) {
				this.typingStats.wordErrors.set(word, 0);
			}
			this.typingStats.wordErrors.set(
				word,
				this.typingStats.wordErrors.get(word)! + 1
			);
		}
	}

	getTypingStats() {
		const currentTime = this.scene.time.now;
		const minutes = (currentTime - this.typingStats.startTime) / 60000;

		return {
			accuracy:
				this.typingStats.totalKeysPressed > 0
					? (
							(this.typingStats.correctKeysPressed /
								this.typingStats.totalKeysPressed) *
							100
					  ).toFixed(1) + "%"
					: "100%",
			wpm:
				minutes > 0
					? Math.round(this.typingStats.correctKeysPressed / 5 / minutes)
					: 0,
			wordsCompleted: this.typingStats.wordCompletions,
			totalKeysPressed: this.typingStats.totalKeysPressed,
			mostProblematicChars: Array.from(
				this.typingStats.characterErrors.entries()
			)
				.sort((a, b) => b[1] - a[1])
				.slice(0, 3),
			difficultWords: Array.from(this.typingStats.wordErrors.entries())
				.sort((a, b) => b[1] - a[1])
				.slice(0, 3),
		};
	}

	// Level management
	advanceToNextLevel() {
		this.level += 1;
		this.increaseDifficulty();
		return this.level;
	}

	increaseDifficulty() {
		// Increase asteroid speed
		this.asteroidSpeed = 1 + (this.level - 1) * 0.2; // Starts at 1 and increases

		// Increase word length after every few levels
		if (this.level % 3 === 0 && this.length < 10) {
			this.length += 1; // Increase word length cap
		}
	}

	// Asteroid management
	spawnAsteroid() {
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

		const { text, background } = this.createAsteroidText(x, word);
		const sprite = this.createAsteroidSprite(x, text.width);

		// Ensure the text appears on top of the asteroid
		sprite.setDepth(1);
		text.setDepth(2);

		if (background) {
			background.setDepth(1.5); // Make sure background is between sprite and text
		}

		// Create the asteroid object
		const asteroid: Asteroid = {
			sprite,
			text,
			originalWord,
			word,
		};

		// Add the background if it exists
		if (background) {
			asteroid.textBackground = background;
		}

		// Push the asteroid object to the array
		this.asteroids.push(asteroid);
	}

	clearAsteroids() {
		// Destroy all existing asteroids when a new level starts
		this.asteroids.forEach((asteroid) => {
			asteroid.sprite.destroy();
			asteroid.text.destroy();
			if (asteroid.textBackground) {
				asteroid.textBackground.destroy();
			}
		});

		this.asteroids = []; // Clear the list
	}

	private getAsteroidSpawnX(): number {
		const { width } = this.scene.cameras.main;
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

	// Helper method to refill the word pool when it's depleted
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

	private createAsteroidSprite(
		x: number,
		wordWidth: number
	): Phaser.GameObjects.Sprite {
		const sprite = this.scene.add.sprite(
			x,
			-50,
			themeManager.getAsset("asteroid")
		);

		const baseSize = 360; // Base size for the asteroid
		const padding = 7; // Additional size to ensure sprite is bigger than text
		const scale = (wordWidth + padding) / baseSize;
		sprite.setScale(scale);

		// Get the current animation type from the theme manager
		const animationType = themeManager.getAsset("animation");

		// Apply different animations based on the theme
		switch (animationType) {
			case "spin":
				// Original spin animation for asteroids
				sprite.angle = Phaser.Math.Between(0, 360);
				const spinSpeed = Phaser.Math.Between(2000, 4000);
				const spinDirection = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;

				this.scene.tweens.add({
					targets: sprite,
					angle: sprite.angle + spinDirection * 360,
					duration: spinSpeed,
					repeat: -1,
				});
				break;

			case "sway":
				// Gentle swaying animation for balloons
				const swayAmount = Phaser.Math.Between(2, 5);
				const swaySpeed = Phaser.Math.Between(2200, 3400);

				this.scene.tweens.add({
					targets: sprite, // and text
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
				this.scene.tweens.add({
					targets: sprite,
					angle: sprite.angle + 360,
					duration: Phaser.Math.Between(4500, 5600),
					repeat: -1,
				});

				// Add a slight horizontal wobble to simulate air resistance
				const negativeWobble = Phaser.Math.Between(-5, -12);
				const positiveWobble = Phaser.Math.Between(5, 12);
				this.scene.tweens.add({
					targets: sprite,
					x: {
						value: x + Phaser.Math.Between(negativeWobble, positiveWobble),
						duration: Phaser.Math.Between(800, 1500),
						ease: "Sine.easeInOut",
						yoyo: true,
						repeat: -1,
					},
				});
				break;

			case "ride":
				// Coconut falling with a wave-like motion
				const waveAmount = Phaser.Math.Between(8, 16);
				const waveDuration = Phaser.Math.Between(2600, 3400);

				// Add wave-like horizontal motion
				this.scene.tweens.add({
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
				this.scene.tweens.add({
					targets: sprite,
					angle: sprite.angle + 360,
					duration: Phaser.Math.Between(2000, 4000),
					repeat: -1,
				});
		}

		return sprite;
	}

	private createAsteroidText(
		x: number,
		word: string
	): {
		text: Phaser.GameObjects.Text;
		background?: Phaser.GameObjects.Rectangle;
	} {
		// Use the getTextColor method to get the color as a string
		const textColor = themeManager.getTextColor("asteroidText");

		// Adjust Y position based on theme
		const yPosition = themeManager.getCurrentTheme() === "party" ? -110 : -50;

		const text = this.scene.add
			.text(x, yPosition, word, {
				fontSize: "20px",
				color: textColor,
			})
			.setOrigin(0.5);

		// Create background for soccer theme
		let background: Phaser.GameObjects.Rectangle | undefined;

		if (themeManager.getCurrentTheme() === "soccer") {
			// Create background (slightly larger than the text)
			background = this.scene.add.rectangle(
				x,
				yPosition,
				text.width + 8,
				text.height + 6,
				0x111111,
				0.8
			);

			// Set the background behind the text
			background.setOrigin(0.5);
			background.setDepth(text.depth - 1);
		}

		return { text, background };
	}

	// Input handling
	handleKeyInput(event: KeyboardEvent): {
		isCorrect: boolean;
		char: string;
		destroyedAsteroid?: boolean;
		asteroidX?: number;
		asteroidY?: number;
	} {
		const char = event.key.toLowerCase();

		// Ignore ESC key presses
		if (char === "escape") return { isCorrect: false, char };

		this.typingStats.totalKeysPressed++;

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
			this.recordTypingError(char);
			return { isCorrect: false, char };
		}

		// Get the targeted asteroid and set the text stroke to red
		const asteroid = this.asteroids[targetedAsteroidIndex];
		asteroid.text.setStroke("red", 2);

		// If the typed character matches the asteroid's first letter
		if (asteroid.word.toLowerCase().startsWith(char)) {
			this.typingStats.correctKeysPressed++;
			this.updateMultiplier();

			// If only one letter remains, destroy the asteroid
			if (asteroid.word.length === 1) {
				const x = asteroid.sprite.x;
				const y = asteroid.sprite.y;
				this.destroyAsteroid(targetedAsteroidIndex);
				return {
					isCorrect: true,
					char,
					destroyedAsteroid: true,
					asteroidX: x,
					asteroidY: y,
				};
			} else {
				// Otherwise, remove the first letter and update the text
				asteroid.word = asteroid.word.slice(1);
				asteroid.text.setText(asteroid.word);
				return {
					isCorrect: true,
					char,
					destroyedAsteroid: false,
					asteroidX: asteroid.sprite.x,
					asteroidY: asteroid.sprite.y,
				};
			}
		} else {
			this.resetMultiplierProgress();
			this.recordTypingError(char);
			return { isCorrect: false, char };
		}
	}

	// Score and multiplier handling
	updateScore(wordLength: number) {
		// Apply multiplier to score
		const scoreIncrease = wordLength * this.multiplier;
		this.score += scoreIncrease;

		this.typingStats.wordCompletions++;

		return {
			score: this.score,
			increase: scoreIncrease,
			multiplier: this.multiplier,
		};
	}

	updateMultiplier() {
		this.correctCharacters++;

		let newMultiplier = 1;
		if (this.correctCharacters >= MULTIPLIER_THRESHOLDS[4]) {
			newMultiplier = 4;
		} else if (this.correctCharacters >= MULTIPLIER_THRESHOLDS[3]) {
			newMultiplier = 3;
		} else if (this.correctCharacters >= MULTIPLIER_THRESHOLDS[2]) {
			newMultiplier = 2;
		}

		const multiplierChanged = newMultiplier !== this.multiplier;
		if (multiplierChanged) {
			this.multiplier = newMultiplier;
		}

		// Calculate progress for the progress bar
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

		return {
			multiplier: this.multiplier,
			multiplierChanged,
			progress,
		};
	}

	resetMultiplierProgress() {
		this.correctCharacters = 0;
		this.multiplier = 1;

		return {
			multiplier: this.multiplier,
			progress: 0,
		};
	}

	destroyAsteroid(index: number) {
		const asteroid = this.asteroids[index];
		const originalWord = asteroid.originalWord;
		const wordLength = originalWord.length;

		const particles = this.scene.add.particles(
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
		this.scene.time.delayedCall(750, () => {
			particles.destroy();
		});

		// Remove asteroid
		asteroid.sprite.destroy();
		asteroid.text.destroy();

		// Destroy the text background if it exists
		if (asteroid.textBackground) {
			asteroid.textBackground.destroy();
		}

		this.asteroids.splice(index, 1);

		// Update score and record word completion
		const scoreResult = this.updateScore(wordLength);
		// Record word completion in statistics - assumes no errors if destroyed
		this.recordWordAttempt(originalWord, 0);

		return scoreResult;
	}

	// Update method called by the game loop
	update() {
		for (let i = this.asteroids.length - 1; i >= 0; i--) {
			const asteroid = this.asteroids[i];
			asteroid.sprite.y += this.asteroidSpeed;

			// Adjust text y position based on theme
			if (themeManager.getCurrentTheme() === "party") {
				asteroid.text.y = asteroid.sprite.y - 70; // Keep text higher for balloons
			} else {
				asteroid.text.y = asteroid.sprite.y; // Default position for other themes
			}

			// Update background position to match text
			if (asteroid.textBackground) {
				asteroid.textBackground.x = asteroid.text.x;
				asteroid.textBackground.y = asteroid.text.y;
			}

			// Check if any asteroid has passed the bottom of the screen
			if (asteroid.sprite.y > this.scene.cameras.main.height) {
				return false; // Game over condition
			}
		}

		return true; // Game continues
	}
}
