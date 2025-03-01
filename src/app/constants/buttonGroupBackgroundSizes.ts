import { ButtonGroupConfig } from "./definitions";

export const buttonGroupBackgroundSizes: Record<string, ButtonGroupConfig> = {
	SettingsScene: {
		width: 640,
		height: 450,
		horizontalPadding: 10,
		verticalPadding: 20,
		borderRadius: 20,
		alpha: 0.7,
	},
	MainMenuScene: {
		width: 400,
		height: 250,
		horizontalPadding: 0,
		verticalPadding: 0,
		borderRadius: 20,
		alpha: 0.7,
	},
	ModeSelectScene: {
		width: 500,
		height: 250,
		horizontalPadding: 0,
		verticalPadding: 0,
		borderRadius: 20,
		alpha: 0.7,
	},
	LetterSelectScene: {
		width: 600,
		height: 450,
		horizontalPadding: 5,
		verticalPadding: 15,
		borderRadius: 20,
		alpha: 0.7,
	},
	GameOverScene: {
		width: 500,
		height: 420,
		horizontalPadding: 0,
		verticalPadding: 20,
		borderRadius: 20,
		alpha: 0.7,
	},
};
