export class IngredientManager {
    constructor(scene) {
        this.scene = scene;
        this.ingredients = [];
        this.placedIngredients = {
            divider: [],
            cookingStation: [],
            cuttingBoard: [],
            leftCuttingBoard: [],
            sidebar: []  // Add sidebar to initialized zones
        };
        this.dividerSlots = [
            { occupied: false, y: 0 },  // Placeholder values, will be initialized later
            { occupied: false, y: 0 },
            { occupied: false, y: 0 },
            { occupied: false, y: 0 }
        ];
    }

    initializeDividerSlots() {
        const dividerZone = this.scene.zoneManager.getZone('divider');
        if (!dividerZone) return;

        // Calculate positions to evenly space 4 slots along the divider height
        const dividerHeight = dividerZone.height;
        const padding = 80; // Space from top/bottom edges
        const usableHeight = dividerHeight - (padding * 2);
        const spacing = usableHeight / 3; // For 4 slots, we need 3 spaces between them

        this.dividerSlots = [
            { occupied: false, y: dividerZone.y + padding }, // Top slot
            { occupied: false, y: dividerZone.y + padding + spacing }, // Upper middle
            { occupied: false, y: dividerZone.y + padding + spacing * 2 }, // Lower middle
            { occupied: false, y: dividerZone.y + padding + spacing * 3 } // Bottom slot
        ];

        // Debug visualization of slots (optional)
        if (this.scene.game.config.physics.arcade?.debug) {
            this.dividerSlots.forEach(slot => {
                this.scene.add.circle(dividerZone.x + dividerZone.width / 2, slot.y, 5, 0xff0000);
            });
        }
    }

    createIngredients(sidebarX) {
        const ingredients = ['Tortilla', 'Cheese', 'Meat', 'Tomato', 'Avocado'];
        const spacing = 140;
        const startY = 120;

        ingredients.forEach((name, index) => {
            const y = startY + (spacing * index);
            const ingredient = {
                name: name,
                x: sidebarX + 40,
                y: y,
                gameObject: this.scene.add.image(sidebarX, y, `${name.toLowerCase()}0`)
                    .setScale(1)
                    .setOrigin(0.5),
                interactiveZone: this.createIngredientZone(sidebarX + 60, y, name),
                debugVisual: this.scene.add.rectangle(sidebarX + 60, y, 85, 85, 0x00ff00, 0)
                    .setOrigin(0.5)
                    .setStrokeStyle(0, 0x00ff00),
                debugText: this.scene.add.text(sidebarX + 60, y, name, {
                    fontSize: '16px',
                    color: '#000000',
                    backgroundColor: null
                }).setOrigin(0.5).setAlpha(0)
            };

            this.ingredients.push(ingredient);
            this.scene.characterManager.setupIngredientOverlaps([ingredient.interactiveZone]);
        });
    }

    setupInteractiveZones() {
        const ingredientZones = [];
        this.ingredients.forEach(ingredient => {
            const zoneWidth = 85;  // Standardize zone size
            const zoneHeight = 85;
            
            const zone = this.scene.add.zone(
                ingredient.x,
                ingredient.y,
                zoneWidth,
                zoneHeight
            )
                .setOrigin(0.5)
                .setInteractive()
                .setName(ingredient.name);

            this.scene.physics.add.existing(zone, true);
            ingredient.interactiveZone = zone;
            ingredientZones.push(zone);

            // Make the ingredient zone visible for debugging
            const zoneVisual = this.scene.add.rectangle(
                ingredient.x,
                ingredient.y,
                zoneWidth,
                zoneHeight,
                0xff0000,
                0
            )
                .setOrigin(0.5)
                
            ingredient.debugVisual = zoneVisual;  // Attach to ingredient instead of zone

            // Add debug text to show zone name
            ingredient.debugText = this.scene.add.text(
                ingredient.x,
                ingredient.y,
                ingredient.name,
                { fontSize: '16px', color: '#000000', backgroundColor: null } // Black text on a black background
            ).setOrigin(0.5).setAlpha(0); // Fully transparent
            
        });

        // Setup ingredient overlaps in CharacterManager
        this.scene.characterManager.setupIngredientOverlaps(ingredientZones);
    }
    
    placeIngredient(location, ingredient) {
        if (this.placedIngredients[location]) {
            this.placedIngredients[location].push(ingredient);
        }
    }

