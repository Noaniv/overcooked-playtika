import { Scene } from 'phaser';

export class CountdownScene extends Scene {
    constructor() {
        super('CountdownScene');
    }

    create() {
        // Play countdown sound
        const countdownSound = this.sound.add('gameCountdownSound');
        countdownSound.play();

        // Add "Get Ready!" text
        const readyText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            'Get Ready!',
            {
                fontSize: '64px',
                fontWeight: 'bold',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5).setScale(0);

        // Animate "Get Ready!" text
        this.tweens.add({
            targets: readyText,
            scale: 1,
            duration: 500,
            ease: 'Back.out',
            onComplete: () => {
                // Fade out after 2 seconds
                this.tweens.add({
                    targets: readyText,
                    alpha: 0,
                    duration: 500,
                    delay: 1500,
                    onComplete: () => readyText.destroy()
                });
            }
        });

        // Start countdown after "Get Ready!" fades
        this.time.delayedCall(2500, () => {
            let count = 3;
            const countdownText = this.add.text(
                this.scale.width / 2,
                this.scale.height / 2,
                count.toString(),
                {
                    fontSize: '96px',
                    fontWeight: 'bold',
                    fill: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 6
                }
            ).setOrigin(0.5);

            // Countdown timer
            const timer = this.time.addEvent({
                delay: 1000,
                callback: () => {
                    count--;
                    if (count > 0) {
                        countdownText.setText(count.toString());
                    } else if (count === 0) {
                        countdownText.setText('GO!');
                        this.tweens.add({
                            targets: countdownText,
                            scale: 1.5,
                            duration: 500,
                            onComplete: () => {
                                countdownSound.stop();
                                this.scene.start('OvercookedGame');
                            }
                        });
                    }
                },
                repeat: 3
            });
        });
    }
} 