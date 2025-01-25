export class Character {
    constructor(scene, x, y, texture, controls) {
        this.scene = scene;
        
        // Calculate scaled size maintaining aspect ratio (21:31)
        const scale = 2.5; // Adjust this value to change overall size
        const originalWidth = 21;
        const originalHeight = 31;
        const scaledWidth = originalWidth * scale;
        const scaledHeight = originalHeight * scale;

        this.gameObject = scene.add.sprite(x, y, texture)
            .setOrigin(0.5)
            .setDisplaySize(scaledWidth, scaledHeight)  // This maintains aspect ratio
            .setInteractive();

        // Physics setup
        scene.physics.add.existing(this.gameObject, false);
        this.gameObject.body.setCollideWorldBounds(true);
        this.gameObject.body.setBounce(0);
        this.gameObject.body.setDrag(0);
        
        this.heldIngredient = null;
        this.currentZone = null;
        this.controls = {
            up: scene.input.keyboard.addKey(controls.up),
            down: scene.input.keyboard.addKey(controls.down),
            left: scene.input.keyboard.addKey(controls.left),
            right: scene.input.keyboard.addKey(controls.right)
        };
        this.INTERACTION_RADIUS = 60;

        // Create interaction zone
        this.createInteractionZone();
    }

    createInteractionZone() {
        // Physics zone for interactions
        this.interactionZone = this.scene.add.circle(
            this.gameObject.x + this.gameObject.displayWidth / 2,
            this.gameObject.y + this.gameObject.displayHeight / 2,
            this.INTERACTION_RADIUS,
            0x0000ff,
            0
        ).setDepth(-1);

        // Debug visual
        this.debugZone = this.scene.add.circle(
            this.gameObject.x + this.gameObject.displayWidth / 2,
            this.gameObject.y + this.gameObject.displayHeight / 2,
            this.INTERACTION_RADIUS,
            0x0000ff,
            0
        ).setStrokeStyle(2, 0x0000ff);

        // Add physics to interaction zone
        this.scene.physics.add.existing(this.interactionZone, false);
        this.interactionZone.body.setCircle(this.INTERACTION_RADIUS);
    }

    handleMovement() {
        const speed = 500;
        this.gameObject.body.setVelocity(0);

        if (this.controls.left.isDown) {
            this.gameObject.body.setVelocityX(-speed);
        }
        if (this.controls.right.isDown) {
            this.gameObject.body.setVelocityX(speed);
        }
        if (this.controls.up.isDown) {
            this.gameObject.body.setVelocityY(-speed);
        }
        if (this.controls.down.isDown) {
            this.gameObject.body.setVelocityY(speed);
        }

        this.updateHeldIngredient();
        this.updateInteractionZone();
    }

    updateHeldIngredient() {
        if (this.heldIngredient) {
            this.heldIngredient.gameObject.setPosition(
                this.gameObject.x + this.gameObject.displayWidth / 2,
                this.gameObject.y - 20
            );
        }
    }

    updateInteractionZone() {
        const centerX = this.gameObject.x + this.gameObject.displayWidth / 2;
        const centerY = this.gameObject.y + this.gameObject.displayHeight / 2;
        
        this.interactionZone.setPosition(centerX, centerY);
        this.debugZone.setPosition(centerX, centerY);
    }
} 