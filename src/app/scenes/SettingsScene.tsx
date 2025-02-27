// src/app/scenes/SettingsScene.tsx

import { Scene } from "phaser";
import { alphaValues, colors, hexadecimalColors } from "../constants/colors";
import {
	KeyboardNavigation,
	NavigationItem,
} from "../../utils/NavigationUtils";
import { gameSettings, themeManager, GameSettings } from "@/game";

export class SettingsScene extends Scene {
	private navigation!: KeyboardNavigation;

	preload() {
		this.load.image("asteroid", "/assets/img/sprite/asteroid.png");
		this.load.image("particle", "/assets/img/sprite/particle.png");
		this.load.image("blue-galaxy", "/assets/img/space/blue-galaxy.png");
		this.load.image("ship", "/assets/img/sprite/ship.png");

		this.load.image("party-background", "/assets/img/party/party-bg.png");

		this.load.image("soccer-field", "/assets/img/soccer/soccer-field.png");

		this.load.image("beach-background", "/assets/img/beach/beach-bg.png");
	}

	constructor() {
		super({ key: "SettingsScene" });
	}

	create() {
		const { width, height } = this.cameras.main;

		themeManager.setScene(this);
		themeManager.createBackground();
		themeManager.createMenuBackground();

		// Initialize keyboard navigation
		this.navigation = new KeyboardNavigation(this).init();

		// Settings menu container
		// const horizontalPadding = 80;
		// const verticalPadding = 40;
		// const menuHeight = 380;
		// const menuWidth = 500;

		// Title
		this.add
			.text(width / 2, height / 6, "Settings", {
				fontSize: "40px",
				fontFamily: "Monospace",
				color: colors.white,
			})
			.setOrigin(0.5)
			.setDepth(1);

		const navigationItems: NavigationItem[] = [];

		// Theme Selection
		const themeLabel = this.add
			.text(width / 6, height / 3, "Theme:", {
				fontSize: "24px",
				fontFamily: "Monospace",
				color: colors.white,
			})
			.setOrigin(0, 0.5)
			.setDepth(1);

		const themes = ["Space", "Party", "Soccer", "Beach"];
		const themeButtons = themes.map((theme, index) => {
			const button = this.add
				.rectangle(
					width / 2 + (index - 1) * 120,
					height / 3,
					100,
					40,
					hexadecimalColors.menuButtonBg
				)
				.setInteractive({ useHandCursor: true })
				.setDepth(2);

			const text = this.add
				.text(button.x, button.y, theme, {
					fontSize: "20px",
					fontFamily: "Monospace",
					color:
						gameSettings.theme === theme.toLowerCase()
							? colors.yellow
							: colors.white,
				})
				.setOrigin(0.5)
				.setDepth(2);

			button.on("pointerover", () => {
				text.setColor(colors.yellow);
			});

			button.on("pointerout", () => {
				if (gameSettings.theme !== theme.toLowerCase()) {
					text.setColor(colors.white);
				}
			});

			// Add click handler
			button.on("pointerdown", () => {
				this.setTheme(theme.toLowerCase() as GameSettings["theme"]);
			});

			navigationItems.push({
				element: button,
				position: { row: 0, col: index },
				onSelect: () =>
					this.setTheme(theme.toLowerCase() as GameSettings["theme"]),
			});

			return { button, text };
		});

		// Sound Toggle
		const soundLabel = this.add
			.text(width / 6, height / 2, "Sound:", {
				fontSize: "24px",
				fontFamily: "Monospace",
				color: colors.white,
			})
			.setOrigin(0, 0.5)
			.setDepth(1);

		const soundToggle = this.add
			.rectangle(width / 2, height / 2, 100, 40, hexadecimalColors.menuButtonBg)
			.setInteractive({ useHandCursor: true })
			.setDepth(1);

		const soundText = this.add
			.text(
				soundToggle.x,
				soundToggle.y,
				gameSettings.soundEnabled ? "ON" : "OFF",
				{
					fontSize: "20px",
					fontFamily: "Monospace",
					color: gameSettings.soundEnabled ? colors.green : colors.red,
				}
			)
			.setOrigin(0.5)
			.setDepth(1);

		navigationItems.push({
			element: soundToggle,
			position: { row: 1, col: 1 },
			onSelect: () => this.toggleSound(soundText),
		});

		// Volume Sliders
		const createVolumeSlider = (
			yPos: number,
			label: string,
			initialValue: number,
			rowIndex: number
		) => {
			const sliderLabel = this.add
				.text(width / 6, yPos, label, {
					fontSize: "24px",
					fontFamily: "Monospace",
					color: colors.white,
				})
				.setOrigin(0, 0.5)
				.setDepth(1);

			const sliderBg = this.add
				.rectangle(width / 2, yPos, 200, 10, 0x666666)
				.setOrigin(0.5)
				.setDepth(1);

			const slider = this.add
				.rectangle(width / 2 - 100 + initialValue * 200, yPos, 20, 30, 0x888888)
				.setInteractive({ draggable: true, useHandCursor: true })
				.setDepth(1);

			const sliderValue = this.add
				.text(width / 2 + 120, yPos, `${Math.round(initialValue * 100)}%`, {
					fontSize: "20px",
					fontFamily: "Monospace",
					color: colors.white,
				})
				.setOrigin(0, 0.5)
				.setDepth(1);

			slider.on("drag", (pointer: Phaser.Input.Pointer) => {
				const minX = width / 2 - 100;
				const maxX = width / 2 + 100;
				slider.x = Phaser.Math.Clamp(pointer.x, minX, maxX);
				const value = (slider.x - minX) / 200;
				sliderValue.setText(`${Math.round(value * 100)}%`);

				if (label === "Music:") {
					gameSettings.musicVolume = value;
				} else {
					gameSettings.sfxVolume = value;
				}
			});

			navigationItems.push({
				element: slider,
				position: { row: rowIndex, col: 1 },
				onSelect: () => {}, // Slider interaction is handled by drag events
			});
		};

		createVolumeSlider(height / 2 + 80, "Music:", gameSettings.musicVolume, 2);
		createVolumeSlider(height / 2 + 160, "SFX:", gameSettings.sfxVolume, 3);

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

		navigationItems.push({
			element: backButton,
			position: { row: 4, col: 0 },
			onSelect: () => this.scene.start("MainMenuScene"),
		});

		// Add all items to navigation system
		this.navigation.addItems(navigationItems);

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

	private setTheme(theme: GameSettings["theme"]) {
		gameSettings.theme = theme;

		themeManager.setTheme(theme);

		// Find all theme button texts
		const themeButtonsTexts = this.children.list.filter(
			(obj) =>
				obj instanceof Phaser.GameObjects.Text &&
				["Space", "Party", "Soccer", "Beach"].includes(obj.text)
		) as Phaser.GameObjects.Text[];

		// Update their colors based on the current theme
		themeButtonsTexts.forEach((text) => {
			text.setColor(
				gameSettings.theme === text.text.toLowerCase()
					? colors.yellow
					: colors.white
			);
		});

		console.log(`Theme set to ${gameSettings.theme}`);
		this.scene.restart();
	}

	private toggleSound(soundText: Phaser.GameObjects.Text) {
		gameSettings.soundEnabled = !gameSettings.soundEnabled;
		soundText.setText(gameSettings.soundEnabled ? "ON" : "OFF");
		soundText.setColor(gameSettings.soundEnabled ? colors.green : colors.red);
		// Here you would implement the actual sound toggle logic
		console.log(`Sound ${gameSettings.soundEnabled ? "enabled" : "disabled"}`);
	}
}
