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
	private wordPool: string[] = [
		"crouch",
		"quest",
		"run",
		"deport",
		"release",
		"tender",
		"multimedia",
		"voucher",
		"trail",
		"civilian",
		"lie",
		"chord",
		"look",
		"credit",
		"route",
		"regulation",
		"habitat",
		"suburb",
		"gene",
		"spontaneous",
		"slant",
		"compact",
		"convulsion",
		"prayer",
		"suntan",
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
		const randomSpinSpeed = Phaser.Math.Between(2000, 4000);
        const spinDirection = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;

		const currentStartLetters = this.asteroids.map((asteroid) =>
			asteroid.word.charAt(0).toLowerCase()
		);

		const availablePhrases = this.wordPool.filter(
			(phrase) => !currentStartLetters.includes(phrase.charAt(0).toLowerCase())
		);

		const word =
			availablePhrases.length > 0
				? availablePhrases[Phaser.Math.Between(0, availablePhrases.length - 1)]
				: this.wordPool[Phaser.Math.Between(0, this.wordPool.length - 1)];

		const sprite = this.add.sprite(x, -50, "asteroid").setScale(0.5);

		sprite.angle = Phaser.Math.Between(0, 360);

		this.tweens.add({
			targets: sprite,
			angle: sprite.angle + (spinDirection * 360),
			duration: randomSpinSpeed,
			repeat: -1,
		});

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

			if (asteroid.word.toLowerCase().startsWith(char)) {
				if (asteroid.word.length === 1) {
					this.destroyAsteroid(i);
				} else {
					asteroid.word = asteroid.word.slice(1);
					asteroid.text.setText(asteroid.word);
				}
				break;
			}
		}
	}

	private destroyAsteroid(index: number) {
		const asteroid = this.asteroids[index];

		const particles = this.add.particles(
			asteroid.sprite.x,
			asteroid.sprite.y,
			"particle",
			{
				speed: { min: 50, max: 150 },
				lifespan: 1500,
				scale: { start: 0.8, end: 0 },
				quantity: 5,
				rotate: { min: 0, max: 360 },
				alpha: { start: 1, end: 0 },
				blendMode: "ADD",
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
