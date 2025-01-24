import { Scene } from 'phaser';

export class GameOver extends Scene
{
    constructor ()
    {
        super('GameOver');
    }
    init(data) {
        this.finalScore = data.score;
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0xff0000);

        this.add.image(512, 384, 'background').setAlpha(0.5);

        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        this.add.text(centerX, centerY - 50, 'Game Over!', {
            fontSize: '48px',
            fill: '#000'
        }).setOrigin(0.5);

        this.add.text(centerX, centerY + 50, `Final Score: ${this.finalScore}`, {
            fontSize: '32px',
            fill: '#000'
        }).setOrigin(0.5);

        // Restart button
        const restartButton = this.add.text(centerX, centerY + 150, 'Play Again', {
            fontSize: '24px',
            fill: '#000',
            backgroundColor: '#fff',
            padding: { x: 20, y: 10 }
        })
        .setInteractive()
        .setOrigin(0.5);

        restartButton.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.scene.start('MainMenu');
            });
    }
}
