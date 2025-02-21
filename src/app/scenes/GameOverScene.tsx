import { Scene } from "phaser";
import { colors } from "../constants/colors";
import { KeyboardNavigation, NavigationItem } from "../../utils/NavigationUtils";

export class GameOverScene extends Scene {
	private score: number = 0;
	private navigation!: KeyboardNavigation;

	constructor() {
		super({ key: "GameOverScene" });
	}

	init(data: { score: number }) {
		this.score = data.score;
	}

	create() {
		const { width, height } = this.cameras.main;

		// Initialize keyboard navigation
		this.navigation = new KeyboardNavigation(this).init();

		this.add
			.text(width / 2, height / 3, "GAME OVER", {
				fontSize: "32px",
				color: "#ffffff",
			})
			.setOrigin(0.5);

		this.add
			.text(width / 2, height / 2, `Final Score: ${this.score}`, {
				fontSize: "24px",
				color: "#ffffff",
			})
			.setOrigin(0.5);

		const restartText = this.add
			.text(width / 2, (height * 2) / 3, "Click to Restart", {
				fontSize: "24px",
				color: colors.green,
			})
			.setOrigin(0.5)
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
	}
}
