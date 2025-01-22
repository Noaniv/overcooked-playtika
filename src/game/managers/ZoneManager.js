export class ZoneManager {
    constructor(scene) {
        this.scene = scene;
        this.zones = {};
        this.zoneSprites = {};
    }

    createZones(width, height, dividerWidth, dividerX) {
        this.zones = {
            sidebar: { x: width - 75, y: 0, width: 100, height: height },
            divider: { x: dividerX, y: height/2 - 130, width: dividerWidth, height: 300},
            cookingStation: { x: 0, y: 0, width: 370, height: 130 },
            cuttingBoard: { x: dividerX + dividerWidth + 30, y: 0, width: 340, height: 130 },
            leftTrash: { x: 170, y: height - 85, width: 90, height: 90 },
            rightTrash: { x: width - 210, y: height - 85, width: 90, height: 80 },
            readyTable: { x: 0, y: height/2 - 50, width: 180, height: 350 }
        };

        this.createZoneVisuals();
        return this.zones;
    }

    createZoneVisuals() {
        Object.entries(this.zones).forEach(([zoneKey, zone]) => {
            const zoneRect = this.scene.add.rectangle(
                zone.x + zone.width / 2,
                zone.y + zone.height / 2,
                zone.width,
                zone.height,
                0x00ff00,
                0.3
            ).setOrigin(0.5);

            this.scene.physics.add.existing(zoneRect, true);
            this.zoneSprites[zoneKey] = zoneRect;
        });
    }

    setupCollisions(characterManager) {
        characterManager.setupZoneOverlaps(this.zoneSprites);
    }

    isNearZone(player, zoneName, radius = 60) {
        const zone = this.zones[zoneName];
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
        const zone = this.zones[zoneName];
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

    getZone(zoneName) {
        return this.zones[zoneName];
    }

    getZoneSprite(zoneName) {
        return this.zoneSprites[zoneName];
    }
} 