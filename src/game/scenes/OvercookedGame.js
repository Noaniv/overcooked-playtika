import { Scene } from 'phaser';

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
                points: 50
            },
            {
                name: 'Burrito',
                image: 'burrito_recipe',
                result: 'burrito_complete',
                ingredients: ['Tortilla', 'Meat', 'Avocado', 'Cheese'],
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
        let timeLeft = 120; // 2 minutes in seconds
        this.timeText = this.add.text(this.scale.width / 2, this.scale.height - 40, `Time: ${timeLeft}s`, {
            fontSize: '32px',
            fill: '#000',
            backgroundColor: '#ffffff',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        this.scoreText = this.add.text(this.scale.width / 2, this.scale.height - 80, `Score: ${this.score}`, {
            fontSize: '32px',
            fill: '#000',
            backgroundColor: '#ffffff',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
    
        this.gameTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                timeLeft--;
                this.timeText.setText(`Time: ${timeLeft}s`);
                if (timeLeft <= 0) {
                    this.endGame();
                }
            },
            repeat: 120
        });
    }
    
    endGame() {
        this.scene.start('GameOver', { score: this.score });
    }    

    // Helper function for checking proximity (adjusted for full height interaction)
isNearZone(player, zone, radius = 80) {
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

  // Refactored startCuttingTimer using the helper function
  startCuttingTimer() {
    if (this.isCutting) return; // Don't start if already cutting

    this.isCutting = true;
    this.spaceKeyIsDown = true;
    

    // Create a colored progress bar (full width at start)
    this.cuttingProgress = this.add.rectangle(
        this.zones.cuttingBoard.x + this.zones.cuttingBoard.width / 2,
        this.zones.cuttingBoard.y + this.zones.cuttingBoard.height + 20,
        150, // initial width (full bar size)
        10,  // height of the progress bar
        0x00ff00 // green color for progress
    ).setOrigin(0.5, 0);

    // Add some corner rounding to the progress bar
    this.cuttingProgress.setStrokeStyle(2, 0x000000); // Add a black border for better visibility

    // Smooth transition for the progress bar width decreasing using tweens
    this.tweens.add({
        targets: this.cuttingProgress,
        width: 0,  // final width (empty bar)
        duration: 5000, // 5 seconds duration
        ease: 'Linear', // smooth progression
        onComplete: () => this.completeCutting(), // when the timer completes
    });

    // Create and start the timer using the helper function
    this.cuttingTimer = createTimer.call(this, 5000, () => this.completeCutting());
}
    
completeCutting() {
    if (!this.spaceKeyIsDown) return;
    
    const oldImage = this.sousChef.heldIngredient.gameObject;
    const ingredientName = this.sousChef.heldIngredient.name;
    
    const newImage = this.add.image(
        oldImage.x,
        oldImage.y,
        `${ingredientName.toLowerCase()}2`
    ).setInteractive()
    .setScale(0.3);
    
    // Update the held ingredient with the new image
    this.sousChef.heldIngredient.gameObject.destroy();
    this.sousChef.heldIngredient.gameObject = newImage;
    
    this.cleanupCuttingTimer();
}
    
    cleanupCuttingTimer() {
        if (this.cuttingProgress) {
            this.cuttingProgress.destroy();
            this.cuttingProgress = null;
        }
        if (this.cuttingTimer) {
            this.cuttingTimer.remove();
            this.cuttingTimer = null;
        }
        this.isCutting = false;
    }
    
    handleChefInteraction() {
    if (!this.chef.heldIngredient) {
        if (this.cookingResult && this.isNearZone(this.chef, this.zones.cookingStation)) {
            this.chef.heldIngredient = {
                name: this.currentRecipe.name,
                gameObject: this.cookingResult
            };
            this.cookingResult = null;

            // Add points for picking up the meal
            this.score += this.currentRecipe.points;
            this.scoreText.setText(`Score: ${this.score}`);
        }
        // Try pickup from divider
        for (const ingredient of this.placedIngredients.divider) {
            if (this.isNearIngredient(this.chef, ingredient)) {
                this.handleIngredientPickup(this.chef, ingredient, 'divider');
                break;
            }
        }
        // Try pickup from cooking station
        if (!this.chef.heldIngredient) {
            const ingredient = this.placedIngredients.cookingStation[0];
            if (ingredient && this.isNearZone(this.chef, this.zones.cookingStation)) {
                this.handleIngredientPickup(this.chef, ingredient, 'cookingStation');
            }
        }
    } else {
        if (this.isNearZone(this.chef, this.zones.cookingStation)) {
            this.dropOffIngredient(this.chef, this.zones.cookingStation);
        } else if (this.isNearZone(this.chef, this.zones.leftTrash)) {
            this.score -= 10;
            this.scoreText.setText(`Score: ${this.score}`);
            this.chef.heldIngredient.gameObject.destroy();
            this.chef.heldIngredient = null;
        } else if (this.isNearZone(this.chef, this.zones.readyTable)) {
            // Drop off completed meal at ready table
            if (this.chef.heldIngredient && this.chef.heldIngredient.name === this.currentRecipe.name) {
                this.dropOffAtReadyTable();
            }
        }
        
    }
}

handleSousChefInteraction() {
    if (this.sousChef.heldIngredient && this.isNearZone(this.sousChef, this.zones.cuttingBoard)) {
        if (!this.isCutting) this.startCuttingTimer();
        return;
    }

    if (!this.sousChef.heldIngredient) {
        // Try pickup from sidebar
        for (const ingredient of this.ingredients) {
            if (this.isNearIngredient(this.sousChef, ingredient)) {
                this.pickUpIngredient(this.sousChef, ingredient);
                break;
            }
        }
        // Try pickup from divider
        if (!this.sousChef.heldIngredient) {
            for (const ingredient of this.placedIngredients.divider) {
                if (this.isNearIngredient(this.sousChef, ingredient)) {
                    this.handleIngredientPickup(this.sousChef, ingredient, 'divider');
                    break;
                }
            }
        }
    } else {
        if (this.isNearZone(this.sousChef, this.zones.divider)) {
            this.dropOffIngredient(this.sousChef, this.zones.divider);
        } else if (this.isNearZone(this.sousChef, this.zones.rightTrash)) {
            this.score -= 10;
            this.scoreText.setText(`Score: ${this.score}`);
            this.sousChef.heldIngredient.gameObject.destroy();
            this.sousChef.heldIngredient = null;
        }
    }
    
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
    
        // Clear ingredients from the cooking station
        this.placedIngredients.cookingStation.forEach(ingredient => {
            ingredient.gameObject.destroy();
        });
        this.placedIngredients.cookingStation = [];
    
        // Add delay penalty if the meal isn't picked up
        const penaltyTime = 10; // 10 seconds to pick up
        let penaltyCounter = penaltyTime;
    
        const penaltyText = this.add.text(
            this.cookingResult.x,
            this.cookingResult.y - 50,
            `${penaltyCounter}s`,
            { fontSize: '20px', fill: '#ff0000' }
        ).setOrigin(0.5);
    
        const penaltyTimer = this.time.addEvent({
            delay: 1000, // 1-second interval
            callback: () => {
                penaltyCounter--;
                penaltyText.setText(`${penaltyCounter}s`);
                if (penaltyCounter <= 0) {
                    // Deduct points for delay
                    this.score -= 20;
                    this.scoreText.setText(`Score: ${this.score}`);
    
                    // Destroy meal and penalty timer
                    penaltyText.destroy();
                    this.cookingResult.destroy();
                    this.cookingResult = null;
    
                    penaltyTimer.remove();
                }
            },
            repeat: penaltyTime - 1
        });
    
        // Pick a new recipe
        const recipeIndex = (this.recipes.indexOf(this.currentRecipe) + 1) % this.recipes.length;
        this.currentRecipe = this.recipes[recipeIndex];
        this.recipeDisplay.setTexture(this.currentRecipe.image);
    }

    dropOffAtReadyTable() {
        const meal = this.chef.heldIngredient;
    
        // Place the meal at the ready table
        meal.gameObject.setPosition(
            this.zones.readyTable.x + this.zones.readyTable.width / 2,
            this.zones.readyTable.y + this.zones.readyTable.height / 2
        );
    
        this.tweens.add({
            targets: meal.gameObject,
            alpha: 0,
            duration: 3000, // Fade out over 3 seconds
            onComplete: () => {
                meal.gameObject.destroy(); // Remove the meal after fade-out
            }
        });
    
        // Add 40 points to the score
        this.score += 40;
        this.scoreText.setText(`Score: ${this.score}`);
    
        // Set a timer to remove the meal from the ready table
        this.time.addEvent({
            delay: 3000, // Meal disappears after 3 seconds
            callback: () => {
                meal.gameObject.destroy();
            }
        });
    
        // Clear the chef's held ingredient
        this.chef.heldIngredient = null;
    }
    
    


    update() {
        // Chef movement: Prevent passing the divider but allow free movement on the left side
        const speed = 8;

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