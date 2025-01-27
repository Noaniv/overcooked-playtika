export class IngredientManager {
    constructor(scene) {
        this.scene = scene;
        this.ingredients = [];
        this.placedIngredients = {
            cookingStation: [],
            cuttingBoard: [],
            leftCuttingBoard: [],
            divider: []
        };
        this.dividerSlots = [
            { occupied: false, y: 0 },
            { occupied: false, y: 0 },
            { occupied: false, y: 0 },
            { occupied: false, y: 0 }
        ];
    }

    initializeDividerSlots() {
        const dividerZone = this.scene.zoneManager.getZone('divider');
        if (!dividerZone) return;

        const dividerHeight = dividerZone.height;
        const padding = 80;
        const usableHeight = dividerHeight - (padding * 2);
        const spacing = usableHeight / 3;

        this.dividerSlots = [
            { occupied: false, y: dividerZone.y + padding },
            { occupied: false, y: dividerZone.y + padding + spacing },
            { occupied: false, y: dividerZone.y + padding + spacing * 2 },
            { occupied: false, y: dividerZone.y + padding + spacing * 3 }
        ];

        if (this.scene.game.config.physics.arcade?.debug) {
            this.dividerSlots.forEach(slot => {
                this.scene.add.circle(dividerZone.x + dividerZone.width / 2, slot.y, 5, 0xff0000);
            });
        }
    }

    // Rename createIngredient to createSourceIngredient
    createSourceIngredient(name, x, y, scale = 1) {
        // Create the interactive zone first
        const interactiveZone = this.createIngredientZone(x, y, name);
        const zoneBounds = interactiveZone.getBounds();

        const ingredient = {
            name: name,
            x: x,
            y: y,
            gameObject: this.scene.add.image(x, y, `${name.toLowerCase()}0`)
                .setScale(scale)
                .setOrigin(0.5),
            interactiveZone: interactiveZone,
            // Create debug visual matching the zone's exact dimensions
            debugVisual: this.scene.add.rectangle(
                zoneBounds.x + zoneBounds.width / 2,
                zoneBounds.y + zoneBounds.height / 2,
                zoneBounds.width,
                zoneBounds.height,
                0x00ff00,
                0
            ).setOrigin(0.5)
            .setStrokeStyle(0, 0x00ff00),
            debugText: this.scene.add.text(x, y, name, {
                fontSize: '16px',
                color: '#000000',
                backgroundColor: null
            }).setOrigin(0.5).setAlpha(0),
            originalScale: scale,  // Store original scale
            isPulsing: false,      // Track pulse state
            pulsingCharacter: null // Track pulsing character
        };

        this.ingredients.push(ingredient);
        this.scene.characterManager.setupIngredientOverlaps([ingredient.interactiveZone]);
        return ingredient;
    }

    // New method to initialize ingredients with custom positions
    initializeIngredients(ingredientConfigs) {
        // Clear existing ingredients
        this.ingredients.forEach(ingredient => {
            ingredient.gameObject.destroy();
            ingredient.interactiveZone.destroy();
            ingredient.debugVisual.destroy();
            ingredient.debugText.destroy();
        });
        this.ingredients = [];

        // Create new ingredients based on configs
        ingredientConfigs.forEach(config => {
            this.createSourceIngredient(
                config.name,
                config.x,
                config.y,
                config.scale || 1
            );
        });
    }

    createIngredientZone(x, y, name) {
        // Check if the ingredient is meat or a completed meal
        const isMeat = name.toLowerCase().includes('meat');
        const isCompletedMeal = name.toLowerCase().includes('complete');
        
        // Adjust size based on ingredient type
        let width, height;
        if (isMeat) {
            width = 130;
            height = 200;
        } else if (isCompletedMeal) {
            width = 100;
            height = 100;
        } else {
            width = 125;
            height = 85;
        }

        const zone = this.scene.add.zone(x, y, width, height)
            .setOrigin(0.5)
            .setName(name);
        
        this.scene.physics.add.existing(zone, true);

        // Add debug visualization if in debug mode
        if (this.scene.game.config.physics.arcade?.debug) {
            const debugGraphics = this.scene.add.graphics()
                .setDepth(100)
                .lineStyle(1, 0xff0000);
            debugGraphics.strokeRect(
                zone.x - (width/2),
                zone.y - (height/2),
                width,
                height
            );
        }

        return zone;
    }

    setupInteractiveZones() {
        const ingredientZones = [];
        this.ingredients.forEach(ingredient => {
            const zone = ingredient.interactiveZone;
            ingredientZones.push(zone);
        });

        this.scene.characterManager.setupIngredientOverlaps(ingredientZones);
    }

    placeIngredient(location, ingredient) {
        if (this.placedIngredients[location]) {
            this.placedIngredients[location].push(ingredient);
        }
    }

    removeIngredient(location, ingredient) {
        if (this.placedIngredients[location]) {
            ingredient.timer?.remove();
            ingredient.timerContainer?.destroy();
            ingredient.interactiveZone?.destroy();

            if (location === 'divider' && typeof ingredient.slotIndex === 'number') {
                this.dividerSlots[ingredient.slotIndex].occupied = false;
            }

            this.placedIngredients[location].splice(
                this.placedIngredients[location].indexOf(ingredient),
                1
            );
        }
    }

    addPulseEffect(ingredient) {
        this.scene.tweens.add({
            targets: ingredient.gameObject,
            scale: ingredient.gameObject.scale * 1.2,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    removePulseEffect(ingredient) {
        this.scene.tweens.killTweensOf(ingredient.gameObject);
        // Reset to original scale
        ingredient.gameObject.setScale(ingredient.originalScale || 1);
    }

    clearCookingStation() {
        this.placedIngredients.cookingStation.forEach(ingredient => {
            if (ingredient.gameObject) {
                ingredient.gameObject.destroy();
            }
            if (ingredient.interactiveZone) {
                ingredient.interactiveZone.destroy();
            }
        });
        this.placedIngredients.cookingStation = [];
    }

    // Rename createNewIngredient to createIngredientInstance
    createIngredientInstance(name, x, y, state = 'raw', scale = 0.2, textureType = 0) {
        return {
            name: name,
            gameObject: this.scene.add.image(x, y, `${name.toLowerCase()}${textureType}`)
                .setScale(scale)
                .setOrigin(0.5),
            state: state,
            originalScale: scale,
            interactiveZone: this.createIngredientZone(x, y, name)
        };
    }

    findInteractingIngredient(character) {
        // First check cooking station
        if (character.currentZone === 'cookingStation' && 
            this.placedIngredients.cookingStation.length > 0) {
            
            const cookingStationIngredients = this.placedIngredients.cookingStation;
            const topIngredient = cookingStationIngredients[cookingStationIngredients.length - 1];
            
            const charBounds = character.interactionZone.getBounds();
            const ingBounds = topIngredient.gameObject.getBounds();
            
            if (Phaser.Geom.Rectangle.Overlaps(charBounds, ingBounds)) {
                // If it's a completed meal
                if (topIngredient.isCompletedMeal) {
                    // Remove from cooking station first
                    this.placedIngredients.cookingStation.pop();
                    
                    return {
                        name: topIngredient.name,
                        state: 'completed',
                        x: character.x,
                        y: character.y,
                        isCompletedMeal: true,
                        points: topIngredient.points,
                        result: topIngredient.result,
                        gameObject: topIngredient.gameObject // Keep the game object
                    };
                }
                
                // For regular ingredients
                if (topIngredient.gameObject) {
                    topIngredient.gameObject.destroy();
                }
                if (topIngredient.interactiveZone) {
                    topIngredient.interactiveZone.destroy();
                }
                
                // Remove from cooking station
                this.placedIngredients.cookingStation.pop();
                
                return {
                    name: topIngredient.name,
                    state: topIngredient.state || 'raw',
                    x: character.x,
                    y: character.y,
                    isFromStation: true
                };
            }
        }

        // First check cutting boards
        if ((character.currentZone === 'cuttingBoard' || character.currentZone === 'leftCuttingBoard') && 
            this.placedIngredients[character.currentZone]?.length > 0) {
            
            const boardIngredients = this.placedIngredients[character.currentZone];
            const topIngredient = boardIngredients[boardIngredients.length - 1];
            
            const charBounds = character.interactionZone.getBounds();
            const ingBounds = topIngredient.gameObject.getBounds();
            
            if (Phaser.Geom.Rectangle.Overlaps(charBounds, ingBounds)) {

                // Properly destroy the original ingredient
                if (topIngredient.gameObject) {
                    topIngredient.gameObject.destroy();
                }
                if (topIngredient.interactiveZone) {
                    topIngredient.interactiveZone.destroy();
                }
                
                // Remove from cutting board
                this.placedIngredients[character.currentZone].pop();
                
                // Return the ingredient info with its state
                return {
                    name: topIngredient.name,
                    state: 'prepped',
                    x: character.x,
                    y: character.y,
                    isFromStation: true
                };
            }
        }
        
        // Then check divider
        if (character.currentZone === 'divider' && 
            this.placedIngredients.divider.length > 0) {
            
            const dividerIngredients = this.placedIngredients.divider;
            const topIngredient = dividerIngredients[dividerIngredients.length - 1];
            
            const charBounds = character.interactionZone.getBounds();
            const ingBounds = topIngredient.gameObject.getBounds();
            
            if (Phaser.Geom.Rectangle.Overlaps(charBounds, ingBounds)) {
                // Properly destroy the original ingredient and its components
                if (topIngredient.gameObject) {
                    topIngredient.gameObject.destroy();
                }
                if (topIngredient.interactiveZone) {
                    topIngredient.interactiveZone.destroy();
                }
                if (topIngredient.timer) {
                    topIngredient.timer.remove();
                }
                if (topIngredient.timerContainer) {
                    topIngredient.timerContainer.destroy();
                }
                
                // Remove from divider and clear slot
                if (typeof topIngredient.slotIndex === 'number') {
                    this.dividerSlots[topIngredient.slotIndex].occupied = false;
                }
                this.placedIngredients.divider.pop();
                
                // Return the ingredient info
                return {
                    name: topIngredient.name,
                    state: topIngredient.state,
                    x: character.x,
                    y: character.y,
                    isFromStation: true
                };
            }
        }
        
        // Finally check raw ingredients in sidebar
        const sidebarIngredient = this.ingredients.find(ingredient => {
            const bounds = ingredient.interactiveZone.getBounds();
            const charBounds = character.interactionZone.getBounds();
            return Phaser.Geom.Rectangle.Overlaps(bounds, charBounds);
        });

        if (sidebarIngredient) {
            return {
                name: sidebarIngredient.name,
                x: sidebarIngredient.x,
                y: sidebarIngredient.y,
                state: 'raw',
                isFromSidebar: true
            };
        }

        return null;
    }

    handleIngredientPickup(character) {
        if (character.heldIngredient) return;

        // Check for completed meal pickup first
        if (this.canPickupCompletedMeal(character)) {
            this.pickupCompletedMeal(character);
            return;
        }

        // Then check for other ingredients
        const foundIngredient = this.findInteractingIngredient(character);
        if (foundIngredient) {
            if (foundIngredient.isFromStation) {
                this.pickupStationIngredient(character, foundIngredient);
            } else {
                this.pickupBasketIngredient(character, foundIngredient);
            }
        }
    }

    canPickupCompletedMeal(character) {
        return character.currentZone === 'cookingStation' && 
               this.placedIngredients.cookingStation.length > 0 && 
               this.placedIngredients.cookingStation[0].isCompletedMeal;
    }

    pickupCompletedMeal(character) {
        const completedMeal = this.placedIngredients.cookingStation[0];
        
        // Clean up timers
        if (completedMeal.timer) completedMeal.timer.remove();
        if (completedMeal.updateTimer) completedMeal.updateTimer.remove();
        if (completedMeal.timerContainer) completedMeal.timerContainer.destroy();

        // Create new game object with completed meal texture
        const gameObject = this.scene.add.image(
            character.x,
            character.y - 20,
            completedMeal.result
        ).setScale(0.2);

        // Set up held ingredient
        character.heldIngredient = {
            name: completedMeal.name,
            gameObject: gameObject,
            isCompletedMeal: true,
            points: completedMeal.points,
            result: completedMeal.result,
            state: 'completed'
        };
        
        // Cleanup
        completedMeal.gameObject.destroy();
        this.placedIngredients.cookingStation = [];
        
        this.playPickupSound();
    }

    pickupBasketIngredient(character, ingredient) {
        // Stop pulsing if applicable
        if (ingredient.isPulsing) {
            this.removePulseEffect(ingredient);
            ingredient.isPulsing = false;
            ingredient.pulsingCharacter = null;
        }

        // Create new instance with type 1 texture (raw state)
        character.heldIngredient = this.createIngredientInstance(
            ingredient.name,
            character.x,
            character.y - 20,
            'raw',
            0.2,
            1  // Use type 1 texture
        );

        this.playPickupSound();
    }

    pickupStationIngredient(character, ingredient) {
        // Determine texture type based on state
        let textureType = 0;
        if (ingredient.state === 'raw') {
            textureType = 1;
        } else if (ingredient.state === 'prepped') {
            textureType = 2;
        }

        // Create new instance with correct texture type
        character.heldIngredient = this.createIngredientInstance(
            ingredient.name,
            character.x,
            character.y - 20,
            ingredient.state || 'raw',
            0.3,
            textureType  // Use the determined texture type
        );

        this.playPickupSound();
    }

    playPickupSound() {
        const pickupSound = this.scene.sound.add('pickupSound');
        pickupSound.play({ volume: 0.3 });
    }

    handleIngredientDropOff(character, zoneName) {
        if (!character.heldIngredient) return;
        
        switch (zoneName) {
            case 'readyTable':
                if (character.heldIngredient.isCompletedMeal) {
                    this.handleReadyTableDropoff(character);
                }
                break;
            case 'leftTrash':
            case 'rightTrash':
                this.handleTrashDisposal(character);
                break;
            case 'cuttingBoard':
            case 'leftCuttingBoard':
                this.scene.cuttingManager.handleCuttingBoardDropoff(character, zoneName);
                break;
            case 'cookingStation':
                this.handleCookingStationDropoff(character);
                break;
            case 'divider':
                this.handleDividerDropoff(character);
                break;
        }
    }

    handleDividerDropoff(character) {
        if (!character.heldIngredient) return;

        const divider = this.scene.zoneManager.getZone('divider');
        if (!divider) return;

        const emptySlot = this.dividerSlots.find(slot => !slot.occupied);
        if (!emptySlot) return;

        const droppedIngredient = character.heldIngredient;

        // Position the ingredient
        droppedIngredient.gameObject.setPosition(
            divider.x + divider.width / 2,
            emptySlot.y
        );

        // Mark slot as occupied
        emptySlot.occupied = true;
        droppedIngredient.slotIndex = this.dividerSlots.indexOf(emptySlot);

        // Add to placed ingredients
        this.placedIngredients.divider.push(droppedIngredient);

        // Create timer container
        const timerContainer = this.scene.add.container(
            divider.x + divider.width / 2,
            emptySlot.y - 30
        );

        // Add timer background
        const timerBg = this.scene.add.rectangle(0, 0, 50, 20, 0x000000, 0.5)
            .setOrigin(0.5);
        timerContainer.add(timerBg);

        // Add timer text
        const timerText = this.scene.add.text(0, 0, '10', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        timerContainer.add(timerText);

        // Create timer
        const timer = this.scene.time.addEvent({
            delay: 10000,
            callback: () => {
                // Apply penalty points
                this.scene.addPoints(-10);
                
                // Play trash disposal sound
                const trashSound = this.scene.sound.add('trashDisposalSound');
                trashSound.play({ volume: 0.3 });

                // Create trash effect at ingredient position
                this.scene.createTrashEffect(
                    droppedIngredient.gameObject.x,
                    droppedIngredient.gameObject.y
                );

                // Destroy the ingredient when timer runs out
                droppedIngredient.gameObject.destroy();
                if (droppedIngredient.interactiveZone) {
                    droppedIngredient.interactiveZone.destroy();
                }
                if (droppedIngredient.debugVisual) {
                    droppedIngredient.debugVisual.destroy();
                }
                timerContainer.destroy();
                
                // Clear the slot
                this.dividerSlots[droppedIngredient.slotIndex].occupied = false;
                
                // Remove from placed ingredients
                this.placedIngredients.divider = this.placedIngredients.divider.filter(
                    ing => ing !== droppedIngredient
                );
            }
        });

        // Update timer text every second
        const updateTimer = this.scene.time.addEvent({
            delay: 1000,
            repeat: 9,
            callback: () => {
                if (!timerContainer.active) {
                    updateTimer.remove();
                    return;
                }
                const remaining = Math.ceil((10000 - timer.getElapsed()) / 1000);
                if (remaining >= 0) {
                    timerText.setText(remaining.toString());
                }
            }
        });

        // Store timer and container references with the ingredient
        droppedIngredient.timer = timer;
        droppedIngredient.updateTimer = updateTimer;
        droppedIngredient.timerContainer = timerContainer;

        // Clear held ingredient
        character.heldIngredient = null;
    }

    handleCookingStationDropoff(character) {
        if (!character.heldIngredient) return;

        const cookingStation = this.scene.zoneManager.getZone('cookingStation');
        if (!cookingStation) return;

        const dropPos = {
            x: cookingStation.x + cookingStation.width / 2,
            y: cookingStation.y + cookingStation.height / 2
        };

        // Set position and adjust scale for visibility
        character.heldIngredient.gameObject
            .setPosition(dropPos.x, dropPos.y)
            .setScale(0.3);

        // Store original scale with the ingredient
        character.heldIngredient.originalScale = 0.3;
        
        this.placedIngredients.cookingStation.push(character.heldIngredient);
        
        // Start cooking process
        this.scene.cookingManager.startCooking();
        
        character.heldIngredient = null;
    }

    startCompletedMealTimer(completedMeal) {
        // Create timer container above the meal
        const timerContainer = this.scene.add.container(
            completedMeal.gameObject.x,
            completedMeal.gameObject.y - 40
        );

        // Add timer background
        const timerBg = this.scene.add.rectangle(0, 0, 30, 20, 0x000000, 0.5)
            .setOrigin(0.5);
        timerContainer.add(timerBg);

        // Add timer text
        const timerText = this.scene.add.text(0, 0, '5', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        timerContainer.add(timerText);

        // Create timer
        const timer = this.scene.time.addEvent({
            delay: 5000,
            callback: () => {
                // Apply penalty points
                this.scene.addPoints(-40);
                
                // Play trash disposal sound
                const trashSound = this.scene.sound.add('trashDisposalSound');
                trashSound.play({ volume: 0.3 });

                // Create penalty effect
                this.createPenaltyEffect(
                    completedMeal.gameObject.x, 
                    completedMeal.gameObject.y, 
                    40
                );

                // Destroy the meal and timer
                completedMeal.gameObject.destroy();
                timerContainer.destroy();
                
                // Clear cooking station
                this.placedIngredients.cookingStation = [];
            }
        });

        // Update timer text every second
        const updateTimer = this.scene.time.addEvent({
            delay: 1000,
            repeat: 4,
            callback: () => {
                if (!timerContainer.active) {
                    updateTimer.remove();
                    return;
                }
                const remaining = Math.ceil((5000 - timer.getElapsed()) / 1000);
                if (remaining >= 0) {
                    timerText.setText(remaining.toString());
                }
            }
        });

        // Store timer references with the meal
        completedMeal.timer = timer;
        completedMeal.updateTimer = updateTimer;
        completedMeal.timerContainer = timerContainer;
    }

    handleTrashDisposal(character) {
        if (!character.heldIngredient) return;

        const x = character.heldIngredient.gameObject.x;
        const y = character.heldIngredient.gameObject.y;

        // Clean up the ingredient
        character.heldIngredient.gameObject.destroy();
        if (character.heldIngredient.interactiveZone) {
            character.heldIngredient.interactiveZone.destroy();
        }
        if (character.heldIngredient.debugVisual) {
            character.heldIngredient.debugVisual.destroy();
        }

        // Create trash effect and deduct points
        const trashSound = this.scene.sound.add('trashDisposalSound');
        trashSound.play({ volume: 0.3 });
        this.createTrashEffect(x, y);
        this.scene.addPoints(-5);

        character.heldIngredient = null;
    }

    handleReadyTableDropoff(character) {
        if (!character.heldIngredient?.isCompletedMeal) return;

        const readyTable = this.scene.zoneManager.getZone('readyTable');
        if (!readyTable) return;

        const meal = character.heldIngredient;
        const points = meal.points || 50;
        
        // Position the meal
        meal.gameObject.setPosition(
            readyTable.x + readyTable.width / 2,
            readyTable.y + readyTable.height / 2
        );

        // Create success effect and add points
        this.createSuccessEffect(meal.gameObject.x, meal.gameObject.y, points);
        this.scene.addPoints(points);

        // Fade out and destroy
        this.scene.tweens.add({
            targets: meal.gameObject,
            alpha: 0,
            duration: 1500,
            onComplete: () => meal.gameObject.destroy()
        });

        character.heldIngredient = null;
    }

    updateHeldIngredients() {
        const updateCharacterIngredient = (character) => {
            if (character.heldIngredient) {
                const centerX = character.x + character.displayWidth / 2;
                const centerY = character.y - 20;
                
                // Update game object position
                character.heldIngredient.gameObject.setPosition(centerX, centerY);
                
                // Update interactive zone position
                if (character.heldIngredient.interactiveZone) {
                    character.heldIngredient.interactiveZone.setPosition(centerX, centerY);
                    
                    // Update debug visual to match zone's new position
                    if (character.heldIngredient.debugVisual) {
                        const zoneBounds = character.heldIngredient.interactiveZone.getBounds();
                        character.heldIngredient.debugVisual.setPosition(
                            zoneBounds.x + zoneBounds.width / 2,
                            zoneBounds.y + zoneBounds.height / 2
                        );
                    }
                }
                
                // Update debug text position
                if (character.heldIngredient.debugText) {
                    character.heldIngredient.debugText.setPosition(centerX, centerY);
                }
            }
        };

        updateCharacterIngredient(this.scene.characterManager.chef);
        updateCharacterIngredient(this.scene.characterManager.sousChef);
    }

    getCookingStationIngredients() {
        return this.placedIngredients.cookingStation.map(ing => ing.name);
    }

    addPulseEffectToPickupable(character) {
        // Don't pulse if character is holding something
        if (character.heldIngredient) return;

        const charBounds = character.interactionZone.getBounds();
        let overlappingIngredient = null;

        // Check for overlap with raw ingredients in sidebar
        if (character.currentZone === 'sidebar') {
            this.ingredients.forEach(ingredient => {
                const ingBounds = ingredient.interactiveZone.getBounds();
                if (Phaser.Geom.Rectangle.Overlaps(charBounds, ingBounds)) {
                    overlappingIngredient = ingredient;
                } else if (ingredient.isPulsing && ingredient.pulsingCharacter === character) {
                    // Stop pulsing if no longer overlapping
                    this.removePulseEffect(ingredient);
                    ingredient.isPulsing = false;
                    ingredient.pulsingCharacter = null;
                }
            });
        }
        // Check for overlap with placed ingredients
        else if (character.currentZone && this.placedIngredients[character.currentZone]) {
            const zoneIngredients = this.placedIngredients[character.currentZone];
            if (zoneIngredients.length > 0) {
                const topIngredient = zoneIngredients[zoneIngredients.length - 1];
                const ingBounds = topIngredient.gameObject.getBounds();
                if (Phaser.Geom.Rectangle.Overlaps(charBounds, ingBounds)) {
                    overlappingIngredient = topIngredient;
                } else if (topIngredient.isPulsing && topIngredient.pulsingCharacter === character) {
                    // Stop pulsing if no longer overlapping
                    this.removePulseEffect(topIngredient);
                    topIngredient.isPulsing = false;
                    topIngredient.pulsingCharacter = null;
                }
            }
        }

        // Start pulsing if overlapping and not already pulsing
        if (overlappingIngredient && !overlappingIngredient.isPulsing) {
            overlappingIngredient.isPulsing = true;
            overlappingIngredient.pulsingCharacter = character;
            this.addPulseEffect(overlappingIngredient);
        }
    }

    createTrashEffect(x, y) {
        // Create the "-5" text effect
        const penaltyText = this.scene.add.text(x, y, '-5', {
            fontSize: '32px',
            fontWeight: 'bold',
            fill: '#FF0000'
        }).setOrigin(0.5);

        // Simple red flash
        const flash = this.scene.add.rectangle(x, y, 50, 50, 0xff0000)
            .setAlpha(0.7)
            .setOrigin(0.5);

        // Animate the text
        this.scene.tweens.add({
            targets: penaltyText,
            y: y - 100,
            alpha: 0,
            duration: 1000,
            ease: 'Power1',
            onComplete: () => penaltyText.destroy()
        });

        // Animate the flash
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 300,
            onComplete: () => flash.destroy()
        });

        // Add camera shake
        this.scene.cameras.main.shake(200, 0.005);
    }

    createSuccessEffect(x, y, points) {
        // Create success text
        const successText = this.scene.add.text(x, y, `+${points}`, {
            fontSize: '32px',
            fontWeight: 'bold',
            fill: '#00ff00'
        }).setOrigin(0.5);

        // Animate success text
        this.scene.tweens.add({
            targets: successText,
            y: y - 150,
            alpha: 0,
            duration: 2000,
            ease: 'Power1',
            onComplete: () => successText.destroy()
        });

        // Play success sound
        const successSound = this.scene.sound.add('pickupSound');
        successSound.play({ volume: 0.3 });
    }

    createPenaltyEffect(x, y, points) {
        // Simple text effect
        const penaltyText = this.scene.add.text(x, y, `-${points}`, {
            fontSize: '24px',
            fontWeight: 'bold',
            fill: '#FF4D4D'
        }).setOrigin(0.5);

        // Subtle fade-up animation
        this.scene.tweens.add({
            targets: penaltyText,
            y: y - 50,
            alpha: 0,
            duration: 800,
            ease: 'Power1',
            onComplete: () => penaltyText.destroy()
        });

        // Small flash effect
        const flash = this.scene.add.rectangle(x, y, 40, 40, 0xff0000)
            .setAlpha(0.3)
            .setOrigin(0.5);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 1.5,
            duration: 200,
            onComplete: () => flash.destroy()
        });

        // Camera shake
        this.scene.cameras.main.shake(150, 0.02);

        // Play sound effect
        const trashSound = this.scene.sound.add('trashDisposalSound');
        trashSound.play({ volume: 0.2 });
    }

    handlePlayerInteraction(character) {
        // If holding an ingredient, handle drop off
        if (character.heldIngredient) {
            this.handleIngredientDropOff(character, character.currentZone);
            return;
        }

        // Otherwise, try to pick up an ingredient
        this.handleIngredientPickup(character);
    }

}