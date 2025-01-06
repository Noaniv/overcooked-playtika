import { Scene } from 'phaser';

export class OvercookedGame extends Scene {
    constructor() {
        super('OvercookedGame');

        this.chef = null;
        this.sousChef = null;
        this.zones = {};
        this.placedIngredients = {
            divider: [],
            cookingStation: [],
            cuttingBoard: []
        };
        this.isCutting = false;
        this.cuttingTimer = null;
        this.cuttingProgress = null;
        this.spaceKeyIsDown = false;
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;
        const dividerWidth = 150;
        const dividerX = (width - dividerWidth) / 2;

        this.zones = {
            sidebar: { x: width - 100, y: 0, width: 100, height: height },
            divider: { x: dividerX, y: 0, width: dividerWidth, height: height},
            cookingStation: { x: 0, y: 0, width: 200, height: 200 },
            cuttingBoard: { x: width - 400, y: 0, width: 200, height: 200 },
            leftTrash: { x: 50, y: height - 100, width: 80, height: 80 },
            rightTrash: { x: width - 130, y: height - 100, width: 80, height: 80 }
        };


        const cuttingBoardZone = this.add.rectangle(this.zones.cuttingBoard.x, this.zones.cuttingBoard.y, this.zones.cuttingBoard.width, this.zones.cuttingBoard.height, 0x8B4513)
            .setOrigin(0)
            .setInteractive();


        this.add.rectangle(0, 0, width, height, 0xf9f4da).setOrigin(0);

        Object.entries(this.zones).forEach(([key, zone]) => {
            let color;
            switch (key) {
                case 'sidebar': color = 0xffc0cb; break;
                case 'divider': color = 0x808080; break;
                case 'cookingStation':
                case 'cuttingBoard': color = 0x8B4513; break;
                default: color = 0x808080;
            }

            

            const rect = this.add.rectangle(zone.x, zone.y, zone.width, zone.height, color)
                .setOrigin(0)
                .setInteractive();

            if (key === 'cookingStation' || key === 'cuttingBoard') {
                this.add.text(
                    zone.x + zone.width / 2,
                    zone.y + 30,
                    key === 'cookingStation' ? 'Cooking Station' : 'Cutting Board',
                    { fontSize: '16px', fill: '#fff' }
                ).setOrigin(0.5);
            }
        });

        this.chef = this.add.rectangle(50, height / 4, 50, 50, 0x00ff00)
            .setOrigin(0)
            .setInteractive();
        this.chef.heldIngredient = null;

        this.sousChef = this.add.rectangle(
            dividerX + dividerWidth + 50,
            height / 4,
            50,
            50,
            0xffff00
        ).setOrigin(0)
            .setInteractive();
        this.sousChef.heldIngredient = null;

        this.ingredients = [
            { name: 'Avocado', x: this.zones.sidebar.x + 60, y: 50 },
            { name: 'Meat', x: this.zones.sidebar.x + 60, y: 175 },
            { name: 'Tomato', x: this.zones.sidebar.x + 60, y: 300 },
            { name: 'Cheese', x: this.zones.sidebar.x + 60, y: 425 },
            { name: 'Tortilla', x: this.zones.sidebar.x + 60, y: 550 }
        ].map(ing => {
            const image = this.add.image(ing.x, ing.y, `${ing.name.toLowerCase()}1`)
                .setInteractive()
                .setScale(0.3); // Scale down to half size
            const text = this.add.text(ing.x, ing.y + 40, ing.name, {
                fontSize: '12px',
                fill: '#000'
            }).setOrigin(0.5);
            return { ...ing, gameObject: image, label: text };
        });
        

        this.keys = this.input.keyboard.addKeys({
            up: 'W',
            down: 'S',
            left: 'A',
            right: 'D',
            interact: 'E',
            up2: 'UP',
            down2: 'DOWN',
            left2: 'LEFT',
            right2: 'RIGHT',
            interact2: 'SPACE'
        });

        this.input.keyboard.on('keydown-E', () => this.handleChefInteraction());
        this.input.keyboard.on('keydown-SPACE', () => this.handleSousChefInteraction());
        this.input.keyboard.on('keyup-SPACE', () => {
            this.spaceKeyIsDown = false;
            if (this.isCutting) {
                // If cutting was in progress, destroy the ingredient
                if (this.sousChef.heldIngredient) {
                    this.sousChef.heldIngredient.gameObject.destroy();
                    this.sousChef.heldIngredient.label.destroy();
                    this.sousChef.heldIngredient = null;
                }
                this.cleanupCuttingTimer();
            }
        });
    }

