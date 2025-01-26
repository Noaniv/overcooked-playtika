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
            sidebar: { x: width - 75, y: 0, width: 100, height: height },
            divider: { x: dividerX + 4, y: height/2 - 100, width: dividerWidth - 50, height: 310},
            cookingStation: { x: 380, y: 0, width: 190, height: 200 },
            cuttingBoard: { x: dividerX + 180, y: 0, width: 450, height: 200 },
            leftCuttingBoard: { x: 0, y: height/2 - 240, width: 100, height: 300 },
            leftTrash: { x: 0, y: height/2 + 120, width: 100, height: 100 },
            rightTrash: { x: width - 210, y: height - 85, width: 90, height: 80 },
            readyTable: { x: 0, y: height -150, width: 350, height: 180 }
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

    updateZones(width, height, dividerWidth, dividerX) {
        // Update zone definitions
        this.overlapZones = {
            sidebar: { x: width - 75, y: 0, width: 100, height: height },
            divider: { x: dividerX, y: height/2 - 130, width: dividerWidth, height: 300},
            cookingStation: { x: 0, y: 0, width: 370, height: 130 },
            cuttingBoard: { x: dividerX + dividerWidth + 30, y: 0, width: 340, height: 130 },
            leftTrash: { x: 170, y: height - 85, width: 90, height: 90 },
            rightTrash: { x: width - 210, y: height - 85, width: 90, height: 80 },
            readyTable: { x: 0, y: height/2 - 50, width: 180, height: 350 }
        };

        // Update zone visuals and physics bodies
        Object.entries(this.overlapZones).forEach(([zoneName, zone]) => {
            const zoneSprite = this.overlapZoneSprites[zoneName];
            if (zoneSprite) {
                // Update visual position and size
                zoneSprite.setPosition(
                    zone.x + zone.width / 2,
                    zone.y + zone.height / 2
                );
                zoneSprite.setSize(zone.width, zone.height);

                // Update physics body
                if (zoneSprite.body) {
                    zoneSprite.body.reset(
                        zone.x + zone.width / 2,
                        zone.y + zone.height / 2
                    );
                    zoneSprite.body.setSize(zone.width, zone.height);
                }
            }
        });
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

        return zoneName === 'cookingStation' 
            ? this.getClosestDropPosition(player, zone)
            : { 
                x: zone.x + zone.width / 2, 
                y: player.y + player.height / 2 
            };
    }

    getClosestDropPosition(player, zone) {
        const ingredientWidth = player.heldIngredient.gameObject.width;
        const ingredientHeight = player.heldIngredient.gameObject.height;

        let dropX = player.x + player.width / 2 - ingredientWidth / 2;
        let dropY = player.y + player.height / 2 - ingredientHeight / 2;

        // Adjust horizontal position
        if (dropX < zone.x) {
            dropX = zone.x;
        } else if (dropX + ingredientWidth > zone.x + zone.width) {
            dropX = zone.x + zone.width - ingredientWidth;
        }

        // Adjust vertical position
        if (dropY < zone.y) {
            dropY = zone.y;
        } else if (dropY + ingredientHeight > zone.y + zone.height) {
            dropY = zone.y + zone.height - ingredientHeight;
        }

        // Ensure within bounds
        dropX = Phaser.Math.Clamp(dropX, zone.x, zone.x + zone.width - ingredientWidth);
        dropY = Phaser.Math.Clamp(dropY, zone.y, zone.y + zone.height - ingredientHeight);

        return { x: dropX, y: dropY };
    }

    getZoneSprite(zoneName) {
        return this.overlapZoneSprites[zoneName];
    }
} 