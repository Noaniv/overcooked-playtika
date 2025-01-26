export class IngredientManager {
    constructor(scene) {
        this.scene = scene;
        this.ingredients = [];
        this.placedIngredients = {
            divider: [],
            cookingStation: [],
            cuttingBoard: [],
            leftCuttingBoard: [],
            sidebar: []
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

    // New method to create a single ingredient
    createIngredient(name, x, y, scale = 1) {
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
            this.createIngredient(
                config.name,
                config.x,
                config.y,
                config.scale || 1
            );
        });
    }

    createIngredientZone(x, y, name) {
        // Check if the ingredient is meat and adjust size
        const isMeat = name.toLowerCase().includes('meat');
        const width = isMeat ? 130 : 125; // Increase width for meat
        const height = isMeat ? 200 : 85; // Increase height for meat

        const zone = this.scene.add.zone(x, y, width, height)
            .setOrigin(0.5)
            .setName(name);

        this.scene.physics.add.existing(zone, true);
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

    findInteractingIngredient(character) {
        // Debug the interaction check
        console.log('Checking interaction zones');
        
        // First check cooking station if character is in that zone
        if (character.currentZone === 'cookingStation' && 
            this.placedIngredients.cookingStation.length > 0) {
            
            const cookingStationIngredients = this.placedIngredients.cookingStation;
            const topIngredient = cookingStationIngredients[cookingStationIngredients.length - 1];
            
            // Check if character's interaction zone overlaps with the ingredient
            const charBounds = character.interactionZone.getBounds();
            const ingBounds = topIngredient.gameObject.getBounds();
            
            if (Phaser.Geom.Rectangle.Overlaps(charBounds, ingBounds) && !topIngredient.isCompletedMeal) {
                console.log('Found ingredient in cooking station:', topIngredient);
                // Remove from cooking station
                this.placedIngredients.cookingStation.pop();
                return topIngredient;
            }
        }
        
        // Then check raw ingredients in sidebar
        const interactingIngredient = this.ingredients.find(ingredient => {
            const bounds = ingredient.interactiveZone.getBounds();
            const charBounds = character.interactionZone.getBounds();
            const isOverlapping = Phaser.Geom.Rectangle.Overlaps(bounds, charBounds);
            
            console.log('Checking ingredient:', {
                name: ingredient.name,
                ingredientBounds: bounds,
                characterBounds: charBounds,
                isOverlapping
            });
            
            return isOverlapping;
        });

        return interactingIngredient;
    }

    handleIngredientPickup(character) {
        if (character.heldIngredient) return;

        // Debug logs
        console.log('Attempting pickup:', {
            character: character === this.scene.characterManager.chef ? 'chef' : 'sousChef',
            currentZone: character.currentZone,
            position: { x: character.x, y: character.y }
        });

        // First check if we're at cooking station and there's a completed meal
        if (character.currentZone === 'cookingStation' && 
            this.placedIngredients.cookingStation.length > 0 && 
            this.placedIngredients.cookingStation[0].isCompletedMeal) {
            
            const completedMeal = this.placedIngredients.cookingStation[0];
            console.log('Picking up completed meal:', completedMeal);
            
            character.heldIngredient = completedMeal;
            this.placedIngredients.cookingStation = [];
            
            // Play pickup sound
            const pickupSound = this.scene.sound.add('pickupSound');
            pickupSound.play({ volume: 0.3 });
            return;
        }

        // Then check for raw ingredients
        const rawIngredient = this.findInteractingIngredient(character);
        if (rawIngredient) {
            console.log('Found raw ingredient:', {
                name: rawIngredient.name,
                position: { x: rawIngredient.x, y: rawIngredient.y }
            });

            // Stop pulsing the raw ingredient
            if (rawIngredient.isPulsing) {
                this.removePulseEffect(rawIngredient);
                rawIngredient.isPulsing = false;
                rawIngredient.pulsingCharacter = null;
            }

            // Create new instance of ingredient with texture1
            const newIngredient = {
                name: rawIngredient.name,
                gameObject: this.scene.add.image(
                    rawIngredient.x,
                    rawIngredient.y,
                    `${rawIngredient.name.toLowerCase()}1`
                )
                    .setScale(0.3)
                    .setOrigin(0.5),
                state: 'raw',
                originalScale: 0.2,
                interactiveZone: this.createIngredientZone(rawIngredient.x, rawIngredient.y, rawIngredient.name)
            };

            character.heldIngredient = newIngredient;
            console.log('Picked up ingredient:', newIngredient);

            // Play pickup sound
            const pickupSound = this.scene.sound.add('pickupSound');
            pickupSound.play({ volume: 0.3 });
        } else {
            console.log('Failed to pick up ingredient');
        }
    }

    handleIngredientDropOff(character, zoneName) {
        if (!character.heldIngredient) return;
        
        const heldIngredient = character.heldIngredient;
        
        switch (zoneName) {
            case 'divider':
                this.handleDividerDropoff(character);
                break;
            case 'cookingStation':
                this.handleCookingStationDropoff(character);
                break;
            case 'cuttingBoard':
            case 'leftCuttingBoard':
                this.dropInCuttingBoard(character, zoneName);
                break;
            case 'readyTable':
                this.handleReadyTableDropoff(character);
                break;
            default:
                return;
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
        character.heldIngredient = null;

        // Check recipe completion after adding new ingredient
        const currentIngredients = this.placedIngredients.cookingStation.map(ing => ing.name);
        console.log('Checking recipe with ingredients:', currentIngredients);

        if (this.scene.recipeManager.checkRecipeCompletion(this.placedIngredients.cookingStation)) {
            console.log('Recipe complete!');
            // Create the completed meal
            const recipe = this.scene.recipeManager.currentRecipe;
            const completedMeal = {
                name: recipe.name,
                gameObject: this.scene.add.image(dropPos.x, dropPos.y, recipe.result)
                    .setScale(0.4),
                isCompletedMeal: true,
                points: 50
            };

            // Clear cooking station ingredients
            this.clearCookingStation();

            // Place completed meal
            this.placedIngredients.cookingStation.push(completedMeal);

            // Move to next recipe
            this.scene.recipeManager.completeRecipe();
        } else {
            console.log('Recipe not complete yet');
        }
    }

    dropInCuttingBoard(character, zoneName) {
        const cuttingBoard = this.scene.zoneManager.getZone(zoneName);
        if (!cuttingBoard) return;
        
        character.heldIngredient.gameObject.setPosition(
            cuttingBoard.x + cuttingBoard.width / 2,
            cuttingBoard.y + cuttingBoard.height / 2
        );

        this.placedIngredients[zoneName].push(character.heldIngredient);
        
        if (!this.scene.cuttingManager.isCutting) {
            this.scene.cuttingManager.startCuttingTimer(character);
        }
        
        character.heldIngredient = null;
    }

    handleTrashDisposal(character) {
        if (!character.heldIngredient) return;

        const x = character.heldIngredient.gameObject.x;
        const y = character.heldIngredient.gameObject.y;

        character.heldIngredient.gameObject.destroy();
        if (character.heldIngredient.interactiveZone) {
            character.heldIngredient.interactiveZone.destroy();
        }
        if (character.heldIngredient.debugVisual) {
            character.heldIngredient.debugVisual.destroy();
        }

        const trashSound = this.scene.sound.add('trashDisposalSound');
        trashSound.play({ volume: 0.3 });

        this.scene.createTrashEffect(x, y);
        character.heldIngredient = null;
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
        
        this.placedIngredients.cuttingBoard = [];
        this.placedIngredients.leftCuttingBoard = [];
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

    handleReadyTableDropoff(character) {
        if (!character.heldIngredient || !character.heldIngredient.isCompletedMeal) {
            return; // Only allow completed meals to be dropped at ready table
        }

        const readyTable = this.scene.zoneManager.getZone('readyTable');
        if (!readyTable) return;

        const meal = character.heldIngredient;
        
        // Clear the character's held ingredient
        character.heldIngredient = null;

        // Position the meal at the ready table
        meal.gameObject.setPosition(
            readyTable.x + readyTable.width / 2,
            readyTable.y + readyTable.height / 2
        );

        // Add points
        this.scene.addPoints(meal.points || 50);

        // Create success effect
        this.createSuccessEffect(meal.gameObject.x, meal.gameObject.y);

        // Fade out and destroy the meal
        this.scene.tweens.add({
            targets: meal.gameObject,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                meal.gameObject.destroy();
            }
        });
    }

    createSuccessEffect(x, y) {
        // Create a success text effect
        const successText = this.scene.add.text(x, y, '+50', {
            fontSize: '32px',
            fontWeight: 'bold',
            fill: '#00ff00'
        }).setOrigin(0.5);

        // Animate the text
        this.scene.tweens.add({
            targets: successText,
            y: y - 100,
            alpha: 0,
            duration: 1000,
            ease: 'Power1',
            onComplete: () => successText.destroy()
        });

        // Add a flash effect
        const flash = this.scene.add.rectangle(x, y, 100, 100, 0x00ff00)
            .setAlpha(0.5)
            .setOrigin(0.5);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 300,
            onComplete: () => flash.destroy()
        });

        // Play success sound
        const successSound = this.scene.sound.add('pickupSound');
        successSound.play({ volume: 0.3 });
    }
}