    // Helper function for checking proximity (adjusted for full height interaction)
isNearZone(player, zone, radius = 80) {
    const playerCenterX = player.x ;
    const playerCenterY = player.y ;

    // Get the left and right edges of the zone (since the zone is rectangular)
    const zoneLeft = zone.x;
    const zoneRight = zone.x + zone.width;
    
    // For vertical zones (like divider), we consider the full height
    const zoneTop = zone.y;
    const zoneBottom = zone.y + zone.height;

    // Calculate horizontal and vertical distances from the player to the zone's edges
    const distanceX = Math.max(0, Math.abs(playerCenterX - (zoneLeft + zone.width / 2)) - zone.width / 2);
    const distanceY = Math.max(0, Math.max(zoneTop - playerCenterY, playerCenterY - zoneBottom));

    // Check if player is within radius horizontally and vertically along the divider's full height
    return distanceX < radius && distanceY < radius;
}

    isNearIngredient(player, ingredient, radius = 70) {
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;

        const distance = Phaser.Math.Distance.Between(
            playerCenterX,
            playerCenterY,
            ingredient.x,
            ingredient.y
        );

        return distance < radius;
    }

    pickUpIngredient(player, ingredient) {
        if (!player.heldIngredient && ingredient) {
            // Create a new copy of the ingredient image using the correct key
            const newIngredient = {
                name: ingredient.name,
                gameObject: this.add.image(
                    player.x + player.width / 2,
                    player.y - 20,
                    `${ingredient.name.toLowerCase()}1`
                ).setInteractive()
                .setScale(0.3), // Scale down to match sidebar size
                label: this.add.text(
                    player.x + player.width / 2,
                    player.y - 30,
                    ingredient.name,
                    {
                        fontSize: '12px',
                        fill: '#000'
                    }
                ).setOrigin(0.5)
            };
    
            player.heldIngredient = newIngredient;
            return true;
        }
        return false;
    }
    
    
    dropOffIngredient(player, zone) {
        if (!player.heldIngredient) return false;
    
        // Get the drop position, using the updated logic
        const dropPosition = zone.key === 'cookingStation' 
            ? this.getClosestDropPosition(player, this.zones.cookingStation)
            : { 
                x: zone.x + zone.width / 2, 
                y: player.y + player.height / 2 
            };
    
        // Add ingredient to the relevant zone's placedIngredients
        const zoneKey = Object.keys(this.zones).find(key => this.zones[key] === zone);
        if (zoneKey && this.placedIngredients[zoneKey]) {
            const newIngredient = { 
                ...player.heldIngredient, 
                x: dropPosition.x, 
                y: dropPosition.y 
            };
            this.placedIngredients[zoneKey].push(newIngredient);
        }
    
        // Update the visual position of the ingredient
        player.heldIngredient.gameObject.setPosition(dropPosition.x, dropPosition.y);
        player.heldIngredient.label.setPosition(dropPosition.x, dropPosition.y + 40);
    
        // Clear the held ingredient
        player.heldIngredient = null;
    
        return true;
    }
    

    
    getClosestDropPosition(player, zone) {
        // Get the bounds of the zone
        const zoneX = zone.x;
        const zoneY = zone.y;
        const zoneWidth = zone.width;
        const zoneHeight = zone.height;
    
        // Get the size of the ingredient being held
        const ingredientWidth = player.heldIngredient.gameObject.width;
        const ingredientHeight = player.heldIngredient.gameObject.height;
    
        // Calculate the closest drop position based on the player's position
        let dropX = player.x + player.width / 2 - ingredientWidth / 2;
        let dropY = player.y + player.height / 2 - ingredientHeight / 2;
    
        // Adjust for horizontal position (left-right)
        if (dropX < zoneX) {
            // Player is to the left of the zone
            dropX = zoneX; // Place the ingredient at the left boundary of the zone
        } else if (dropX + ingredientWidth > zoneX + zoneWidth) {
            // Player is to the right of the zone
            dropX = zoneX + zoneWidth - ingredientWidth; // Place the ingredient at the right boundary of the zone
        }
    
        // Adjust for vertical position (top-bottom)
        if (dropY < zoneY) {
            // Player is above the zone
            dropY = zoneY; // Place the ingredient at the top boundary of the zone
        } else if (dropY + ingredientHeight > zoneY + zoneHeight) {
            // Player is below the zone
            dropY = zoneY + zoneHeight - ingredientHeight; // Place the ingredient at the bottom boundary of the zone
        }
    
        // Ensure the ingredient stays within the bounds of the zone
        dropX = Phaser.Math.Clamp(dropX, zoneX, zoneX + zoneWidth - ingredientWidth);
        dropY = Phaser.Math.Clamp(dropY, zoneY, zoneY + zoneHeight - ingredientHeight);
    
        return { x: dropX, y: dropY };
    }
    
