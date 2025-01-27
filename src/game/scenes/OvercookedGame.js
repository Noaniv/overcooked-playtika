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
        this.score = 0;
        
        // Initialize managers
        this.recipeManager = null;
        this.ingredientManager = null;
        this.characterManager = null;
        this.zoneManager = null;
        this.cuttingManager = null;
        this.cookingManager = null;
    }

    create() {
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

        EventBus.emit('current-scene-ready', this);
        EventBus.emit('scene-changed', 'OvercookedGame');
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
                    this.cuttingManager.handleCuttingBoardDropoff(chef, chef.currentZone);
                } else if (this.ingredientManager.placedIngredients[chef.currentZone].length > 0) {
                    this.cuttingManager.startCuttingTimer(chef);
                }
            } else {
                this.handlePickupAttempt(chef);
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
                    this.cuttingManager.handleCuttingBoardDropoff(sousChef, sousChef.currentZone);
                } else if (this.ingredientManager.placedIngredients[sousChef.currentZone].length > 0) {
                    this.cuttingManager.startCuttingTimer(sousChef);
                }
            } else {
                this.handlePickupAttempt(sousChef);
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

    handlePickupAttempt(character) {
        // If holding an ingredient
        if (character.heldIngredient) {
            // Check if at ready table with completed meal
            if (character.currentZone === 'readyTable' && character.heldIngredient.isCompletedMeal) {
                this.handleReadyTableDropoff(character);
                return;
            }
            // Check if at trash
            if (character.currentZone === 'leftTrash' || character.currentZone === 'rightTrash') {
                this.ingredientManager.handleTrashDisposal(character);
            }
            // Check if at either cutting board
            else if (character.currentZone === 'cuttingBoard' || character.currentZone === 'leftCuttingBoard') {
                this.cuttingManager.handleCuttingBoardDropoff(character, character.currentZone);
            } else if (character.currentZone === 'cookingStation') {
                this.ingredientManager.handleCookingStationDropoff(character);
            } else if (character.currentZone === 'divider') {
                this.ingredientManager.handleDividerDropoff(character);
            }
        } else {
            // Try to pick up from zones
            if (character.currentZone) {
                this.ingredientManager.handleIngredientPickup(character, character.currentZone);
            }
        }
    }

    handleReadyTableDropoff(character) {
        if (!character.heldIngredient || !character.heldIngredient.isCompletedMeal) return;

        const readyTable = this.zoneManager.getZone('readyTable');
        if (!readyTable) return;

        const meal = character.heldIngredient;
        
        // Clear the character's held ingredient first
        character.heldIngredient = null;

        // Position the meal at the ready table
        meal.gameObject.setPosition(
            readyTable.x + readyTable.width / 2,
            readyTable.y + readyTable.height / 2
        );

        // Add points and create effect
        this.addPoints(meal.points || 50);
        this.ingredientManager.createSuccessEffect(meal.gameObject.x, meal.gameObject.y, meal.points || 50);

        // Fade out and destroy the meal
        this.tweens.add({
            targets: meal.gameObject,
            alpha: 0,
            duration: 1500,
            ease: 'Power1',
            onComplete: () => {
                meal.gameObject.destroy();
            }
        });
    }

    addPoints(points) {
        this.score += points;
        EventBus.emit('score-updated', this.score);
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

    createPenaltyEffect(x, y, points) {
        // Simple text effect
        const penaltyText = this.add.text(x, y, `-${points}`, {
            fontSize: '24px',
            fontWeight: 'bold',
            fill: '#FF4D4D'
        }).setOrigin(0.5);

        // Subtle fade-up animation
        this.tweens.add({
            targets: penaltyText,
            y: y - 50,
            alpha: 0,
            duration: 800,
            ease: 'Power1',
            onComplete: () => penaltyText.destroy()
        });

        // Small flash effect
        const flash = this.add.rectangle(x, y, 40, 40, 0xff0000)
            .setAlpha(0.3)
            .setOrigin(0.5);

        this.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 1.5,
            duration: 200,
            onComplete: () => flash.destroy()
        });

        // Optional: Very subtle camera shake
        this.cameras.main.shake(150, 0.02);

        // Play a softer sound effect
        const trashSound = this.sound.add('trashDisposalSound');
        trashSound.play({ volume: 0.2 });
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

    shutdown() {
        // Clean up managers
        if (this.cookingManager) {
            this.cookingManager.cleanup();
        }

        // Clean up scene change
        EventBus.emit('scene-changed', null);
    }
}