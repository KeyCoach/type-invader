// NavigationUtils.ts
import { Scene } from "phaser";
import { colors } from "../app/constants/colors";
import { NavigationItem } from "../app/constants/definitions"

export class KeyboardNavigation {
	private scene: Scene;
	private items: NavigationItem[] = [];
	private currentIndex: number = 0;
	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
	private enterKey!: Phaser.Input.Keyboard.Key;
	private spaceKey!: Phaser.Input.Keyboard.Key;
	private grid: { rows: number; cols: number } = { rows: 1, cols: 1 };
	private lastInputTime: number = 0;
	private inputDelay: number = 200; // ms delay between inputs to prevent too rapid movement
	private initialized: boolean = false;

	constructor(scene: Scene) {
		this.scene = scene;

		// We'll initialize input in a separate init method
		// that should be called from the scene's create method
	}

	init() {
		if (this.scene.input && this.scene.input.keyboard) {
			this.cursors = this.scene.input.keyboard.createCursorKeys();
			this.enterKey = this.scene.input.keyboard.addKey(
				Phaser.Input.Keyboard.KeyCodes.ENTER
			);
			this.spaceKey = this.scene.input.keyboard.addKey(
				Phaser.Input.Keyboard.KeyCodes.SPACE
			);
			this.setupListeners();
			this.initialized = true;
		} else {
			console.error("Input system not available in the scene");
		}
		return this;
	}

	setupListeners() {
		this.scene.events.on("update", this.update, this);
		this.scene.events.once("shutdown", this.destroy, this);
	}

	destroy() {
		if (this.initialized) {
			this.scene.events.off("update", this.update, this);
			this.items = [];
		}
	}

	update() {
		if (!this.initialized) return;

		const time = this.scene.time.now;
		if (time - this.lastInputTime < this.inputDelay) {
			return;
		}

		if (this.items.length === 0) return;

		let moved = false;
		const currentItem = this.items[this.currentIndex];

		// Navigate with arrow keys
		if (this.cursors.up.isDown) {
			this.navigateUp();
			moved = true;
		} else if (this.cursors.down.isDown) {
			this.navigateDown();
			moved = true;
		} else if (this.cursors.left.isDown) {
			this.navigateLeft();
			moved = true;
		} else if (this.cursors.right.isDown) {
			this.navigateRight();
			moved = true;
		}

		// Select with enter or space
		if (
			Phaser.Input.Keyboard.JustDown(this.enterKey) ||
			Phaser.Input.Keyboard.JustDown(this.spaceKey)
		) {
			this.selectCurrent();
		}

		if (moved) {
			this.lastInputTime = time;
		}
	}

	addItem(item: NavigationItem) {
		this.items.push(item);
		this.updateGrid();

		// If this is the first item, highlight it
		if (this.items.length === 1) {
			this.highlightItem(0);
		}

		return this;
	}

	addItems(items: NavigationItem[]) {
		this.items.push(...items);
		this.updateGrid();

		// If these are the first items, highlight the first one
		if (this.items.length === items.length) {
			this.highlightItem(0);
		}

		return this;
	}

	private updateGrid() {
		if (this.items.length === 0) return;

		// Find max row and column to determine grid size
		let maxRow = 0;
		let maxCol = 0;

		this.items.forEach((item) => {
			maxRow = Math.max(maxRow, item.position.row);
			maxCol = Math.max(maxCol, item.position.col);
		});

		this.grid = {
			rows: maxRow + 1,
			cols: maxCol + 1,
		};
	}

	navigateUp() {
		if (this.items.length === 0) return;

		const currentItem = this.items[this.currentIndex];
		const currentRow = currentItem.position.row;
		const currentCol = currentItem.position.col;

		// Find items in the row above
		const itemsAbove = this.items.filter(
			(item) => item.position.row < currentRow
		);

		if (itemsAbove.length === 0) return;

		// Find the closest item above
		let closestItem = itemsAbove[0];
		let minDistance = Number.MAX_VALUE;

		itemsAbove.forEach((item) => {
			// Find items in the closest row above
			const closeRow = Math.max(...itemsAbove.map((i) => i.position.row));
			if (item.position.row === closeRow) {
				const distance = Math.abs(item.position.col - currentCol);
				if (distance < minDistance) {
					minDistance = distance;
					closestItem = item;
				}
			}
		});

		const newIndex = this.items.indexOf(closestItem);
		this.setCurrentIndex(newIndex);
	}

