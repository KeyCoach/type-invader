// ThemeManager.ts
export type GameTheme = "space" | "birthday" | "soccer" | "beach";

interface ThemeAssets {
	background: string;
	asteroid: string;
	particle: string;
	ship: string;
	animation?: string;
	colors: {
		primary: number;
		secondary: number;
		highlight: number;
		asteroidText: number;
		menuBackground: number;
	};
}

interface MenuConfig {
	width?: number;
	height?: number;
	horizontalPadding?: number;
	verticalPadding?: number;
	borderRadius?: number;
	alpha?: number;
}

export class ThemeManager {
	private scene: Phaser.Scene | null = null;
	private shootingStarTimer?: Phaser.Time.TimerEvent;
	private currentTheme: GameTheme = "space";

	// Define theme assets for each theme
	private themeAssets: Record<GameTheme, ThemeAssets> = {
		space: {
			background: "blue-galaxy",
			asteroid: "asteroid",
			particle: "particle",
			ship: "ship",
			animation: "spin",
			colors: {
				primary: 0xf0f0f0,
				secondary: 0x62de6d,
				highlight: 0xebdf64,
				asteroidText: 0xf0f0f0,
				menuBackground: 0x000000,
			},
		},
		birthday: {
			background: "party-background",
			asteroid: "balloon",
			particle: "confetti",
			ship: "party-hat",
			animation: "sway",
			colors: {
				primary: 0xffd700,
				secondary: 0xff6b6b,
				highlight: 0xe91e63,
				asteroidText: 0x000000,
				menuBackground: 0x332244,
			},
		},
		soccer: {
			background: "soccer-field",
			asteroid: "soccer-ball",
			particle: "soccer-ball",
			ship: "soccer-player",
			animation: "kick",
			colors: {
				primary: 0x000000,
				secondary: 0xffffff,
				highlight: 0x00ff00,
				asteroidText: 0xfefefe,
				menuBackground: 0x000000,
			},
		},
		beach: {
			background: "beach-background",
			asteroid: "coconut",
			particle: "water-splash",
			ship: "surfboard",
			animation: "ride",
			colors: {
				primary: 0x00ffff,
				secondary: 0xffff00,
				highlight: 0xffa500,
				asteroidText: 0xfefefe,
				menuBackground: 0x87ceeb,
			},
		},
	};

	constructor() {}

	setScene(scene: Phaser.Scene): void {
		this.scene = scene;
	}

	setTheme(theme: GameTheme): void {
		this.currentTheme = theme;

		// Skip if no scene is set
		if (!this.scene) return;

		// Update background image
		const backgroundObjects = this.scene.children.list.filter(
			(obj) => obj instanceof Phaser.GameObjects.Image && obj.depth === -1
		);

		if (backgroundObjects.length > 0) {
			const bg = backgroundObjects[0] as Phaser.GameObjects.Image;
			bg.setTexture(this.getAsset("background"));

			// Reset background size
			const { width, height } = this.scene.cameras.main;
			bg.setDisplaySize(width, height);
		} else {
			this.createBackground();
		}

		// Update menu backgrounds
		const menuBackgrounds = this.scene?.children.list.filter(
			(obj) => obj instanceof Phaser.GameObjects.Graphics && obj.depth === 1
		);

		if (typeof menuBackgrounds != "undefined" && menuBackgrounds.length > 0) {
			const menuBg = menuBackgrounds[0] as Phaser.GameObjects.Graphics;
			menuBg.clear();
			menuBg.fillStyle(this.getColor("menuBackground"), 0.7);

			// Update menu background
			const { width, height } = this.scene.cameras.main;
			menuBg.fillRoundedRect(width / 2 - 280, height / 2 - 165, 560, 330, 20);
		}

		// Update asteroids to match the current theme
		const asteroids = this.scene.children.list.filter(
			(obj) =>
				obj instanceof Phaser.GameObjects.Sprite &&
				(obj.texture.key === "asteroid" ||
					obj.texture.key === "balloon" ||
					obj.texture.key === "soccer-ball" ||
					obj.texture.key === "coconut")
		);

		if (asteroids.length > 0) {
			asteroids.forEach((asteroid) => {
				(asteroid as Phaser.GameObjects.Sprite).setTexture(
					this.getAsset("asteroid")
				);
			});
		}

		// Update ship sprite if it exists
		const ships = this.scene.children.list.filter(
			(obj) =>
				obj instanceof Phaser.GameObjects.Sprite && obj.texture.key === "ship"
		);

		if (ships.length > 0) {
			ships.forEach((ship) => {
				(ship as Phaser.GameObjects.Sprite).setTexture(this.getAsset("ship"));
			});
		}
	}

