import { Scene } from "phaser";
import { wordPool, wordPoolByLetterAndLength } from "../constants/wordPool";
import { fetchWordsByLetterAndLength, extractWords } from "../constants/words-api";
import { colors, hexadecimalColors } from "../constants/colors";
import { themeManager } from "@/game";

const MULTIPLIER_THRESHOLDS = {
    2: 30,
    3: 75,
    4: 135
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
  private length: number = 6; // need to figure out how to determine this -- for now just hardcoding the value

  private asteroids: Asteroid[] = [];
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private scoreUpdateText!: Phaser.GameObjects.Text;
  private ship!: Phaser.GameObjects.Sprite;
  // part of resetting the game 
  private spawnTimer?: Phaser.Time.TimerEvent;

  // New properties for multiplier and progress bar
  private multiplier: number = 1;
  private multiplierText!: Phaser.GameObjects.Text;
  private correctCharacters: number = 0;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBarBg!: Phaser.GameObjects.Graphics;

  // New property for pausing the game
	private isPaused: boolean = false;

  constructor() {
    super({ key: "GameScene" });
  }

  private async loadWordsForLevel(letter: string, length: number): Promise<string[]> {
    try {
      const apiResponse = await fetchWordsByLetterAndLength(letter, length);
      return extractWords(apiResponse);
    } catch (error) {
      console.error("Error loading words for level:", error);
      return [];
    }
  }

  init(data: { mode: "free" | "letter"; letter?: string }) {
	// Reset all game state
    this.mode = data.mode;
    this.selectedLetter = data.letter;
	  this.score = 0;
    this.multiplier = 1;
    this.correctCharacters = 0;
    this.asteroids = [];


	  // Clear any existing game objects
    this.cleanupGameObjects();

    // Initialize word pool based on mode
    if (this.mode === "free") {
      this.wordPool = wordPool; // Use original pool
    } else if (this.mode === "letter" && this.selectedLetter) {

      // Initialize word pool with a placeholder which is filled in create()
      this.wordPool = [];
    }
  }

  private cleanupGameObjects() {
    // Stop the spawn timer if it exists
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
    }

    // Clear any existing asteroids
    this.asteroids.forEach(asteroid => {
      asteroid.sprite.destroy();
      asteroid.text.destroy();
    });
    
    // Clear any existing particle systems
    this.children.list
      .filter(child => child instanceof Phaser.GameObjects.Particles.ParticleEmitter)
      .forEach(child => child.destroy());
  }

  async create() {
    const { width, height } = this.cameras.main;

    this.input.keyboard?.on("keydown-ESC", this.togglePause, this);
  
    themeManager.setScene(this);
		themeManager.createBackground();
    
    this.ship = this.add.sprite(width / 2, height - 50, "ship").setScale(0.75);
  
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
  
    this.multiplierText = this.add.text(32, 485, "1x", {
      fontSize: "24px",
      fontFamily: "Monospace",
      color: colors.yellow,
    });
  
    scoreLabel.setDepth(2);
    this.scoreText.setDepth(2);
    this.multiplierText.setDepth(2);
  
    // Progress bar setup
    this.progressBarBg = this.add.graphics();
    this.progressBarBg.fillStyle(0x666666, 0.3);
    this.progressBarBg.fillRect(0, height - 10, width, 10);
  
    // Create progress bar
    this.progressBar = this.add.graphics();
    this.updateProgressBar();
  
    // Set up keyboard input
    this.input.keyboard?.on("keydown", this.handleKeyInput, this);
  
    // Fetch words for letter mode
    if (this.mode === "letter" && this.selectedLetter) {
      this.wordPool = await this.loadWordsForLevel(this.selectedLetter, this.length);
    } else {
      this.wordPool = wordPool; // Default word pool for free mode
    }
  
    // Start spawning asteroids
    this.spawnTimer = this.time.addEvent({
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

  private togglePause() {
		this.isPaused = !this.isPaused;

		if (this.isPaused) {
			// Pause the game
			this.scene.pause();
			if (this.spawnTimer) {
				this.spawnTimer.paused = true;
			}
			// Launch the pause scene
			this.scene.launch("PauseScene", { mainScene: this.scene.key });
		} else {
			// Resume the game
			this.scene.resume();
			if (this.spawnTimer) {
				this.spawnTimer.paused = false;
			}
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
    const x = this.getAsteroidSpawnX();
    const word = this.getAsteroidWord();
    const originalWord = word;

	  // Create the text object first to calc its width
    const text = this.createAsteroidText(x, word);

	  // use text.width instead of scale to make dynamic sprites
    const sprite = this.createAsteroidSprite(x, text.width);

    // Ensure the text appears on top of the sprite
    text.setDepth(1); // Higher depth than the sprite
    sprite.setDepth(0); // Base depth for the sprite
    
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

  // updated to base the scale of the sprite on the width of the word 
  private createAsteroidSprite(
    x: number,
    wordWidth: number
  ): Phaser.GameObjects.Sprite {
    const sprite = this.add.sprite(x, -50, "asteroid")

	const baseSize = 80; // Base size for the asteroid
	const padding = 7; // Additional size to ensure sprite is bigger than text
	const scale = (wordWidth + padding) / baseSize;
	sprite.setScale(scale);

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

  private createAsteroidText(
	x: number, 
	word: string
  ): Phaser.GameObjects.Text {
    const text = this.add
      .text(x, -50, word, {
        fontSize: "20px",
        color: colors.white
      })
      .setOrigin(0.5);

	  return text
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

    let targetedAsteroidIndex = this.asteroids.findIndex(
      (asteroid) => asteroid.word.length < asteroid.originalWord.length
    );

    if (targetedAsteroidIndex === -1) {
      targetedAsteroidIndex = this.asteroids.findIndex((asteroid) =>
        asteroid.word.toLowerCase().startsWith(char)
      );
    }

    if (targetedAsteroidIndex !== -1) {
      const asteroid = this.asteroids[targetedAsteroidIndex];
      asteroid.text.setStroke("red", 2);

      if (asteroid.word.toLowerCase().startsWith(char)) {
        this.shootMissile(asteroid.sprite.x, asteroid.sprite.y);
        this.updateMultiplier(); // Update multiplier on correct keystroke

        if (asteroid.word.length === 1) {
          this.destroyAsteroid(targetedAsteroidIndex);
        } else {
          asteroid.word = asteroid.word.slice(1);
          asteroid.text.setText(asteroid.word);
        }
      } else {
        this.resetMultiplierProgress(); // Reset on incorrect keystroke
      }
    } else {
      this.resetMultiplierProgress(); // Reset when no asteroid is targeted
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
	}
}
