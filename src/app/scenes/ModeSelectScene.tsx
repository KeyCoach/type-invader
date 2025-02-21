import { Scene } from "phaser";
import { colors } from "../constants/colors";
import { KeyboardNavigation, NavigationItem } from "../../utils/NavigationUtils";

export class ModeSelectScene extends Scene {
	private navigation!: KeyboardNavigation;

	constructor() {
		super({ key: "ModeSelectScene" });
	}

	create() {
		const { width, height } = this.cameras.main;

		// Initialize keyboard navigation
		this.navigation = new KeyboardNavigation(this).init();

		// Title
		this.add
			.text(width / 2, height / 4, "Select Game Mode", {
				fontSize: "40px",
				fontFamily: "Monospace",
				color: colors.white,
			})
			.setOrigin(0.5);

		// Free Play button
		const freePlayButton = this.add
			.text(width / 2, height / 2 - 30, "Free Play", {
				fontSize: "32px",
				fontFamily: "Monospace",
				color: colors.green,
			})
			.setOrigin(0.5)
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => freePlayButton.setColor(colors.yellow))
			.on("pointerout", () => freePlayButton.setColor(colors.green))
			.on("pointerdown", () => this.scene.start("GameScene", { mode: "free" }));

		// Letter Mode button
		const letterModeButton = this.add
			.text(width / 2, height / 2 + 30, "Letter Mode", {
				fontSize: "32px",
				fontFamily: "Monospace",
				color: colors.green,
			})
			.setOrigin(0.5)
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => letterModeButton.setColor(colors.yellow))
			.on("pointerout", () => letterModeButton.setColor(colors.green))
			.on("pointerdown", () => this.scene.start("LetterSelectScene"));

		// Back button
		const backButton = this.add
			.text(32, height - 40, "← Back", {
				fontSize: "24px",
				fontFamily: "Monospace",
				color: colors.red,
			})
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => backButton.setColor(colors.yellow))
			.on("pointerout", () => backButton.setColor(colors.red))
			.on("pointerdown", () => this.scene.start("MainMenuScene"));

		// Add to navigation system
		this.navigation.addItems([
			{
				element: freePlayButton,
				position: { row: 0, col: 0 },
				onSelect: () => this.scene.start("GameScene", { mode: "free" }),
			},
			{
				element: letterModeButton,
				position: { row: 1, col: 0 },
				onSelect: () => this.scene.start("LetterSelectScene"),
			},
			{
				element: backButton,
				position: { row: 2, col: 0 },
				onSelect: () => this.scene.start("MainMenuScene"),
			},
		]);

		// Add instructions text
		this.add
			.text(
				width / 2,
				height - 50,
				"Use arrow keys to navigate, ENTER to select",
				{
					fontSize: "16px",
					fontFamily: "Monospace",
					color: colors.white,
				}
			)
			.setOrigin(0.5);
	}
}
