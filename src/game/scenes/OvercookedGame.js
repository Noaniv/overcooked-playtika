import { Scene } from 'phaser';
import { EventBus } from '../EventBus';


export class OvercookedGame extends Scene {
    constructor() {
        super('OvercookedGame');

        this.chef = null;
        this.sousChef = null;
        this.zones = {};
        this.placedIngredients = {
            divider: [],
            cookingStation: [],
            cuttingBoard: []
        };
        this.isCutting = false;
        this.cuttingTimer = null;
        this.cuttingProgress = null;
        this.spaceKeyIsDown = false;
        this.despawnTimers = new Map();
        this.gameTimer = null;
        this.timeText = null;
        this.score = 0;
        this.scoreText = null;

        this.recipes = [
            {
                name: 'Taco',
                image: 'taco_recipe',
                result: 'taco_complete',
                ingredients: ['Tortilla', 'Cheese', 'Tomato'],
                points: 40
            },
            {
                name: 'Burrito',
                image: 'burrito_recipe',
                result: 'burrito_complete',
                ingredients: ['Tortilla', 'Meat', 'Tomato'],
                points: 40
            },
            {
                name: 'Chips and Guac',
                image: 'chipsandguac_recipe',
                result: 'chipsandguac_complete',
                ingredients: ['Tortilla', 'Avocado', 'Tomato'],
                points: 40
            },
            {
                name: 'Guacamole',
                image: 'guacamole_recipe',
                result: 'guacamole_complete',
                ingredients: ['Tortilla', 'Avocado', 'Tomato'],
                points: 40
            }
        ];
    
        // Recipe state variables
        this.currentRecipe = null;
        this.recipeDisplay = null;
        this.cookingResult = null;
    }

    create() {

    const width = this.scale.width;
    const height = this.scale.height;
    const dividerWidth = 150;  // Changed back to 150 from 350
    const dividerX = (width - dividerWidth) / 2;

    this.zones = {
        sidebar: { x: width - 100, y: 0, width: 100, height: height },
        divider: { x: dividerX, y: 0, width: dividerWidth, height: height},
        cookingStation: { x: 0, y: -133, width: 439, height: 420 },  // Added x offset
        cuttingBoard: { x: dividerX + dividerWidth, y: -160, width: 339, height: 473 },  // Adjusted x position
        leftTrash: { x: 50, y: height - 85, width: 80, height: 80 },
        rightTrash: { x: width - 130, y: height - 85, width: 80, height: 80 },
        readyTable: { x: -250, y: height - 420, width: 600, height: 390 }
    };

// Create all game zones
Object.entries(this.zones).forEach(([key, zone]) => {
    switch (key) {
        case 'sidebar':
            this.add.rectangle(zone.x, zone.y, zone.width, zone.height, 0xffc0cb)
                .setOrigin(0)
                .setInteractive();
            break;
        case 'divider':
            this.add.rectangle(zone.x, zone.y, zone.width, zone.height, 0x808080)
                .setOrigin(0)
                .setInteractive();
            break;
        case 'cookingStation':
            const cookingStation = this.add.image(zone.x, zone.y, 'cookingStation')
                .setOrigin(0)
                .setDisplaySize(zone.width, zone.height)
                .setInteractive();
            break;
        case 'cuttingBoard':
            const cuttingBoard = this.add.image(zone.x, zone.y, 'cuttingBoard')
                .setOrigin(0)
                .setDisplaySize(zone.width, zone.height)
                .setInteractive();
            break;
        case 'leftTrash':
        case 'rightTrash':
            this.add.image(zone.x, zone.y, 'trash')
                .setOrigin(0)
                .setDisplaySize(zone.width, zone.height)
                .setInteractive();
            break;
            case 'readyTable':
                const readyTable = this.add.image(zone.x, zone.y, 'readyTable')
                    .setOrigin(0)
                    .setDisplaySize(zone.width, zone.height)
                    .setInteractive();
                break;
    }
});
        // Create chef and sous-chef
    this.chef = this.add.image(50, height / 4, 'ChefImage')
    .setOrigin(0)
    .setDisplaySize(130, 150)
    .setInteractive();
    this.chef.width = 130;  // Explicitly set width
    this.chef.height = 150; // Explicitly set height
    this.chef.heldIngredient = null;

    this.sousChef = this.add.image(
        dividerX + dividerWidth + 50,
        height / 4,
        'Sous_chefImage'
    ).setOrigin(0)
        .setDisplaySize(110, 120)
        .setInteractive();
    this.sousChef.width = 110;  // Explicitly set width
    this.sousChef.height = 120; // Explicitly set height
    this.sousChef.heldIngredient = null;

        // Create ingredients
        this.ingredients = [
            { name: 'Avocado', x: this.zones.sidebar.x + 60, y: 50 },
            { name: 'Meat', x: this.zones.sidebar.x + 60, y: 175 },
            { name: 'Tomato', x: this.zones.sidebar.x + 60, y: 300 },
            { name: 'Cheese', x: this.zones.sidebar.x + 60, y: 425 },
            { name: 'Tortilla', x: this.zones.sidebar.x + 60, y: 550 }
        ].map(ing => {
            const image = this.add.image(ing.x, ing.y, `${ing.name.toLowerCase()}1`)
                .setInteractive()
                .setScale(0.3);
        
            return { ...ing, gameObject: image };
        });
        

        // Display current recipe at the top of the divider
    this.currentRecipe = this.recipes[0]; // Start with the first recipe
    this.recipeDisplay = this.add.image(this.zones.divider.x + this.zones.divider.width / 2, 200, this.currentRecipe.image)
        .setOrigin(0.5)
        .setScale(0.4); // Adjust scale as needed


        // Set up controls
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

        // Add event listeners
        this.input.keyboard.on('keydown-E', () => this.handleChefInteraction());
        this.input.keyboard.on('keydown-SPACE', () => this.handleSousChefInteraction());
        this.input.keyboard.on('keyup-SPACE', () => {
            this.spaceKeyIsDown = false;
            if (this.isCutting) {
                if (this.sousChef.heldIngredient) {
                    this.score -= 5;  // Penalty for interrupting cutting
                    this.scoreText.setText(`Score: ${this.score}`);
                    
                    this.sousChef.heldIngredient.gameObject.destroy();
                    this.sousChef.heldIngredient = null;
                }
                this.cleanupCuttingTimer();
            }
        });


        this.startGameTimer();
    }


