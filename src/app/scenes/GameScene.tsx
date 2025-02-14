import { Scene } from "phaser";

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
		"code",
		"type",
		"game",
		"play",
		"win",
		"phaser",
		"next",
		"react",
		"web",
		"dev",
	];

	constructor() {
		super({ key: "GameScene" });
	}

	create() {
		const { width, height } = this.cameras.main;

		// Add score display
		this.scoreText = this.add.text(16, 16, "Score: 0", {
			fontSize: "24px",
			color: "#ffffff",
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
		const word =
			this.wordPool[Phaser.Math.Between(0, this.wordPool.length - 1)];

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

		// Add explosion animation here
		this.add.particles(asteroid.sprite.x, asteroid.sprite.y, "particle", {
			speed: 100,
			lifespan: 800,
			scale: { start: 1, end: 0 },
			quantity: 10,
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
