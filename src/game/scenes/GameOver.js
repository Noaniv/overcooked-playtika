import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class GameOver extends Scene {
    constructor() {
        super('GameOver');
    }

    init(data) {
        this.finalScore = data.score;
    }

    create() {
        // Create a rich, warm gradient background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0xFF9642, 0xFF5733, 0xC70039, 0x900C3F, 1);
        bg.fillRect(0, 0, 1024, 768);

        // Center coordinates
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        // Add decorative tile border pattern
        this.createTileBorder();

        // Create a central container for main content
        const contentContainer = this.add.container(centerX, centerY - 50);

        // Create and add the "Game Over" text with a festive style
        const gameOverText = this.add.text(0, -100, '¡BUEN TRABAJO!', {
            fontSize: '64px',
            fontFamily: 'Arial Black',
            fill: '#FFF',
            stroke: '#2C1810',
            strokeThickness: 8,
        }).setOrigin(0.5);
        
        // Create score display with Mexican-inspired frame
        const scoreContainer = this.createScoreDisplay(0, 0);

        // Add everything to the main container
        contentContainer.add([gameOverText, scoreContainer]);

        // Create the "Play Again" button with Mexican-inspired design
        this.createPlayAgainButton(centerX, centerY + 150);

        // Entry animations
        this.animateElements(gameOverText, scoreContainer);
    }

    createTileBorder() {
        // Create a decorative border inspired by Mexican tiles
        const tileSize = 40;
        const colors = [0xFEDB39, 0xFF7733, 0xC70039, 0x900C3F];
        
        // Top and bottom borders
        for (let x = 0; x < this.scale.width; x += tileSize) {
            this.createTileDecoration(x, 0, colors[0]);
            this.createTileDecoration(x, this.scale.height - tileSize, colors[2]);
        }

        // Side borders
        for (let y = tileSize; y < this.scale.height - tileSize; y += tileSize) {
            this.createTileDecoration(0, y, colors[1]);
            this.createTileDecoration(this.scale.width - tileSize, y, colors[3]);
        }
    }

    createTileDecoration(x, y, color) {
        const tile = this.add.graphics();
        tile.lineStyle(2, 0xFFFFFF, 0.3);
        tile.fillStyle(color, 0.3);
        tile.fillRect(x, y, 40, 40);
        tile.strokeRect(x, y, 40, 40);

        // Add simple geometric pattern inside tile
        tile.beginPath();
        tile.moveTo(x + 20, y + 5);
        tile.lineTo(x + 35, y + 20);
        tile.lineTo(x + 20, y + 35);
        tile.lineTo(x + 5, y + 20);
        tile.closePath();
        tile.strokePath();
    }

    createScoreDisplay(x, y) {
        const container = this.add.container(x, y);

        // Create decorative medallion background
        const medalBg = this.add.graphics();
        // Outer circle
        medalBg.lineStyle(6, 0xFEDB39);
        medalBg.strokeCircle(0, 0, 120);
        // Inner circle
        medalBg.lineStyle(4, 0xFEDB39);
        medalBg.strokeCircle(0, 0, 100);
        
        // Create decorative rays
        const rays = this.add.graphics();
        rays.lineStyle(3, 0xFEDB39, 0.6);
        for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI * 2) / 12;
            const x1 = Math.cos(angle) * 120;
            const y1 = Math.sin(angle) * 120;
            const x2 = Math.cos(angle) * 150;
            const y2 = Math.sin(angle) * 150;
            rays.beginPath();
            rays.moveTo(x1, y1);
            rays.lineTo(x2, y2);
            rays.strokePath();
        }

        // Create inner glow effect
        const innerGlow = this.add.graphics();
        innerGlow.fillStyle(0xFEDB39, 0.1);
        innerGlow.fillCircle(0, 0, 90);

        // Score background circle
        const scoreBg = this.add.graphics();
        scoreBg.fillStyle(0xC70039, 0.3);
        scoreBg.fillCircle(0, 0, 80);

        // Add "PUNTAJE FINAL" text with better spacing
        const scoreLabel = this.add.text(0, -85, 'PUNTAJE', {
            fontSize: '28px',
            fontFamily: 'Arial Black',
            fill: '#FFF',
            stroke: '#2C1810',
            strokeThickness: 4,
        }).setOrigin(0.5);

        const finalLabel = this.add.text(0, -55, 'FINAL', {
            fontSize: '28px',
            fontFamily: 'Arial Black',
            fill: '#FFF',
            stroke: '#2C1810',
            strokeThickness: 4,
        }).setOrigin(0.5);

        // Add score text with enhanced styling
        const scoreText = this.add.text(0, 10, `${this.finalScore}`, {
            fontSize: '64px',
            fontFamily: 'Arial Black',
            fill: '#FFF',
            stroke: '#2C1810',
            strokeThickness: 6,
        }).setOrigin(0.5);

        // Add decorative corners
        const cornerSize = 20;
        [-1, 1].forEach(xDir => {
            [-1, 1].forEach(yDir => {
                const corner = this.add.graphics();
                corner.lineStyle(3, 0xFEDB39);
                const x1 = xDir * 120;
                const y1 = yDir * 120;
                corner.beginPath();
                corner.moveTo(x1, y1);
                corner.lineTo(x1 - (xDir * cornerSize), y1);
                corner.moveTo(x1, y1);
                corner.lineTo(x1, y1 - (yDir * cornerSize));
                corner.strokePath();
            });
        });

        // Add subtle rotation animation to rays
        this.tweens.add({
            targets: rays,
            rotation: Math.PI * 2,
            duration: 20000,
            repeat: -1,
            ease: 'Linear'
        });

        // Add pulsing animation to score
        this.tweens.add({
            targets: scoreText,
            scale: 1.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
        });

        container.add([medalBg, rays, innerGlow, scoreBg, scoreLabel, finalLabel, scoreText]);
        return container;
    }

    createPlayAgainButton(x, y) {
        // Create container for button elements
        const button = this.add.container(x, y);

        // Button background with gradient
        const bg = this.add.graphics();
        bg.fillGradientStyle(0xFF5733, 0xFF5733, 0xC70039, 0xC70039, 1);
        bg.fillRoundedRect(-100, -25, 200, 50, 15);
        
        // Button border
        const border = this.add.graphics();
        border.lineStyle(3, 0xFEDB39);
        border.strokeRoundedRect(-100, -25, 200, 50, 15);

        // Button text
        const text = this.add.text(0, 0, '¡JUGAR OTRA VEZ!', {
            fontSize: '24px',
            fontFamily: 'Arial Black',
            fill: '#FFF',
            stroke: '#2C1810',
            strokeThickness: 4,
        }).setOrigin(0.5);

        button.add([bg, border, text]);

        // Make button interactive
        const hitArea = this.add.rectangle(x, y, 200, 50)
            .setInteractive({ useHandCursor: true });

        // Button hover effects
        hitArea.on('pointerover', () => {
            bg.clear();
            bg.fillGradientStyle(0xFF7733, 0xFF7733, 0xE94560, 0xE94560, 1);
            bg.fillRoundedRect(-100, -25, 200, 50, 15);
            this.tweens.add({
                targets: button,
                scale: 1.05,
                duration: 100
            });
        });

        hitArea.on('pointerout', () => {
            bg.clear();
            bg.fillGradientStyle(0xFF5733, 0xFF5733, 0xC70039, 0xC70039, 1);
            bg.fillRoundedRect(-100, -25, 200, 50, 15);
            this.tweens.add({
                targets: button,
                scale: 1,
                duration: 100
            });
        });

        hitArea.on('pointerdown', () => {
            this.cleanupGameState();
            
            // Transition effect
            const flash = this.add.rectangle(0, 0, 1024, 768, 0xFFFFFF)
                .setOrigin(0, 0)
                .setAlpha(0);
            
            this.tweens.add({
                targets: flash,
                alpha: 0.3,
                duration: 200,
                yoyo: true,
                onComplete: () => this.scene.start('MainMenu')
            });
        });
    }

    animateElements(gameOverText, scoreContainer) {
        // Entrance animation for game over text
        gameOverText.setAlpha(0);
        gameOverText.setScale(0.5);
        this.tweens.add({
            targets: gameOverText,
            alpha: 1,
            scale: 1,
            duration: 800,
            ease: 'Back.out'
        });

        // Entrance animation for score container
        scoreContainer.setAlpha(0);
        scoreContainer.setScale(0.5);
        this.tweens.add({
            targets: scoreContainer,
            alpha: 1,
            scale: 1,
            duration: 800,
            delay: 200,
            ease: 'Back.out'
        });
    }

    cleanupGameState() {
        EventBus.emit('score-updated', 0);
        EventBus.emit('recipe-updated', null);
        EventBus.emit('time-updated', 120);
        EventBus.emit('game-reset', true);
    }
}