    startCuttingTimer() {
        if (this.isCutting) return; // Don't start if already cutting
        
        this.isCutting = true;
        this.spaceKeyIsDown = true;
        
        // Create a progress bar
        this.cuttingProgress = this.add.rectangle(
            this.zones.cuttingBoard.x + this.zones.cuttingBoard.width / 2,
            this.zones.cuttingBoard.y + this.zones.cuttingBoard.height + 20,
            0,
            10,
            0x00ff00
        ).setOrigin(0.5, 0);
    
        // Create the timer
        this.cuttingTimer = this.time.addEvent({
            delay: 5000,
            callback: () => this.completeCutting(),
            loop: false
        });
    }
    
    completeCutting() {
        if (!this.spaceKeyIsDown) return; // If space was released, don't complete
        
        // Replace the ingredient image with a "cut" version
        const oldImage = this.sousChef.heldIngredient.gameObject;
        const oldLabel = this.sousChef.heldIngredient.label;
        const ingredientName = this.sousChef.heldIngredient.name;
        
        // Create new "cut" version of the ingredient
        const newImage = this.add.image(
            oldImage.x,
            oldImage.y,
            `${ingredientName.toLowerCase()}2` // Assuming you have images named "ingredient2" for cut versions
        ).setInteractive()
        .setScale(0.3);
        
        // Update the held ingredient reference
        this.sousChef.heldIngredient.gameObject = newImage;
        oldImage.destroy(); // Remove old image
        
        this.cleanupCuttingTimer();
    }
    
    cleanupCuttingTimer() {
        if (this.cuttingProgress) {
            this.cuttingProgress.destroy();
            this.cuttingProgress = null;
        }
        if (this.cuttingTimer) {
            this.cuttingTimer.remove();
            this.cuttingTimer = null;
        }
        this.isCutting = false;
    }
    
