import { Game, Types } from "phaser";
import { MenuScene } from "./app/scenes/MenuScene";
import { GameScene } from "./app/scenes/GameScene";
import { GameOverScene } from "./app/scenes/GameOverScene";

export const gameConfig: Types.Core.GameConfig = {
	type: Phaser.AUTO,
	parent: "game-container",
	width: 800,
	height: 600,
	backgroundColor: "#000000",
	physics: {
		default: "arcade",
		arcade: {
			// TODO: ask claude about x: 0 gravity
			gravity: { x: 0, y: 0 },
			debug: false,
		},
	},
	scene: [MenuScene, GameScene, GameOverScene],
};

export default function createGame() {
	return new Game(gameConfig);
}
