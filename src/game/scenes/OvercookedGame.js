import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { CharacterManager } from '../managers/CharacterManager';
import { CuttingManager } from '../managers/CuttingManager';
import { IngredientManager } from '../managers/IngredientManager';
import { RecipeManager } from '../managers/RecipeManager';
import { ZoneManager } from '../managers/ZoneManager';

export class OvercookedGame extends Scene {
    constructor() {
        super('OvercookedGame');

        this.zones = {};
        this.spaceKeyIsDown = false;
        this.despawnTimers = new Map();
        this.gameTimer = null;
        this.timeText = null;
        this.score = 0;
        this.scoreText = null;
        
        // Initialize managers
        this.recipeManager = null;
        this.ingredientManager = null;
        this.characterManager = null;
        this.zoneManager = null;
        this.cuttingManager = null;
    }

    create() {
        // Add resize handler right at the start
        this.scale.on('resize', this.handleResize, this);
        
        // Get initial dimensions
        const width = this.scale.width;
        const height = this.scale.height;
        
        const dividerWidth = 250;
        const dividerX = (width - dividerWidth) / 2;

        // Initialize managers first
        this.recipeManager = new RecipeManager(this);
        this.ingredientManager = new IngredientManager(this);
        this.characterManager = new CharacterManager(this);
        this.zoneManager = new ZoneManager(this);
        this.cuttingManager = new CuttingManager(this);

        // Add background
        const background = this.add.image(width / 2, height / 2, 'background')
            .setDisplaySize(width, height)
            .setOrigin(0.5, 0.5);

        // Initialize zones
        this.zoneManager.createZones(width, height, dividerWidth, dividerX);

        // Initialize divider slots after zones are created
        this.ingredientManager.initializeDividerSlots();

        // Initialize characters
        this.characterManager.createCharacters(width, height);

        // Initialize ingredients
        this.ingredientManager.createIngredients(this.zoneManager.getZone('sidebar').x );

        // Initialize recipe display
        this.recipeManager.initializeDisplay(
            this.zoneManager.getZone('divider').x + this.zoneManager.getZone('divider').width / 2,
            200
        );

        // Set up collisions
        this.zoneManager.setupCollisions(this.characterManager);

        // Set up controls
        this.setupControls();

        // Start game timer
        this.startGameTimer();

        // Don't modify music state, let it continue from previous scene
        
        EventBus.emit('current-scene-ready', this);
    }

    setupControls() {
        this.keys = this.input.keyboard.addKeys({
            up: 'W',
            down: 'S',
            left: 'A',
            right: 'D',
            interact: 'E',
            up2: 'UP',
            down2: 'DOWN',
            left2: 'LEFT',
            right2: 'RIGHT',
            interact2: 'SPACE'
        });

        this.input.keyboard.on('keydown-E', () => this.handleChefInteraction());
        this.input.keyboard.on('keydown-SPACE', () => this.handleSousChefInteraction());
        this.input.keyboard.on('keyup-SPACE', () => {
            this.spaceKeyIsDown = false;
            if (this.cuttingManager.isCutting) {
                this.cuttingManager.cancelCutting(this.characterManager.sousChef);
            }
        });
    }

    update() {
        this.characterManager.handleMovement(this.keys);
    }

