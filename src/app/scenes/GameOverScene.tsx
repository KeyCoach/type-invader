import { Scene } from "phaser";

export class GameOverScene extends Scene {
	private score: number = 0;

	constructor() {
		super({ key: "GameOverScene" });
	}

	init(data: { score: number }) {
		this.score = data.score;
	}

	create() {
		const { width, height } = this.cameras.main;

		this.add
			.text(width / 2, height / 3, "GAME OVER", {
				fontSize: "32px",
				color: "#ffffff",
			})
			.setOrigin(0.5);

		this.add
			.text(width / 2, height / 2, `Final Score: ${this.score}`, {
				fontSize: "24px",
				color: "#ffffff",
			})
			.setOrigin(0.5);

		const restartText = this.add
			.text(width / 2, (height * 2) / 3, "Click to Restart", {
				fontSize: "24px",
				color: "#ffffff",
			})
			.setOrigin(0.5);

		restartText.setInteractive();
		restartText.on("pointerdown", () => {
			this.scene.stop("GameOverScene");
			this.scene.start("MainMenuScene");
		});
	}
}