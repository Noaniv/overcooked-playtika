export class Character extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, controls) {
        super(scene, x, y, texture);
        scene.add.existing(this); // Add sprite to the scene
        
        this.scene = scene;
        this.MOVEMENT_SPEED = 500; // Define speed as a class property
        
        // Calculate scaled size maintaining aspect ratio (21:31)
        const scale = 3; // Adjust this value to change overall size
        const originalWidth = 21;
        const originalHeight = 31;
        const scaledWidth = originalWidth * scale;
        const scaledHeight = originalHeight * scale;

        // Set up sprite properties
        this.setOrigin(0.5)
            .setDisplaySize(scaledWidth, scaledHeight)
            .setInteractive();

        // Physics setup
        scene.physics.add.existing(this);
        this.setBounce(0.2);    // Add some bounce
        this.setCollideWorldBounds(true);
        this.setDrag(1000);     // Add drag to slow down after bounce
        
        this.heldIngredient = null;
        this.currentZone = null;
        this.controls = {
            up: scene.input.keyboard.addKey(controls.up),
            down: scene.input.keyboard.addKey(controls.down),
            left: scene.input.keyboard.addKey(controls.left),
            right: scene.input.keyboard.addKey(controls.right)
        };
        this.INTERACTION_RADIUS = 60;
        this.lastDirection = 'down'; // Track last direction for idle animation

        // Create interaction zone
        this.createInteractionZone();
        this.canMove = true; // Add this property
    }

    createInteractionZone() {
        // Physics zone for interactions
        this.interactionZone = this.scene.add.circle(
            this.x,
            this.y,
            this.INTERACTION_RADIUS,
            0x0000ff,
            0.2 // Slightly visible for debugging
        ).setDepth(-1);

        // Add physics to interaction zone
        this.scene.physics.add.existing(this.interactionZone, false);
        this.interactionZone.body.setCircle(this.INTERACTION_RADIUS);
        
        // Make interaction zone follow the character
        this.interactionZone.setData('followTarget', this);
        this.interactionZone.setData('offsetY', -20); // Adjust as needed
    }

    handleMovement() {
        if (!this.canMove) return;
        
        this.setVelocity(0);
        let isMoving = false;
        const characterType = this === this.scene.characterManager.chef ? 'character1' : 'character2';

        if (this.controls.left.isDown) {
            this.setVelocityX(-this.MOVEMENT_SPEED);
            this.play(`${characterType}-walk-left`, true);
            this.lastDirection = 'left';
            isMoving = true;
        }
        else if (this.controls.right.isDown) {
            this.setVelocityX(this.MOVEMENT_SPEED);
            this.play(`${characterType}-walk-right`, true);
            this.lastDirection = 'right';
            isMoving = true;
        }

        if (this.controls.up.isDown) {
            this.setVelocityY(-this.MOVEMENT_SPEED);
            if (!this.controls.left.isDown && !this.controls.right.isDown) {
                this.play(`${characterType}-walk-up`, true);
                this.lastDirection = 'up';
            }
            isMoving = true;
        }
        else if (this.controls.down.isDown) {
            this.setVelocityY(this.MOVEMENT_SPEED);
            if (!this.controls.left.isDown && !this.controls.right.isDown) {
                this.play(`${characterType}-walk-down`, true);
                this.lastDirection = 'down';
            }
            isMoving = true;
        }

        // If not moving, show idle frame based on last direction
        if (!isMoving) {
            this.setFrame(this.getIdleFrame(characterType, this.lastDirection));
            this.stop(); // Stop any running animation
        }

        this.updateHeldIngredient();
        this.updateInteractionZone();
    }

    getIdleFrame(characterType, direction) {
        // Return the first frame of each directional animation as idle
        switch (direction) {
            case 'up': return 9;    // First frame of up animation
            case 'down': return 0;  // First frame of down animation
            case 'left': return 3;  // First frame of left animation
            case 'right': return 6; // First frame of right animation
            default: return 0;      // Default to down
        }
    }

    updateHeldIngredient() {
        if (this.heldIngredient) {
            this.heldIngredient.gameObject.setPosition(
                this.x,
                this.y - 20
            );
        }
    }

    updateInteractionZone() {
        if (this.interactionZone) {
            this.interactionZone.setPosition(this.x, this.y);
        }
    }
} 