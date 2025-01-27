import { Scene } from 'phaser';

export class CountdownScene extends Scene {
    constructor() {
        super('CountdownScene');
    }

    create() {
        // Create vibrant background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0xFF6B6B, 0xFF6B6B, 0xFFC93C, 0xFFC93C, 1);
        bg.fillRect(0, 0, 1024, 768);

        // Add decorative elements
        this.createDecorativeElements();

        // Calculate total scene duration: 
        // Initial "Get Ready" (2.5s) + 3 numbers (0.7s each) + "VAMOS" (0.5s) = ~5 seconds
        const totalDuration = 5000;
        
        // Play countdown sound and store reference to stop it when transitioning
        this.countdownSound = this.sound.add('gameCountdownSound');
        this.countdownSound.play({ duration: totalDuration });

        // Create "Get Ready!" text with Mexican style
        const readyText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            '¡Prepárate!',
            {
                fontSize: '64px',
                fontFamily: 'Arial Black',
                fill: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 8,
                shadow: { color: '#000000', blur: 10, stroke: true, fill: true }
            }
        ).setOrigin(0.5).setScale(0);

        // Animate "Get Ready!" text with bounce effect
        this.tweens.add({
            targets: readyText,
            scale: 1,
            duration: 500,
            ease: 'Back.out',
            onComplete: () => {
                // Add decorative flash
                this.createFlashEffect(readyText.x, readyText.y);
                
                // Fade out with rotation
                this.tweens.add({
                    targets: readyText,
                    alpha: 0,
                    scale: 2,
                    rotation: 0.1,
                    duration: 500,
                    delay: 1500,
                    onComplete: () => readyText.destroy()
                });
            }
        });

        // Start countdown with enhanced visuals
        this.time.delayedCall(2500, () => this.startCountdown());
    }

    createDecorativeElements() {
        // Add floating decorative elements
        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(0, this.scale.width);
            const y = Phaser.Math.Between(0, this.scale.height);
            
            const decoration = this.add.star(x, y, 5, 20, 40, 0xFFD700)
                .setAlpha(0.3);

            this.tweens.add({
                targets: decoration,
                y: '+=50',
                rotation: Math.PI * 2,
                duration: 3000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.inOut'
            });
        }
    }

    createFlashEffect(x, y) {
        const flash = this.add.circle(x, y, 50, 0xFFFFFF)
            .setAlpha(0);

        this.tweens.add({
            targets: flash,
            alpha: 0.5,
            scale: 3,
            duration: 300,
            yoyo: true,
            onComplete: () => flash.destroy()
        });
    }

    startCountdown() {
        let count = 3;
        
        // If scene changes abruptly, ensure sound is stopped
        this.events.once('shutdown', () => {
            if (this.countdownSound && this.countdownSound.isPlaying) {
                this.countdownSound.stop();
            }
        });
        const numberColors = [0xFF6B6B, 0xFFC93C, 0x00A896];
        
        const showNumber = () => {
            const countdownText = this.add.text(
                this.scale.width / 2,
                this.scale.height / 2,
                count.toString(),
                {
                    fontSize: '96px',
                    fontFamily: 'Arial Black',
                    fill: '#FFFFFF',
                    stroke: '#000000',
                    strokeThickness: 8
                }
            ).setOrigin(0.5);

            // Add colored glow effect
            countdownText.setTint(numberColors[count - 1]);
            
            // Scale and rotate animation
            this.tweens.add({
                targets: countdownText,
                scale: { from: 2, to: 1 },
                rotation: { from: -0.1, to: 0 },
                duration: 500,
                ease: 'Back.out',
                onComplete: () => {
                    // Create flash effect
                    this.createFlashEffect(countdownText.x, countdownText.y);
                    
                    // Fade out
                    this.tweens.add({
                        targets: countdownText,
                        alpha: 0,
                        scale: 0.5,
                        duration: 500,
                        delay: 200,
                        onComplete: () => {
                            countdownText.destroy();
                            count--;
                            if (count > 0) {
                                showNumber();
                            } else {
                                showFinalText();
                            }
                        }
                    });
                }
            });
        };

        const showFinalText = () => {
            const finalText = this.add.text(
                this.scale.width / 2,
                this.scale.height / 2,
                '¡VAMOS!',
                {
                    fontSize: '96px',
                    fontFamily: 'Arial Black',
                    fill: '#FFFFFF',
                    stroke: '#000000',
                    strokeThickness: 8
                }
            ).setOrigin(0.5);

            // Add multiple flash effects
            for (let i = 0; i < 3; i++) {
                this.time.delayedCall(i * 200, () => {
                    this.createFlashEffect(
                        this.scale.width / 2 + Phaser.Math.Between(-100, 100),
                        this.scale.height / 2 + Phaser.Math.Between(-100, 100)
                    );
                });
            }

            // Scale up and transition to game
            this.tweens.add({
                targets: finalText,
                scale: 1.5,
                duration: 500,
                ease: 'Back.out',
                onComplete: () => {
                    // Stop the countdown sound before transitioning
                    if (this.countdownSound && this.countdownSound.isPlaying) {
                        this.countdownSound.stop();
                    }
                    this.scene.start('TransitionScene', {
                        nextScene: 'OvercookedGame',
                        duration: 1200
                    });
                }
            });
        };

        showNumber();
    }
}