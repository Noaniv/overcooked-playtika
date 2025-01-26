export class CuttingManager {
    constructor(scene) {
        this.scene = scene;
        this.isCutting = false;
        this.currentCharacter = null;
        this.cuttingProgress = 0;
        this.cuttingSound = null;
        this.requiredCuttingTime = 5000; // 5 seconds
        this.penaltyPoints = -10;
        this.progressBar = null;
        this.progressFill = null;
        this.progressText = null;
    }

    startCuttingTimer(character) {
        const isAtCuttingBoard = character.currentZone === 'cuttingBoard' || 
                                character.currentZone === 'leftCuttingBoard';
                                
        if (!isAtCuttingBoard || this.isCutting) {
            return;
        }

        // Get the ingredient from the cutting board
        const boardIngredients = this.scene.ingredientManager.placedIngredients[character.currentZone];
        if (boardIngredients.length === 0) return;

        const ingredientToCut = boardIngredients[0];
        if (ingredientToCut.state !== 'raw') return;

        this.isCutting = true;
        this.currentCharacter = character;
        this.cuttingProgress = 0;

        // Create progress bar
        const barX = ingredientToCut.gameObject.x;
        const barY = ingredientToCut.gameObject.y - 40;

        this.progressBar = this.scene.add.rectangle(
            barX,
            barY,
            100,
            15,
            0x000000,
            0.8
        ).setOrigin(0.5).setDepth(1);

        this.progressFill = this.scene.add.rectangle(
            barX - 48,
            barY,
            0,
            11,
            0x00ff00,
            1
        ).setOrigin(0, 0.5).setDepth(2);

        this.progressText = this.scene.add.text(
            barX,
            barY - 20,
            '0%',
            {
                fontSize: '16px',
                fill: '#ffffff'
            }
        ).setOrigin(0.5).setDepth(2);

        // Start cutting sound
        this.cuttingSound = this.scene.sound.add('cuttingKitchenSound', {
            loop: true,
            volume: 0.3
        });
        this.cuttingSound.play();
    }

    failCutting() {
        if (!this.currentCharacter) return;

        const boardIngredients = this.scene.ingredientManager.placedIngredients[this.currentCharacter.currentZone];
        if (boardIngredients.length > 0) {
            const ingredient = boardIngredients[0];
            ingredient.gameObject.destroy();
            
            // Clear the cutting board
            this.scene.ingredientManager.placedIngredients[this.currentCharacter.currentZone] = [];

            // Create penalty effect
            this.scene.createTrashEffect(ingredient.gameObject.x, ingredient.gameObject.y);
            
            // Add penalty points
            this.scene.addPoints(this.penaltyPoints);
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
        
        // Update progress bar and text
        if (this.progressFill && this.progressBar) {
            const progress = Math.min(this.cuttingProgress / this.requiredCuttingTime, 1);
            this.progressFill.width = 96 * progress;
            
            if (this.progressText) {
                const percentage = Math.floor(progress * 100);
                this.progressText.setText(`${percentage}%`);
            }
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

        if (this.progressBar) {
            this.progressBar.destroy();
            this.progressBar = null;
        }
        if (this.progressFill) {
            this.progressFill.destroy();
            this.progressFill = null;
        }
        if (this.progressText) {
            this.progressText.destroy();
            this.progressText = null;
        }

        this.isCutting = false;
        this.currentCharacter = null;
        this.cuttingProgress = 0;
    }
} 