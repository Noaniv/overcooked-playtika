export class MusicToggleButton {
    constructor(scene, x, y) {
        this.scene = scene;
        
        // Create the music instance if it doesn't exist
        if (!this.scene.game.music) {
            this.scene.game.music = this.scene.sound.add('gameMusic', {
                loop: true,
                volume: 0.5
            });
        }

        // Create the toggle button
        this.button = this.scene.add.image(x, y, 'musicOn')
            .setInteractive()
            .setScale(0.5)
            .setScrollFactor(0)
            .setDepth(1000);

        // Set initial state
        this.isMuted = false;

        // Add click handler
        this.button.on('pointerdown', () => {
            this.toggleMusic();
        });

        // Add hover effects
        this.button.on('pointerover', () => {
            this.scene.tweens.add({
                targets: this.button,
                scale: 0.6,
                duration: 100
            });
        });

        this.button.on('pointerout', () => {
            this.scene.tweens.add({
                targets: this.button,
                scale: 0.5,
                duration: 100
            });
        });
    }

    toggleMusic() {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            this.button.setTexture('musicOff');
            this.scene.game.music.pause();
        } else {
            this.button.setTexture('musicOn');
            if (!this.scene.game.music.isPlaying) {
                this.scene.game.music.play();
            }
        }

        // Add a little bounce effect
        this.scene.tweens.add({
            targets: this.button,
            scale: { from: 0.4, to: 0.5 },
            duration: 200,
            ease: 'Bounce.out'
        });
    }

    setPosition(x, y) {
        this.button.setPosition(x, y);
    }

    destroy() {
        this.button.destroy();
    }
} 