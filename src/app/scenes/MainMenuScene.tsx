import { Scene } from "phaser";
import { colors } from "../constants/colors";
import { KeyboardNavigation, NavigationItem } from "../../utils/NavigationUtils";

export class MainMenuScene extends Scene {
	private navigation!: KeyboardNavigation;

	constructor() {
		super({ key: "MainMenuScene" });
	}

	preload() {
		this.load.image("asteroid", "/assets/img/sprite/asteroid.png");
		this.load.image("particle", "/assets/img/sprite/particle.png");
		this.load.image("background", "/assets/img/bg/blue-galaxy.png");
		this.load.image("ship", "/assets/img/sprite/ship.png");
	}

	create() {
		const { width, height } = this.cameras.main;

		// Initialize keyboard navigation
		  this.navigation = new KeyboardNavigation(this).init();

		// Title
		this.add
			.text(width / 2, height / 3, "Typing Asteroids", {
				fontSize: "48px",
				fontFamily: "Monospace",
				color: colors.white,
			})
			.setOrigin(0.5);

		// Play button
		const playButton = this.add
			.text(width / 2, height / 2, "Play Now", {
				fontSize: "32px",
				fontFamily: "Monospace",
				color: colors.green,
			})
			.setOrigin(0.5)
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => playButton.setColor(colors.yellow))
			.on("pointerout", () => playButton.setColor(colors.green))
			.on("pointerdown", () => this.scene.start("ModeSelectScene"));

		// Add to navigation system
		this.navigation.addItem({
			element: playButton,
			position: { row: 0, col: 0 },
			onSelect: () => this.scene.start("ModeSelectScene"),
		});

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
