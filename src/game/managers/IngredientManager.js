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
            .setStrokeStyle(2, 0x00ff00),
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
        const zone = this.scene.add.zone(x, y, 125, 85)
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
            ingredient.gameObject.destroy();
        });
        this.placedIngredients.cookingStation = [];
    }

    findInteractingIngredient(character) {
        return this.ingredients.find(ingredient => {
            const bounds = ingredient.interactiveZone.getBounds();
            const charBounds = character.interactionZone.getBounds();
            return Phaser.Geom.Rectangle.Overlaps(bounds, charBounds);
        });
    }

    handleIngredientPickup(character) {
        if (character.heldIngredient) return;

        // First check if we're overlapping with any raw ingredient
        const rawIngredient = this.findInteractingIngredient(character);
        if (rawIngredient) {
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
                    .setScale(0.2)  // Set consistent scale for held ingredients
                    .setOrigin(0.5),
                state: 'raw',
                originalScale: 0.2,  // Store the scale for reference
                interactiveZone: this.createIngredientZone(rawIngredient.x, rawIngredient.y, rawIngredient.name)
            };

            character.heldIngredient = newIngredient;
        }
        // If not overlapping with a raw ingredient, check placed ingredients
        else if (character.currentZone) {
            const zoneIngredients = this.placedIngredients[character.currentZone];
            if (!zoneIngredients || zoneIngredients.length === 0) return;

            const ingredient = zoneIngredients[zoneIngredients.length - 1];
            
            // Stop pulsing the ingredient being picked up
            if (ingredient.isPulsing) {
                this.removePulseEffect(ingredient);
                ingredient.isPulsing = false;
                ingredient.pulsingCharacter = null;
            }

            // Ensure consistent scale when picking up from zones
            ingredient.gameObject.setScale(0.2);
            ingredient.originalScale = 0.2;
            
            if (character.currentZone === 'divider') {
                if (ingredient.timer) {
                    ingredient.timer.remove();
                    ingredient.timer = null;
                }
                if (ingredient.timerContainer) {
                    ingredient.timerContainer.destroy();
                    ingredient.timerContainer = null;
                }
                
                if (typeof ingredient.slotIndex === 'number') {
                    this.dividerSlots[ingredient.slotIndex].occupied = false;
                    ingredient.slotIndex = undefined;
                }
            }

            zoneIngredients.pop();
            character.heldIngredient = ingredient;
        }

        // Play pickup sound if we picked up something
        if (character.heldIngredient) {
            const pickupSound = this.scene.sound.add('pickupSound');
            pickupSound.play({ volume: 0.3 });
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

        const dropPos = this.scene.zoneManager.getDropPosition('cookingStation', character);
        if (!dropPos) return;

        character.heldIngredient.gameObject.setPosition(dropPos.x, dropPos.y);
        this.placedIngredients.cookingStation.push(character.heldIngredient);
        character.heldIngredient = null;

        if (this.scene.cookingManager) {
            this.scene.cookingManager.startCooking();
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
}