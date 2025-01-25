import { Character } from '../classes/Character';

export class CharacterManager {
    constructor(scene) {
        this.scene = scene;
        this.characters = new Map();
        this.activeZoneOverlaps = new Map();
        this.activeIngredientOverlaps = new Map();
    }

    createCharacters(width, height) {
        // Create chef (character1)
        const chef = new Character(
            this.scene,
            width * 0.2,
            height * 0.5,
            'character1',
            {
                up: 'W',
                down: 'S',
                left: 'A',
                right: 'D'
            }
        );

        // Create sous chef (character2)
        const sousChef = new Character(
            this.scene,
            width * 0.8,
            height * 0.5,
            'character2',
            {
                up: 'UP',
                down: 'DOWN',
                left: 'LEFT',
                right: 'RIGHT'
            }
        );

        // Store characters in map
        this.characters.set('chef', chef);
        this.characters.set('sousChef', sousChef);

        // Initialize zone overlaps tracking
        this.activeZoneOverlaps.set('chef', new Set());
        this.activeZoneOverlaps.set('sousChef', new Set());
        this.activeIngredientOverlaps.set('chef', new Set());
        this.activeIngredientOverlaps.set('sousChef', new Set());

        // Set initial animations
        chef.gameObject.play('character1-walk-down');
        chef.gameObject.anims.stop();
        sousChef.gameObject.play('character2-walk-down');
        sousChef.gameObject.anims.stop();
    }

    handleMovement(keys) {
        const chef = this.characters.get('chef');
        const sousChef = this.characters.get('sousChef');

        // Handle chef movement
        if (keys.left.isDown) {
            chef.gameObject.play('character1-walk-left', true);
            chef.gameObject.setFlipX(false);
        } else if (keys.right.isDown) {
            chef.gameObject.play('character1-walk-right', true);
            chef.gameObject.setFlipX(false);
        } else if (keys.up.isDown) {
            chef.gameObject.play('character1-walk-up', true);
        } else if (keys.down.isDown) {
            chef.gameObject.play('character1-walk-down', true);
        } else if (chef.gameObject.anims.isPlaying) {
            chef.gameObject.anims.stop();
        }

        // Handle sous chef movement
        if (keys.left2.isDown) {
            sousChef.gameObject.play('character2-walk-left', true);
            sousChef.gameObject.setFlipX(false);
        } else if (keys.right2.isDown) {
            sousChef.gameObject.play('character2-walk-right', true);
            sousChef.gameObject.setFlipX(false);
        } else if (keys.up2.isDown) {
            sousChef.gameObject.play('character2-walk-up', true);
        } else if (keys.down2.isDown) {
            sousChef.gameObject.play('character2-walk-down', true);
        } else if (sousChef.gameObject.anims.isPlaying) {
            sousChef.gameObject.anims.stop();
        }

        // Update character positions
        chef.handleMovement();
        sousChef.handleMovement();
    }

    setupZoneOverlaps(zoneSprites) {
        for (const [characterId, character] of this.characters) {
            Object.entries(zoneSprites).forEach(([zoneName, zoneSprite]) => {
                this.scene.physics.add.overlap(
                    character.interactionZone,
                    zoneSprite,
                    () => {
                        this.activeZoneOverlaps.get(characterId).clear();
                        this.activeZoneOverlaps.get(characterId).add(zoneName);
                        this.updateCurrentZone(characterId);
                    },
                    null,
                    this
                );

                zoneSprite.on('overlapend', (_, otherObject) => {
                    if (otherObject === character.interactionZone) {
                        this.activeZoneOverlaps.get(characterId).delete(zoneName);
                        this.updateCurrentZone(characterId);
                    }
                });
            });
        }
    }

    setupIngredientOverlaps(ingredientZones) {
        console.log('Setting up ingredient overlaps for zones:', ingredientZones.map(z => z.name));
        
        for (const [characterId, character] of this.characters) {
            ingredientZones.forEach(zone => {
                const ingredientName = zone.name;

                this.scene.physics.add.overlap(
                    character.interactionZone,
                    zone,
                    () => {
                        this.activeIngredientOverlaps.get(characterId).clear();
                        this.activeIngredientOverlaps.get(characterId).add(ingredientName);
                    },
                    null,
                    this
                );

                zone.on('overlapend', (_, otherObject) => {
                    if (otherObject === character.interactionZone) {
                        if (this.activeIngredientOverlaps.get(characterId).has(ingredientName)) {
                            console.log(`${characterId} left ${ingredientName} ingredient zone`);
                            this.activeIngredientOverlaps.get(characterId).delete(ingredientName);
                        }
                    }
                });
            });
        }
    }

    updateCurrentZone(characterId) {
        const character = this.characters.get(characterId);
        const overlaps = this.activeZoneOverlaps.get(characterId);
        
        if (overlaps.size === 0) {
            character.currentZone = null;
            return;
        }
        
        // If multiple zones, prioritize them
        const zonePriority = [
            'cookingStation', 
            'cuttingBoard',
            'leftCuttingBoard',  // Add the new cutting board to priority list
            'divider', 
            'sidebar', 
            'rightTrash', 
            'leftTrash', 
            'readyTable'
        ];
        
        // Find the highest priority zone that we're overlapping with
        character.currentZone = zonePriority.find(zone => overlaps.has(zone)) || null;
    }

    updateHeldIngredients() {
        for (const character of this.characters.values()) {
            character.updateHeldIngredient();
        }
    }

    isInZone(character, zoneName) {
        // Allow either cutting board to count when checking for cutting board zone
        if (zoneName === 'cuttingBoard') {
            for (const [id, char] of this.characters) {
                if (char === character) {
                    return this.activeZoneOverlaps.get(id).has('cuttingBoard') || 
                           this.activeZoneOverlaps.get(id).has('leftCuttingBoard');
                }
            }
        }
        
        // Normal zone checking
        for (const [id, char] of this.characters) {
            if (char === character) {
                return this.activeZoneOverlaps.get(id).has(zoneName);
            }
        }
        return false;
    }

    isNearIngredient(character, ingredientName) {
        for (const [id, char] of this.characters) {
            if (char === character) {
                return this.activeIngredientOverlaps.get(id).has(ingredientName);
            }
        }
        return false;
    }

    getCharacter(id) {
        return this.characters.get(id);
    }
} 