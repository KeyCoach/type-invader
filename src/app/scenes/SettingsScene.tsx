import { Scene } from "phaser";
import { colors } from "../constants/colors";
import {
	KeyboardNavigation,
	NavigationItem,
} from "../../utils/NavigationUtils";

export interface GameSettings {
	theme: "classic" | "neon" | "retro";
	soundEnabled: boolean;
	musicVolume: number;
	sfxVolume: number;
}

export class SettingsScene extends Scene {
	private navigation!: KeyboardNavigation;
	private settings: GameSettings = {
		theme: "classic",
		soundEnabled: true,
		musicVolume: 0.7,
		sfxVolume: 0.8,
	};

	constructor() {
		super({ key: "SettingsScene" });
	}

	create() {
		const { width, height } = this.cameras.main;

		// Initialize keyboard navigation
		this.navigation = new KeyboardNavigation(this).init();

		// Title
		this.add
			.text(width / 2, height / 6, "Settings", {
				fontSize: "40px",
				fontFamily: "Monospace",
				color: colors.white,
			})
			.setOrigin(0.5);

		const navigationItems: NavigationItem[] = [];

		// Theme Selection
		const themeLabel = this.add
			.text(width / 4, height / 3, "Theme:", {
				fontSize: "24px",
				fontFamily: "Monospace",
				color: colors.white,
			})
			.setOrigin(0, 0.5);

		const themes = ["Classic", "Neon", "Retro"];
		const themeButtons = themes.map((theme, index) => {
			const button = this.add
				.rectangle(width / 2 + (index - 1) * 120, height / 3, 100, 40, 0x444444)
				.setInteractive({ useHandCursor: true });

			const text = this.add
				.text(button.x, button.y, theme, {
					fontSize: "20px",
					fontFamily: "Monospace",
					color:
						this.settings.theme === theme.toLowerCase()
							? colors.yellow
							: colors.white,
				})
				.setOrigin(0.5);

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
			.text(width / 4, height / 2, "Sound:", {
				fontSize: "24px",
				fontFamily: "Monospace",
				color: colors.white,
			})
			.setOrigin(0, 0.5);

		const soundToggle = this.add
			.rectangle(width / 2, height / 2, 100, 40, 0x444444)
			.setInteractive({ useHandCursor: true });

		const soundText = this.add
			.text(
				soundToggle.x,
				soundToggle.y,
				this.settings.soundEnabled ? "ON" : "OFF",
				{
					fontSize: "20px",
					fontFamily: "Monospace",
					color: this.settings.soundEnabled ? colors.green : colors.red,
				}
			)
			.setOrigin(0.5);

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
				.text(width / 4, yPos, label, {
					fontSize: "24px",
					fontFamily: "Monospace",
					color: colors.white,
				})
				.setOrigin(0, 0.5);

			const sliderBg = this.add
				.rectangle(width / 2, yPos, 200, 10, 0x666666)
				.setOrigin(0.5);

			const slider = this.add
				.rectangle(width / 2 - 100 + initialValue * 200, yPos, 20, 30, 0x888888)
				.setInteractive({ draggable: true, useHandCursor: true });

			const sliderValue = this.add
				.text(width / 2 + 120, yPos, `${Math.round(initialValue * 100)}%`, {
					fontSize: "20px",
					fontFamily: "Monospace",
					color: colors.white,
				})
				.setOrigin(0, 0.5);

			slider.on("drag", (pointer: Phaser.Input.Pointer) => {
				const minX = width / 2 - 100;
				const maxX = width / 2 + 100;
				slider.x = Phaser.Math.Clamp(pointer.x, minX, maxX);
				const value = (slider.x - minX) / 200;
				sliderValue.setText(`${Math.round(value * 100)}%`);

				if (label === "Music:") {
					this.settings.musicVolume = value;
				} else {
					this.settings.sfxVolume = value;
				}
			});

			navigationItems.push({
				element: slider,
				position: { row: rowIndex, col: 1 },
				onSelect: () => {}, // Slider interaction is handled by drag events
			});
		};

		createVolumeSlider(height / 2 + 80, "Music:", this.settings.musicVolume, 2);
		createVolumeSlider(height / 2 + 160, "SFX:", this.settings.sfxVolume, 3);

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
		this.settings.theme = theme;
		// Here you would implement the actual theme change logic
		console.log(`Theme changed to: ${theme}`);
	}

	private toggleSound(soundText: Phaser.GameObjects.Text) {
		this.settings.soundEnabled = !this.settings.soundEnabled;
		soundText.setText(this.settings.soundEnabled ? "ON" : "OFF");
		soundText.setColor(this.settings.soundEnabled ? colors.green : colors.red);
		// Here you would implement the actual sound toggle logic
		console.log(`Sound ${this.settings.soundEnabled ? "enabled" : "disabled"}`);
	}
}
