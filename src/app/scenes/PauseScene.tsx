// PauseScene.ts
import { Scene } from "phaser";
import { colors } from "../constants/colors";
import { GameScene } from "./GameScene"; 

export class PauseScene extends Scene {
	private mainScene!: string;
	private menuOptions: Phaser.GameObjects.Text[] = [];
	private selectedOption: number = 0;

	constructor() {
		super({ key: "PauseScene" });
	}

	init(data: { mainScene: string }) {
		this.mainScene = data.mainScene;
	}

	create() {
		const { width, height } = this.cameras.main;

		// Create semi-transparent background
		const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
		overlay.setOrigin(0);

		// Create menu container
		const menuPanel = this.add.rectangle(
			width / 2,
			height / 2,
			300,
			200,
			0x333333,
			0.9
		);
		menuPanel.setStrokeStyle(2, 0xaaaaaa);

		const title = this.add
			.text(width / 2, height / 2 - 60, "PAUSED", {
				fontSize: "32px",
				fontFamily: "Monospace",
				color: colors.yellow,
			})
			.setOrigin(0.5);

		// Create menu options
		const resumeText = this.add
			.text(width / 2, height / 2, "Resume Game", {
				fontSize: "24px",
				fontFamily: "Monospace",
				color: colors.white,
			})
			.setOrigin(0.5)
			.setInteractive({ useHandCursor: true });

		const mainMenuText = this.add
			.text(width / 2, height / 2 + 40, "Return to Main Menu", {
				fontSize: "24px",
				fontFamily: "Monospace",
				color: colors.white,
			})
			.setOrigin(0.5)
			.setInteractive({ useHandCursor: true });

		// Add click handlers
		resumeText.on("pointerdown", () => {
			this.resumeGame();
		});

		mainMenuText.on("pointerdown", () => {
			this.returnToMainMenu();
		});

		// Add hover effects
		resumeText.on("pointerover", () => {
			this.selectedOption = 0;
			this.updateMenuSelection();
		});

		mainMenuText.on("pointerover", () => {
			this.selectedOption = 1;
			this.updateMenuSelection();
		});

		// Store menu options for navigation
		this.menuOptions = [resumeText, mainMenuText];
		this.selectedOption = 0;

		// Highlight the selected option
		this.updateMenuSelection();

		// Setup keyboard navigation
		this.input.keyboard?.on("keydown-UP", this.navigateUp, this);
		this.input.keyboard?.on("keydown-DOWN", this.navigateDown, this);
		this.input.keyboard?.on("keydown-W", this.navigateUp, this);
		this.input.keyboard?.on("keydown-S", this.navigateDown, this);
		this.input.keyboard?.on("keydown-ENTER", this.selectOption, this);
		this.input.keyboard?.on("keydown-SPACE", this.selectOption, this);
		// this.input.keyboard?.on("keydown-ESC", this.resumeGame, this);
	}

	navigateUp() {
		this.selectedOption =
			(this.selectedOption - 1 + this.menuOptions.length) %
			this.menuOptions.length;
		this.updateMenuSelection();
	}

	navigateDown() {
		this.selectedOption = (this.selectedOption + 1) % this.menuOptions.length;
		this.updateMenuSelection();
	}

	updateMenuSelection() {
		// Reset all options to default
		this.menuOptions.forEach((option) => {
			option.setColor(colors.white);
			option.setStroke("#000000", 0);
		});

		// Highlight selected option
		const selectedText = this.menuOptions[this.selectedOption];
		selectedText.setColor(colors.green);
		selectedText.setStroke("#000000", 2);

		// Add a selection marker
		this.menuOptions.forEach((option, index) => {
			if (index === this.selectedOption) {
				option.setText(`▶ ${option.text.replace("▶ ", "")}`);
			} else {
				option.setText(option.text.replace("▶ ", ""));
			}
		});
	}

	selectOption() {
		if (this.selectedOption === 0) {
			this.resumeGame();
		} else {
			this.returnToMainMenu();
		}
	}

	resumeGame() {
		const gameScene = this.scene.get(this.mainScene) as GameScene;
	
		if (gameScene && typeof gameScene.togglePause === "function") {
			gameScene.togglePause(); // Properly unpauses everything
		}
	
		this.scene.stop();
	}

	returnToMainMenu() {
		this.scene.stop(this.mainScene);
		this.scene.start("MainMenuScene");
		this.scene.stop();
	}
}
