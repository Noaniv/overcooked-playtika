import { Character } from '../classes/Character';

export class CharacterManager {
    constructor(scene) {
        this.scene = scene;
        this.chef = null;
        this.sousChef = null;
        this.activeZoneOverlaps = new Map([
            ['chef', new Set()],
            ['sousChef', new Set()]
        ]);
        this.activeIngredientOverlaps = new Map([
            ['chef', new Set()],
            ['sousChef', new Set()]
        ]);
    }

    createCharacters(width, height) {
        // Create chef
        this.chef = new Character(
            this.scene,
            width * 0.75,
            height * 0.75,
            'character1',
            {
                up: 'W',
                down: 'S',
                left: 'A',
                right: 'D'
            }
        );
        this.chef.play('character1-walk-down');

        // Create sous chef
        this.sousChef = new Character(
            this.scene,
            width * 0.25,
            height * 0.75,
            'character2',
            {
                up: 'UP',
                down: 'DOWN',
                left: 'LEFT',
                right: 'RIGHT'
            }
        );
        this.sousChef.play('character2-walk-down');

        // Set up zone overlaps
        this.setupZoneOverlaps();
    }

    setupZoneOverlaps(zones) {
        if (!zones) return;

        Object.entries(zones).forEach(([zoneName, zone]) => {
            // Set up overlap for chef
            this.scene.physics.add.overlap(
                this.chef.interactionZone,
                zone,
                () => this.handleZoneOverlap(this.chef, zoneName),
                null,
                this
            );

            // Set up overlap for sous chef
            this.scene.physics.add.overlap(
                this.sousChef.interactionZone,
                zone,
                () => this.handleZoneOverlap(this.sousChef, zoneName),
                null,
                this
            );
        });
    }

    setupIngredientOverlaps(ingredientZones) {
        console.log('Setting up ingredient overlaps for zones:', ingredientZones.map(z => z.name));
        
        ingredientZones.forEach(zone => {
            const ingredientName = zone.name;

            // Set up overlap for chef
            this.scene.physics.add.overlap(
                this.chef.interactionZone,
                zone,
                () => this.handleIngredientOverlap(this.chef, ingredientName),
                null,
                this
            );

            // Set up overlap for sous chef
            this.scene.physics.add.overlap(
                this.sousChef.interactionZone,
                zone,
                () => this.handleIngredientOverlap(this.sousChef, ingredientName),
                null,
                this
            );
        });
    }

    handleZoneOverlap(character, zoneName) {
        // Clear previous zone if different
        if (character.currentZone !== zoneName) {
            // Stop any existing pulse effects when changing zones
            if (character.currentZone) {
                // Clear any existing pulses for this character
                this.scene.ingredientManager.ingredients.forEach(ingredient => {
                    if (ingredient.isPulsing && ingredient.pulsingCharacter === character) {
                        this.scene.ingredientManager.removePulseEffect(ingredient);
                        ingredient.isPulsing = false;
                        ingredient.pulsingCharacter = null;
                    }
                });
            }
            character.currentZone = zoneName;
        }

        const characterType = character === this.chef ? 'chef' : 'sousChef';
        this.activeZoneOverlaps.get(characterType).add(zoneName);

        // Add pulse effect to pickupable ingredients
        this.scene.ingredientManager.addPulseEffectToPickupable(character);
    }

    handleIngredientOverlap(character, ingredientName) {
        const characterType = character === this.chef ? 'chef' : 'sousChef';
        this.activeIngredientOverlaps.get(characterType).add(ingredientName);
    }

    handleMovement(keys) {
        if (this.chef) {
            this.chef.handleMovement();
        }
        if (this.sousChef) {
            this.sousChef.handleMovement();
        }

        // Clear overlaps each frame
        this.activeZoneOverlaps.get('chef').clear();
        this.activeZoneOverlaps.get('sousChef').clear();
        this.activeIngredientOverlaps.get('chef').clear();
        this.activeIngredientOverlaps.get('sousChef').clear();
    }

    getCharacter(type) {
        return type === 'chef' ? this.chef : this.sousChef;
    }

    isInZone(character, zoneName) {
        const characterType = character === this.chef ? 'chef' : 'sousChef';
        return this.activeZoneOverlaps.get(characterType).has(zoneName);
    }

    isNearIngredient(character, ingredientName) {
        const characterType = character === this.chef ? 'chef' : 'sousChef';
        return this.activeIngredientOverlaps.get(characterType).has(ingredientName);
    }

    clearZoneOverlap(character, zoneName) {
        character.currentZone = null;
        const characterType = character === this.chef ? 'chef' : 'sousChef';
        this.activeZoneOverlaps.get(characterType).delete(zoneName);
        
        // Clear any pulses for this character
        this.scene.ingredientManager.ingredients.forEach(ingredient => {
            if (ingredient.isPulsing && ingredient.pulsingCharacter === character) {
                this.scene.ingredientManager.removePulseEffect(ingredient);
                ingredient.isPulsing = false;
                ingredient.pulsingCharacter = null;
            }
        });
    }
} 