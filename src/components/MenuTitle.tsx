// utils/MenuTitle.ts
import { Scene } from "phaser";

interface TitleColorScheme {
	main: string; // Main text color
	shadow1: string; // First shadow color (e.g., cyan)
	shadow2: string; // Second shadow color (e.g., magenta)
	glowColor?: number; // Optional glow effect color (as hexadecimal)
	glowAlpha?: number; // Optional glow effect alpha
}

export class MenuTitle {
	private scene: Scene;
	private titleContainer: Phaser.GameObjects.Container;
	private letters: Phaser.GameObjects.Container[] = [];
	private isAnimating: boolean = false;
	private titleText: string;
	private finalY: number;
	private fontSize: string;
	private colorScheme: TitleColorScheme;

	/**
	 * Creates an animated menu title with glitch effects
	 * @param scene The current Phaser scene
	 * @param titleText The text to display
	 * @param finalY The final Y position for the title
	 * @param fontSize Font size
	 * @param colorScheme Color scheme for the title
	 */
	constructor(
		scene: Scene,
		titleText: string,
		finalY: number,
		fontSize: string = "128px",
		colorScheme: TitleColorScheme = {
			main: "#FFFFFF",
			shadow1: "#00FFFF",
			shadow2: "#FF00FF",
			glowColor: 0xffffff,
			glowAlpha: 0.07,
		}
	) {
		this.scene = scene;
		this.titleText = titleText;
		this.finalY = finalY;
		this.fontSize = fontSize;
		this.colorScheme = colorScheme;
		this.titleContainer = this.scene.add.container(0, 0);
	}

	/**
	 * Creates and animates the title
	 * @param delay Initial delay before animation starts
	 * @param letterDelay Delay between each letter's animation
	 * @returns The container holding all title elements
	 */
	public createAnimatedTitle(
		delay: number = 0,
		letterDelay: number = 120
	): Phaser.GameObjects.Container {
		const { width } = this.scene.cameras.main;
		const startY = -50; // Starting position above the screen

		// Clear any existing letters
		this.letters = [];
		this.titleContainer.removeAll(true);

		// Create each letter separately
		for (let i = 0; i < this.titleText.length; i++) {
			const letter = this.titleText[i];

			// For space, use a smaller invisible character
			if (letter === " ") {
				const spaceText = this.scene.add.text(0, 0, " ", {
					fontSize: this.fontSize,
					fontFamily: "Monospace",
					color: this.colorScheme.main,
				});

				spaceText.setPosition(
					width / 2 - (this.titleText.length * 24) / 2 + i * 24,
					startY
				);

				this.letters.push(spaceText as unknown as Phaser.GameObjects.Container);
				this.titleContainer.add(spaceText);
				continue;
			}

			// Create letter with glitch effect (colored shadows)
			const letterContainer = this.scene.add.container(
				width / 2 - (this.titleText.length * 24) / 2 + i * 24,
				startY
			);

			// First shadow (e.g., cyan)
			const shadow1 = this.scene.add
				.text(0, 0, letter, {
					fontSize: this.fontSize,
					fontFamily: "Monospace",
					color: this.colorScheme.shadow1,
				})
				.setOrigin(0.5)
				.setAlpha(0.8);

			// Second shadow (e.g., magenta)
			const shadow2 = this.scene.add
				.text(0, 0, letter, {
					fontSize: this.fontSize,
					fontFamily: "Monospace",
					color: this.colorScheme.shadow2,
				})
				.setOrigin(0.5)
				.setAlpha(0.8);

			// Main text
			const mainText = this.scene.add
				.text(0, 0, letter, {
					fontSize: this.fontSize,
					fontFamily: "Monospace",
					color: this.colorScheme.main,
				})
				.setOrigin(0.5);

			// Apply small random offset to the colored shadows for glitch effect
			shadow1.setPosition(-2, 2);
			shadow2.setPosition(2, -2);

			// Add all elements to the container
			letterContainer.add([shadow1, shadow2, mainText]);
			letterContainer.setDepth(1);

			this.letters.push(letterContainer);
			this.titleContainer.add(letterContainer);
		}

		// Don't start animation immediately if we're just creating the title
		if (delay >= 0) {
			this.animateTitle(delay, letterDelay);
		}

		return this.titleContainer;
	}

