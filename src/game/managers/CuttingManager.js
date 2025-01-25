export class CuttingManager {
    constructor(scene) {
        this.scene = scene;
        this.isCutting = false;
        this.cuttingTimer = null;
        this.cuttingProgress = null;
        this.timerGroup = null;
        this.timeLeft = 0;
        this.spaceKeyIsDown = false;
        this.currentCuttingSound = null;
    }

    startCuttingTimer(player) {
        if (this.isCutting) return;
        
        if (!player.heldIngredient) {
            console.log('No held ingredient to cut');
            return;
        }

        try {
            console.log('Playing draw knife sound...');
            const drawKnifeSound = this.scene.sound.add('drawKnifeSound');
            if (!drawKnifeSound) {
                console.error('Failed to create draw knife sound');
                return;
            }
            drawKnifeSound.play({ volume: 0.5 });
            
            drawKnifeSound.once('complete', () => {
                console.log('Draw knife sound completed, starting cutting sound...');
                this.currentCuttingSound = this.scene.sound.add('cuttingKitchenSound', { 
                    loop: true,
                    volume: 0.5
                });
                if (!this.currentCuttingSound) {
                    console.error('Failed to create cutting sound');
                    return;
                }
                this.currentCuttingSound.play({ volume: 1 });
                drawKnifeSound.destroy();
            });
        } catch (error) {
            console.error('Error playing cutting sounds:', error);
        }

        this.isCutting = true;
        this.spaceKeyIsDown = true;
    
        // Create timer group to manage all elements
        this.timerGroup = this.scene.add.group();
        const timerY = player.y + player.displayHeight + 15;
        
        // Constants for bar dimensions
        const BAR_WIDTH = 150;
        const BAR_HEIGHT = 12;
        
        // Background bar (dark border)
        this.timerBg = this.scene.add.rectangle(
            player.x + player.displayWidth / 2,
            timerY,
            BAR_WIDTH,
            BAR_HEIGHT,
            0x333333
        ).setOrigin(0.5, 0.5);
        this.timerGroup.add(this.timerBg);
        
        // Progress bar background
        this.progressBg = this.scene.add.rectangle(
            player.x + player.displayWidth / 2,
            timerY,
            BAR_WIDTH,
            BAR_HEIGHT,
            0x005500
        ).setOrigin(0.5, 0.5);
        this.timerGroup.add(this.progressBg);
    
        // Main progress bar
        this.cuttingProgress = this.scene.add.rectangle(
            player.x + player.displayWidth / 2,
            timerY,
            BAR_WIDTH,
            BAR_HEIGHT,
            0x00ff00
        ).setOrigin(0.5, 0.5);
        this.timerGroup.add(this.cuttingProgress);
    
        // Timer text
        this.timerText = this.scene.add.text(
            player.x + player.displayWidth / 2,
            timerY - 25,
            '5.0',
            {
                fontSize: '24px',
                fontWeight: 'bold',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
        this.timerGroup.add(this.timerText);
    
        // "Cutting..." text
        this.cuttingText = this.scene.add.text(
            player.x + player.displayWidth / 2,
            timerY - 50,
            'Cutting...',
            {
                fontSize: '20px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5);
        this.timerGroup.add(this.cuttingText);
    
        // Cutting animation (knife icon or simple flash)
        const cutIndicator = this.scene.add.rectangle(
            player.x + player.displayWidth / 2,
            timerY,
            20,
            20,
            0xffffff
        ).setAlpha(0);
        this.timerGroup.add(cutIndicator);
    
        // Cutting indicator animation
        this.scene.tweens.add({
            targets: cutIndicator,
            alpha: 0.5,
            yoyo: true,
            duration: 200,
            repeat: 24
        });
    
        // Progress bar animation
        this.scene.tweens.add({
            targets: this.cuttingProgress,
            width: 0,
            duration: 5000,
            ease: 'Linear'
        });
    
        // Store timeLeft in class scope
        this.timeLeft = 5.0;
        
        // Store the countdown timer reference
        this.countdownTimer = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                if (!this.timerText || !this.isCutting) {
                    if (this.countdownTimer) {
                        this.countdownTimer.remove();
                        this.countdownTimer = null;
                    }
                    return;
                }
                
                this.timeLeft -= 0.1;
                if (this.timeLeft > 0) {
                    this.timerText.setText(this.timeLeft.toFixed(1));
                }
            },
            repeat: 49
        });
    
        // Main cutting timer
        this.cuttingTimer = this.scene.time.addEvent({
            delay: 5000,
            callback: () => {
                if (this.countdownTimer) {
                    this.countdownTimer.remove();
                    this.countdownTimer = null;
                }
                
                this.cleanupCuttingTimer();
                this.completeCutting(player);
            },
            loop: false
        });
    
        // Pulse animation for cutting text
        this.scene.tweens.add({
            targets: this.cuttingText,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    cleanupCuttingTimer() {
        // Stop and cleanup all sounds
        if (this.currentCuttingSound) {
            this.currentCuttingSound.stop();
            this.currentCuttingSound.destroy();
            this.currentCuttingSound = null;
        }

        if (this.countdownTimer) {
            this.countdownTimer.remove();
            this.countdownTimer = null;
        }
        if (this.cuttingTimer) {
            this.cuttingTimer.remove();
            this.cuttingTimer = null;
        }
    
        this.scene.tweens.killTweensOf(this.cuttingText);
        this.scene.tweens.killTweensOf(this.cuttingProgress);
    
        if (this.timerGroup) {
            this.timerGroup.clear(true, true);
            this.timerGroup.destroy();
            this.timerGroup = null;
        }

        this.isCutting = false;
        this.spaceKeyIsDown = false;
        this.timeLeft = 0;
    }

    completeCutting(player) {
        try {
            if (!player.heldIngredient) {
                console.log('No held ingredient to transform');
                return;
            }

            const oldImage = player.heldIngredient.gameObject;
            const ingredientName = player.heldIngredient.name;
            const oldX = oldImage.x;
            const oldY = oldImage.y;

            // Create new image first
            const newImage = this.scene.add.image(
                oldX,
                oldY,
                `${ingredientName.toLowerCase()}2`
            )
            .setInteractive()
            .setScale(0.3);

            // Update the held ingredient reference
            oldImage.destroy();
            player.heldIngredient.gameObject = newImage;

            // Clean up timers and UI after transformation is complete
            this.cleanupCuttingTimer();
            
            console.log('Cutting completed successfully:', {
                ingredientName,
                newTexture: `${ingredientName.toLowerCase()}2`,
                position: { x: oldX, y: oldY }
            });
        } catch (error) {
            console.error('Error in completeCutting:', error);
            console.error('Debug state:', {
                hasHeldIngredient: !!player.heldIngredient,
                ingredientName: player.heldIngredient?.name,
                spaceKeyIsDown: this.spaceKeyIsDown
            });
        }
    }

    cancelCutting(player) {
        // Stop and cleanup all sounds
        if (this.currentCuttingSound) {
            this.currentCuttingSound.stop();
            this.currentCuttingSound.destroy();
            this.currentCuttingSound = null;
        }

        if (this.isCutting && player.heldIngredient) {
            this.scene.score -= 5;
            this.scene.scoreText.setText(`Score: ${this.scene.score}`);
            
            player.heldIngredient.gameObject.destroy();
            player.heldIngredient = null;
        }
        this.cleanupCuttingTimer();
    }
} 