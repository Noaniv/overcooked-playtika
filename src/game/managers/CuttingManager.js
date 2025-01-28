export class CuttingManager {
    constructor(scene) {
        this.scene = scene;
        this.isCutting = false;
        this.currentCharacter = null;
        this.cuttingProgress = 0;
        this.cuttingSound = null;
        this.requiredCuttingTime = 5000;
        this.penaltyPoints = -10;
        this.progressContainer = null;
        this.progressBar = null;
        this.progressFill = null;
        this.progressText = null;
        this.progressBorder = null;
        this.timerLabel = null;
        this.decorativeBorder = null;
    }


   startCuttingTimer(character) {
        const isAtCuttingBoard = character.currentZone === 'cuttingBoard' || 
                                character.currentZone === 'leftCuttingBoard';
                                
        if (!isAtCuttingBoard || this.isCutting) return;

        const boardIngredients = this.scene.ingredientManager.placedIngredients[character.currentZone];
        if (boardIngredients.length === 0) return;

        const ingredientToCut = boardIngredients[0];
        if (ingredientToCut.state !== 'raw') return;

        this.isCutting = true;
        this.currentCharacter = character;
        this.cuttingProgress = 0;

        // Position variables
        const barX = ingredientToCut.gameObject.x;
        const barY = ingredientToCut.gameObject.y - 50;
        const barWidth = 140;
        const barHeight = 25;

        // Create container
        this.progressContainer = this.scene.add.container(barX, barY).setDepth(10);

        // Add decorative background pattern
        const pattern = this.scene.add.graphics();
        pattern.lineStyle(2, 0xFFA500, 0.3); // Orange lines
        for (let i = -barWidth/2 - 10; i < barWidth/2 + 10; i += 10) {
            pattern.lineBetween(i, -barHeight/2 - 5, i + 10, barHeight/2 + 5);
        }
        this.progressContainer.add(pattern);

        // Create main background with Mexican-inspired colors
        this.progressBar = this.scene.add.graphics();
        this.progressBar.clear();
        this.progressBar.fillStyle(0x8B0000, 0.85); // Dark red background
        this.progressBar.fillRoundedRect(-barWidth/2, -barHeight/2, barWidth, barHeight, 10);
        this.progressContainer.add(this.progressBar);

        // Create progress fill
        this.progressFill = this.scene.add.graphics();
        this.updateProgressFill(0);
        this.progressContainer.add(this.progressFill);

        // Create decorative border
        this.decorativeBorder = this.scene.add.graphics();
        this.decorativeBorder.lineStyle(3, 0xFFD700, 1); // Gold border
        this.decorativeBorder.strokeRoundedRect(-barWidth/2 - 5, -barHeight/2 - 5, barWidth + 10, barHeight + 10, 12);
        this.decorativeBorder.lineStyle(2, 0xFF4500, 0.8); // Secondary orange border
        this.decorativeBorder.strokeRoundedRect(-barWidth/2, -barHeight/2, barWidth, barHeight, 10);
        this.progressContainer.add(this.decorativeBorder);

        // Create timer label with Mexican-inspired text style
        this.timerLabel = this.scene.add.text(0, -30, 'Start Chopping!', {
            fontSize: '20px',
            fontStyle: 'bold',
            fill: '#FFD700', // Gold text
            stroke: '#8B0000', // Dark red stroke
            strokeThickness: 4,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 2,
                fill: true
            }
        }).setOrigin(0.5);
        this.progressContainer.add(this.timerLabel);

        // Create percentage text
        this.progressText = this.scene.add.text(0, 0, '0%', {
            fontSize: '16px',
            fontStyle: 'bold',
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.progressContainer.add(this.progressText);

        // Add container animation
        this.scene.tweens.add({
            targets: this.progressContainer,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Start cutting sound
        this.cuttingSound = this.scene.sound.add('cuttingKitchenSound', {
            loop: true,
            volume: 0.3
        });
        this.cuttingSound.play();
    }

    updateProgressFill(progress) {
        if (!this.progressFill) return;

        const barWidth = 140;
        const barHeight = 25;
        const fillWidth = barWidth * progress;

        this.progressFill.clear();

        // Mexican-inspired gradient colors
        const colors = {
            start: 0x00AF87,  // Turquoise
            middle: 0xFF4500, // Red-Orange
            end: 0x00FF00     // Green
        };

        let fillColor;
        if (progress < 0.5) {
            fillColor = colors.middle;
        } else {
            fillColor = colors.end;
        }

        // Create gradient fill
        this.progressFill.fillStyle(fillColor, 1);
        this.progressFill.fillRoundedRect(
            -barWidth/2,
            -barHeight/2,
            fillWidth,
            barHeight,
            10
        );

        // Add pattern to fill
        const patternSpacing = 15;
        this.progressFill.lineStyle(2, 0xFFFFFF, 0.2);
        for (let i = 0; i < fillWidth; i += patternSpacing) {
            this.progressFill.lineBetween(
                -barWidth/2 + i,
                -barHeight/2,
                -barWidth/2 + i - barHeight,
                barHeight/2
            );
        }
    }

    failCutting() {
        if (!this.currentCharacter) return;

        const boardIngredients = this.scene.ingredientManager.placedIngredients[this.currentCharacter.currentZone];
        if (boardIngredients.length > 0) {
            const ingredient = boardIngredients[0];
            const x = ingredient.gameObject.x;
            const y = ingredient.gameObject.y;
            
            // Destroy the ingredient
            ingredient.gameObject.destroy();
            if (ingredient.interactiveZone) {
                ingredient.interactiveZone.destroy();
            }
            
            // Clear the cutting board
            this.scene.ingredientManager.placedIngredients[this.currentCharacter.currentZone] = [];

            // Create penalty effect and deduct points
            this.scene.ingredientManager.createPenaltyEffect(x, y, 10);
            this.scene.addPoints(-10);
        }
        
        // Ensure held ingredient is cleared
        if (this.currentCharacter) {
            this.currentCharacter.heldIngredient = null;
        }
        
        this.cleanup();
    }

    completeCutting(character) {
        const cuttingBoard = character.currentZone;
        const ingredients = this.scene.ingredientManager.placedIngredients[cuttingBoard];
        
        if (ingredients && ingredients.length > 0) {
            // Mark the ingredient as prepped
            ingredients.forEach(ingredient => {
                ingredient.state = 'prepped';
                console.log(`Marked ${ingredient.name} as prepped`);
            });
        }
        
        this.isCutting = false;
        if (!this.currentCharacter) return;

        const boardIngredients = this.scene.ingredientManager.placedIngredients[this.currentCharacter.currentZone];
        if (boardIngredients.length > 0) {
            const ingredient = boardIngredients[0];
            const ingredientName = ingredient.name.toLowerCase();
            
            // Update the texture and state
            ingredient.gameObject.setTexture(`${ingredientName}2`);
            ingredient.state = 'prepped';
            ingredient.gameObject.setScale(0.2);

            // Give the cut ingredient to the character
            this.currentCharacter.heldIngredient = ingredient;
            
            // Clear the cutting board
            this.scene.ingredientManager.placedIngredients[this.currentCharacter.currentZone] = [];

            // Play completion sound
            const completionSound = this.scene.sound.add('drawKnifeSound');
            completionSound.play({ volume: 0.5 });
        }
        
        this.cleanup();
    }

    handleCuttingBoardDropoff(character, zoneName) {
        if (!character.heldIngredient) return;

        const cuttingBoard = this.scene.zoneManager.getZone(zoneName);
        if (!cuttingBoard) return;
        
        // Position the ingredient on the cutting board
        character.heldIngredient.gameObject.setPosition(
            cuttingBoard.x + cuttingBoard.width / 2 + 40,
            cuttingBoard.y + cuttingBoard.height / 2 + 40
        );

        // Add to placed ingredients
        this.scene.ingredientManager.placedIngredients[zoneName].push(character.heldIngredient);
        
        // Play drop sound
        const dropSound = this.scene.sound.add('pickupSound');
        dropSound.play({ volume: 0.3 });
        
        // Clear held ingredient before starting cutting
        character.heldIngredient = null;

        // Start cutting immediately
        this.startCuttingTimer(character);
    }

    handleCuttingComplete(character) {
        if (!character.heldIngredient) return;
        
        const ingredientName = character.heldIngredient.name.toLowerCase();
        character.heldIngredient.gameObject
            .setTexture(`${ingredientName}2`)
            .setScale(0.2);
        character.heldIngredient.state = 'prepped';
        
        const cutSound = this.scene.sound.add('drawKnifeSound');
        cutSound.play({ volume: 0.5 });
        
        // Clear cutting boards
        this.scene.ingredientManager.placedIngredients.cuttingBoard = [];
        this.scene.ingredientManager.placedIngredients .leftCuttingBoard = [];
    }

    update(time, delta) {
        if (!this.isCutting || !this.currentCharacter) return;

        const isInteractHeld = this.currentCharacter === this.scene.characterManager.getCharacter('chef') ?
            this.scene.input.keyboard.addKey('E').isDown :
            this.scene.input.keyboard.addKey('SPACE').isDown;

        if (!isInteractHeld) {
            this.failCutting();
            return;
        }

        this.cuttingProgress += delta;
        const progress = Math.min(this.cuttingProgress / this.requiredCuttingTime, 1);
        
        // Update progress bar and text
        if (this.progressFill) {
            this.updateProgressFill(progress);
            
            if (this.progressText) {
                const percentage = Math.floor(progress * 100);
                this.progressText.setText(`${percentage}%`);
            }

            // Update label with English text
            if (this.timerLabel) {
                if (progress < 0.3) {
                    this.timerLabel.setText('Start Chopping!');
                } else if (progress < 0.7) {
                    this.timerLabel.setText('Keep Going!');
                } else {
                    this.timerLabel.setText('Almost Done!');
                }
            }
        }

        // Add subtle sway animation to the decorative border
        if (this.decorativeBorder) {
            this.decorativeBorder.rotation = Math.sin(time / 500) * 0.01;
        }

        if (this.cuttingProgress >= this.requiredCuttingTime) {
            this.completeCutting(this.currentCharacter);
        }
    }

    cleanup() {
        if (this.cuttingSound) {
            this.cuttingSound.stop();
            this.cuttingSound.destroy();
            this.cuttingSound = null;
        }

        if (this.progressContainer) {
            this.progressContainer.destroy();
            this.progressContainer = null;
        }

        this.progressBar = null;
        this.progressFill = null;
        this.progressText = null;
        this.progressBorder = null;
        this.timerLabel = null;
        this.decorativeBorder = null;

        this.isCutting = false;
        this.currentCharacter = null;
        this.cuttingProgress = 0;
    }
} 