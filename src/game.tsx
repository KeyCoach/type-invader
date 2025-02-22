import { Game, Types } from "phaser";
import { MainMenuScene } from "./app/scenes/MainMenuScene";
import { GameScene } from "./app/scenes/GameScene";
import { GameOverScene } from "./app/scenes/GameOverScene";
import { ModeSelectScene } from "./app/scenes/ModeSelectScene";
import { LetterSelectScene } from "./app/scenes/LetterSelectScene";
import { PauseScene } from "./app/scenes/PauseScene";

export const gameConfig: Types.Core.GameConfig = {
	type: Phaser.AUTO,
	parent: "game-container",
	width: 800,
	height: 600,
	backgroundColor: "#292929",
	physics: {
		default: "arcade",
		arcade: {
			// TODO: ask claude about x: 0 gravity
			gravity: { x: 0, y: 0 },
			debug: false,
		},
	},
	scene: [
		MainMenuScene,
		ModeSelectScene,
		LetterSelectScene,
		GameScene,
		GameOverScene,
		PauseScene,
	],
};

export default function createGame() {
	return new Game(gameConfig);
}
