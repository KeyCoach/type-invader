// ThemeManager.ts
export type GameTheme = "space" | "party" | "soccer" | "beach";

interface ThemeAssets {
	background: string;
	asteroid: string;
	particle: string;
	ship: string;
	colors: {
		primary: number;
		secondary: number;
		highlight: number;
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
			colors: {
				primary: 0xf0f0f0,
				secondary: 0x62de6d,
				highlight: 0xebdf64,
				menuBackground: 0x000000,
			},
		},
		party: {
			background: "party-background",
			asteroid: "balloon",
			particle: "confetti",
			ship: "party-hat",
			colors: {
				primary: 0xffd700,
				secondary: 0xff6b6b,
				highlight: 0xe91e63,
				menuBackground: 0x332244,
			},
		},
		// Define other themes...
		soccer: {
			background: "soccer-field",
            asteroid: "soccer-ball",
            particle: "soccer-ball",
            ship: "soccer-player",
            colors: {
                primary: 0x000000,
                secondary: 0xffffff,
                highlight: 0x00ff00,
                menuBackground: 0x000000,
            },
		},
		beach: {
			background: "beach-background",
            asteroid: "coconut",
            particle: "water-splash",
            ship: "surfboard",
            colors: {
                primary: 0x00ffff,
                secondary: 0xffff00,
                highlight: 0xffa500,
                menuBackground: 0x87ceeb,
		    },
        },
	};

	constructor() {
	}

	setScene(scene: Phaser.Scene): void {
    this.scene = scene;
  }

	setTheme(theme: GameTheme): void {
		this.currentTheme = theme;
		// If you need to immediately update the current scene, add refresh logic here
	}

	getCurrentTheme(): GameTheme {
		return this.currentTheme;
	}

	getAsset(key: keyof ThemeAssets): string {
		return this.themeAssets[this.currentTheme][key] as string;
	}

	getColor(key: keyof ThemeAssets["colors"]): number {
		return this.themeAssets[this.currentTheme].colors[key];
	}

	createBackground(): Phaser.GameObjects.Image | null {
    if (!this.scene) return null;
    
    const { width, height } = this.scene.cameras.main;
    return this.scene.add
      .image(0, 0, this.getAsset('background'))
      .setOrigin(0, 0)
      .setDisplaySize(width, height);
  }

	createMenuBackground(config: MenuConfig = {}): Phaser.GameObjects.Graphics | null {
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
			case "party":
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
		// Party theme specific effect
	}

	private createBouncingBall(): void {
		// Soccer theme specific effect
	}

	private createWave(): void {
		// Beach theme specific effect
	}
}
