import { Scene } from "phaser";
import { useEffect } from "react";

interface Asteroid {
	sprite: Phaser.GameObjects.Sprite;
	text: Phaser.GameObjects.Text;
	word: string;
}

export class GameScene extends Scene {
	private asteroids: Asteroid[] = [];
	private score: number = 0;
	private scoreText!: Phaser.GameObjects.Text;
	private phrasePool: string[] = [
		"Time heals all wounds",
		"Live and let live",
		"Actions speak louder",
		"Better late than never",
		"Love conquers all",
		"Easy come, easy go",
		"Out of sight",
		"Out of mind",
		"Birds of a feather",
		"Stick together",
		"Every cloud has a",
        "Silver lining",
		"Ignorance is bliss",
        "Look before you leap",
		"An apple a day",
        "Keeps the doctor away",
		"Practice makes perfect",
		"All is fair",
        "In love and war",
		"Knowledge is power",
        "Fortune favors the bold",
		"Every dog has its day",
		"Beauty is in the eye",
		"The early bird catches",
		"Absence makes the heart",
		"A stitch in time",
		"The grass is always",
		"All that glitter",
		"Half a loaf",
		"The more the merrier",
		"Actions speak louder",
		"A rolling stone gathers",
		"In the nick of time",
		"In the heat of",
		"Like father, like son",
		"Laugh and the world",
		"A picture is worth",
		"Two heads are better",
		"No pain, no gain",
		"People who live in",
		"The pen is mightier",
		"A watched pot never",
		"Give credit where credit",
		"History repeats itself",
		"When in Rome, do",
		"You reap what you",
		"The squeaky wheel gets",
		"You scratch my back",
		"Actions speak louder",
	];

	constructor() {
		super({ key: "GameScene" });
	}

	create() {
		const { width, height } = this.cameras.main;

		// Add score display
		this.scoreText = this.add.text(32, 520, "Score: 0", {
			fontSize: "32px",
			fontFamily: "Monospace",
			color: "#F0F0F0",
		});

		// Set up keyboard input
		this.input.keyboard?.on("keydown", this.handleKeyInput, this);

		// Start spawning asteroids
		this.time.addEvent({
			delay: 2000,
			callback: this.spawnAsteroid,
			callbackScope: this,
			loop: true,
		});
	}

	update() {
		// Update asteroid positions and check for game over
		for (let i = this.asteroids.length - 1; i >= 0; i--) {
			const asteroid = this.asteroids[i];
			asteroid.sprite.y += 1; // Adjust speed as needed
			asteroid.text.y = asteroid.sprite.y;

			// Check if asteroid reached bottom
			if (asteroid.sprite.y > this.cameras.main.height) {
				this.gameOver();
				break;
			}
		}
	}

	private spawnAsteroid() {
		const { width } = this.cameras.main;
		const x = Phaser.Math.Between(50, width - 50);

		// Get all current starting letters on screen
		const currentStartLetters = this.asteroids.map((asteroid) =>
			asteroid.word.charAt(0).toLowerCase()
		);

		// Filter the phrasePool to only phrases that start with unused letters
		const availablePhrases = this.phrasePool.filter(
			(phrase) => !currentStartLetters.includes(phrase.charAt(0).toLowerCase())
		);

		// If no available phrases with unique starting letters, just pick any phrase
		// This prevents the game from getting stuck if all letters are in use
		const word =
			availablePhrases.length > 0
				? availablePhrases[Phaser.Math.Between(0, availablePhrases.length - 1)]
				: this.phrasePool[Phaser.Math.Between(0, this.phrasePool.length - 1)];

		// Create asteroid sprite
		const sprite = this.add.sprite(x, -50, "asteroid").setScale(0.5);

		// Add text on the asteroid
		const text = this.add
			.text(x, -50, word, {
				fontSize: "20px",
				color: "#ffffff",
			})
			.setOrigin(0.5);

		this.asteroids.push({ sprite, text, word });
	}

	private handleKeyInput(event: KeyboardEvent) {
		const char = event.key.toLowerCase();

		for (let i = this.asteroids.length - 1; i >= 0; i--) {
			const asteroid = this.asteroids[i];

			// Check if the typed character matches the start of the word
			if (asteroid.word.toLowerCase().startsWith(char)) {
				if (asteroid.word.length === 1) {
					// Word completed, destroy asteroid
					this.destroyAsteroid(i);
				} else {
					// Remove first character from word
					asteroid.word = asteroid.word.slice(1);
					asteroid.text.setText(asteroid.word);
				}
				break;
			}
		}
	}

	private destroyAsteroid(index: number) {
		const asteroid = this.asteroids[index];

		// Create particle emitter with smoother scaling animation
		const particles = this.add.particles(
			asteroid.sprite.x,
			asteroid.sprite.y,
			"particle",
			{
				speed: { min: 50, max: 150 }, // Add some speed variation
				lifespan: 1500, // Match the 2-second duration
				scale: { start: 0.8, end: 0 }, // Scale down to zero
				quantity: 5, // Increased for better effect
				rotate: { min: 0, max: 360 }, // Add some rotation
				alpha: { start: 1, end: 0 }, // Fade out
				blendMode: "ADD", // Makes particles blend/glow
			}
		);

		// Set timer to destroy the emitter
		this.time.delayedCall(2000, () => {
			particles.destroy();
		});

		// Remove asteroid
		asteroid.sprite.destroy();
		asteroid.text.destroy();
		this.asteroids.splice(index, 1);

		// Update score
		this.score += 100;
		this.scoreText.setText(`Score: ${this.score}`);
	}

	private gameOver() {
		this.scene.start("GameOverScene", { score: this.score });
	}
}