    handleChefInteraction() {
        if (!this.chef.heldIngredient) {
            // Try to pick up from divider (multiple ingredients allowed)
            const dividerIngredients = this.placedIngredients.divider;
            for (const ingredient of dividerIngredients) {
                if (this.isNearIngredient(this.chef, ingredient)) {
                    this.pickUpIngredient(this.chef, ingredient);
                    // Remove ingredient from the divider after pick up
                    this.placedIngredients.divider = this.placedIngredients.divider.filter(ing => ing !== ingredient);
                    ingredient.gameObject.destroy();
                    ingredient.label.destroy();
                    break; // Pick up the first ingredient found
                }
            }
    
            // Try to pick up from cooking station (multiple ingredients allowed)
            if (!this.chef.heldIngredient) {
                const cookingStationIngredient = this.placedIngredients.cookingStation[0];
                if (cookingStationIngredient && this.isNearZone(this.chef, this.zones.cookingStation)) {
                    this.pickUpIngredient(this.chef, cookingStationIngredient);
                    // Remove ingredient from cooking station after pick up
                    this.placedIngredients.cookingStation.shift();
                    cookingStationIngredient.gameObject.destroy();
                    cookingStationIngredient.label.destroy();
                }
            }
        } else {
            // Try to drop off at cutting board
            if (this.isNearZone(this.chef, this.zones.cookingStation)) {
                this.dropOffIngredient(this.chef, this.zones.cookingStation);
            }
            // Drop off at left trash can
            else if (this.isNearZone(this.chef, this.zones.leftTrash)) {
                this.chef.heldIngredient.gameObject.destroy();
                this.chef.heldIngredient.label.destroy();
                this.chef.heldIngredient = null;
            }
        }
    }
    
    
    handleSousChefInteraction() {
        if (this.sousChef.heldIngredient && this.isNearZone(this.sousChef, this.zones.cuttingBoard)) {
            if (!this.isCutting) {
                this.startCuttingTimer();
            }
            return; // Exit to prevent other interactions while cutting
        }

        if (!this.sousChef.heldIngredient) {
            // Try to pick up from sidebar (ingredient selection area)
            for (const ingredient of this.ingredients) {
                if (this.isNearIngredient(this.sousChef, ingredient)) {
                    this.pickUpIngredient(this.sousChef, ingredient);
                    break;
                }
            }
    
            // Try to pick up from divider (multiple ingredients allowed)
            if (!this.sousChef.heldIngredient) {
                const dividerIngredients = this.placedIngredients.divider;
                for (const ingredient of dividerIngredients) {
                    if (this.isNearIngredient(this.sousChef, ingredient)) {
                        this.pickUpIngredient(this.sousChef, ingredient);
                        // Remove ingredient from the divider after pick up
                        this.placedIngredients.divider = this.placedIngredients.divider.filter(ing => ing !== ingredient);
                        ingredient.gameObject.destroy();
                        ingredient.label.destroy();
                        break;
                    }
                }
            }
        } else {
            // Try to drop off at divider (multiple ingredients allowed)
            if (this.isNearZone(this.sousChef, this.zones.divider)) {
                this.dropOffIngredient(this.sousChef, this.zones.divider);
            }
            // Try to drop off at right trash can
            else if (this.isNearZone(this.sousChef, this.zones.rightTrash)) {
                this.sousChef.heldIngredient.gameObject.destroy();
                this.sousChef.heldIngredient.label.destroy();
                this.sousChef.heldIngredient = null;
            }
        }
    }
    

    update() {
        // Chef movement: Prevent passing the divider but allow free movement on the left side
        const speed = 3;

        if (this.keys.left.isDown && this.chef.x > 0) {
            this.chef.x -= speed;  // Chef can move left but can't go off-screen
        }
        if (this.keys.right.isDown && this.chef.x + this.chef.width < this.zones.divider.x + this.zones.divider.width/2) {
            this.chef.x += speed;  // Chef can move right but can't pass the divider
        }
        if (this.keys.up.isDown && this.chef.y > 0) {
            this.chef.y -= speed;  // Chef can't move off-screen upwards
        }
        if (this.keys.down.isDown && this.chef.y + this.chef.height < this.scale.height) {
            this.chef.y += speed;  // Chef can't move off-screen downwards
        }
    
        // Sous-Chef movement: Allow movement on the right side of the divider
        if (this.keys.left2.isDown && this.sousChef.x + this.sousChef.width > this.zones.divider.x + this.zones.divider.width) {
            this.sousChef.x -= speed;
        }
        if (this.keys.right2.isDown && this.sousChef.x + this.sousChef.width < this.scale.width) {
            this.sousChef.x += speed;
        }
        if (this.keys.up2.isDown && this.sousChef.y > 0) {
            this.sousChef.y -= speed;
        }
        if (this.keys.down2.isDown && this.sousChef.y + this.sousChef.height < this.scale.height) {
            this.sousChef.y += speed;
        }
    
        // Update held ingredients' positions for both chef and sous-chef
        if (this.chef.heldIngredient) {
            this.chef.heldIngredient.gameObject.setPosition(this.chef.x + this.chef.width / 2, this.chef.y - 20);
            this.chef.heldIngredient.label.setPosition(this.chef.x + this.chef.width / 2, this.chef.y - 30);
        }
        if (this.sousChef.heldIngredient) {
            this.sousChef.heldIngredient.gameObject.setPosition(this.sousChef.x + this.sousChef.width / 2, this.sousChef.y - 20);
            this.sousChef.heldIngredient.label.setPosition(this.sousChef.x + this.sousChef.width / 2, this.sousChef.y - 30);
        }
        if (this.isCutting && this.cuttingProgress && this.cuttingTimer) {
            const progress = 1 - this.cuttingTimer.getProgress(); // Get remaining time percentage
            this.cuttingProgress.width = this.zones.cuttingBoard.width * progress; // Update progress bar width
        }
    }
}