    removeIngredient(location, ingredient) {
        if (this.placedIngredients[location]) {
            // Clean up timers
            ingredient.timer?.remove();
            ingredient.timerContainer?.destroy();
            ingredient.interactiveZone?.destroy();

            // Free up slot if in divider
            if (location === 'divider' && typeof ingredient.slotIndex === 'number') {
                this.dividerSlots[ingredient.slotIndex].occupied = false;
            }

            this.placedIngredients[location].splice(this.placedIngredients[location].indexOf(ingredient), 1);
        }
    }
    addPulseEffect(ingredient) {
        this.scene.tweens.add({
            targets: ingredient.gameObject,
            scaleX: { from: 0.25, to: 0.3 },
            scaleY: { from: 0.25, to: 0.3 },
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    // To stop the effect
    removePulseEffect(ingredient) {
        this.scene.tweens.killTweensOf(ingredient.gameObject);
        ingredient.gameObject.setScale(0.25); // Reset to original scale
    }

    clearCookingStation() {
        this.placedIngredients.cookingStation.forEach(ingredient => {
            ingredient.gameObject.destroy();
        });
        this.placedIngredients.cookingStation = [];
    }

    findInteractingIngredient(character, zoneName) {
        // For sidebar, check ingredients array
        if (zoneName === 'sidebar') {
            return this.ingredients.find(ingredient => 
                this.scene.characterManager.isNearIngredient(character, ingredient.name)
            );
        }

        // For other zones, check if the zone exists in placedIngredients
        if (!this.placedIngredients[zoneName]) {
            this.placedIngredients[zoneName] = [];  // Initialize if undefined
        }

        return this.placedIngredients[zoneName].find(ingredient => {
            const distance = Phaser.Math.Distance.Between(
                character.gameObject.x,
                character.gameObject.y,
                ingredient.gameObject.x,
                ingredient.gameObject.y
            );
            return distance < character.INTERACTION_RADIUS;
        });
    }

    handleIngredientPickup(character, zoneName) {
        if (character.heldIngredient) return;

        // For sidebar pickup, create new ingredient
        if (zoneName === 'sidebar') {
            const ingredient = this.findInteractingIngredient(character, zoneName);
            if (!ingredient) return;

            // Create new instance of ingredient with texture1
            const newIngredient = {
                name: ingredient.name,
                gameObject: this.scene.add.image(
                    ingredient.x,
                    ingredient.y,
                    `${ingredient.name.toLowerCase()}1`
                )
                    .setScale(0.2)  // Small scale for held ingredients
                    .setOrigin(0.5),
                state: 'raw',
                interactiveZone: this.createIngredientZone(ingredient.x, ingredient.y, ingredient.name)
            };

            // Play pickup sound
            const pickupSound = this.scene.sound.add('pickupSound');
            pickupSound.play({ volume: 0.3 });

            character.heldIngredient = newIngredient;
            return;
        }

        // For other zones (divider, cutting board, etc.)
        const ingredient = this.findInteractingIngredient(character, zoneName);
        if (!ingredient) return;

        // If picking up from divider, clear timers
        if (zoneName === 'divider') {
            if (ingredient.timer) {
                ingredient.timer.remove();
                ingredient.timer = null;
            }
            if (ingredient.timerContainer) {
                ingredient.timerContainer.destroy();
                ingredient.timerContainer = null;
            }
            
            // Free up the slot
            if (typeof ingredient.slotIndex === 'number') {
                this.dividerSlots[ingredient.slotIndex].occupied = false;
                ingredient.slotIndex = undefined;
            }
        }

        // Remove from placed ingredients
        const index = this.placedIngredients[zoneName].indexOf(ingredient);
        if (index > -1) {
            this.placedIngredients[zoneName].splice(index, 1);
        }

        character.heldIngredient = ingredient;
    }

    handleIngredientDropOff(character, zoneName) {
        if (!character.heldIngredient) return;
        
        const heldIngredient = character.heldIngredient;
        
        // Handle dropping in different zones
        switch (zoneName) {
            case 'divider':
                this.handleDividerDropoff(character);
                break;
            case 'cookingStation':
                this.handleCookingStationDropoff(character);
                break;
            case 'cuttingBoard':
                this.dropInCuttingBoard(character);
                break;
            default:
                return;
        }
    }

    handleDividerDropoff(character) {
        if (!character.heldIngredient) return;

        // Find an empty slot
        const emptySlot = this.dividerSlots.find(slot => !slot.occupied);
        if (!emptySlot) return;

        const dividerZone = this.scene.zoneManager.getZone('divider');
        const slotIndex = this.dividerSlots.indexOf(emptySlot);
        const slotY = emptySlot.y;

        // Position the ingredient
        character.heldIngredient.gameObject.setPosition(
            dividerZone.x + dividerZone.width / 2,
            slotY
        );

        // Mark slot as occupied and store the ingredient
        emptySlot.occupied = true;
        character.heldIngredient.slotIndex = slotIndex;
        
        // Store reference to the ingredient
        const placedIngredient = character.heldIngredient;
        this.placedIngredients.divider.push(placedIngredient);

        // Create timer container
        const timerContainer = this.scene.add.container(
            placedIngredient.gameObject.x + 30,
            placedIngredient.gameObject.y
        );

        // Add timer background
        const timerBg = this.scene.add.circle(0, 0, 15, 0x000000, 0.5);
        timerContainer.add(timerBg);

        // Add timer text
        const timerText = this.scene.add.text(0, 0, '10', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);
        timerContainer.add(timerText);

        // Create and start the timer
        const timer = this.scene.time.addEvent({
            delay: 10000, // 10 seconds
            callback: () => {
                // Make sure ingredient still exists and is still on divider
                const ingredientIndex = this.placedIngredients.divider.indexOf(placedIngredient);
                if (ingredientIndex === -1) return; // Ingredient was already removed

                // Destroy the ingredient
                if (placedIngredient.gameObject) {
                    placedIngredient.gameObject.destroy();
                }
                
                // Cleanup timer elements
                if (timerContainer) {
                    timerContainer.destroy();
                }
                
                // Free up the slot
                this.dividerSlots[slotIndex].occupied = false;
                
                // Remove from placed ingredients
                this.placedIngredients.divider.splice(ingredientIndex, 1);

                // Create penalty effect
                this.scene.createTrashEffect(
                    dividerZone.x + dividerZone.width / 2,
                    slotY
                );
                
                // Add penalty points
                this.scene.addPoints(-10);
            }
        });

        // Update timer text every second
        this.scene.time.addEvent({
            delay: 1000,
            repeat: 9,
            callback: () => {
                if (!timerContainer || !timerContainer.active) return;
                const timeLeft = Math.ceil((10000 - timer.getElapsed()) / 1000);
                timerText.setText(timeLeft.toString());
            }
        });

        // Store timer references
        placedIngredient.timer = timer;
        placedIngredient.timerContainer = timerContainer;

        // Clear held ingredient
        character.heldIngredient = null;
    }

    handleCookingStationDropoff(character) {
        if (!character.heldIngredient) return;

        const cookingStation = this.scene.zoneManager.getZone('cookingStation');
        if (!cookingStation) return;

        // Position the ingredient at the cooking station
        character.heldIngredient.gameObject.setPosition(
            cookingStation.x + cookingStation.width / 2,
            cookingStation.y + cookingStation.height / 2
        );

        // Add to placed ingredients
        this.placedIngredients.cookingStation.push(character.heldIngredient);

        // Start cooking sound
        if (this.scene.cookingManager) {
            this.scene.cookingManager.startCooking();
        }

        // Clear held ingredient
        character.heldIngredient = null;

        // Check recipe completion
        if (this.scene.checkRecipeCompletion()) {
            this.scene.completeRecipe();
            // Stop cooking sound when recipe is complete
            if (this.scene.cookingManager) {
                this.scene.cookingManager.stopCooking();
            }
        }
    }

    dropInCuttingBoard(character) {
        const cuttingBoard = this.scene.zoneManager.getZone('cuttingBoard');
        
        // Position the ingredient at the cutting board
        character.heldIngredient.gameObject.setPosition(
            cuttingBoard.x + cuttingBoard.width / 2,
            cuttingBoard.y + cuttingBoard.height / 2
        );

        // Add to placed ingredients
        this.placedIngredients.cuttingBoard.push(character.heldIngredient);
        
        // Start cutting immediately
        if (!this.scene.cuttingManager.isCutting) {
            this.scene.cuttingManager.startCuttingTimer(character);
        }
        
        // Clear held ingredient
        character.heldIngredient = null;
    }

    createIngredientZone(x, y, name) {
        const zone = this.scene.add.zone(
            x,
            y,
            60, // Width of interaction zone
            60  // Height of interaction zone
        )
            .setOrigin(0.5)
            .setName(name);

        this.scene.physics.add.existing(zone, true);

        // Add debug visual for the zone
        const zoneVisual = this.scene.add.rectangle(
            x,
            y,
            60, // Same as zone width
            60, // Same as zone height
            0x00ff00,
            0.0
        ).setOrigin(0.5);

        // Add border to make the zone more visible
        zoneVisual.setStrokeStyle(0, 0x00ff00);

        // Store the visual in the zone object
        zone.debugVisual = zoneVisual;

        return zone;
    }

    updateHeldIngredients() {
        if (this.scene.characterManager.chef.heldIngredient) {
            const centerX = this.scene.characterManager.chef.x + this.scene.characterManager.chef.displayWidth / 2;
            const centerY = this.scene.characterManager.chef.y - 20;
            this.scene.characterManager.chef.heldIngredient.gameObject.setPosition(centerX, centerY);
            this.scene.characterManager.chef.heldIngredient.interactiveZone.setPosition(centerX, centerY);
            this.scene.characterManager.chef.heldIngredient.debugVisual.setPosition(centerX, centerY);
            this.scene.characterManager.chef.heldIngredient.debugText.setPosition(centerX, centerY);
        }
        if (this.scene.characterManager.sousChef.heldIngredient) {
            const centerX = this.scene.characterManager.sousChef.x + this.scene.characterManager.sousChef.displayWidth / 2;
            const centerY = this.scene.characterManager.sousChef.y - 20;
            this.scene.characterManager.sousChef.heldIngredient.gameObject.setPosition(centerX, centerY);
            this.scene.characterManager.sousChef.heldIngredient.interactiveZone.setPosition(centerX, centerY);
            this.scene.characterManager.sousChef.heldIngredient.debugVisual.setPosition(centerX, centerY);
            this.scene.characterManager.sousChef.heldIngredient.debugText.setPosition(centerX, centerY);
        }
    }

    // Helper method to get ingredients in cooking station
    getCookingStationIngredients() {
        return this.placedIngredients.cookingStation.map(ing => ing.name);
    }

    handleCuttingBoardDropoff(character, zoneName) {
        if (!character.heldIngredient) return;
        
        const cuttingBoard = this.scene.zoneManager.getZone(zoneName);
        if (!cuttingBoard) return;

        // Position the ingredient on the appropriate cutting board
        character.heldIngredient.gameObject.setPosition(
            cuttingBoard.x + cuttingBoard.width / 2,
            cuttingBoard.y + cuttingBoard.height / 2
        );

        // Add to placed ingredients for the specific cutting board
        this.placedIngredients[zoneName].push(character.heldIngredient);
        
        // Clear held ingredient before starting cutting
        character.heldIngredient = null;
    }

    handlePickupFromSidebar(character, ingredientName) {
        const ingredient = this.ingredients.find(ing => ing.name === ingredientName);
        if (!ingredient) return;

        // Create a new held ingredient with the "1" version of the texture
        const heldIngredient = {
            name: ingredient.name,
            gameObject: this.scene.add.image(
                ingredient.x,
                ingredient.y,
                `${ingredientName.toLowerCase()}1`  // Raw ingredient texture
            )
                .setScale(2)
                .setOrigin(0.5),
            interactiveZone: this.createIngredientZone(ingredient.x, ingredient.y, ingredient.name),
            debugVisual: this.scene.add.rectangle(ingredient.x, ingredient.y, 85, 85, 0x00ff00, 0)
                .setOrigin(0.5)
                .setStrokeStyle(0, 0x00ff00),
            debugText: this.scene.add.text(ingredient.x, ingredient.y, ingredient.name, {
                fontSize: '16px',
                color: '#000000',
                backgroundColor: null
            }).setOrigin(0.5).setAlpha(0),
            state: 'raw'  // Track ingredient state
        };

        // Assign the new ingredient to the character
        character.heldIngredient = heldIngredient;
    }

    // Update the cutting completion handler
    handleCuttingComplete(character) {
        if (!character.heldIngredient) return;
        
        // Change texture to the prepped version (2) while maintaining scale
        const ingredientName = character.heldIngredient.name.toLowerCase();
        character.heldIngredient.gameObject
            .setTexture(`${ingredientName}2`)
            .setScale(0.2);  // Keep same scale after cutting
        character.heldIngredient.state = 'prepped';
        
        // Play cutting complete sound if available
        const cutSound = this.scene.sound.add('drawKnifeSound');
        cutSound.play({ volume: 0.5 });
        
        // Clear the cutting board
        this.placedIngredients.cuttingBoard = [];
        this.placedIngredients.leftCuttingBoard = [];
    }

    handleTrashDisposal(character) {
        if (!character.heldIngredient) return;

        // Create trash effect at the ingredient's position
        const x = character.heldIngredient.gameObject.x;
        const y = character.heldIngredient.gameObject.y;

        // Destroy the ingredient
        character.heldIngredient.gameObject.destroy();
        if (character.heldIngredient.interactiveZone) {
            character.heldIngredient.interactiveZone.destroy();
        }
        if (character.heldIngredient.debugVisual) {
            character.heldIngredient.debugVisual.destroy();
        }

        // Play trash sound
        const trashSound = this.scene.sound.add('trashDisposalSound');
        trashSound.play({ volume: 0.3 });

        // Create trash effect
        this.scene.createTrashEffect(x, y);

        // Clear the held ingredient
        character.heldIngredient = null;
    }
}