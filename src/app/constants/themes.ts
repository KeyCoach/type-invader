import { GameTheme, ThemeAssets } from "./definitions";

export interface ThemeImagesDefinition {
	background: string;
	asteroid: string;
	particle: string;
	ship: string;
	animation?: string;
}

export interface ThemeColorsDefinition {
	primary: number;
	secondary: number;
	highlight: number;
	asteroidText: number;
	buttonFont: number;
	buttonBoxBackground: number;
	menuBackground: number;
}

export interface ThemeSoundsDefinition {
	menuMusic: string;
	gameMusic: string;
	explosion: string;
	gameOver: string;
	levelUp: string;
	gameStart: string;
	missileFire: string;
}

const themeImages: Record<GameTheme, ThemeImagesDefinition> = {
	space: {
		background: "blue-galaxy",
		asteroid: "asteroid",
		particle: "particle",
		ship: "ship",
		animation: "spin",
	},
	birthday: {
		background: "party-background",
		asteroid: "balloon",
		particle: "confetti",
		ship: "party-hat",
		animation: "sway",
	},
	soccer: {
		background: "soccer-field",
		asteroid: "soccer-ball",
		particle: "soccer-ball",
		ship: "soccer-player",
		animation: "kick",
	},
	beach: {
		background: "beach-background",
		asteroid: "coconut",
		particle: "water-splash",
		ship: "surfboard",
		animation: "ride",
	},
};

const themeColors: Record<GameTheme, ThemeColorsDefinition> = {
	space: {
		primary: 0xf0f0f0,
		secondary: 0x62de6d,
		highlight: 0xebdf64,
		asteroidText: 0xf0f0f0,
		buttonFont: 0xffffff, // Assuming default value
		buttonBoxBackground: 0x444444, // Assuming default value
		menuBackground: 0x000000,
	},
	birthday: {
		primary: 0xffd700,
		secondary: 0xff6b6b,
		highlight: 0xe91e63,
		asteroidText: 0x000000,
		buttonFont: 0xffffff, // Assuming default value
		buttonBoxBackground: 0x444444, // Assuming default value
		menuBackground: 0x332244,
	},
	soccer: {
		primary: 0x000000,
		secondary: 0xffffff,
		highlight: 0x00ff00,
		asteroidText: 0xfefefe,
		buttonFont: 0xffffff, // Assuming default value
		buttonBoxBackground: 0x444444, // Assuming default value
		menuBackground: 0x000000,
	},
	beach: {
		primary: 0x00ffff,
		secondary: 0xffff00,
		highlight: 0xffa500,
		asteroidText: 0xfefefe,
		buttonFont: 0xffffff, // Assuming default value
		buttonBoxBackground: 0x444444, // Assuming default value
		menuBackground: 0x87ceeb,
	},
};

// Define the sounds for each theme
const themeSounds: Record<GameTheme, ThemeSoundsDefinition> = {
	space: {
		menuMusic: "space-menu-music",
		gameMusic: "space-game-music",
		explosion: "space-explosion",
		gameOver: "space-game-over",
		levelUp: "space-level-up",
		gameStart: "space-game-start",
		missileFire: "space-missile-fire",
	},
	birthday: {
		menuMusic: "birthday-menu-music",
		gameMusic: "birthday-game-music",
		explosion: "birthday-explosion",
		gameOver: "birthday-game-over",
		levelUp: "birthday-level-up",
		gameStart: "birthday-game-start",
		missileFire: "birthday-missile-fire",
	},
	soccer: {
		menuMusic: "soccer-menu-music",
		gameMusic: "soccer-game-music",
		explosion: "soccer-explosion",
		gameOver: "soccer-game-over",
		levelUp: "soccer-level-up",
		gameStart: "soccer-game-start",
		missileFire: "soccer-missile-fire",
	},
	beach: {
		menuMusic: "beach-menu-music",
		gameMusic: "beach-game-music",
		explosion: "beach-explosion",
		gameOver: "beach-game-over",
		levelUp: "beach-level-up",
		gameStart: "beach-game-start",
		missileFire: "beach-missile-fire",
	},
};

// Combine both definitions into the ThemeAssetsDefinition
export const ThemeAssetsDefinition: Record<GameTheme, ThemeAssets> = {
	space: {
		images: themeImages.space,
		colors: themeColors.space,
		sounds: themeSounds.space,
	},
	birthday: {
		images: themeImages.birthday,
		colors: themeColors.birthday,
		sounds: themeSounds.birthday,
	},
	soccer: {
		images: themeImages.soccer,
		colors: themeColors.soccer,
		sounds: themeSounds.soccer,
	},
	beach: {
		images: themeImages.beach,
		colors: themeColors.beach,
		sounds: themeSounds.beach,
	},
};

export { themeImages, themeColors };
