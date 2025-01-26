import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { CharacterManager } from '../managers/CharacterManager';
import { CookingManager } from '../managers/CookingManager';
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
        this.cookingManager = null;
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
        this.cookingManager = new CookingManager(this);

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
        const ingredientConfigs = [
            { name: 'Tortilla', x: width - 70, y: 200, scale: .9 },
            { name: 'Cheese', x: width -70, y: 310, scale: .9 },
            { name: 'Meat', x: 200, y: 90, scale: 1 },
            { name: 'Tomato', x: width -70, y: 430, scale: .8 },
            { name: 'Avocado', x: width -70, y: 560, scale: .9 }
        ];
        this.ingredientManager.initializeIngredients(ingredientConfigs);

        // Set up collisions after both zones and characters are created
        this.zoneManager.setupCollisions(this.characterManager);

        // Set up controls
        this.setupControls();

        // Start game timer immediately since countdown is handled in previous scene
        this.startGameTimer();

        // Start the recipe manager at the end of create
        this.recipeManager.start();

        // Create UI container in the sidebar
        this.createSidebarUI(width, height);

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

        // Chef controls
        this.input.keyboard.on('keydown-E', () => {
            const chef = this.characterManager.getCharacter('chef');
            const isAtCuttingBoard = chef.currentZone === 'cuttingBoard' || 
                                    chef.currentZone === 'leftCuttingBoard';

            if (isAtCuttingBoard) {
                if (chef.heldIngredient) {
                    // Drop off ingredient first
                    this.ingredientManager.dropInCuttingBoard(chef, chef.currentZone);
                    // Then start cutting
                    this.cuttingManager.startCuttingTimer(chef);
                } else if (this.ingredientManager.placedIngredients[chef.currentZone].length > 0) {
                    // If there's already an ingredient on the board, start cutting
                    this.cuttingManager.startCuttingTimer(chef);
                }
            } else {
                this.handleChefInteraction();
            }
        });
        
        this.input.keyboard.on('keyup-E', () => {
            if (this.cuttingManager.isCutting) {
                this.cuttingManager.failCutting();
            }
        });

        // Sous Chef controls
        this.input.keyboard.on('keydown-SPACE', () => {
            const sousChef = this.characterManager.getCharacter('sousChef');
            const isAtCuttingBoard = sousChef.currentZone === 'cuttingBoard' || 
                                    sousChef.currentZone === 'leftCuttingBoard';

            if (isAtCuttingBoard) {
                if (sousChef.heldIngredient) {
                    // Drop off ingredient first
                    this.ingredientManager.dropInCuttingBoard(sousChef, sousChef.currentZone);
                    // Then start cutting
                    this.cuttingManager.startCuttingTimer(sousChef);
                } else if (this.ingredientManager.placedIngredients[sousChef.currentZone].length > 0) {
                    // If there's already an ingredient on the board, start cutting
                    this.cuttingManager.startCuttingTimer(sousChef);
                }
            } else {
                this.handleSousChefInteraction();
            }
        });
        
        this.input.keyboard.on('keyup-SPACE', () => {
            if (this.cuttingManager.isCutting) {
                this.cuttingManager.failCutting();
            }
        });
    }

    update(time, delta) {
        this.characterManager.handleMovement(this.keys);

        // Update cutting manager
        this.cuttingManager.update(time, delta);
    }

    startGameTimer() {
        let timeLeft = 120; // 2 minutes in seconds
        
        this.gameTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (!this.scene || !this.scene.isActive('OvercookedGame')) {
                    if (this.gameTimer) {
                        this.gameTimer.remove();
                    }
                    return;
                }
                
                timeLeft--;
                // Emit time update only if scene is still active
                if (timeLeft >= 0) {
                    EventBus.emit('time-updated', timeLeft);
                }
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
        const chef = this.characterManager.getCharacter('chef');
        
        // If holding an ingredient
        if (chef.heldIngredient) {
            // Check if at trash
            if (chef.currentZone === 'leftTrash' || chef.currentZone === 'rightTrash') {
                this.ingredientManager.handleTrashDisposal(chef);
            }
            // Check if at either cutting board
            else if (chef.currentZone === 'cuttingBoard' || chef.currentZone === 'leftCuttingBoard') {
                this.ingredientManager.handleCuttingBoardDropoff(chef, chef.currentZone);
            } else if (chef.currentZone === 'divider') {
                this.ingredientManager.handleDividerDropoff(chef);
            } else if (chef.currentZone === 'cookingStation') {
                this.ingredientManager.handleCookingStationDropoff(chef);
            }
        } else {
            // Try to pick up from zones
            if (chef.currentZone) {
                this.ingredientManager.handleIngredientPickup(chef, chef.currentZone);
            }
        }
    }

    handleSousChefInteraction() {
        const sousChef = this.characterManager.getCharacter('sousChef');
        
        // If holding an ingredient
        if (sousChef.heldIngredient) {
            // Check if at trash
            if (sousChef.currentZone === 'leftTrash' || sousChef.currentZone === 'rightTrash') {
                this.ingredientManager.handleTrashDisposal(sousChef);
            }
            // Check if at either cutting board
            else if (sousChef.currentZone === 'cuttingBoard' || sousChef.currentZone === 'leftCuttingBoard') {
                this.ingredientManager.handleCuttingBoardDropoff(sousChef, sousChef.currentZone);
            } else if (sousChef.currentZone === 'divider') {
                this.ingredientManager.handleDividerDropoff(sousChef);
            } else if (sousChef.currentZone === 'cookingStation') {
                this.ingredientManager.handleCookingStationDropoff(sousChef);
            }
        } else {
            // Try to pick up from zones
            if (sousChef.currentZone) {
                this.ingredientManager.handleIngredientPickup(sousChef, sousChef.currentZone);
            }
        }
    }

    handleChefPickupAttempt() {
        const chef = this.characterManager.getCharacter('chef');
        // Don't pick up if already holding something
        if (chef.heldIngredient) return;

        // First priority: Check for completed meal pickup
        if (this.cookingResult && this.characterManager.activeZoneOverlaps.get('chef').has('cookingStation')) {
            this.pickupCompletedMeal(chef);
            return;
        }

        // Try to pick up from current zone
        if (chef.currentZone) {
            // Check if we're in a valid zone and overlapping with an ingredient
            if (this.characterManager.isInZone(chef, chef.currentZone)) {
                this.ingredientManager.handleIngredientPickup(
                    chef, 
                    chef.currentZone
                );
            }
        }
    }

    handleChefDropOffAttempt(chef) {
        const heldIngredient = chef.heldIngredient;
        if (!heldIngredient) return;

        // If in cutting board zone, start cutting
        if (this.characterManager.activeZoneOverlaps.get('chef').has('cuttingBoard')) {
            this.ingredientManager.handleIngredientDropOff(chef, 'cuttingBoard');
            return;
        }

        // Special case for ready table - only allow completed meals
        if (this.characterManager.activeZoneOverlaps.get('chef').has('readyTable') && heldIngredient.isCompletedMeal) {
            this.dropOffAtReadyTable(chef);
            return;
        }

        // Handle trash disposal
        if (this.characterManager.activeZoneOverlaps.get('chef').has('leftTrash') || 
            this.characterManager.activeZoneOverlaps.get('chef').has('rightTrash')) {
            this.handleTrashDisposal(chef);
            return;
        }

        // Handle other zones
        if (chef.currentZone) {
            this.ingredientManager.handleIngredientDropOff(chef, chef.currentZone);
        }
    }

    pickupCompletedMeal(chef) {
        // Cancel penalty timer
        if (this.pickupTimer) {
            this.pickupTimer.remove();
        }

        if (!this.cookingResult) return;

        const completedRecipeName = this.cookingResult.recipeName;
        
        chef.heldIngredient = {
            name: completedRecipeName,
            gameObject: this.cookingResult,
            isCompletedMeal: true,  // Mark as completed meal
            points: this.cookingResult.points
        };
        this.cookingResult = null;

        // Award points
        this.addPoints(40); // Default points or use this.cookingResult.points
    }

    handleSousChefPickupAttempt() {
        const sousChef = this.characterManager.getCharacter('sousChef');
        // Don't pick up if already holding something
        if (sousChef.heldIngredient) return;

        // First priority: Check for completed meal pickup
        if (this.cookingResult && this.characterManager.activeZoneOverlaps.get('sousChef').has('cookingStation')) {
            this.pickupCompletedMeal(sousChef);
            return;
        }

        // Try to pick up from current zone
        if (sousChef.currentZone) {
            // Check if we're in a valid zone and overlapping with an ingredient
            if (this.characterManager.isInZone(sousChef, sousChef.currentZone)) {
                this.ingredientManager.handleIngredientPickup(
                    sousChef, 
                    sousChef.currentZone
                );
            }
        }
    }

    handleSousChefDropOffAttempt(sousChef) {
        const heldIngredient = sousChef.heldIngredient;
        if (!heldIngredient) return;

        // If in cutting board zone, start cutting
        if (this.characterManager.activeZoneOverlaps.get('sousChef').has('cuttingBoard')) {
            this.ingredientManager.handleIngredientDropOff(sousChef, 'cuttingBoard');
            return;
        }

        // Handle trash disposal
        if (this.characterManager.activeZoneOverlaps.get('sousChef').has('leftTrash') || 
            this.characterManager.activeZoneOverlaps.get('sousChef').has('rightTrash')) {
            this.handleTrashDisposal(sousChef);
            return;
        }

        // Handle other zones
        if (sousChef.currentZone) {
            this.ingredientManager.handleIngredientDropOff(sousChef, sousChef.currentZone);
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
        // Emit score update after penalty
        EventBus.emit('score-updated', this.score);
        
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

    addPoints(points) {
        this.score += points;
        EventBus.emit('score-updated', this.score);
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
        // Emit score update after penalty
        EventBus.emit('score-updated', this.score);

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

        // Emit recipe updated event
        EventBus.emit('recipe-updated', this.currentRecipe.name);
    }

    dropOffAtReadyTable(chef) {
        const heldIngredient = chef.heldIngredient;
        if (!heldIngredient) return;
        
        const meal = heldIngredient;
        
        // Clear the chef's held ingredient before the tween
        chef.heldIngredient = null;

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
        
        // Recalculate game zones
        const dividerWidth = 250;
        const dividerX = (width - dividerWidth) / 2;
        
        if (this.zoneManager) {
            this.zoneManager.updateZones(width, height, dividerWidth, dividerX);
        }
        
        // Update camera
        this.cameras.main.setSize(width, height);
    }

    shutdown() {
        // Remove event listeners first
        EventBus.off('time-updated', this.updateTimeHandler);
        EventBus.off('score-updated', this.updateScoreHandler);
        EventBus.off('recipe-updated', this.updateRecipeHandler);

        // Clean up UI elements
        if (this.timeText) {
            this.timeText.destroy();
            this.timeText = null;
        }
        if (this.scoreText) {
            this.scoreText.destroy();
            this.scoreText = null;
        }
        if (this.recipeDisplay) {
            this.recipeDisplay.destroy();
            this.recipeDisplay = null;
        }

        // Clean up resize listener
        this.scale.removeListener('resize', this.handleResize);
        
        // Clean up managers
        if (this.cookingManager) {
            this.cookingManager.cleanup();
        }
    }

    createSidebarUI(width, height) {
        // Create container for UI elements in sidebar
        const sidebar = this.add.container(width - 120, 10);

        // Add background for UI elements
        const uiBackground = this.add.rectangle(0, 0, 110, 160, 0x000000, 0.3)
            .setOrigin(0, 0);
        sidebar.add(uiBackground);

        // Add timer
        const timerLabel = this.add.text(10, 10, 'Time:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0);
        
        this.timeText = this.add.text(65, 10, '120', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0);

        // Add score
        const scoreLabel = this.add.text(10, 40, 'Score:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0);
        
        this.scoreText = this.add.text(65, 40, '0', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0);

        // Add recipe section
        const recipeLabel = this.add.text(10, 70, 'Recipe:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0);

        // Recipe display will be added by RecipeManager
        this.recipeDisplay = this.add.image(-55, 770, 'guacamole_recipe')
            .setScale(0.3)
            .setOrigin(0.5);
        this.recipeManager.cycleToNextRecipe();

        // Add all elements to sidebar
        sidebar.add([timerLabel, this.timeText, scoreLabel, this.scoreText, recipeLabel, this.recipeDisplay]);

        // Store bound event handlers
        this.updateTimeHandler = this.updateTime.bind(this);
        this.updateScoreHandler = this.updateScore.bind(this);
        this.updateRecipeHandler = this.updateRecipe.bind(this);

        // Set up event listeners with bound handlers
        EventBus.on('time-updated', this.updateTimeHandler);
        EventBus.on('score-updated', this.updateScoreHandler);
        EventBus.on('recipe-updated', this.updateRecipeHandler);
    }

    // Separate methods for event handling
    updateTime(time) {
        if (this.timeText && this.timeText.active && !this.timeText.destroyed) {
            try {
                this.timeText.setText(time.toString());
            } catch (error) {
                console.warn('Error updating time text:', error);
            }
        }
    }

    updateScore(score) {
        if (this.scoreText && this.scoreText.active && !this.scoreText.destroyed) {
            try {
                this.scoreText.setText(score.toString());
            } catch (error) {
                console.warn('Error updating score text:', error);
            }
        }
    }

    updateRecipe(recipeData) {
        if (this.recipeDisplay && this.recipeDisplay.active && !this.recipeDisplay.destroyed && this.scene) {
            try {
                // Default to placeholder if no recipe data
                if (!recipeData) {
                    this.recipeDisplay.setTexture('guacamole_recipe');
                    return;
                }

                // Get the image name directly from the recipe data
                const textureName = recipeData.image;
                
                // Log for debugging
                console.log('Updating recipe display:', {
                    recipeData,
                    textureName,
                    exists: this.textures.exists(textureName)
                });

                // Only set texture if it exists
                if (this.textures.exists(textureName)) {
                    this.recipeDisplay.setTexture(textureName);
                    this.recipeDisplay.setScale(0.4); // Ensure consistent scale
                } else {
                    console.warn(`Recipe texture "${textureName}" not found, using default`);
                    this.recipeDisplay.setTexture('guacamole_recipe');
                }
            } catch (error) {
                console.warn('Error updating recipe display:', error);
            }
        }
    }
}