import Phaser from "phaser";

export default class PauseButton extends Phaser.GameObjects.Container {
    constructor(scene: Phaser.Scene, x: number, y: number, togglePause: () => void) {
        super(scene, x, y);
        scene.add.existing(this);

        // Create the button area (transparent)
        const button = scene.add.rectangle(0, 0, 50, 50, 0x000000, 0.3) // Slightly transparent
            //.setStrokeStyle(2, 0x000000)
            .setInteractive({ useHandCursor: true });

        // Create the two vertical pause lines
        const line1 = scene.add.rectangle(-7, 0, 8, 30, 0xffffff, 0.5);
        const line2 = scene.add.rectangle(7, 0, 8, 30, 0xffffff, 0.5);

        // Add all elements to the container
        this.add([button, line1, line2]);

        // Click listener to toggle pause
        button.on("pointerdown", () => {
            togglePause();
        });
    }
}