    startGameTimer() {
        let timeLeft = 120; // 2 minutes in seconds
        this.timeText = this.add.text(this.scale.width / 2, this.scale.height - 40, 'Time: 02:00', {
            fontSize: '32px',
            fill: '#000',
            backgroundColor: '#ffffff',
            padding: { x: 10, y: 5 },
        }).setOrigin(0.5);
        this.scoreText = this.add.text(this.scale.width / 2, this.scale.height - 80, `Score: ${this.score}`, {
            fontSize: '32px',
            fill: '#000',
            backgroundColor: '#ffffff',
            padding: { x: 10, y: 5 },
        }).setOrigin(0.5);

        this.gameTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                timeLeft--;
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                const formattedTime = `Time: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                this.timeText.setText(formattedTime);
                if (timeLeft <= 0) {
                    this.endGame();
                }
            },
            repeat: 120,
        });
    }

    endGame() {
        // Don't stop music when game ends
        this.scene.start('GameOver', { score: this.score });
    }    

    // Helper function for checking proximity (adjusted for full height interaction)
    isNearZone(player, zone, radius = 60) {
        if (zone === this.zoneManager.getZone('cuttingBoard')) {
            radius = 50; // Much smaller radius for cutting board interactions
        }
        const playerCenterX = player.x ;
        const playerCenterY = player.y ;

        // Get the left and right edges of the zone (since the zone is rectangular)
        const zoneLeft = zone.x;
        const zoneRight = zone.x + zone.width;
        
        // For vertical zones (like divider), we consider the full height
        const zoneTop = zone.y;
        const zoneBottom = zone.y + zone.height;

        // Calculate horizontal and vertical distances from the player to the zone's edges
        const distanceX = Math.max(0, Math.abs(playerCenterX - (zoneLeft + zone.width / 2)) - zone.width / 2);
        const distanceY = Math.max(0, Math.max(zoneTop - playerCenterY, playerCenterY - zoneBottom));

        // Check if player is within radius horizontally and vertically along the divider's full height
        return distanceX < radius && distanceY < radius;
    }

    isNearIngredient(player, ingredient, radius = 70) {
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;

        const distance = Phaser.Math.Distance.Between(
            playerCenterX,
            playerCenterY,
            ingredient.x,
            ingredient.y
        );

        return distance < radius;
    }

    handleChefInteraction() {
        if (!this.characterManager.chef.heldIngredient) {
            this.handleChefPickupAttempt();
        } else {
            this.handleChefDropOffAttempt();
        }
    }

    handleChefPickupAttempt() {
        // Don't pick up if already holding something
        if (this.characterManager.chef.heldIngredient) return;

        // First priority: Check for completed meal pickup
        if (this.cookingResult && this.characterManager.activeZoneOverlaps.chef.has('cookingStation')) {
            this.pickupCompletedMeal();
            return;
        }

        // Try to pick up from current zone
        if (this.characterManager.chef.currentZone) {
            // Check if we're in a valid zone and overlapping with an ingredient
            if (this.characterManager.isInZone(this.characterManager.chef, this.characterManager.chef.currentZone)) {
                this.ingredientManager.handleIngredientPickup(
                    this.characterManager.chef, 
                    this.characterManager.chef.currentZone
                );
            }
        }
    }

    handleChefDropOffAttempt() {
        const heldIngredient = this.characterManager.chef.heldIngredient;
        if (!heldIngredient) return;

        // Special case for ready table - only allow completed meals
        if (this.characterManager.activeZoneOverlaps.chef.has('readyTable') && heldIngredient.isCompletedMeal) {
            this.dropOffAtReadyTable();
            return;
        }

        // Handle trash disposal first
        if (this.characterManager.activeZoneOverlaps.chef.has('leftTrash')) {
            this.handleTrashDisposal(this.characterManager.chef);
            return;
        }
        // Then handle other zones
        if (this.characterManager.chef.currentZone) {
            this.ingredientManager.handleIngredientDropOff(this.characterManager.chef, this.characterManager.chef.currentZone);
        }
    }

    pickupCompletedMeal() {
        // Cancel penalty timer
        if (this.pickupTimer) {
            this.pickupTimer.remove();
        }

        if (!this.cookingResult) return;

        const completedRecipeName = this.cookingResult.recipeName;
        
        this.characterManager.chef.heldIngredient = {
            name: completedRecipeName,
            gameObject: this.cookingResult,
            isCompletedMeal: true,  // Mark as completed meal
            points: this.cookingResult.points
        };
        this.cookingResult = null;

        // Award points
        this.addPoints(40); // Default points or use this.cookingResult.points
    }

    handleSousChefInteraction() {
        if (!this.characterManager.sousChef.heldIngredient) {
            this.handleSousChefPickupAttempt();
        } else {
            this.handleSousChefDropOffAttempt();
        }
    }

    handleSousChefPickupAttempt() {
        // Don't pick up if already holding something
        if (this.characterManager.sousChef.heldIngredient) return;

        // Try to pick up from current zone
        if (this.characterManager.sousChef.currentZone) {
            // Sous chef can only pick up from sidebar and divider
            if (!['sidebar', 'divider'].includes(this.characterManager.sousChef.currentZone)) return;

            // Check if we're in a valid zone and overlapping with an ingredient
            if (this.characterManager.isInZone(this.characterManager.sousChef, this.characterManager.sousChef.currentZone)) {
                this.ingredientManager.handleIngredientPickup(
                    this.characterManager.sousChef, 
                    this.characterManager.sousChef.currentZone
                );
            }
        }
    }

    handleSousChefDropOffAttempt() {
        // If sous chef is in cutting board zone and has an ingredient, start cutting
        if (this.characterManager.activeZoneOverlaps.sousChef.has('cuttingBoard')) {
            if (this.characterManager.sousChef.heldIngredient && !this.cuttingManager.isCutting) {
                this.cuttingManager.startCuttingTimer(this.characterManager.sousChef);
            }
            return;
        }

        // Only allow dropping in right trash or divider
        if (this.characterManager.sousChef.currentZone) {
            if (this.characterManager.sousChef.currentZone === 'rightTrash') {
                this.handleTrashDisposal(this.characterManager.sousChef);
            }
            if (this.characterManager.sousChef.currentZone === 'divider') {
                this.ingredientManager.handleIngredientDropOff(
                    this.characterManager.sousChef,
                    'divider'
                );
            }         
        }
    }

    handleTrashDisposal(character) {
        if (!character.heldIngredient) return; // Guard clause
    
        const ingredientX = character.heldIngredient.gameObject.x;
        const ingredientY = character.heldIngredient.gameObject.y;
    
        // Clean up all ingredient visuals and properties
        if (character.heldIngredient.gameObject) {
            character.heldIngredient.gameObject.destroy();
        }
        if (character.heldIngredient.interactiveZone) {
            character.heldIngredient.interactiveZone.destroy();
        }
        if (character.heldIngredient.debugVisual) {
            character.heldIngredient.debugVisual.destroy();
        }
        if (character.heldIngredient.debugText) {
            character.heldIngredient.debugText.destroy();
        }
    
        // Clear the reference immediately
        character.heldIngredient = null;
    
        // Apply score penalty
        this.score -= 5;
        this.scoreText.setText(`Score: ${this.score}`);
    
        // Create visual effects after cleanup
        this.createTrashEffect(ingredientX, ingredientY);
    }
    
    createTrashEffect(x, y) {
        // Create the "-10" text effect
        const penaltyText = this.add.text(x, y, '-5', {
            fontSize: '32px',
            fontWeight: 'bold',
            fill: '#FF0000'
        }).setOrigin(0.5);
    
        // Simple red flash
        const flash = this.add.rectangle(x, y, 50, 50, 0xff0000)
            .setAlpha(0.7)
            .setOrigin(0.5);
    
        // Animate the text
        this.tweens.add({
            targets: penaltyText,
            y: y - 100,
            alpha: 0,
            duration: 1000,
            ease: 'Power1',
            onComplete: () => penaltyText.destroy()
        });
    
        // Animate the flash
        this.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 300,
            onComplete: () => flash.destroy()
        });
    
        // If you have the particle texture loaded, add particles
        if (this.textures.exists('particle')) {
            const particles = this.add.particles('particle');
            
            particles.createEmitter({
                x: x,
                y: y,
                speed: { min: -100, max: 100 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.5, end: 0 },
                alpha: { start: 1, end: 0 },
                lifespan: 500,
                quantity: 10,
                tint: 0xff0000
            });
        
            // Clean up particles
            this.time.delayedCall(600, () => {
                particles.destroy();
            });
        }
    
        // Add camera shake
        this.cameras.main.shake(200, 0.005);
    }
//destroy addpoint visuals after 3 seconds

    addPoints(points) {
        this.score += points;
        this.scoreText.setText(`Score: ${this.score}`);
        
        // Create more dramatic floating score text
        const floatingText = this.add.text(
            this.characterManager.chef.x,
            this.characterManager.chef.y - 50,
            `+${points}`,
            { 
                fontSize: '36px',
                fontWeight: 'bold',
                fill: '#00ff00',
                stroke: '#000000',
                strokeThickness: 4,
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 2,
                    fill: true
                }
            }
        ).setOrigin(0.5).setScale(0.5);

        // Create a star burst effect
        const starBurst = this.add.particles('particle');
        const burstEmitter = starBurst.createEmitter({
            x: this.characterManager.chef.x,
            y: this.characterManager.chef.y - 30,
            speed: { min: 100, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.6, end: 0 },
            lifespan: 800,
            quantity: 10,
            tint: 0xffff00
        });

        // Animate the floating text with scale effect
        this.tweens.add({
            targets: floatingText,
            scaleX: 1.5,
            scaleY: 1.5,
            y: floatingText.y - 80,
            alpha: 0,
            duration: 1200,
            ease: 'Power2',
            onComplete: () => {
                floatingText.destroy();
                starBurst.destroy();
            }
        });

        // Flash the score display
        const originalColor = this.scoreText.style.color;
        this.scoreText.setColor('#00ff00');
        this.time.delayedCall(200, () => {
            this.scoreText.setColor(originalColor);
        });
        this.time.delayedCall(3000, () => {
            floatingText.destroy();
            starBurst.destroy();
        });
    }

    checkRecipeCompletion() {
        if (!this.currentRecipe) return false;

        const requiredIngredients = this.currentRecipe.ingredients;
        const placedIngredients = this.placedIngredients.cookingStation.map(ing => ing.name);

        // Check if all required ingredients are in the cooking station
        return requiredIngredients.every(ingredient => placedIngredients.includes(ingredient));
    }

    completeRecipe() {
        // Show completed meal image
        this.cookingResult = this.add.image(
            this.zoneManager.getZone('cookingStation').x + this.zoneManager.getZone('cookingStation').width / 2,
            this.zoneManager.getZone('cookingStation').y + this.zoneManager.getZone('cookingStation').height / 2,
            this.currentRecipe.result
        )
        .setOrigin(0.5)
        .setScale(0.5);

        // Clear current ingredients
        this.clearCookingStation();

        // Initialize pickup timer
        this.initializePickupTimer();

        // Move to next recipe immediately
        this.cycleToNextRecipe();
    }

    clearCookingStation() {
        this.placedIngredients.cookingStation.forEach(ingredient => {
            ingredient.gameObject.destroy();
        });
        this.placedIngredients.cookingStation = [];
    }

    initializePickupTimer() {
        const PENALTY_TIME = 10000; // 10 seconds in milliseconds
        const PENALTY_POINTS = 20;

        const penaltyText = this.add.text(
            this.cookingResult.x,
            this.cookingResult.y - 50,
            '10',
            { fontSize: '20px', fill: '#ff0000' }
        ).setOrigin(0.5);

        // Create a precise timer using Phaser's built-in timer
        this.pickupTimer = this.time.delayedCall(PENALTY_TIME, () => {
            this.handleMissedPickup(penaltyText, PENALTY_POINTS);
        }, [], this);

        // Update countdown text
        this.time.addEvent({
            delay: 1000,
            repeat: 9,
            callback: () => {
                const remaining = Math.ceil((PENALTY_TIME - this.pickupTimer.getElapsed()) / 1000);
                penaltyText.setText(remaining.toString());
            }
        });
    }

    handleMissedPickup(penaltyText, penaltyPoints) {
        // Apply penalty
        this.score -= penaltyPoints;
        this.scoreText.setText(`Score: ${this.score}`);

        // Clean up
        penaltyText.destroy();
        if (this.cookingResult) {
            this.cookingResult.destroy();
            this.cookingResult = null;
        }

        // Visual feedback for penalty
        this.createPenaltyEffect();
    }

    createPenaltyEffect() {
        // Create a more intense flash effect
        const penaltyFlash = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            this.cameras.main.width,
            this.cameras.main.height,
            0xff0000
        ).setAlpha(0);

        // Add warning text
        const warningText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            'TIME PENALTY!',
            { 
                fontSize: '48px', 
                fontWeight: 'bold',
                fill: '#ff0000',
                stroke: '#ffffff',
                strokeThickness: 6
            }
        ).setOrigin(0.5).setAlpha(0);

        // Create multiple flash sequences
        this.tweens.add({
            targets: [penaltyFlash, warningText],
            alpha: 0.5,
            duration: 150,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                penaltyFlash.destroy();
                warningText.destroy();
            }
        });

        // Shake the camera
        this.cameras.main.shake(300, 0.005);
    }

    cycleToNextRecipe() {
        const recipeIndex = (this.recipes.indexOf(this.currentRecipe) + 1) % this.recipes.length;
        this.currentRecipe = this.recipes[recipeIndex];
        
        // Animate recipe transition
        if (this.recipeDisplay) {
            this.tweens.add({
                targets: this.recipeDisplay,
                alpha: 0,
                duration: 150,
                onComplete: () => {
                    this.recipeDisplay.setTexture(this.currentRecipe.image);
                    this.tweens.add({
                        targets: this.recipeDisplay,
                        alpha: 1,
                        duration: 150
                    });
                }
            });
        }
    }

    dropOffAtReadyTable() {
        if (!this.characterManager.chef.heldIngredient) return;
        
        const meal = this.characterManager.chef.heldIngredient;
        
        // Clear the chef's held ingredient before the tween
        this.characterManager.chef.heldIngredient = null;
    
        // Place the meal at the ready table
        if (meal.gameObject && meal.gameObject.active) {
            const readyTable = this.zoneManager.getZone('readyTable');
            meal.gameObject.setPosition(
                readyTable.x + readyTable.width / 2,
                readyTable.y + readyTable.height / 2
            );
        
            this.tweens.add({
                targets: meal.gameObject,
                alpha: 0,
                duration: 1500,
                onComplete: () => {
                    if (meal.gameObject && meal.gameObject.active) {
                        meal.gameObject.destroy();
                    }
                }
            });
        }
    
        // Add points to the score
        this.addPoints(meal.points || 40);
    }

    handleResize(gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;
        
        // Resize background
        if (this.background) {
            this.background.setDisplaySize(width, height);
            this.background.setPosition(width / 2, height / 2);
        }
        
        // Update UI elements positions
        if (this.timeText) {
            this.timeText.setPosition(width / 2, height - 40);
        }
        if (this.scoreText) {
            this.scoreText.setPosition(width / 2, height - 80);
        }
        
        // Recalculate game zones
        const dividerWidth = 250;
        const dividerX = (width - dividerWidth) / 2;
        
        if (this.zoneManager) {
            this.zoneManager.updateZones(width, height, dividerWidth, dividerX);
        }
        
        // Update recipe display position if it exists
        if (this.recipeManager) {
            this.recipeManager.updateDisplayPosition(
                this.zoneManager.getZone('divider').x + this.zoneManager.getZone('divider').width / 2,
                200
            );
        }
        
        // Update camera
        this.cameras.main.setSize(width, height);
    }

    shutdown() {
        // Clean up resize listener when scene shuts down
        this.scale.removeListener('resize', this.handleResize);
        // ... any other existing shutdown code ...
    }
}