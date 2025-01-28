import { Scene } from 'phaser';

export class InstructionsScene extends Scene {
    constructor() {
        super('Instructions');
        this.currentImageIndex = 0;
        this.totalImages = 6; // Update this based on your actual number of instruction images
    }

    create() {
        // Add console log to debug image loading
        console.log('Loading instruction image:', `instruction${this.currentImageIndex + 1}`);

        // Add the same gradient background as main menu
        const gradient = this.add.graphics();
        gradient.fillGradientStyle(0xFF6B6B, 0xFF6B6B, 0xFFC93C, 0xFFC93C, 1);
        gradient.fillRect(0, 0, 1024, 768);

        // Create decorative background pattern
        this.createPatternBackground();

        // Create papel picado at the top
        this.createPapelPicado();

        // Add Mexican-styled title
        const titleText = this.add.text(512, 80, 'Instructions!', {
            fontFamily: 'Arial Black',
            fontSize: 48,
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        // Add decorative underline for title
        const underline = this.add.graphics();
        underline.lineStyle(4, 0xFFA500);
        underline.beginPath();
        underline.moveTo(362, 100);
        underline.lineTo(662, 100);
        underline.strokePath();

        // Create main image display area
        this.createImageDisplay();

        // Add navigation controls
        this.createNavigationControls();

        // Set up keyboard controls
        this.input.keyboard.on('keydown-RIGHT', () => this.nextImage());
        this.input.keyboard.on('keydown-LEFT', () => this.previousImage());

        // Create return to menu button
        this.createReturnButton();
    }

    createPatternBackground() {
        const pattern = this.add.group();
        const spacing = 100;
        
        for (let x = 0; x < 1024; x += spacing) {
            for (let y = 0; y < 768; y += spacing) {
                const decoration = this.add.star(x, y, 4, 15, 30, 0xFFD700)
                    .setAlpha(0.2)
                    .setDepth(1);
                pattern.add(decoration);
                
                this.tweens.add({
                    targets: decoration,
                    rotation: Math.PI * 2,
                    duration: 8000,
                    repeat: -1,
                    ease: 'Linear'
                });
            }
        }
    }

    createPapelPicado() {
        for (let x = 0; x < 1024; x += 120) {
            const banner = this.add.triangle(x, 50, 0, 0, 30, 40, 60, 0, 0xFF9B42)
                .setAlpha(0.8);
            
            this.tweens.add({
                targets: banner,
                y: '+=10',
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.inOut'
            });
        }
    }

    createImageDisplay() {
        // Create a container for the instruction image and its frame
        this.imageContainer = this.add.container(512, 384);

        // Add decorative frame
        const frame = this.add.graphics();
        frame.lineStyle(6, 0xFFA500);
        frame.strokeRect(-310, -210, 620, 420);
        this.imageContainer.add(frame);

        // Add the instruction image
        this.currentImage = this.add.image(0, 0, `instruction${this.currentImageIndex + 1}`)
            .setOrigin(0.5)
            .on('error', () => {
                console.error('Failed to load instruction image:', `instruction${this.currentImageIndex + 1}`);
            });
        this.imageContainer.add(this.currentImage);

        // Add decorative corners
        this.addDecorativeCorners();
    }

    addDecorativeCorners() {
        const cornerPositions = [
            [-310, -210], [310, -210],
            [-310, 210], [310, 210]
        ];

        cornerPositions.forEach(([x, y]) => {
            // Add corner circle
            const corner = this.add.graphics();
            corner.lineStyle(3, 0xFFD700);
            corner.beginPath();
            corner.arc(x, y, 20, 0, Math.PI * 2);
            corner.strokePath();
            this.imageContainer.add(corner);

            // Add inner star decoration
            const star = this.add.star(x, y, 5, 8, 15, 0xFFD700);
            this.imageContainer.add(star);

            // Add rotation animation to stars
            this.tweens.add({
                targets: star,
                rotation: Math.PI * 2,
                duration: 5000,
                repeat: -1,
                ease: 'Linear'
            });
        });
    }

    createNavigationControls() {
        // Create arrow buttons
        this.createArrowButton(100, 384, 'left', () => this.previousImage());
        this.createArrowButton(924, 384, 'right', () => this.nextImage());

        // Add page indicator with Mexican style
        this.pageText = this.add.text(512, 650, `Página ${this.currentImageIndex + 1}/${this.totalImages}`, {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5);

        // Add decorative elements around page indicator
        const leftStar = this.add.star(432, 650, 5, 8, 15, 0xFFD700);
        const rightStar = this.add.star(592, 650, 5, 8, 15, 0xFFD700);

        // Add rotation animation to decorative stars
        [leftStar, rightStar].forEach(star => {
            this.tweens.add({
                targets: star,
                rotation: Math.PI * 2,
                duration: 5000,
                repeat: -1,
                ease: 'Linear'
            });
        });
    }

    createArrowButton(x, y, direction, callback) {
        const isLeft = direction === 'left';
        const points = isLeft 
            ? [0, -30, -40, 0, 0, 30]
            : [0, -30, 40, 0, 0, 30];

        const arrow = this.add.triangle(x, y, ...points, 0xFF4D4D)
            .setStrokeStyle(3, 0xFFA500)
            .setInteractive({ useHandCursor: true });

        // Add hover effects
        arrow.on('pointerover', () => {
            arrow.setFillStyle(0xFF6B6B);
            this.tweens.add({
                targets: arrow,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 100
            });
        });

        arrow.on('pointerout', () => {
            arrow.setFillStyle(0xFF4D4D);
            this.tweens.add({
                targets: arrow,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });

        arrow.on('pointerdown', callback);

        // Add pulsing animation
        this.tweens.add({
            targets: arrow,
            scale: 1.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
    }

    createReturnButton() {
        const returnButton = this.add.container(512, 700);

        // Add button background
        const bg = this.add.graphics();
        bg.lineStyle(3, 0xFFA500);
        bg.fillStyle(0xFF4D4D);
        bg.fillRoundedRect(-100, -25, 200, 50, 10);
        bg.strokeRoundedRect(-100, -25, 200, 50, 10);
        returnButton.add(bg);

        // Add button text
        const text = this.add.text(0, 0, 'Main Menu', {
            fontFamily: 'Arial Black',
            fontSize: 24,
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5);
        returnButton.add(text);

        // Make button interactive
        returnButton.setSize(200, 50);
        returnButton.setInteractive({ useHandCursor: true });

        // Add hover effects
        returnButton.on('pointerover', () => {
            bg.clear();
            bg.lineStyle(3, 0xFFF700);
            bg.fillStyle(0xFF6B6B);
            bg.fillRoundedRect(-100, -25, 200, 50, 10);
            bg.strokeRoundedRect(-100, -25, 200, 50, 10);
            
            this.tweens.add({
                targets: text,
                scale: 1.1,
                duration: 100
            });
        });

        returnButton.on('pointerout', () => {
            bg.clear();
            bg.lineStyle(3, 0xFFA500);
            bg.fillStyle(0xFF4D4D);
            bg.fillRoundedRect(-100, -25, 200, 50, 10);
            bg.strokeRoundedRect(-100, -25, 200, 50, 10);
            
            this.tweens.add({
                targets: text,
                scale: 1,
                duration: 100
            });
        });

        returnButton.on('pointerdown', () => this.returnToMainMenu());
    }

    nextImage() {
        if (this.currentImageIndex < this.totalImages - 1) {
            this.currentImageIndex++;
            this.updateImage();
        } else {
            this.returnToMainMenu();
        }
    }

    previousImage() {
        if (this.currentImageIndex > 0) {
            this.currentImageIndex--;
            this.updateImage();
        }
    }

    updateImage() {
        // Fade out current image
        this.tweens.add({
            targets: this.currentImage,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                // Update image and fade in
                this.currentImage.setTexture(`instruction${this.currentImageIndex + 1}`);
                this.tweens.add({
                    targets: this.currentImage,
                    alpha: 1,
                    duration: 200
                });
            }
        });

        // Update page indicator
        this.pageText.setText(`Page ${this.currentImageIndex + 1}/${this.totalImages}`);
    }

    returnToMainMenu() {
        // Add flash effect before returning to menu
        const flash = this.add.rectangle(0, 0, 1024, 768, 0xFFFFFF)
            .setOrigin(0, 0)
            .setAlpha(0);
        
        this.tweens.add({
            targets: flash,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            onComplete: () => {
                this.scene.start('MainMenu');
            }
        });
    }
}