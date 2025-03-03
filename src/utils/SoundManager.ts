// SoundManager.ts
import { Scene } from "phaser";
import { gameSettings } from "@/game";
import { ThemeManager } from "./ThemeManager";

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

	// In SoundManager.ts, add this new method
	playMenuMusic(): void {
		if (!this.scene || !gameSettings.soundEnabled) return;

        // Phaser random number between 1 and 3
        const randomMenuMusic = Phaser.Math.Between(1, 3);

		try {
			// Stop previous music if playing
			if (this.bgMusic && this.bgMusic.isPlaying) {
				this.bgMusic.stop();
			}

			this.bgMusic = this.scene.sound.add(`menu-music-${randomMenuMusic}`, {
				loop: true,
				volume: gameSettings.musicVolume,
			});

			this.bgMusic.play();
		} catch (error) {
			console.error(`Error playing menu music: ${error}`);
			// Fallback to theme music if menu music fails
			this.playMusic("theme");
		}
	}

	// Play explosion sound when asteroid is destroyed
	playExplosion(): void {
		if (!this.scene) return;
		if (!gameSettings.soundEnabled) return;

		const theme = this.themeManager.getCurrentTheme();
		const soundKey = `${theme}-explosion`;

		try {
			if (!this.sounds.has(soundKey)) {
				const sound = this.scene.sound.add(soundKey);
				this.sounds.set(soundKey, sound);
			}

			const explosionSound = this.sounds.get(soundKey);
			if (explosionSound) {
				// Cast to any, TS doesn't recognize setVolume
				(explosionSound as any).setVolume(gameSettings.sfxVolume);
				explosionSound.play();
			}
		} catch (error) {
			console.error(`Error playing explosion sound:`, error);
		}
	}

	// Play theme music for menus or gameplay
	playMusic(musicType: "theme" | "game"): void {
		if (!this.scene || !gameSettings.soundEnabled) return;

		const theme = this.themeManager.getCurrentTheme();
		const musicKey = musicType === "theme" ? `${theme}-theme` : `${theme}-theme`;

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
				// Check if the missile sound exists, fallback to explosion if not
				let actualKey = soundKey;
				try {
					if (!this.scene.sound.get(soundKey)) {
						actualKey = `${theme}-explosion`;
					}
				} catch (error) {
					actualKey = `${theme}-explosion`;
				}

				const sound = this.scene.sound.add(actualKey);
				this.sounds.set(soundKey, sound);
			}

			const missileSound = this.sounds.get(soundKey);
			if (missileSound) {
				// Cast to any to bypass TypeScript limitations with Phaser sound
				(missileSound as any).setVolume(gameSettings.sfxVolume * 0.5); // Lower volume for missile
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
			// Cast to any to bypass TypeScript limitations with Phaser sound
			(this.bgMusic as any).setVolume(gameSettings.musicVolume);
		}

		this.sounds.forEach((sound) => {
			if (sound.key.includes("missile")) {
				// Cast to any to bypass TypeScript limitations with Phaser sound
				(sound as any).setVolume(gameSettings.sfxVolume * 0.5);
			} else {
				// Cast to any to bypass TypeScript limitations with Phaser sound
				(sound as any).setVolume(gameSettings.sfxVolume);
			}
		});
	}

	// Toggle sound on/off
	toggleSound(enabled: boolean): void {
		console.log(`Toggling sound: ${enabled ? "ON" : "OFF"}`);

		if (!enabled) {
			this.stopAll();
		} else if (this.scene) {
			// Restart music if we're enabling sound
			this.playMusic("theme");
		}
	}
}
