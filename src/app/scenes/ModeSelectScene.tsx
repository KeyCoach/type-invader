import { Scene } from "phaser";
import { colors } from "../constants/colors";

export class ModeSelectScene extends Scene {
  constructor() {
    super({ key: "ModeSelectScene" });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Title
    this.add
      .text(width / 2, height / 4, "Select Game Mode", {
        fontSize: "40px",
        fontFamily: "Monospace",
        color: colors.white,
      })
      .setOrigin(0.5);

    // Free Play button
    const freePlayButton = this.add
      .text(width / 2, height / 2 - 30, "Free Play", {
        fontSize: "32px",
        fontFamily: "Monospace",
        color: colors.green,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => freePlayButton.setColor(colors.yellow))
      .on("pointerout", () => freePlayButton.setColor(colors.green))
      .on("pointerdown", () => this.scene.start("GameScene", { mode: "free" }));

    // Letter Mode button
    const letterModeButton = this.add
      .text(width / 2, height / 2 + 30, "Letter Mode", {
        fontSize: "32px",
        fontFamily: "Monospace",
        color: colors.green,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => letterModeButton.setColor(colors.yellow))
      .on("pointerout", () => letterModeButton.setColor(colors.green))
      .on("pointerdown", () => this.scene.start("LetterSelectScene"));
  }
}
