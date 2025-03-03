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

	// Play explosion sound when asteroid is destroyed
	playExplosion(): void {
		console.log(
			"playExplosion called, scene:",
			!!this.scene,
			"sound enabled:",
			gameSettings.soundEnabled
		);

		if (!this.scene) {
			console.log("No scene set in SoundManager");
			return;
		}

		if (!gameSettings.soundEnabled) {
			console.log("Sound is disabled in game settings");
			return;
		}

		const theme = this.themeManager.getCurrentTheme();
		const soundKey = `${theme}-explosion`;

		console.log(`Playing explosion sound: ${soundKey}`);

		try {
			if (!this.sounds.has(soundKey)) {
				console.log(`Adding ${soundKey} to sound collection`);
				const sound = this.scene.sound.add(soundKey);
				this.sounds.set(soundKey, sound);
				console.log(`Added ${theme} explosion sound`);
			}

			const explosionSound = this.sounds.get(soundKey);
			console.log(`Explosion sound: ${explosionSound}`);
			if (explosionSound) {
				// Cast to any to bypass TypeScript limitations with Phaser sound
				(explosionSound as any).setVolume(gameSettings.sfxVolume);
				explosionSound.play();
				console.log(`${theme} explosion sound played`);
			}
		} catch (error) {
			console.error(`Error playing explosion sound:`, error);
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
