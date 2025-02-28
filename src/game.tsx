import { Game, Types } from "phaser";
import { ThemeManager, GameTheme } from "./utils/ThemeManager";
import { MainMenuScene } from "./app/scenes/MainMenuScene";
import { GameScene } from "./app/scenes/GameScene";
import { GameOverScene } from "./app/scenes/GameOverScene";
import { ModeSelectScene } from "./app/scenes/ModeSelectScene";
import { LetterSelectScene } from "./app/scenes/LetterSelectScene";
import { PauseScene } from "./app/scenes/PauseScene";
import { SettingsScene } from "./app/scenes/SettingsScene";

export interface GameSettings {
	theme: "space" | "birthday" | "soccer" | "beach";
	soundEnabled: boolean;
	musicVolume: number;
	sfxVolume: number;
}

export const gameSettings: GameSettings = {
	theme: "space",
	musicVolume: 0.5,
	sfxVolume: 0.5,
	soundEnabled: false,
};

export const themeManager = new ThemeManager();

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
		SettingsScene,
	],
};

export default function createGame() {
	return new Game(gameConfig);
}
