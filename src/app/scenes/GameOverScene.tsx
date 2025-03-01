// GameOverScene.tsx
import { Scene } from "phaser";
import { colors, hexadecimalColors } from "../constants/colors";
import { KeyboardNavigation } from "../../utils/NavigationUtils";
import { themeManager } from "@/game";

export class GameOverScene extends Scene {
	private score: number = 0;
	private navigation!: KeyboardNavigation;
	private nextStarTime: number = 0;
	private stats: { wpm: number; accuracy: string; wordsCompleted: number; mostProblematicChars: [string, number][] } | null = null;

	constructor() {
		super({ key: "GameOverScene" });
	}

	init(data: { score: number; stats?: { wpm: number; accuracy: string; wordsCompleted: number; mostProblematicChars: [string, number][] } | null }) {
		this.score = data.score;
		this.stats = data.stats ?? null;
	}

	create() {
		const { width, height } = this.cameras.main;

		themeManager.setScene(this);
		themeManager.createBackground();
		themeManager.createMenuBackground();

		// Initialize keyboard navigation
		this.navigation = new KeyboardNavigation(this).init();

		// Game Over title
		this.add
			.text(width / 2, height / 5, "GAME OVER", {
				fontSize: "42px",
				color: colors.whiteText,
			})
			.setOrigin(0.5)
			.setDepth(1);

		// Score display
		this.add
			.text(width / 2, height / 3, `Final Score: ${this.score}`, {
				fontSize: "28px",
				color: colors.whiteText,
			})
			.setOrigin(0.5)
			.setDepth(1);

		// Display typing statistics if available
		if (this.stats) {
			// Words Per Minute
			this.add
				.text(
					width / 2,
					height / 3 + 40,
					`Words Per Minute: ${this.stats.wpm}`,
					{
						fontSize: "20px",
						color: colors.whiteText,
					}
				)
				.setOrigin(0.5)
				.setDepth(1);

			// Typing Accuracy
			this.add
				.text(width / 2, height / 3 + 70, `Accuracy: ${this.stats.accuracy}`, {
					fontSize: "20px",
					color: colors.whiteText,
				})
				.setOrigin(0.5)
				.setDepth(1);

			// Words Completed
			this.add
				.text(
					width / 2,
					height / 3 + 100,
					`Words Completed: ${this.stats.wordsCompleted}`,
					{
						fontSize: "20px",
						color: colors.whiteText,
					}
				)
				.setOrigin(0.5)
				.setDepth(1);

			// Most Problematic Characters
			if (
				this.stats.mostProblematicChars &&
				this.stats.mostProblematicChars.length > 0
			) {
				let errorText = "Most Challenging Keys: ";
				this.stats.mostProblematicChars.forEach(
					(char: [string, number], index: number) => {
						errorText += `'${char[0]}' (${char[1]})`;
						if (this.stats && index < this.stats.mostProblematicChars.length - 1) {
							errorText += ", ";
						}
					}
				);

				this.add
					.text(width / 2, height / 3 + 130, errorText, {
						fontSize: "18px",
						color: colors.yellow,
					})
					.setOrigin(0.5)
					.setDepth(1);
			}
		}

		// Restart button
		const restartText = this.add
			.text(width / 2, (height * 3) / 4, "Click to Restart", {
				fontSize: "24px",
				color: colors.green,
			})
			.setOrigin(0.5)
			.setDepth(1)
			.setInteractive()
			.on("pointerover", () => restartText.setColor(colors.yellow))
			.on("pointerout", () => restartText.setColor(colors.green))
			.on("pointerdown", () => {
				this.scene.stop("GameOverScene");
				this.scene.start("MainMenuScene");
			});

		// Add to navigation system
		this.navigation.addItem({
			element: restartText,
			position: { row: 0, col: 0 },
			onSelect: () => {
				this.scene.stop("GameOverScene");
				this.scene.start("MainMenuScene");
			},
		});

		// Add instructions text
		this.add
			.text(width / 2, height - 50, "Press ENTER to restart", {
				fontSize: "16px",
				fontFamily: "Monospace",
				color: colors.white,
			})
			.setOrigin(0.5);

		this.nextStarTime = this.time.now + Phaser.Math.Between(500, 2000);
	}

	update() {
		const time = this.time.now;
		if (time > this.nextStarTime) {
			this.createShootingStar();
			this.nextStarTime = time + Phaser.Math.Between(500, 2000);
		}
	}

	private createShootingStar() {
		const { width, height } = this.cameras.main;

		// Random starting position along the top edge
		const startX = Phaser.Math.Between(0, width);
		const startY = -20;

		// Create the star using an ellipse
		const star = this.add
			.ellipse(
				startX,
				startY,
				3, // width
				12, // height
				hexadecimalColors.white
			)
			.setDepth(0); // Ensure stars are behind menu

		// Calculate random endpoint
		const endX = startX + Phaser.Math.Between(-200, 200);
		const endY = height + 50;

		// Calculate angle for rotation
		const angle = Phaser.Math.Angle.Between(startX, startY, endX, endY);
		star.rotation = angle - Math.PI / 2;

		// Create particle trail
		const particles = this.add
			.particles(startX, startY, "particle", {
				speed: { min: 10, max: 20 },
				scale: { start: 0.2, end: 0 },
				alpha: { start: 0.5, end: 0 },
				lifespan: 1000,
				blendMode: "ADD",
				frequency: 50,
				follow: star,
			})
			.setDepth(0); // Ensure particles are behind menu

		// Animate the star
		this.tweens.add({
			targets: star,
			x: endX,
			y: endY,
			duration: Phaser.Math.Between(2000, 4000),
			onComplete: () => {
				particles.destroy();
				star.destroy();
			},
		});
	}
}
