export class IngredientManager {
    constructor(scene) {
        this.scene = scene;
        this.ingredients = [];
        this.placedIngredients = {
            divider: [],
            cookingStation: [],
            cuttingBoard: []
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
        const spacing = 150;
        const startY = 100;

        ingredients.forEach((name, index) => {
            const y = startY + (spacing * index);
            const ingredient = {
                name: name,
                x: sidebarX + 40,
                y: y,
                gameObject: this.scene.add.image(sidebarX + 1200, y, `${name.toLowerCase()}1`)
                    .setScale(0.25),
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

            // Add pulse effect to the ingredient
            this.addPulseEffect(ingredient);

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

    handleIngredientPickup(player, zoneName) {
        const isSousChef = player === this.scene.characterManager.sousChef;
        
        if (zoneName === 'sidebar') {
            console.log('Attempting sidebar pickup:', {
                player: player === this.scene.characterManager.chef ? 'chef' : 'sousChef',
                zoneName
            });
            
            // Find ingredient that player is interacting with
            const ingredient = this.findInteractingIngredient(player);
            console.log('Found ingredient:', ingredient?.name);
            
            if (!ingredient) return false;
            
            // Play pickup sound
            this.scene.sound.play('pickupSound', { volume: 0.5 });

            // Create a new copy of the ingredient for the player to hold
            const newIngredient = {
                name: ingredient.name,
                x: ingredient.x,
                y: ingredient.y,
                gameObject: this.scene.add.image(
                    player.x + player.displayWidth / 2,
                    player.y - 20,
                    `${ingredient.name.toLowerCase()}1`
                ).setScale(0.3),
                interactiveZone: this.createIngredientZone(
                    player.x + player.displayWidth / 2,
                    player.y - 20,
                    ingredient.name
                ),
                debugVisual: this.scene.add.rectangle(
                    player.x + player.displayWidth / 2,
                    player.y - 20,
                    85,
                    85,
                    0x00ff00,
                    0
                )
                    .setOrigin(0.5)
                    .setStrokeStyle(0, 0x00ff00),
                debugText: this.scene.add.text(
                    ingredient.x,
                    ingredient.y,
                    ingredient.name,
                    { fontSize: '16px', color: '#000000', backgroundColor: null } // Black text on a black background
                ).setOrigin(0.5).setAlpha(0)
            };
            
            // Add physics to the new ingredient
            this.scene.physics.add.existing(newIngredient.gameObject, true);
            
            // Setup overlaps for this new ingredient zone
            this.scene.characterManager.setupIngredientOverlaps([newIngredient.interactiveZone]);
            
            // Assign the new ingredient to the player
            player.heldIngredient = newIngredient;
            return true;
        } else {
            // For non-sidebar zones, pick up the actual ingredient
            if (this.placedIngredients[zoneName] && this.placedIngredients[zoneName].length > 0) {
                // Find the closest ingredient in the zone that the player can interact with
                let closestIngredient = null;
                let closestDistance = Infinity;
                
                this.placedIngredients[zoneName].forEach(ing => {
                    const playerX = player.x + player.displayWidth / 2;
                    const playerY = player.y + player.displayHeight / 2;
                    const distance = Phaser.Math.Distance.Between(
                        playerX,
                        playerY,
                        ing.x,
                        ing.y
                    );
                    
                    if (distance < closestDistance && distance < 100) { // 100 is interaction radius
                        closestDistance = distance;
                        closestIngredient = ing;
                    }
                });
                
                // Only pick up if we're overlapping with the ingredient
                if (!closestIngredient) return false;

                // For divider, only sous chef can pick up from right side, chef from left side
                if (zoneName === 'divider') {
                    const zone = this.scene.zoneManager.getZone('divider');
                    const playerX = player.x + player.displayWidth / 2;
                    const dividerCenterX = zone.x + zone.width / 2;
                    
                    if (isSousChef && playerX < dividerCenterX) {
                        console.log('Sous chef must pick up from right side');
                        return false;
                    }
                    if (!isSousChef && playerX > dividerCenterX) {
                        console.log('Chef must pick up from left side');
                        return false;
                    }
                }

                // Play pickup sound
                this.scene.sound.play('pickupSound', { volume: 0.5 });

                // Transfer all properties including debug visuals
                const pickedUpIngredient = {
                    ...closestIngredient,
                    debugVisual: closestIngredient.debugVisual,
                    debugText: closestIngredient.debugText
                };

                this.removeIngredient(zoneName, closestIngredient);
                player.heldIngredient = pickedUpIngredient;
                return true;
            }
        }
        return false;
    }

    findInteractingIngredient(player) {
        const characterType = player === this.scene.characterManager.chef ? 'chef' : 'sousChef';
        
        // Debug log the current overlaps
        console.log('Current overlaps:', {
            characterType,
            overlaps: this.scene.characterManager.activeIngredientOverlaps[characterType],
            allOverlaps: this.scene.characterManager.activeIngredientOverlaps
        });

        // Get all ingredients the character is currently overlapping with
        const overlappingIngredients = Array.from(this.scene.characterManager.activeIngredientOverlaps[characterType])
            .map(name => this.ingredients.find(ing => ing.name === name))
            .filter(ing => ing !== undefined);
        
        console.log('Found overlapping ingredients:', overlappingIngredients);
        
        if (overlappingIngredients.length === 0) return null;
        
        // If only one ingredient, return it
        if (overlappingIngredients.length === 1) {
            return overlappingIngredients[0];
        }
        
        // If multiple ingredients, find the closest one
        const playerCenter = {
            x: player.x + player.displayWidth / 2,
            y: player.y + player.displayHeight / 2
        };
        
        // Debug log player position
        console.log('Player position:', playerCenter);
        
        return overlappingIngredients.reduce((closest, current) => {
            if (!closest) return current;
            
            const closestDist = Phaser.Math.Distance.Between(
                playerCenter.x, playerCenter.y,
                closest.x, closest.y
            );
            
            const currentDist = Phaser.Math.Distance.Between(
                playerCenter.x, playerCenter.y,
                current.x, current.y
            );
            
            // Debug log distances
            console.log('Distance comparison:', {
                ingredient: current.name,
                distance: currentDist,
                closestSoFar: closest.name,
                closestDistance: closestDist
            });
            
            return currentDist < closestDist ? current : closest;
        }, null);
    }

    handleIngredientDropOff(player, zoneName) {
        if (!player.heldIngredient) return false;

        // Verify player is still in the zone
        if (!this.scene.characterManager.isInZone(player, zoneName)) return false;

        // Skip if trying to drop at ready table - this is handled separately
        if (zoneName === 'readyTable') return false;

        const isSousChef = player === this.scene.characterManager.sousChef;
        
        // Sous chef can only drop in right trash or divider
        if (isSousChef && !['rightTrash', 'divider'].includes(zoneName)) {
            return false;
        }

        const zone = this.scene.zoneManager.getZone(zoneName);
        if (!zone) return false;

        let dropY = zone.y + zone.height / 2; // Default center position
        let slotIndex = -1;

        // For divider zone, check if there's an available slot
        if (zoneName === 'divider') {
            const availableSlot = this.dividerSlots.find(slot => !slot.occupied);
            if (!availableSlot) {
                console.log('No available slots in divider');
                return false;
            }
            
            // Verify the slot is within divider bounds
            if (availableSlot.y < zone.y || availableSlot.y > zone.y + zone.height) {
                console.log('Slot position outside divider bounds');
                return false;
            }

            // Find which slot the player is closest to
            const playerY = player.y + player.displayHeight / 2;
            let closestSlot = null;
            let closestDistance = Infinity;
            let closestIndex = -1;

            this.dividerSlots.forEach((slot, index) => {
                const distance = Math.abs(playerY - slot.y);
                if (distance < closestDistance && !slot.occupied) {
                    closestDistance = distance;
                    closestSlot = slot;
                    closestIndex = index;
                }
            });

            // If no unoccupied slot is found or player is too far from any slot
            if (!closestSlot || closestDistance > 100) {
                console.log('No available slot near player');
                return false;
            }

            // Use the closest available slot
            slotIndex = closestIndex;
            dropY = closestSlot.y;
        }

        const dropPosition = this.scene.zoneManager.getDropPosition(zoneName, player);
        if (!dropPosition) return false;

        // Create and position the new ingredient
        const newIngredient = { 
            name: player.heldIngredient.name,
            gameObject: player.heldIngredient.gameObject,
            x: zone.x + zone.width / 2,
            y: dropY,
            timer: null,
            timeText: null,
            interactiveZone: player.heldIngredient.interactiveZone,
            debugVisual: player.heldIngredient.debugVisual,
            debugText: player.heldIngredient.debugText,
            slotIndex: slotIndex
        };

        // Update positions
        newIngredient.gameObject.setPosition(newIngredient.x, newIngredient.y);
        newIngredient.interactiveZone.setPosition(newIngredient.x, newIngredient.y);

        // Mark slot as occupied for divider
        if (zoneName === 'divider' && slotIndex !== -1) {
            this.dividerSlots[slotIndex].occupied = true;
        }

        // Place ingredient before adding timer
        this.placeIngredient(zoneName, newIngredient);
        
        // Now that we know the drop-off was successful, play the appropriate sound
        if (zoneName === 'leftTrash' || zoneName === 'rightTrash') {
            try {
                console.log('Playing trash sound...');
                const trashSound = this.scene.sound.add('trashDisposalSound');
                if (!trashSound) {
                    console.error('Failed to create trash sound');
                    return;
                }
                trashSound.play({ volume: 1 });
                console.log('Trash sound started playing');
                trashSound.once('complete', () => {
                    console.log('Trash sound completed');
                    trashSound.destroy();
                });
            } catch (error) {
                console.error('Error playing trash sound:', error);
            }
        } else if (zoneName === 'cookingStation') {
            const cookingSound = this.scene.sound.add('cookingKitchenSound');
            cookingSound.play({ volume: 0.5 });
            cookingSound.once('complete', () => {
                cookingSound.destroy();
            });
        }

        player.heldIngredient = null;

        // Only add timer for divider zone
        if (zoneName === 'divider') {
            this.addDespawnTimer(newIngredient, zoneName);
        }

        // Check recipe completion if dropping in cooking station
        if (zoneName === 'cookingStation') {
            if (this.scene.recipeManager.checkRecipeCompletion(this.placedIngredients.cookingStation)) {
                this.scene.recipeManager.completeRecipe();
            }
        }

        return true;
    }

    addDespawnTimer(ingredient, zoneName) {
        const zone = this.scene.zoneManager.getZone(zoneName);
        const timerOffset = 40;
        const timerX = Math.min(
            zone.x + zone.width - timerOffset,
            ingredient.x + timerOffset
        );

        // Create a container for the timer display
        const timerContainer = this.scene.add.container(timerX, ingredient.y);

        // Add background for better visibility
        const background = this.scene.add.rectangle(0, 0, 40, 30, 0x000000, 0.3)
            .setOrigin(0.5);
        
        const timeText = this.scene.add.text(
            0,
            0,
            '10',
            { 
                fontSize: '20px', 
                fill: '#ff0000',
                fontStyle: 'bold',
                backgroundColor: '#ffffff',
                padding: { x: 5, y: 2 }
            }
        ).setOrigin(0.5);

        timerContainer.add([background, timeText]);
        ingredient.timerContainer = timerContainer;
    
        let timeLeft = 10;
        ingredient.timer = this.scene.time.addEvent({
            delay: 1000,
            callback: () => {
                timeLeft--;
                if (timeLeft <= 0) {
                    this.scene.score -= 10;
                    this.scene.scoreText.setText(`Score: ${this.scene.score}`);
            
                    this.destroyIngredient(zoneName, ingredient);
                } else {
                    timeText.setText(timeLeft.toString());
                }
            },
            repeat: 10
        });
        ingredient.timeText = timerContainer;
    }

    destroyIngredient(zoneName, ingredient) {
        // Play trash disposal sound when ingredient despawns from divider
        if (zoneName === 'divider') {
            const despawnSound = this.scene.sound.add('trashDisposalSound');
            despawnSound.play({ volume: 0.3 });
            // Clean up sound after it's done
            despawnSound.once('complete', () => {
                despawnSound.destroy();
            });
        }

        // Clean up all visuals
        ingredient.gameObject.destroy();
        ingredient.timerContainer?.destroy();
        ingredient.interactiveZone?.destroy();
        ingredient.debugVisual?.destroy();
        ingredient.debugText?.destroy();
        
        // Free up the slot if it's in the divider
        if (zoneName === 'divider' && typeof ingredient.slotIndex === 'number') {
            this.dividerSlots[ingredient.slotIndex].occupied = false;
        }
        
        // Remove from placed ingredients array
        const index = this.placedIngredients[zoneName].indexOf(ingredient);
        if (index > -1) {
            this.placedIngredients[zoneName].splice(index, 1);
        }
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
}