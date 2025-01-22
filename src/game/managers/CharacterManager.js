export class CharacterManager {
    constructor(scene) {
        this.scene = scene;
        this.chef = null;
        this.sousChef = null;
        this.interactionZones = {
            chef: null,
            sousChef: null
        };
        this.INTERACTION_RADIUS = 60; // Radius for interaction zone
        // Track both zone and ingredient overlaps
        this.activeZoneOverlaps = {
            chef: new Set(),
            sousChef: new Set()
        };
        this.activeIngredientOverlaps = {
            chef: new Set(),
            sousChef: new Set()
        };
    }

    createCharacters(width, height) {
        // Create chef
        this.chef = this.scene.add.image(50, height / 4, 'ChefImage')
            .setOrigin(0)
            .setDisplaySize(130, 150)
            .setInteractive();
        
        // Create sous-chef
        this.sousChef = this.scene.add.image(width / 2 + 50, height / 4, 'Sous_chefImage')
            .setOrigin(0)
            .setDisplaySize(110, 120)
            .setInteractive();

        this.setupPhysics();
        this.createInteractionZones();
    }

    createInteractionZones() {
        // Create chef interaction zone
        const chefZone = this.scene.add.circle(
            this.chef.x + this.chef.displayWidth / 2,
            this.chef.y + this.chef.displayHeight / 2,
            this.INTERACTION_RADIUS,
            0x0000ff,
            0.2
        ).setDepth(-1);

        // Create sous-chef interaction zone
        const sousChefZone = this.scene.add.circle(
            this.sousChef.x + this.sousChef.displayWidth / 2,
            this.sousChef.y + this.sousChef.displayHeight / 2,
            this.INTERACTION_RADIUS,
            0xff0000,
            0.2
        ).setDepth(-1);

        // Create debug visuals for interaction zones
        const chefDebugZone = this.scene.add.circle(
            this.chef.x + this.chef.displayWidth / 2,
            this.chef.y + this.chef.displayHeight / 2,
            this.INTERACTION_RADIUS,
            0x0000ff,
            0.1
        ).setStrokeStyle(2, 0x0000ff);

        const sousChefDebugZone = this.scene.add.circle(
            this.sousChef.x + this.sousChef.displayWidth / 2,
            this.sousChef.y + this.sousChef.displayHeight / 2,
            this.INTERACTION_RADIUS,
            0xff0000,
            0.1
        ).setStrokeStyle(2, 0xff0000);

        // Add physics to interaction zones
        this.scene.physics.add.existing(chefZone, false);
        this.scene.physics.add.existing(sousChefZone, false);

        // Make zones follow characters
        chefZone.body.setCircle(this.INTERACTION_RADIUS);
        sousChefZone.body.setCircle(this.INTERACTION_RADIUS);

        // Store both the physics zones and debug visuals
        this.interactionZones = {
            chef: {
                physics: chefZone,
                debug: chefDebugZone
            },
            sousChef: {
                physics: sousChefZone,
                debug: sousChefDebugZone
            }
        };
    }

    setupPhysics() {
        // Enable physics for both characters
        this.scene.physics.add.existing(this.chef, false);
        this.scene.physics.add.existing(this.sousChef, false);

        // Configure physics bodies
        this.chef.body.setCollideWorldBounds(true);
        this.chef.body.setBounce(0);
        this.chef.body.setDrag(0);
        this.chef.heldIngredient = null;

        this.sousChef.body.setCollideWorldBounds(true);
        this.sousChef.body.setBounce(0);
        this.sousChef.body.setDrag(0);
        this.sousChef.heldIngredient = null;
    }

    handleMovement(keys) {
        const speed = 500;

        // Reset velocities
        this.chef.body.setVelocity(0);
        this.sousChef.body.setVelocity(0);

        // Chef movement
        if (keys.left.isDown && this.chef.x > 0) {
            this.chef.body.setVelocityX(-speed);
        }
        if (keys.right.isDown && this.chef.x + this.chef.displayWidth < this.scene.scale.width/2) {
            this.chef.body.setVelocityX(speed);
        }
        if (keys.up.isDown && this.chef.y > 0) {
            this.chef.body.setVelocityY(-speed);
        }
        if (keys.down.isDown && this.chef.y + this.chef.displayHeight < this.scene.scale.height) {
            this.chef.body.setVelocityY(speed);
        }

        // Sous-Chef movement
        if (keys.left2.isDown && this.sousChef.x > this.scene.scale.width/2) {
            this.sousChef.body.setVelocityX(-speed);
        }
        if (keys.right2.isDown && this.sousChef.x + this.sousChef.displayWidth < this.scene.scale.width) {
            this.sousChef.body.setVelocityX(speed);
        }
        if (keys.up2.isDown && this.sousChef.y > 0) {
            this.sousChef.body.setVelocityY(-speed);
        }
        if (keys.down2.isDown && this.sousChef.y + this.sousChef.displayHeight < this.scene.scale.height) {
            this.sousChef.body.setVelocityY(speed);
        }

        this.updateHeldIngredients();
        this.updateInteractionZones();
    }

    updateInteractionZones() {
        // Update chef interaction zone position
        if (this.interactionZones.chef.physics) {
            const chefCenterX = this.chef.x + this.chef.displayWidth / 2;
            const chefCenterY = this.chef.y + this.chef.displayHeight / 2;
            this.interactionZones.chef.physics.setPosition(chefCenterX, chefCenterY);
            this.interactionZones.chef.debug.setPosition(chefCenterX, chefCenterY);
            this.updateCurrentZone('chef');
        }

        // Update sous-chef interaction zone position
        if (this.interactionZones.sousChef.physics) {
            const sousChefCenterX = this.sousChef.x + this.sousChef.displayWidth / 2;
            const sousChefCenterY = this.sousChef.y + this.sousChef.displayHeight / 2;
            this.interactionZones.sousChef.physics.setPosition(sousChefCenterX, sousChefCenterY);
            this.interactionZones.sousChef.debug.setPosition(sousChefCenterX, sousChefCenterY);
            this.updateCurrentZone('sousChef');
        }
    }

    setupZoneOverlaps(zoneSprites) {
        Object.entries(zoneSprites).forEach(([zoneName, zoneSprite]) => {
            // Setup chef overlaps
            this.scene.physics.add.overlap(
                this.interactionZones.chef.physics,
                zoneSprite,
                () => {
                    // Update to single active zone
                    this.activeZoneOverlaps.chef.clear();
                    this.activeZoneOverlaps.chef.add(zoneName);
                    this.updateCurrentZone('chef');
                },
                null,
                this
            );

            // Setup sous-chef overlaps
            this.scene.physics.add.overlap(
                this.interactionZones.sousChef.physics,
                zoneSprite,
                () => {
                    // Update to single active zone
                    this.activeZoneOverlaps.sousChef.clear();
                    this.activeZoneOverlaps.sousChef.add(zoneName);
                    this.updateCurrentZone('sousChef');
                },
                null,
                this
            );

            // Setup exit detection using overlapend event
            zoneSprite.on('overlapend', (_, otherObject) => {
                if (otherObject === this.interactionZones.chef.physics) {
                    console.log(`Chef left ${zoneName} zone`);
                    this.activeZoneOverlaps.chef.delete(zoneName);
                    this.updateCurrentZone('chef');
                } else if (otherObject === this.interactionZones.sousChef.physics) {
                    console.log(`Sous Chef left ${zoneName} zone`);
                    this.activeZoneOverlaps.sousChef.delete(zoneName);
                    this.updateCurrentZone('sousChef');
                }
            });
        });
    }

    setupIngredientOverlaps(ingredientZones) {
        console.log('Setting up ingredient overlaps for zones:', ingredientZones.map(z => z.name));
        ingredientZones.forEach(zone => {
            const ingredientName = zone.name;

            // Setup chef overlaps with ingredients
            this.scene.physics.add.overlap(
                this.interactionZones.chef.physics,
                zone,
                () => {
                    // Update to single active ingredient
                    this.activeIngredientOverlaps.chef.clear();
                    this.activeIngredientOverlaps.chef.add(ingredientName);
                },
                null,
                this
            );

            // Setup sous-chef overlaps with ingredients
            this.scene.physics.add.overlap(
                this.interactionZones.sousChef.physics,
                zone,
                () => {
                    // Update to single active ingredient
                    this.activeIngredientOverlaps.sousChef.clear();
                    this.activeIngredientOverlaps.sousChef.add(ingredientName);
                },
                null,
                this
            );

            // Setup exit detection for ingredients
            zone.on('overlapend', (_, otherObject) => {
                if (otherObject === this.interactionZones.chef.physics) {
                    if (this.activeIngredientOverlaps.chef.has(ingredientName)) {
                        console.log(`Chef left ${ingredientName} ingredient zone`);
                        this.activeIngredientOverlaps.chef.delete(ingredientName);
                    }
                } else if (otherObject === this.interactionZones.sousChef.physics) {
                    if (this.activeIngredientOverlaps.sousChef.has(ingredientName)) {
                        console.log(`Sous Chef left ${ingredientName} ingredient zone`);
                        this.activeIngredientOverlaps.sousChef.delete(ingredientName);
                    }
                }
            });
        });
    }

    updateCurrentZone(characterType) {
        const character = characterType === 'chef' ? this.chef : this.sousChef;
        const overlaps = this.activeZoneOverlaps[characterType];
        
        if (overlaps.size === 0) {
            character.currentZone = null;
            return;
        }
        
        // If multiple zones, prioritize them
        const zonePriority = ['cookingStation', 'cuttingBoard', 'divider', 'sidebar', 'rightTrash', 'leftTrash', 'readyTable'];
        
        // Find the highest priority zone that we're overlapping with
        character.currentZone = zonePriority.find(zone => overlaps.has(zone)) || null;
    }

    updateHeldIngredients() {
        if (this.chef.heldIngredient) {
            this.chef.heldIngredient.gameObject.setPosition(
                this.chef.x + this.chef.displayWidth / 2,
                this.chef.y - 20
            );
        }
        if (this.sousChef.heldIngredient) {
            this.sousChef.heldIngredient.gameObject.setPosition(
                this.sousChef.x + this.sousChef.displayWidth / 2,
                this.sousChef.y - 20
            );
        }
    }

    isInZone(character, zoneName) {
        const characterType = character === this.chef ? 'chef' : 'sousChef';
        return this.activeZoneOverlaps[characterType].has(zoneName);
    }

    isNearIngredient(character, ingredientName) {
        const characterType = character === this.chef ? 'chef' : 'sousChef';
        return this.activeIngredientOverlaps[characterType].has(ingredientName);
    }
} 