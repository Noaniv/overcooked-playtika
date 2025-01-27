import { Scene } from 'phaser';

export class TransitionScene extends Scene {
    constructor() {
        super('TransitionScene');
    }

    init(data) {
        this.nextScene = data.nextScene;
        this.transitionDuration = data.duration || 1000;
        this.radius = 0;
    }

    create() {
        // Create a black background
        this.add.rectangle(0, 0, 1024, 768, 0x000000).setOrigin(0, 0);

        // Create the transition mask
        this.transitionMask = this.add.graphics();
        
        // Create the tortilla texture
        this.tortilla = this.add.graphics();
        this.tortilla.setPosition(512, 384);
        
        // Draw the tortilla
        this.drawTortilla(this.tortilla);
        
        // Create mask for the tortilla
        this.maskGraphics = this.add.graphics();
        this.tortilla.mask = new Phaser.Display.Masks.GeometryMask(this, this.maskGraphics);

        // Start the transition
        this.startTransition();
    }

    drawTortilla(graphics) {
        graphics.clear();

        // Main tortilla shape
        graphics.fillStyle(0xF4D03F, 1); // Warm tortilla color
        graphics.fillCircle(0, 0, 800);

        // Add texture details
        graphics.lineStyle(4, 0xC9A66B); // Darker color for details

        // Concentric circles for texture
        for (let radius = 100; radius <= 700; radius += 100) {
            graphics.strokeCircle(0, 0, radius);
        }

        // Add random "toasted spots"
        graphics.fillStyle(0xC9A66B, 0.3);
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 750;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            graphics.fillCircle(x, y, Math.random() * 15 + 5);
        }
    }

    startTransition() {
        // Circular reveal animation
        this.tweens.add({
            targets: this,
            radius: 1200,
            duration: this.transitionDuration,
            ease: 'Cubic.easeInOut',
            onUpdate: () => {
                this.maskGraphics.clear();
                this.maskGraphics.fillStyle(0xffffff);
                this.maskGraphics.fillCircle(512, 384, this.radius);
            },
            onComplete: () => {
                this.scene.start(this.nextScene);
            }
        });

        // Rotate the tortilla
        this.tweens.add({
            targets: this.tortilla,
            rotation: Math.PI / 2,
            duration: this.transitionDuration,
            ease: 'Cubic.easeInOut'
        });

        // Scale animation
        this.tweens.add({
            targets: this.tortilla,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: this.transitionDuration,
            ease: 'Quad.easeIn'
        });
    }
}