	/**
	 * Animates the title letters flying in
	 * @param initialDelay Delay before animation starts
	 * @param letterDelay Delay between each letter
	 */
	public animateTitle(
		initialDelay: number = 0,
		letterDelay: number = 120
	): void {
		if (this.isAnimating) return;
		this.isAnimating = true;

		// Animate each letter with a delay between them
		this.letters.forEach((letter, index) => {
			// Calculate delay based on letter position
			const delay = initialDelay + index * letterDelay;

			// Initial small random rotation for more dynamic feel
			letter.setRotation((Phaser.Math.Between(-15, 15) * Math.PI) / 180);

			// First tween: letter flies in from top
			this.scene.tweens.add({
				targets: letter,
				y: this.finalY,
				rotation: 0, // Straighten the letter
				duration: 800,
				delay: delay,
				ease: "Bounce.easeOut",
				onComplete: () => {
					// Apply continuous subtle floating animation after arrival
					if (letter.type === "Container") {
						this.scene.tweens.add({
							targets: letter,
							y: this.finalY - Phaser.Math.Between(2, 5),
							duration: Phaser.Math.Between(1500, 2500),
							yoyo: true,
							repeat: -1,
							delay: Phaser.Math.Between(0, 500), // Randomize timing for each letter
						});

						// Optional: add random glitch effect occasionally
						this.scene.time.addEvent({
							delay: Phaser.Math.Between(5000, 10000),
							callback: () => this.glitchEffect(letter),
							callbackScope: this,
							loop: true,
						});
					}

					// Mark animation as complete when the last letter is done
					if (index === this.letters.length - 1) {
						this.isAnimating = false;
					}
							
				},
			});
		});
	}

	/**
	 * Creates a single glitch effect for a letter
	 * @param letterContainer The letter container to apply the effect to
	 */
	private glitchEffect(letterContainer: Phaser.GameObjects.GameObject): void {
		if (letterContainer.type !== "Container") return;

		// Get the shadow elements
		const container = letterContainer as Phaser.GameObjects.Container;
		if (container.list.length < 3) return;

		const shadow1 = container.list[0] as Phaser.GameObjects.Text;
		const shadow2 = container.list[1] as Phaser.GameObjects.Text;

		// Temporarily increase the offset for glitch effect
		const originalShadow1X = shadow1.x;
		const originalShadow1Y = shadow1.y;
		const originalShadow2X = shadow2.x;
		const originalShadow2Y = shadow2.y;

		// Apply stronger glitch
		shadow1.setPosition(
			originalShadow1X - Phaser.Math.Between(2, 6),
			originalShadow1Y + Phaser.Math.Between(2, 5)
		);

		shadow2.setPosition(
			originalShadow2X + Phaser.Math.Between(2, 6),
			originalShadow2Y - Phaser.Math.Between(2, 5)
		);

		// Reset after short delay
		this.scene.time.delayedCall(150, () => {
			shadow1.setPosition(originalShadow1X, originalShadow1Y);
			shadow2.setPosition(originalShadow2X, originalShadow2Y);
		});
	}

	/**
	 * Triggers a glitch effect on all letters at once
	 */
	public triggerFullGlitch(): void {
		this.letters.forEach((letter) => {
			if (letter.type === "Container") {
				this.glitchEffect(letter);
			}
		});
	}

	/**
	 * Updates the color scheme of the title
	 * @param newColorScheme The new color scheme to apply
	 */
	public updateColors(newColorScheme: Partial<TitleColorScheme>): void {
		// Update the color scheme with new values
		this.colorScheme = { ...this.colorScheme, ...newColorScheme };

		// Apply new colors to existing letters
		this.letters.forEach((letterObj) => {
			if (letterObj.type === "Container") {
				const container = letterObj as Phaser.GameObjects.Container;

				// Update only if the container has the expected structure
				if (container.list.length >= 3) {
					const shadow1 = container.list[0] as Phaser.GameObjects.Text;
					const shadow2 = container.list[1] as Phaser.GameObjects.Text;
					const mainText = container.list[2] as Phaser.GameObjects.Text;

					// Apply new colors
					shadow1.setColor(this.colorScheme.shadow1);
					shadow2.setColor(this.colorScheme.shadow2);
					mainText.setColor(this.colorScheme.main);
				}
			} else if (letterObj.type === "Text") {
				// For spaces
				(letterObj as unknown as Phaser.GameObjects.Text).setColor(
					this.colorScheme.main
				);
			}
		});
	}

	/**
	 * Destroys the title elements to clean up memory
	 */
	public destroy(): void {
		this.titleContainer.destroy();
		this.letters = [];
	}
}
