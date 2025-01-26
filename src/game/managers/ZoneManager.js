export class ZoneManager {
    constructor(scene) {
        this.scene = scene;
        this.overlapZones = {};        // Zones for interactions (pickup/dropoff)
        this.overlapZoneSprites = {};  // Physics bodies for overlap zones
        this.collisionZones = [];      // Zones that block movement
        this.debugGraphics = scene.add.graphics();
        this.debugCollisionGraphics = scene.add.graphics();
    }

    createZones(width, height, dividerWidth, dividerX) {
        // Define interaction zones
        this.overlapZones = {
            sidebar: { x: width - 125, y: 0, width: 200, height: height },
            divider: { x: dividerX + 4, y: height/2 - 100, width: dividerWidth - 50, height: 310},
            cookingStation: { x: 380, y: 0, width: 190, height: 200 },
            cuttingBoard: { x: dividerX + 180, y: 0, width: 280, height: 200 },
            leftCuttingBoard: { x: 0, y: height/2 - 240, width: 100, height: 300 },
            leftTrash: { x: 0, y: height/2 + 120, width: 100, height: 100 },
            rightTrash: { x: width - 210, y: height - 85, width: 90, height: 80 },
            readyTable: { x: 0, y: height -170, width: 350, height: 200 }
        };

        // Create collision zones
        this.createCollisionZones(width, height, dividerWidth, dividerX);

        // Create overlap zone sprites
        this.createOverlapZones();

        return this.overlapZones;
    }

    createOverlapZones() {
        Object.entries(this.overlapZones).forEach(([zoneName, zone]) => {
            const zoneSprite = this.scene.add.rectangle(
                zone.x + zone.width / 2,
                zone.y + zone.height / 2,
                zone.width,
                zone.height,
                0x00ff00,
                0
            ).setOrigin(0.5);

            // Add physics but don't enable collision
            this.scene.physics.add.existing(zoneSprite, true);
            zoneSprite.body.enable = true;
            this.overlapZoneSprites[zoneName] = zoneSprite;

            // Add debug visual if debug is enabled
            if (this.scene.game.config.physics.arcade?.debug) {
                this.debugGraphics.lineStyle(2, 0x00ff00, 1);
                this.debugGraphics.strokeRect(zone.x, zone.y, zone.width, zone.height);
            }
        });
    }

    createCollisionZones(width, height, dividerWidth, dividerX) {
        this.debugGraphics.clear();
        this.debugCollisionGraphics.clear();

        const collisionAreas = [
            { x: 0, y: -10, width: width, height: 170, name: 'Top Wall' },
            { x: 0, y: height -145, width: 330, height: 170, name: 'Left Bottom Wall' },
            { x: width - 350, y: height -145, width: 350, height: 190, name: 'Right Bottom Wall' },
            { x: 0, y: 0, width: 80, height: height/2 +15, name: 'Left Wall' },
            { x: width - 105, y: 0, width: 145, height: height, name: 'Right Wall' },
            { x: dividerX + 55, y: height/2 - 80, width: dividerWidth - 150, height: 260, name: 'Center Divider' }
        ];

        collisionAreas.forEach(area => {
            const collisionZone = this.scene.add.rectangle(
                area.x + area.width/2,
                area.y + area.height/2,
                area.width,
                area.height,
                0xff0000,
                0
            );
            
            // Add physics with collision enabled
            this.scene.physics.add.existing(collisionZone, true);
            collisionZone.name = area.name;
            this.collisionZones.push(collisionZone);

            // Add debug visual
            if (this.scene.game.config.physics.arcade?.debug) {
                this.debugCollisionGraphics.lineStyle(2, 0xff0000, 1);
                this.debugCollisionGraphics.strokeRect(area.x, area.y, area.width, area.height);
            }
        });
    }

    setupCollisions(characterManager) {
        // Set up solid collisions
        this.collisionZones.forEach(zone => {
            this.scene.physics.add.collider(characterManager.chef, zone);
            this.scene.physics.add.collider(characterManager.sousChef, zone);
        });

        // Set up zone overlaps for interaction
        Object.entries(this.overlapZoneSprites).forEach(([zoneName, zoneSprite]) => {
            this.scene.physics.add.overlap(
                characterManager.chef,
                zoneSprite,
                () => characterManager.handleZoneOverlap(characterManager.chef, zoneName)
            );
            this.scene.physics.add.overlap(
                characterManager.sousChef,
                zoneSprite,
                () => characterManager.handleZoneOverlap(characterManager.sousChef, zoneName)
            );
        });
    }

    getZone(zoneName) {
        return this.overlapZones[zoneName];
    }

    isNearZone(player, zoneName, radius = 60) {
        const zone = this.overlapZones[zoneName];
        if (!zone) return false;

        if (zoneName === 'cuttingBoard') {
            radius = 50; // Smaller radius for cutting board interactions
        }

        const playerCenterX = player.x;
        const playerCenterY = player.y;

        const zoneLeft = zone.x;
        const zoneRight = zone.x + zone.width;
        const zoneTop = zone.y;
        const zoneBottom = zone.y + zone.height;

        const distanceX = Math.max(0, Math.abs(playerCenterX - (zoneLeft + zone.width / 2)) - zone.width / 2);
        const distanceY = Math.max(0, Math.max(zoneTop - playerCenterY, playerCenterY - zoneBottom));

        return distanceX < radius && distanceY < radius;
    }

    getDropPosition(zoneName, player) {
        const zone = this.overlapZones[zoneName];
        if (!zone) return null;

        // Special handling for cooking station
        if (zoneName === 'cookingStation') {
            // Calculate position based on number of ingredients already there
            const existingIngredients = this.scene.ingredientManager.placedIngredients.cookingStation.length;
            const baseX = zone.x + zone.width / 2;
            const baseY = zone.y + zone.height / 2;
            
            // Offset each ingredient slightly
            const offsetX = existingIngredients * 40;
            const offsetY = existingIngredients * 20;
            
            return {
                x: baseX + offsetX,
                y: baseY + offsetY
            };
        }

        return { 
            x: zone.x + zone.width / 2, 
            y: player.y + player.height / 2 
        };
    }

    getClosestDropPosition(player, zone) {
        if (zone.name === 'cookingStation') {
            return { x: 400, y: 150 };
        }

        const ingredientWidth = player.heldIngredient.gameObject.width;
        const ingredientHeight = player.heldIngredient.gameObject.height;

        // Center the drop position within the zone
        const dropX = zone.x + (zone.width - ingredientWidth) / 2;
        const dropY = zone.y + (zone.height - ingredientHeight) / 2;

        return { x: dropX, y: dropY };
    }

    getZoneSprite(zoneName) {
        return this.overlapZoneSprites[zoneName];
    }
} 