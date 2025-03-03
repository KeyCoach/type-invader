// GameUI.ts
import Phaser from "phaser";
import { Scene } from "phaser";
import { colors, hexadecimalColors } from "../app/constants/colors";
import PauseButton from "../components/PauseButton";
import { StatsDisplay } from "../app/constants/definitions";
import { soundManager } from "@/game";

export class GameUI {
	private scene: Scene;
	private scoreText: Phaser.GameObjects.Text;
	private scoreUpdateText: Phaser.GameObjects.Text | null = null;
	private scoreUpdateMultiplier: Phaser.GameObjects.Text | null = null;
	private timerText: Phaser.GameObjects.Text;
	private levelText: Phaser.GameObjects.Text;
	private multiplierText: Phaser.GameObjects.Text;
	private progressBar: Phaser.GameObjects.Graphics;
	private progressBarBg: Phaser.GameObjects.Graphics;
	private statsElements: Phaser.GameObjects.GameObject[] = [];

	constructor(scene: Scene, togglePause: () => void) {
		this.scene = scene;
		const { width, height } = this.scene.cameras.main;

		// Create all UI elements
		const scoreLabel = this.scene.add.text(32, 520, "Score: ", {
			fontSize: "32px",
			fontFamily: "Monospace",
			color: colors.red,
		});

		this.scoreText = this.scene.add.text(
			scoreLabel.x + scoreLabel.width - 2,
			520,
			"0",
			{
				fontSize: "32px",
				fontFamily: "Monospace",
				color: colors.white,
			}
		);

		// Create timer text
		this.timerText = this.scene.add.text(width - 110, 520, "00:30", {
			fontSize: "32px",
			fontFamily: "Monospace",
			color: colors.white,
		});

		// Create level text (initially hidden)
		this.levelText = this.scene.add
			.text(width / 2, height / 2, "", {
				fontSize: "48px",
				fontFamily: "Monospace",
				color: colors.yellow,
			})
			.setOrigin(0.5)
			.setAlpha(0);

		// Create multiplier text
		this.multiplierText = this.scene.add.text(32, 485, "1x", {
			fontSize: "24px",
			fontFamily: "Monospace",
			color: colors.yellow,
		});

		// Create pause button
		new PauseButton(scene, 25, 25, togglePause);

		// Create progress bar background
		this.progressBarBg = this.scene.add.graphics();
		this.progressBarBg.fillStyle(0x666666, 0.3);
		this.progressBarBg.fillRect(0, height - 10, width, 10);

		// Create progress bar (initially empty)
		this.progressBar = this.scene.add.graphics();

		// Set depth to ensure UI is always on top
		this.scoreText.setDepth(2);
		this.timerText.setDepth(2);
		this.levelText.setDepth(2);
		this.multiplierText.setDepth(2);
		scoreLabel.setDepth(2);
		this.progressBar.setDepth(2);
		this.progressBarBg.setDepth(1);
	}

	updateScore(score: number) {
		this.scoreText.setText(`${score}`);
	}

	showScoreUpdate(score: number, increase: number, multiplier: number) {
		const scoreUpdateX = Phaser.Math.Between(80, 220);
		const scoreUpdateY = Phaser.Math.Between(495, 505);
		const scoreUpdateTravelDistance = Phaser.Math.Between(80, 100);

		// Clear previous score update if it exists
		if (this.scoreUpdateText) {
			this.scoreUpdateText.destroy();
		}
		if (this.scoreUpdateMultiplier) {
			this.scoreUpdateMultiplier.destroy();
		}

		this.scoreUpdateText = this.scene.add.text(
			scoreUpdateX,
			scoreUpdateY,
			`+${increase}`,
			{
				fontSize: "22px",
				color: colors.green,
			}
		);

		// Apply random rotation for visual flair
		this.scoreUpdateText.rotation = Phaser.Math.DegToRad(
			Phaser.Math.Between(-30, 30)
		);

		// Add multiplier indicator if multiplier > 1
		if (multiplier > 1) {
			this.scoreUpdateMultiplier = this.scene.add.text(
				this.scoreUpdateText.x + this.scoreUpdateText.width + 5,
				scoreUpdateY,
				`(${multiplier}x)`,
				{
					fontSize: "18px",
					color: colors.yellow,
				}
			);

			this.scene.tweens.add({
				targets: this.scoreUpdateMultiplier,
				y: scoreUpdateY - scoreUpdateTravelDistance,
				alpha: 0,
				duration: 1000,
				onComplete: () => {
					if (this.scoreUpdateMultiplier) {
						this.scoreUpdateMultiplier.destroy();
						this.scoreUpdateMultiplier = null;
					}
				},
			});
		}

		// Animate and destroy score update
		this.scene.tweens.add({
			targets: this.scoreUpdateText,
			y: scoreUpdateY - scoreUpdateTravelDistance,
			alpha: 0,
			duration: 1000,
			onComplete: () => {
				if (this.scoreUpdateText) {
					this.scoreUpdateText.destroy();
					this.scoreUpdateText = null;
				}
			},
		});
	}