	getCurrentTheme(): GameTheme {
		return this.currentTheme;
	}

	getAsset(key: keyof ThemeAssets): string {
		if (key === "animation") {
			return this.themeAssets[this.currentTheme][key] as string;
		}
		return this.themeAssets[this.currentTheme][key] as string;
	}

	getColor(key: keyof ThemeAssets["colors"]): number {
		return this.themeAssets[this.currentTheme].colors[key];
	}

	getTextColor(key: keyof ThemeAssets["colors"]): string {
		// Convert the numeric color to a hex string that Phaser text can use
		const colorValue = this.themeAssets[this.currentTheme].colors[key];
		return "#" + colorValue.toString(16).padStart(6, "0");
	}

	createBackground(): Phaser.GameObjects.Image | null {
		if (!this.scene) return null;

		const { width, height } = this.scene.cameras.main;
		return this.scene.add
			.image(width / 2, height / 2, this.getAsset("background"))
			.setOrigin(0.5)
			.setDisplaySize(width, height)
			.setDepth(-1); // Consistent depth for easy finding later
	}

	createMenuBackground(
		config: MenuConfig = {}
	): Phaser.GameObjects.Graphics | null {
		if (!this.scene) return null;

		const { width, height } = this.scene.cameras.main;
		const {
			width: menuWidth = 400,
			height: menuHeight = 250,
			horizontalPadding = 80,
			verticalPadding = 40,
			borderRadius = 20,
			alpha = 0.7,
		} = config;

		// TODO: refactor to use menuButtonBox naming
		const menuBackground = this.scene.add.graphics();
		menuBackground.fillStyle(this.getColor("menuBackground"), alpha);
		menuBackground.fillRoundedRect(
			width / 2 - (menuWidth + horizontalPadding * 2) / 2,
			height / 2 - (menuHeight + verticalPadding * 2) / 2,
			menuWidth + horizontalPadding * 2,
			menuHeight + verticalPadding * 2,
			borderRadius
		);
		menuBackground.setDepth(1);

		return menuBackground;
	}

	createThemeEffect(): void {
		// Each theme could have a different effect
		switch (this.currentTheme) {
			case "space":
				this.createShootingStar();
				break;
			case "birthday":
				this.createFloatingBalloon();
				break;
			case "soccer":
				this.createBouncingBall();
				break;
			case "beach":
				this.createWave();
				break;
		}
	}

	startThemeEffects(frequency: number = 5000): void {
		this.stopThemeEffects(); // Clean up existing

		if (!this.scene) return;

		this.shootingStarTimer = this.scene.time.addEvent({
			delay: frequency,
			callback: this.createThemeEffect,
			callbackScope: this,
			loop: true,
		});

		// Create one immediately
		this.createThemeEffect();
	}

	stopThemeEffects(): void {
		if (this.shootingStarTimer) {
			this.shootingStarTimer.destroy();
			this.shootingStarTimer = undefined;
		}
	}

	// Theme-specific effect methods
	private createShootingStar(): void {
		if (!this.scene) return;

		// Original shooting star code
		const { width, height } = this.scene.cameras.main;

		const startX = Phaser.Math.Between(0, width);
		const startY = -20;

		const star = this.scene.add
			.ellipse(startX, startY, 3, 12, this.getColor("primary"))
			.setDepth(0);

		// Rest of shooting star code...
	}

	private createFloatingBalloon(): void {
		// Birthday Party theme specific effect
	}

	private createBouncingBall(): void {
		// Soccer theme specific effect
	}

	private createWave(): void {
		// Beach theme specific effect
	}
}
