import { Scene } from "phaser";
import { wordPool } from "../constants/wordPool";
import { colors, hexadecimalColors } from "../constants/colors";

interface Asteroid {
	sprite: Phaser.GameObjects.Sprite;
	text: Phaser.GameObjects.Text;
	originalWord: string;
	word: string;
}

export class GameScene extends Scene {
	private asteroids: Asteroid[] = [];
	private score: number = 0;
	private scoreText!: Phaser.GameObjects.Text;
	private scoreUpdateText!: Phaser.GameObjects.Text;
	private wordPool: string[] = wordPool;
	private ship!: Phaser.GameObjects.Sprite;

	constructor() {
		super({ key: "GameScene" });
	}

	create() {
		const { width, height } = this.cameras.main;

		const background = this.add.image(width, height / 2, "background");
		this.ship = this.add.sprite(width / 2, height - 50, "ship").setScale(0.75);

		const scoreLabel = this.add.text(32, 520, "Score: ", {
			fontSize: "32px",
			fontFamily: "Monospace",
			color: colors.red,
		});

		// Add score display
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

		// Set up keyboard input
		this.input.keyboard?.on("keydown", this.handleKeyInput, this);

		// Start spawning asteroids
		this.time.addEvent({
			delay: 1000,
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

	// ask Toph if he wants to adhere to SRP (Single Responsibility Principle) or nah

	private spawnAsteroid() {
		const x = this.getAsteroidSpawnX();
		const word = this.getAsteroidWord();
		const originalWord = word;
		const scale = Phaser.Math.Between(50, 100) / 100;

		const sprite = this.createAsteroidSprite(x, scale);
		const text = this.createAsteroidText(x, word);

		this.asteroids.push({ sprite, text, word, originalWord });
	}

	private getAsteroidSpawnX(): number {
		const { width } = this.cameras.main;
		const maxAsteroids = Math.floor(width / 100);
		let xPositions = Array.from({ length: maxAsteroids }, (_, i) => (i + 1) * (width / (maxAsteroids + 1)));

		Phaser.Utils.Array.Shuffle(xPositions);

		const minDistance = 100;
		this.asteroids.forEach((asteroid) => {
			xPositions = xPositions.filter(
				(x) => Math.abs(x - asteroid.sprite.x) > minDistance
			);
		});

		return xPositions.length > 0 ? xPositions[0] : Phaser.Math.Between(50, width - 50);
	}

	private getAsteroidWord(): string {
		const currentStartLetters = this.asteroids.map((asteroid) =>
			asteroid.word.charAt(0).toLowerCase()
		);

		const availablePhrases = this.wordPool.filter(
			(phrase) =>
				!currentStartLetters.includes(phrase.charAt(0).toLowerCase()) &&
				!this.asteroids.some((asteroid) => asteroid.word === phrase)
		);

		return availablePhrases.length > 0
			? availablePhrases[Phaser.Math.Between(0, availablePhrases.length - 1)]
			: this.wordPool[Phaser.Math.Between(0, this.wordPool.length - 1)];
	}

	private createAsteroidSprite(x: number, scale: number): Phaser.GameObjects.Sprite {
		const sprite = this.add.sprite(x, -50, "asteroid").setScale(scale);
		sprite.angle = Phaser.Math.Between(0, 360);

		const spinSpeed = Phaser.Math.Between(2000, 4000);
		const spinDirection = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;

		this.tweens.add({
			targets: sprite,
			angle: sprite.angle + spinDirection * 360,
			duration: spinSpeed,
			repeat: -1,
		});

		return sprite;
	}

	private createAsteroidText(x: number, word: string): Phaser.GameObjects.Text {
		return this.add
			.text(x, -50, word, {
				fontSize: "20px",
				color: colors.white,
			})
			.setOrigin(0.5);
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

		// Find the first asteroid that is currently being targeted
		let targetedAsteroidIndex = this.asteroids.findIndex(
			(asteroid) => asteroid.word.length < asteroid.originalWord.length
		);

		// If no asteroid is currently being targeted, find the first matching asteroid
		if (targetedAsteroidIndex === -1) {
			targetedAsteroidIndex = this.asteroids.findIndex((asteroid) =>
				asteroid.word.toLowerCase().startsWith(char)
			);
		}

		// ensure it's a valid index and if so, begin firing at asteroid as letters are typed
		if (targetedAsteroidIndex !== -1) { 
			const asteroid = this.asteroids[targetedAsteroidIndex];
			asteroid.text.setStroke("red", 2); // Outline the text in red

			if (asteroid.word.toLowerCase().startsWith(char)) {
				// Shoot missile at the asteroid
				this.shootMissile(asteroid.sprite.x, asteroid.sprite.y);

				if (asteroid.word.length === 1) {
					this.destroyAsteroid(targetedAsteroidIndex);
				} else {
					asteroid.word = asteroid.word.slice(1);
					asteroid.text.setText(asteroid.word);
				}
			}
		}
	}

	private updateScore(wordLength: number) {
		const scoreUpdateX = Phaser.Math.Between(80, 220);
		const scoreUpdateY = Phaser.Math.Between(495, 505);
		const scoreUpdateTravelDistance = Phaser.Math.Between(80, 100);
		this.score += wordLength;
		this.scoreUpdateText = this.add.text(
			scoreUpdateX,
			scoreUpdateY,
			`+${wordLength}`,
			{
				fontSize: "22px",
				color: colors.green,
			}
		);
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
}
