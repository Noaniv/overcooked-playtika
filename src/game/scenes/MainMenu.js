// MainMenu.js
import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class MainMenu extends Scene {
    logoTween;

    constructor() {
        super('MainMenu');
    }

    create() {
        // Add a colorful gradient background
        const gradient = this.add.graphics();
        gradient.fillGradientStyle(0xFF6B6B, 0xFF6B6B, 0xFFC93C, 0xFFC93C, 1);
        gradient.fillRect(0, 0, 1024, 768);

        // Create decorative background pattern
        this.createPatternBackground();

        // Add floating papel picado (Mexican paper decorations)
        this.createPapelPicado();

        // Main logo with drop shadow
        this.logo = this.add.image(512, 300, 'logo')
            .setDepth(100);
        
        // Add shadow effect to logo
        const logoShadow = this.add.image(515, 303, 'logo')
            .setTint(0x000000)
            .setAlpha(0.3)
            .setDepth(99);

        // Synchronize logo and shadow movement
        this.logo.shadow = logoShadow;

        // Create buttons with decorative frames
        this.createDecorativeButton(512, 460, '¡Comenzar!', () => this.startGame());
        this.createDecorativeButton(512, 560, '¡Instructions!', () => this.scene.start('Instructions'));

        // Music setup
        if (this.game.music && !this.game.music.isPlaying && !this.sound.locked) {
            try {
                this.game.music.play();
                EventBus.emit('musicStateChanged', false);
            } catch (error) {
                console.error('Error playing music in MainMenu:', error);
            }
        }

        EventBus.emit('current-scene-ready', this);
    }

    createPatternBackground() {
        // Create a repeating pattern of decorative elements
        const pattern = this.add.group();
        const spacing = 100;
        
        for (let x = 0; x < 1024; x += spacing) {
            for (let y = 0; y < 768; y += spacing) {
                const decoration = this.add.star(x, y, 4, 15, 30, 0xFFD700)
                    .setAlpha(0.2)
                    .setDepth(1);
                pattern.add(decoration);
                
                // Add subtle rotation animation
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
        // Create decorative banners across the top
        for (let x = 0; x < 1024; x += 120) {
            const banner = this.add.triangle(x, 50, 0, 0, 30, 40, 60, 0, 0xFF9B42)
                .setAlpha(0.8);
            
            // Add swaying animation
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

    createDecorativeButton(x, y, text, callback) {
        // Create a decorative frame for the button
        const buttonWidth = 300;
        const buttonHeight = 80;
        
        // Button background with gradient
        const button = this.add.graphics();
        button.lineStyle(4, 0xFFA500);
        button.fillGradientStyle(0xFF4D4D, 0xFF4D4D, 0xC41E3A, 0xC41E3A, 1);
        button.fillRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 20);
        button.strokeRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 20);

        // Add decorative corners
        const cornerSize = 15;
        const corners = [
            [x - buttonWidth/2, y - buttonHeight/2], // Top-left
            [x + buttonWidth/2, y - buttonHeight/2], // Top-right
            [x - buttonWidth/2, y + buttonHeight/2], // Bottom-left
            [x + buttonWidth/2, y + buttonHeight/2]  // Bottom-right
        ];

        corners.forEach(([cx, cy]) => {
            const corner = this.add.star(cx, cy, 4, cornerSize/2, cornerSize, 0xFFD700)
                .setDepth(101);
            
            // Add subtle rotation animation
            this.tweens.add({
                targets: corner,
                rotation: Math.PI * 2,
                duration: 6000,
                repeat: -1,
                ease: 'Linear'
            });
        });

        // Add the text with enhanced style
        const buttonText = this.add.text(x, y, text, {
            fontFamily: 'Arial Black',
            fontSize: 38,
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setDepth(101).setOrigin(0.5);

        // Make the entire button area interactive
        const hitArea = this.add.rectangle(x, y, buttonWidth, buttonHeight)
            .setInteractive({ useHandCursor: true });

        hitArea.on('pointerdown', () => {
            if (callback) callback();
            else this.changeScene();
        });
        
        hitArea.on('pointerover', () => {
            button.clear();
            button.lineStyle(4, 0xFFF700);
            button.fillGradientStyle(0xFF6B6B, 0xFF6B6B, 0xE71D36, 0xE71D36, 1);
            button.fillRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 20);
            button.strokeRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 20);
            
            // Scale up text slightly
            this.tweens.add({
                targets: buttonText,
                scale: 1.1,
                duration: 100
            });
        });
        
        hitArea.on('pointerout', () => {
            button.clear();
            button.lineStyle(4, 0xFFA500);
            button.fillGradientStyle(0xFF4D4D, 0xFF4D4D, 0xC41E3A, 0xC41E3A, 1);
            button.fillRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 20);
            button.strokeRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 20);
            
            // Reset text scale
            this.tweens.add({
                targets: buttonText,
                scale: 1,
                duration: 100
            });
        });
    }

    startGame() {
        if (this.logoTween) {
            this.logoTween.stop();
            this.logoTween = null;
        }
        
        // Add a colorful flash effect before scene change
        const flash = this.add.rectangle(0, 0, 1024, 768, 0xFFFFFF)
            .setOrigin(0, 0)
            .setAlpha(0);
        
        this.tweens.add({
            targets: flash,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            onComplete: () => {
                this.scene.start('CountdownScene');
            }
        });
    }

    moveLogo(reactCallback) {
        if (this.logoTween) {
            if (this.logoTween.isPlaying()) {
                this.logoTween.pause();
            } else {
                this.logoTween.play();
            }
        } else {
            this.logoTween = this.tweens.add({
                targets: [this.logo, this.logo.shadow],
                x: { value: 750, duration: 3000, ease: 'Back.easeInOut' },
                y: { value: 80, duration: 1500, ease: 'Sine.easeOut' },
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    if (reactCallback) {
                        reactCallback({
                            x: Math.floor(this.logo.x),
                            y: Math.floor(this.logo.y)
                        });
                    }
                }
            });
        }
    }
}