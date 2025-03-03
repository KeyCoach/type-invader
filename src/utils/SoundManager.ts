// SoundManager.ts
import { Scene } from "phaser";
import { gameSettings } from "@/game";
import { ThemeManager } from "./ThemeManager";
import { GameTheme } from "../app/constants/definitions";

export class SoundManager {
	private scene: Scene | null = null;
	private themeManager: ThemeManager;
	private bgMusic: Phaser.Sound.BaseSound | null = null;
	private sounds: Map<string, Phaser.Sound.BaseSound> = new Map();

	constructor(themeManager: ThemeManager) {
		this.themeManager = themeManager;
	}

	setScene(scene: Scene): void {
		this.scene = scene;
		// Clear previous sounds when changing scenes
		this.sounds.clear();
		// Stop previous music if changing scenes
		if (this.bgMusic && this.bgMusic.isPlaying) {
			this.bgMusic.stop();
			this.bgMusic = null;
		}
	}

	// Play explosion sound when asteroid is destroyed
	playExplosion(): void {
		if (!this.scene || !gameSettings.soundEnabled) return;

		const theme = this.themeManager.getCurrentTheme();
		const soundKey = `${theme}-explosion`;

		try {
			if (!this.sounds.has(soundKey)) {
				const sound = this.scene.sound.add(soundKey);
				this.sounds.set(soundKey, sound);
			}

			const explosionSound = this.sounds.get(soundKey);
			if (explosionSound) {
				explosionSound.setVolume(gameSettings.sfxVolume);
				explosionSound.play();
			}
		} catch (error) {
			console.error(`Error playing explosion sound: ${error}`);
		}
	}

	// Play theme music for menus or gameplay
	playMusic(musicType: "theme" | "game"): void {
		if (!this.scene || !gameSettings.soundEnabled) return;

		const theme = this.themeManager.getCurrentTheme();
		const musicKey = musicType === "theme" ? `${theme}-theme` : `${theme}-game`;

		try {
			// Stop previous music if playing
			if (this.bgMusic && this.bgMusic.isPlaying) {
				this.bgMusic.stop();
			}

			this.bgMusic = this.scene.sound.add(musicKey, {
				loop: true,
				volume: gameSettings.musicVolume,
			});

			this.bgMusic.play();
		} catch (error) {
			console.error(`Error playing ${musicType} music: ${error}`);
		}
	}

	// Play missile fire sound
	playMissileFire(): void {
		if (!this.scene || !gameSettings.soundEnabled) return;

		const theme = this.themeManager.getCurrentTheme();
		const soundKey = `${theme}-missile`;

		try {
			if (!this.sounds.has(soundKey)) {
				// Fallback to explosion if missile sound doesn't exist
				const actualKey = this.scene.sound.get(soundKey)
					? soundKey
					: `${theme}-explosion`;
				const sound = this.scene.sound.add(actualKey);
				this.sounds.set(soundKey, sound);
			}

			const missileSound = this.sounds.get(soundKey);
			if (missileSound) {
				missileSound.setVolume(gameSettings.sfxVolume * 0.5); // Lower volume for missile
				missileSound.play();
			}
		} catch (error) {
			console.error(`Error playing missile sound: ${error}`);
		}
	}

	// Stop all sounds
	stopAll(): void {
		if (this.bgMusic) {
			this.bgMusic.stop();
			this.bgMusic = null;
		}

		this.sounds.forEach((sound) => {
			if (sound.isPlaying) {
				sound.stop();
			}
		});
	}

	// Update volume levels based on settings
	updateVolumes(): void {
		if (this.bgMusic) {
			this.bgMusic.setVolume(gameSettings.musicVolume);
		}

		this.sounds.forEach((sound) => {
			if (sound.key.includes("missile")) {
				sound.setVolume(gameSettings.sfxVolume * 0.5);
			} else {
				sound.setVolume(gameSettings.sfxVolume);
			}
		});
	}

	// Toggle sound on/off
	toggleSound(enabled: boolean): void {
		if (!enabled) {
			this.stopAll();
		} else if (this.scene) {
			// Restart music if we're enabling sound
			this.playMusic("theme");
		}
	}
}