	navigateDown() {
		if (this.items.length === 0) return;

		const currentItem = this.items[this.currentIndex];
		const currentRow = currentItem.position.row;
		const currentCol = currentItem.position.col;

		// Find items in the row below
		const itemsBelow = this.items.filter(
			(item) => item.position.row > currentRow
		);

		if (itemsBelow.length === 0) return;

		// Find the closest item below
		let closestItem = itemsBelow[0];
		let minDistance = Number.MAX_VALUE;

		itemsBelow.forEach((item) => {
			// Find items in the closest row below
			const closeRow = Math.min(...itemsBelow.map((i) => i.position.row));
			if (item.position.row === closeRow) {
				const distance = Math.abs(item.position.col - currentCol);
				if (distance < minDistance) {
					minDistance = distance;
					closestItem = item;
				}
			}
		});

		const newIndex = this.items.indexOf(closestItem);
		this.setCurrentIndex(newIndex);
	}

	navigateLeft() {
		if (this.items.length === 0) return;

		const currentItem = this.items[this.currentIndex];
		const currentRow = currentItem.position.row;
		const currentCol = currentItem.position.col;

		// Find items in the same row to the left
		const itemsLeft = this.items.filter(
			(item) =>
				item.position.row === currentRow && item.position.col < currentCol
		);

		if (itemsLeft.length === 0) return;

		// Find the rightmost item to the left (closest)
		const closestItem = itemsLeft.reduce((prev, current) =>
			prev.position.col > current.position.col ? prev : current
		);

		const newIndex = this.items.indexOf(closestItem);
		this.setCurrentIndex(newIndex);
	}

	navigateRight() {
		if (this.items.length === 0) return;

		const currentItem = this.items[this.currentIndex];
		const currentRow = currentItem.position.row;
		const currentCol = currentItem.position.col;

		// Find items in the same row to the right
		const itemsRight = this.items.filter(
			(item) =>
				item.position.row === currentRow && item.position.col > currentCol
		);

		if (itemsRight.length === 0) return;

		// Find the leftmost item to the right (closest)
		const closestItem = itemsRight.reduce((prev, current) =>
			prev.position.col < current.position.col ? prev : current
		);

		const newIndex = this.items.indexOf(closestItem);
		this.setCurrentIndex(newIndex);
	}

	selectCurrent() {
		if (this.items.length === 0) return;

		const currentItem = this.items[this.currentIndex];
		if (currentItem.onSelect) {
			currentItem.onSelect();
		}
	}

	setCurrentIndex(index: number) {
		if (index < 0 || index >= this.items.length) return;

		// Unhighlight current
		this.unhighlightItem(this.currentIndex);

		// Set and highlight new
		this.currentIndex = index;
		this.highlightItem(this.currentIndex);
	}

	private highlightItem(index: number) {
		if (index < 0 || index >= this.items.length) return;

		const item = this.items[index];
		if (item.element instanceof Phaser.GameObjects.Text) {
			(item.element as Phaser.GameObjects.Text).setColor(colors.yellow);
		} else if (item.element instanceof Phaser.GameObjects.Rectangle) {
			(item.element as Phaser.GameObjects.Rectangle).setStrokeStyle(
				2,
				0xffff00
			);
		}

		// If there's a linked element (like text in a button group)
		const linkedIndex = this.items.findIndex(
			(i) =>
				i !== item &&
				i.position.row === item.position.row &&
				i.position.col === item.position.col
		);

		if (linkedIndex >= 0) {
			const linkedItem = this.items[linkedIndex];
			if (linkedItem.element instanceof Phaser.GameObjects.Text) {
				(linkedItem.element as Phaser.GameObjects.Text).setColor(colors.yellow);
			}
		}
	}

	private unhighlightItem(index: number) {
		if (index < 0 || index >= this.items.length) return;

		const item = this.items[index];
		if (item.element instanceof Phaser.GameObjects.Text) {
			const defaultColor =
				item.element.name === "backButton" ? colors.red : colors.green;
			(item.element as Phaser.GameObjects.Text).setColor(defaultColor);
		} else if (item.element instanceof Phaser.GameObjects.Rectangle) {
			(item.element as Phaser.GameObjects.Rectangle).setStrokeStyle(0);
		}

		// If there's a linked element
		const linkedIndex = this.items.findIndex(
			(i) =>
				i !== item &&
				i.position.row === item.position.row &&
				i.position.col === item.position.col
		);

		if (linkedIndex >= 0) {
			const linkedItem = this.items[linkedIndex];
			if (linkedItem.element instanceof Phaser.GameObjects.Text) {
				(linkedItem.element as Phaser.GameObjects.Text).setColor(colors.white);
			}
		}
	}
}
