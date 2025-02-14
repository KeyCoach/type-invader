import { Scene } from "phaser";

export class MenuScene extends Scene {
	constructor() {
		super({ key: "MenuScene" });
	}

	preload() {
		this.load.image("asteroid", "/assets/asteroid.png");
		this.load.image("particle", "/assets/particle.png"); // Also load the particle image
	}

	create() {
		const { width, height } = this.cameras.main;

		this.add
			.text(width / 2, height / 3, "TYPING ASTEROIDS", {
				fontSize: "32px",
				color: "#ffffff",
			})
			.setOrigin(0.5);

		const startText = this.add
			.text(width / 2, height / 2, "Click to Start", {
				fontSize: "24px",
				color: "#ffffff",
			})
			.setOrigin(0.5);

		startText.setInteractive();
		startText.on("pointerdown", () => {
			this.scene.start("GameScene");
		});
	}
}
