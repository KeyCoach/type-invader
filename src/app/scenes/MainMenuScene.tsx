import { Scene } from "phaser";
import { themeManager } from "@/game";
import { colors, hexadecimalColors } from "../constants/colors";
import { KeyboardNavigation } from "../../utils/NavigationUtils";

export class MainMenuScene extends Scene {
	private navigation!: KeyboardNavigation;
	private nextStarTime: number = 0;

	constructor() {
		super({ key: "MainMenuScene" });
	}

	preload() {
		this.load.image("particle", "/assets/img/sprite/particle.png");
		this.load.image("ship", "/assets/img/sprite/ship.png");

		// space
		this.load.image("blue-galaxy", "/assets/img/space/blue-galaxy.png");
		this.load.image("asteroid", "/assets/img/space/asteroid.png");

		// birthday party
		this.load.image("party-background", "/assets/img/party/party-bg.png");
		this.load.image("balloon", "/assets/img/party/white-baloon.png");

		// soccer
		this.load.image("soccer-field", "/assets/img/soccer/soccer-field.png");
		this.load.image("soccer-ball", "/assets/img/soccer/soccer-ball.png");
		
		// beach
		this.load.image("beach-background", "/assets/img/beach/beach-bg.png");
		this.load.image("coconut", "/assets/img/beach/coconut.png");
	}

	create() {
		const { width, height } = this.cameras.main;

		themeManager.setScene(this);
		themeManager.createBackground();
		themeManager.createMenuBackground();

		// Initialize keyboard navigation
		this.navigation = new KeyboardNavigation(this).init();

		// Create container background with alpha
		// const horizontalPadding = 80;
		// const verticalPadding = 40;
		// const menuHeight = 250;
		// const menuWidth = 400;

		// Title
		this.add
			.text(width / 2, height / 2 - 80, "Type Invader", {
				fontSize: "48px",
				fontFamily: "Monospace",
				color: colors.white,
			})
			.setOrigin(0.5)
			.setDepth(1);

		// Play button
		const playButton = this.add
			.text(width / 2, height / 2, "Play Now", {
				fontSize: "32px",
				fontFamily: "Monospace",
				color: colors.green,
			})
			.setOrigin(0.5)
			.setDepth(1)
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => playButton.setColor(colors.yellow))
			.on("pointerout", () => playButton.setColor(colors.green))
			.on("pointerdown", () => this.scene.start("ModeSelectScene"));

		// Settings button
		const settingsButton = this.add
			.text(width / 2, height / 2 + 60, "Settings", {
				fontSize: "32px",
				fontFamily: "Monospace",
				color: colors.green,
			})
			.setOrigin(0.5)
			.setDepth(1)
			.setInteractive({ useHandCursor: true })
			.on("pointerover", () => settingsButton.setColor(colors.yellow))
			.on("pointerout", () => settingsButton.setColor(colors.green))
			.on("pointerdown", () => this.scene.start("SettingsScene"));

		// Add to navigation system
		this.navigation.addItems([
			{
				element: playButton,
				position: { row: 0, col: 0 },
				onSelect: () => this.scene.start("ModeSelectScene"),
			},
			{
				element: settingsButton,
				position: { row: 1, col: 0 },
				onSelect: () => this.scene.start("SettingsScene"),
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
			.setOrigin(0.5)
			.setDepth(1);

		// Initialize shooting star system
		this.nextStarTime = this.time.now + Phaser.Math.Between(500, 2000);
	}

	update() {
		const time = this.time.now;
		if (time > this.nextStarTime) {
			this.createShootingStar();
			this.nextStarTime = time + Phaser.Math.Between(500, 2000);
		}
	}

	shutdown() {
		themeManager.stopThemeEffects();
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
