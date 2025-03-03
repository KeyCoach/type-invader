import { Scene } from "phaser";
import { themeManager, soundManager } from "@/game";
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
		this.load.audio("space-theme", "/assets/audio/space/theme.mp3");
		this.load.audio("space-explosion", "/assets/audio/space/explosion.m4a");

		// birthday party
		this.load.image("party-background", "/assets/img/party/party-bg.png");
		this.load.image("balloon", "/assets/img/party/white-balloon.png");
		// this.load.audio("party-theme", "/assets/audio/party/theme.mp3");
		this.load.audio("party-explosion", "/assets/audio/party/explosion.mp3");

		// soccer
		this.load.image("soccer-field", "/assets/img/soccer/soccer-field.png");
		this.load.image("soccer-ball", "/assets/img/soccer/soccer-ball.png");
		this.load.audio("soccer-theme", "/assets/audio/soccer/theme.mp3");
		this.load.audio("soccer-explosion", "/assets/audio/soccer/explosion.mp3");

		// beach
		this.load.image("beach-background", "/assets/img/beach/beach-bg.png");
		this.load.image("coconut", "/assets/img/beach/coconut.png");
		this.load.audio("beach-theme", "/assets/audio/beach/theme.mp3");
		this.load.audio("beach-explosion", "/assets/audio/beach/explosion.m4a");

		// TODO: Add game music for the menu screens
		// this.load.audio("menu-music", "/assets/audio/menu.mp3");

		// TOD: Add missile sound effects by theme
		// this.load.audio("{theme}-missile", "/assets/audio/theme/missile.mp3");
	}

	create() {
		const { width, height } = this.cameras.main;

		themeManager.setScene(this);
		soundManager.setScene(this);

		// Start playing theme music
		soundManager.playMusic("theme");

		themeManager.createBackground();
		themeManager.createMenuBackground();

		// Initialize keyboard navigation
		this.navigation = new KeyboardNavigation(this).init();

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