	updateTimer(seconds: number) {
		this.timerText.setText(`00:${String(seconds).padStart(2, "0")}`);

		// Make timer text red when time is running low (under 10 seconds)
		if (seconds <= 10) {
			this.timerText.setColor(colors.red);
		} else {
			this.timerText.setColor(colors.white);
		}
	}

	updateMultiplier(multiplier: number, animate: boolean = false) {
		this.multiplierText.setText(`${multiplier}x`);

		// Add animation effect if requested
		if (animate) {
			this.scene.tweens.add({
				targets: this.multiplierText,
				scale: { from: 1.5, to: 1 },
				duration: 200,
				ease: "Bounce",
			});
		}
	}

	showLevelText(level: number) {
		this.levelText.setText(`Level ${level}`).setAlpha(1);

		// Fade out after a delay
		this.scene.tweens.add({
			targets: this.levelText,
			alpha: 0,
			duration: 2000, // Fades out over 2 seconds
		});
	}

	updateProgressBar(progress: number) {
		const { width, height } = this.scene.cameras.main;

		this.progressBar.clear();
		this.progressBar.fillStyle(hexadecimalColors.teal, 0.5);
		this.progressBar.fillRect(0, height - 6, width * progress, 6);
	}

	createMissile(
		shipX: number,
		shipY: number,
		targetX: number,
		targetY: number
	): void {
		const missile = this.scene.add.ellipse(
			shipX,
			shipY - 20,
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
		this.scene.tweens.add({
			targets: missile,
			x: targetX,
			y: targetY,
			duration: 200, // Adjust speed as needed
			onComplete: () => {
				// Create small impact effect
				const impact = this.scene.add.particles(targetX, targetY, "particle", {
					speed: { min: 20, max: 40 },
					scale: { start: 0.4, end: 0 },
					lifespan: 200,
					quantity: 3,
					blendMode: "ADD",
				});

				// Clean up impact and missile
				this.scene.time.delayedCall(200, () => {
					impact.destroy();
					missile.destroy();
				});
			},
		});
	}

	showStats(stats: {
		wpm: number;
		accuracy: number;
		wordsCompleted: number;
		totalKeysPressed: number;
		mostProblematicChars?: [string, number][];
	}): StatsDisplay {
		const { width, height } = this.scene.cameras.main;
		this.clearStatsElements();

		// Create semi-transparent background
		const bg = this.scene.add
			.rectangle(
				width / 2,
				height / 2,
				width * 0.7,
				height * 0.6,
				0x000000,
				0.8
			)
			.setDepth(3);
		this.statsElements.push(bg);

		// Create stats text
		const title = this.scene.add
			.text(width / 2, height / 2 - 100, "YOUR TYPING STATS", {
				fontSize: "28px",
				fontFamily: "Monospace",
				color: colors.yellow,
			})
			.setOrigin(0.5)
			.setDepth(3);
		this.statsElements.push(title);

		const statsText = this.scene.add
			.text(
				width / 2,
				height / 2 - 50,
				`WPM: ${stats.wpm}  |  Accuracy: ${stats.accuracy}`,
				{
					fontSize: "22px",
					fontFamily: "Monospace",
					color: colors.white,
				}
			)
			.setOrigin(0.5)
			.setDepth(3);
		this.statsElements.push(statsText);

		const wordsCompletedText = this.scene.add
			.text(
				width / 2,
				height / 2 - 20,
				`Words Completed: ${stats.wordsCompleted}  |  Keys Pressed: ${stats.totalKeysPressed}`,
				{
					fontSize: "18px",
					fontFamily: "Monospace",
					color: colors.white,
				}
			)
			.setOrigin(0.5)
			.setDepth(3);
		this.statsElements.push(wordsCompletedText);

		// Show most problematic characters if available
		if (stats.mostProblematicChars && stats.mostProblematicChars.length > 0) {
			let errorText = "Most Errors: ";
			stats.mostProblematicChars.forEach(
				(char: [string, number], index: number) => {
					errorText += `'${char[0]}' (${char[1]})`;
					if (
						stats.mostProblematicChars &&
						index < stats.mostProblematicChars.length - 1
					) {
						errorText += ", ";
					}
				}
			);

			const problemCharsText = this.scene.add
				.text(width / 2, height / 2 + 20, errorText, {
					fontSize: "18px",
					fontFamily: "Monospace",
					color: colors.red,
				})
				.setOrigin(0.5)
				.setDepth(3);
			this.statsElements.push(problemCharsText);
		}

		// Add continue button
		const continueButton = this.scene.add
			.text(width / 2, height / 2 + 100, "Continue", {
				fontSize: "24px",
				fontFamily: "Monospace",
				color: colors.green,
			})
			.setOrigin(0.5)
			.setDepth(3)
			.setInteractive()
			.on("pointerover", () => continueButton.setColor(colors.yellow))
			.on("pointerout", () => continueButton.setColor(colors.green));

		this.statsElements.push(continueButton);

		return {
			destroy: () => this.clearStatsElements(),
			continueButton,
		};
	}

	private clearStatsElements() {
		this.statsElements.forEach((element) => element.destroy());
		this.statsElements = [];
	}
}