    startGameTimer() {
        let timeLeft = 100; // 2 minutes in seconds
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
        EventBus.emit('current-scene-ready', this);
    }
    
    
    endGame(){
    this.scene.start('GameOver', { score: this.score });
    }    

    // Helper function for checking proximity (adjusted for full height interaction)
isNearZone(player, zone, radius = 60) {
    if (zone === this.zones.cuttingBoard) {
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

    handleIngredientPickup(player, ingredient, zoneKey) {
        const timer = this.despawnTimers.get(ingredient.gameObject);
        if (timer) {
            timer.remove();
            this.despawnTimers.delete(ingredient.gameObject);
        }
        this.pickUpIngredient(player, ingredient);
        this.placedIngredients[zoneKey] = this.placedIngredients[zoneKey].filter(ing => ing !== ingredient);
        ingredient.gameObject.destroy();
        if (ingredient.timeText) ingredient.timeText.destroy();
    }

    pickUpIngredient(player, ingredient) {
        if (!player.heldIngredient && ingredient) {
            // Get the current texture key of the ingredient
            const textureKey = ingredient.gameObject.texture.key;
            
            const newIngredient = {
                name: ingredient.name,
                gameObject: this.add.image(
                    player.x + player.width / 2,
                    player.y - 20,
                    textureKey  // Use the same texture as the source ingredient
                ).setInteractive()
                .setScale(0.3)
            };
    
            player.heldIngredient = newIngredient;
            return true;
        }
        return false;
    }
    
    // Updated dropOffIngredient function
    dropOffIngredient(player, zone) {
        if (!player.heldIngredient) return false;
    
        const dropPosition = this.getDropPosition(zone, player);
        const zoneKey = Object.keys(this.zones).find(key => this.zones[key] === zone);
        
        if (zoneKey && this.placedIngredients[zoneKey]) {
            const newIngredient = { 
                name: player.heldIngredient.name,
                gameObject: player.heldIngredient.gameObject,
                x: dropPosition.x, 
                y: dropPosition.y
            };
    
            // Only add timer for divider zone
            if (zoneKey === 'divider') {
                newIngredient.timeText = this.add.text(dropPosition.x, dropPosition.y - 40, '10', { 
                    fontSize: '20px', 
                    fill: '#ff0000',
                    fontStyle: 'bold',
                    backgroundColor: '#ffffff',
                    padding: { x: 5, y: 2 }
                }).setOrigin(0.5);
    
                let timeLeft = 10;
                const timer = this.time.addEvent({
                    delay: 1000,
                    callback: () => {
                        timeLeft--;
                        if (timeLeft <= 0) {
                            this.score -= 10;
                            this.scoreText.setText(`Score: ${this.score}`);
                
                            newIngredient.gameObject.destroy();
                            newIngredient.timeText.destroy();
                            const index = this.placedIngredients[zoneKey].indexOf(newIngredient);
                            if (index > -1) {
                                this.placedIngredients[zoneKey].splice(index, 1);
                            }
                            this.despawnTimers.delete(newIngredient.gameObject);
                        } else {
                            newIngredient.timeText.setText(timeLeft.toString());
                        }
                    },
                    repeat: 10
                });
                this.despawnTimers.set(newIngredient.gameObject, timer);
            }
    
            this.placedIngredients[zoneKey].push(newIngredient);
        }
    
        player.heldIngredient.gameObject.setPosition(dropPosition.x, dropPosition.y);
        player.heldIngredient = null;

        if (zoneKey === 'cookingStation' && this.checkRecipeCompletion()) {
            this.completeRecipe();
        }
    
        return true;
    }
    
    getDropPosition(zone, player) {
        return zone.key === 'cookingStation' 
            ? this.getClosestDropPosition(player, this.zones.cookingStation)
            : { 
                x: zone.x + zone.width / 2, 
                y: player.y + player.height / 2 
            };
    }
    
    getClosestDropPosition(player, zone) {
        // Get the bounds of the zone
        const zoneX = zone.x;
        const zoneY = zone.y;
        const zoneWidth = zone.width;
        const zoneHeight = zone.height;
    
        // Get the size of the ingredient being held
        const ingredientWidth = player.heldIngredient.gameObject.width;
        const ingredientHeight = player.heldIngredient.gameObject.height;
    
        // Calculate the closest drop position based on the player's position
        let dropX = player.x + player.width / 2 - ingredientWidth / 2;
        let dropY = player.y + player.height / 2 - ingredientHeight / 2;
    
        // Adjust for horizontal position (left-right)
        if (dropX < zoneX) {
            // Player is to the left of the zone
            dropX = zoneX; // Place the ingredient at the left boundary of the zone
        } else if (dropX + ingredientWidth > zoneX + zoneWidth) {
            // Player is to the right of the zone
            dropX = zoneX + zoneWidth - ingredientWidth; // Place the ingredient at the right boundary of the zone
        }
    
        // Adjust for vertical position (top-bottom)
        if (dropY < zoneY) {
            // Player is above the zone
            dropY = zoneY; // Place the ingredient at the top boundary of the zone
        } else if (dropY + ingredientHeight > zoneY + zoneHeight) {
            // Player is below the zone
            dropY = zoneY + zoneHeight - ingredientHeight; // Place the ingredient at the bottom boundary of the zone
        }
    
        // Ensure the ingredient stays within the bounds of the zone
        dropX = Phaser.Math.Clamp(dropX, zoneX, zoneX + zoneWidth - ingredientWidth);
        dropY = Phaser.Math.Clamp(dropY, zoneY, zoneY + zoneHeight - ingredientHeight);
    
        return { x: dropX, y: dropY };
    }
    
    // Helper Function to Create a Timer
    createTimer(durationInMilliseconds, onComplete) {
        const timerEvent = this.time.addEvent({
        delay: durationInMilliseconds,
        callback: onComplete,
        loop: false
        });
        return timerEvent;
    }

    startCuttingTimer() {
        if (this.isCutting) return;
        
        // Check if player is near cutting board
        if (!this.isNearZone(this.sousChef, this.zones.cuttingBoard)) {
            return;
        }
    
        const playerCenter = {
            x: this.sousChef.x + this.sousChef.width / 2,
            y: this.sousChef.y + this.sousChef.height / 2
        };
        
        const boardCenter = {
            x: this.zones.cuttingBoard.x + this.zones.cuttingBoard.width / 2,
            y: this.zones.cuttingBoard.y + this.zones.cuttingBoard.height / 2
        };
        
        // Distance check
        const distance = Phaser.Math.Distance.Between(
            playerCenter.x,
            playerCenter.y,
            boardCenter.x,
            boardCenter.y
        );
        
        if (distance > 40) return;
    
        this.isCutting = true;
        this.spaceKeyIsDown = true;
    
        // Create timer group to manage all elements
        this.timerGroup = this.add.group();
        const timerY = this.sousChef.y + this.sousChef.height + 15;
        
        // Constants for bar dimensions
        const BAR_WIDTH = 150;
        const BAR_HEIGHT = 12;
        
        // Background bar (dark border)
        this.timerBg = this.add.rectangle(
            this.sousChef.x - (BAR_WIDTH / 2),
            timerY,
            BAR_WIDTH,
            BAR_HEIGHT,
            0x333333
        ).setOrigin(0, 0.5);
        this.timerGroup.add(this.timerBg);
        
        // Progress bar background
        this.progressBg = this.add.rectangle(
            this.sousChef.x - (BAR_WIDTH / 2),
            timerY,
            BAR_WIDTH,
            BAR_HEIGHT,
            0x005500
        ).setOrigin(0, 0.5);
        this.timerGroup.add(this.progressBg);
    
        // Main progress bar
        this.cuttingProgress = this.add.rectangle(
            this.sousChef.x - (BAR_WIDTH / 2),
            timerY,
            BAR_WIDTH,
            BAR_HEIGHT,
            0x00ff00
        ).setOrigin(0, 0.5);
        this.timerGroup.add(this.cuttingProgress);
    
        // Timer text
        this.timerText = this.add.text(
            this.sousChef.x,
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
        this.cuttingText = this.add.text(
            this.sousChef.x,
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
        const cutIndicator = this.add.rectangle(
            this.sousChef.x,
            timerY,
            20,
            20,
            0xffffff
        ).setAlpha(0);
        this.timerGroup.add(cutIndicator);
    
        // Cutting indicator animation
        this.tweens.add({
            targets: cutIndicator,
            alpha: 0.5,
            yoyo: true,
            duration: 200,
            repeat: 24
        });
    
        // Progress bar animation
        this.tweens.add({
            targets: this.cuttingProgress,
            width: 0,
            duration: 5000,
            ease: 'Linear'
        });
    
        // Store timeLeft in class scope
        this.timeLeft = 5.0;
        
        // Store the countdown timer reference
        this.countdownTimer = this.time.addEvent({
            delay: 100,
            callback: () => {
                if (!this.timerText || !this.isCutting) {
                    // If text is destroyed or we're not cutting anymore, remove the timer
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
        this.cuttingTimer = this.time.addEvent({
            delay: 5000,
            callback: () => {
                // Remove the countdown timer first
                if (this.countdownTimer) {
                    this.countdownTimer.remove();
                    this.countdownTimer = null;
                }
                
                // Then cleanup visual elements
                this.cleanupCuttingTimer();
                
                // Finally complete the cutting
                this.completeCutting();
            },
            loop: false
        });
    
        // Pulse animation for cutting text
        this.tweens.add({
            targets: this.cuttingText,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    cleanupCuttingTimer() {
        // First remove timers
        if (this.countdownTimer) {
            this.countdownTimer.remove();
            this.countdownTimer = null;
        }
        if (this.cuttingTimer) {
            this.cuttingTimer.remove();
            this.cuttingTimer = null;
        }
    
        // Then kill tweens
        this.tweens.killTweensOf(this.cuttingText);
        this.tweens.killTweensOf(this.cuttingProgress);
    
        // Then destroy visual elements
        if (this.timerText) {
            this.timerText.destroy();
            this.timerText = null;
        }
        if (this.cuttingText) {
            this.cuttingText.destroy();
            this.cuttingText = null;
        }
        if (this.cuttingProgress) {
            this.cuttingProgress.destroy();
            this.cuttingProgress = null;
        }
        if (this.progressBg) {
            this.progressBg.destroy();
            this.progressBg = null;
        }
        if (this.timerBg) {
            this.timerBg.destroy();
            this.timerBg = null;
        }
    
        // Finally clean up the group
        if (this.timerGroup) {
            this.timerGroup.clear(true, true);
            this.timerGroup.destroy();
            this.timerGroup = null;
        }
        // Reset state flags
    this.isCutting = false;
    this.spaceKeyIsDown = false;
    this.timeLeft = 0;
}

    completeCutting() {
    try {
        // Store ingredient info before cleanup
        if (!this.sousChef.heldIngredient) {
            console.log('No held ingredient to transform');
            return;
        }

        const oldImage = this.sousChef.heldIngredient.gameObject;
        const ingredientName = this.sousChef.heldIngredient.name;
        const oldX = oldImage.x;
        const oldY = oldImage.y;

        // Create new image first
        const newImage = this.add.image(
            oldX,
            oldY,
            `${ingredientName.toLowerCase()}2`
        )
        .setInteractive()
        .setScale(0.3);

        // Update the held ingredient reference
        oldImage.destroy();
        this.sousChef.heldIngredient.gameObject = newImage;

        // Clean up timers and UI after transformation is complete
        this.cleanupCuttingTimer();
        
        console.log('Cutting completed successfully:', {
            ingredientName,
            newTexture: `${ingredientName.toLowerCase()}2`,
            position: { x: oldX, y: oldY }
        });
    } catch (error) {
        console.error('Error in completeCutting:', error);
        // Log more details about the state
        console.error('Debug state:', {
            hasHeldIngredient: !!this.sousChef.heldIngredient,
            ingredientName: this.sousChef.heldIngredient?.name,
            spaceKeyIsDown: this.spaceKeyIsDown
        });
    }
}

    
    handleChefInteraction() {
        if (!this.chef.heldIngredient) {
            this.handleChefPickupAttempt();
        } else {
            this.handleChefDropOffAttempt();
        }
    }

    handleChefPickupAttempt() {
        // First priority: Check for completed meal pickup
        if (this.cookingResult && this.isNearZone(this.chef, this.zones.cookingStation)) {
            this.pickupCompletedMeal();
            return;
        }

        // Second priority: Check divider ingredients
        const dividerIngredient = this.placedIngredients.divider.find(
            ingredient => this.isNearIngredient(this.chef, ingredient)
        );
        if (dividerIngredient) {
            this.handleIngredientPickup(this.chef, dividerIngredient, 'divider');
            return;
        }

        // Last priority: Check cooking station
        const cookingIngredient = this.placedIngredients.cookingStation[0];
        if (cookingIngredient && this.isNearZone(this.chef, this.zones.cookingStation)) {
            this.handleIngredientPickup(this.chef, cookingIngredient, 'cookingStation');
        }
    }

    handleChefDropOffAttempt() {
        if (this.isNearZone(this.chef, this.zones.cookingStation)) {
            this.dropOffIngredient(this.chef, this.zones.cookingStation);
        } else if (this.isNearZone(this.chef, this.zones.leftTrash)) {
            this.handleTrashDisposal(this.chef);
        } else if (this.isNearZone(this.chef, this.zones.readyTable)) {
            // Drop off completed meal at ready table
            if (this.chef.heldIngredient.name === this.currentRecipe.name) {
                this.dropOffAtReadyTable();
            }
        }
    }

    pickupCompletedMeal() {
        // Cancel penalty timer
        if (this.pickupTimer) {
            this.pickupTimer.remove();
        }

        const completedRecipeName = this.currentRecipe.name;
        
        this.chef.heldIngredient = {
            name: completedRecipeName,
            gameObject: this.cookingResult
        };
        this.cookingResult = null;

        // Award points
        this.addPoints(this.currentRecipe.points);
    }


    handleSousChefInteraction() {
        if (!this.sousChef.heldIngredient) {
            this.handleSousChefPickupAttempt();
        } else {
            this.handleSousChefDropOffAttempt();
        }
    }

    handleSousChefPickupAttempt() {
        // First priority: Check sidebar ingredients
        const sidebarIngredient = this.ingredients.find(
            ingredient => this.isNearIngredient(this.sousChef, ingredient)
        );
        if (sidebarIngredient) {
            this.pickUpIngredient(this.sousChef, sidebarIngredient);
            return;
        }

        // Second priority: Check divider ingredients
        const dividerIngredient = this.placedIngredients.divider.find(
            ingredient => this.isNearIngredient(this.sousChef, ingredient)
        );
        if (dividerIngredient) {
            this.handleIngredientPickup(this.sousChef, dividerIngredient, 'divider');
        }
    }

    handleSousChefDropOffAttempt() {
        // Check if sous chef is very close to cutting board
        const isVeryClosed = this.isNearZone(this.sousChef, this.zones.cuttingBoard);
        if (isVeryClosed && !this.isCutting) {
            this.startCuttingTimer();
            return;
        }

        // Check for divider drop-off
        if (this.isNearZone(this.sousChef, this.zones.divider)) {
            this.dropOffIngredient(this.sousChef, this.zones.divider);
            return;
        }

        // Check for trash drop-off
        if (this.isNearZone(this.sousChef, this.zones.rightTrash)) {
            this.handleTrashDisposal(this.sousChef);
        }
    }

    handleTrashDisposal(character) {
        if (!character.heldIngredient) return; // Guard clause
    
        const ingredientX = character.heldIngredient.gameObject.x;
        const ingredientY = character.heldIngredient.gameObject.y;
    
        // First destroy the held ingredient's game object
        if (character.heldIngredient.gameObject) {
            character.heldIngredient.gameObject.destroy();
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

    addPoints(points) {
        this.score += points;
        this.scoreText.setText(`Score: ${this.score}`);
        
        // Create more dramatic floating score text
        const floatingText = this.add.text(
            this.chef.x,
            this.chef.y - 50,
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
            x: this.chef.x,
            y: this.chef.y - 30,
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
            this.zones.cookingStation.x + this.zones.cookingStation.width / 2,
            this.zones.cookingStation.y + this.zones.cookingStation.height / 2,
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
        if (!this.chef.heldIngredient) return;
        
        const meal = this.chef.heldIngredient;
        
        // Clear the chef's held ingredient before the tween
        this.chef.heldIngredient = null;
    
        // Place the meal at the ready table
        if (meal.gameObject && meal.gameObject.active) {
            meal.gameObject.setPosition(
                this.zones.readyTable.x + this.zones.readyTable.width / 2,
                this.zones.readyTable.y + this.zones.readyTable.height / 2
            );
        
            this.tweens.add({
                targets: meal.gameObject,
                alpha: 0,
                duration: 1500, // Reduced from 3000 to make it faster
                onComplete: () => {
                    if (meal.gameObject && meal.gameObject.active) {
                        meal.gameObject.destroy();
                    }
                }
            });
        }
    
        // Add points to the score
        this.score += 40;
        if (this.scoreText && this.scoreText.active) {
            this.scoreText.setText(`Score: ${this.score}`);
        }
    }
    
    


    update() {
        // Chef movement: Prevent passing the divider but allow free movement on the left side
        const speed = 5;

        if (this.keys.left.isDown && this.chef.x > 0) {
            this.chef.x -= speed;  // Chef can move left but can't go off-screen
        }
        if (this.keys.right.isDown && this.chef.x + this.chef.width < this.zones.divider.x + this.zones.divider.width/2) {
            this.chef.x += speed;  // Chef can move right but can't pass the divider
        }
        if (this.keys.up.isDown && this.chef.y > 0) {
            this.chef.y -= speed;  // Chef can't move off-screen upwards
        }
        if (this.keys.down.isDown && this.chef.y + this.chef.height < this.scale.height) {
            this.chef.y += speed;  // Chef can't move off-screen downwards
        }
    
        // Sous-Chef movement: Allow movement on the right side of the divider
        if (this.keys.left2.isDown && this.sousChef.x + this.sousChef.width > this.zones.divider.x + this.zones.divider.width) {
            this.sousChef.x -= speed;
        }
        if (this.keys.right2.isDown && this.sousChef.x + this.sousChef.width < this.scale.width) {
            this.sousChef.x += speed;
        }
        if (this.keys.up2.isDown && this.sousChef.y > 0) {
            this.sousChef.y -= speed;
        }
        if (this.keys.down2.isDown && this.sousChef.y + this.sousChef.height < this.scale.height) {
            this.sousChef.y += speed;
        }
    
        // Update held ingredients' positions for both chef and sous-chef
        if (this.chef.heldIngredient) {
            this.chef.heldIngredient.gameObject.setPosition(this.chef.x + this.chef.width / 2, this.chef.y - 20);
        }
        if (this.sousChef.heldIngredient) {
            this.sousChef.heldIngredient.gameObject.setPosition(this.sousChef.x + this.sousChef.width / 2, this.sousChef.y - 20);
        }
        if (this.isCutting && this.cuttingProgress && this.cuttingTimer) {
            const progress = 1 - this.cuttingTimer.getProgress(); // Get remaining time percentage
            this.cuttingProgress.width = this.zones.cuttingBoard.width * progress; // Update progress bar width
        }
    }
}