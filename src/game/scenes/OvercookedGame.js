import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

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
        
        this.keys = null;
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;
        const dividerWidth = 150;
        const dividerX = (width - dividerWidth) / 2;

        this.zones = {
            sidebar: { x: width - 150, y: 0, width: 100, height: height },
            divider: { x: dividerX, y: 0, width: dividerWidth, height: height },
            cookingStation: { x: 0, y: 0, width: 200, height: 200 },
            cuttingBoard: { x: width - 400, y: 0, width: 200, height: 200 },
            leftTrash: { x: 50, y: height - 100, width: 80, height: 80 },
            rightTrash: { x: width - 130, y: height - 100, width: 80, height: 80 }
        };

        this.add.rectangle(0, 0, width, height, 0xf9f4da).setOrigin(0);

        Object.entries(this.zones).forEach(([key, zone]) => {
            let color;
            switch(key) {
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
                const label = this.add.text(
                    zone.x + zone.width/2,
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

        // Create sidebar ingredients with adjusted positions
        this.ingredients = [
            { name: 'raw_avocado', color: 0xffa500, x: this.zones.sidebar.x + 75, y: 150 },
            { name: 'raw_cheese', color: 0xff0000, x: this.zones.sidebar.x + 75, y: 300 },
            { name: 'raw_meat', color: 0x00ff00, x: this.zones.sidebar.x + 75, y: 450 },
            { name: 'raw_tomato', color: 0x8b4513, x: this.zones.sidebar.x + 75, y: 600 }
        ].map(ing => {
            const circle = this.add.circle(ing.x, ing.y, 20, ing.color)
                .setInteractive();
            const text = this.add.text(ing.x, ing.y + 40, ing.name, {
                fontSize: '12px',
                fill: '#000'
            }).setOrigin(0.5);
            return { ...ing, gameObject: circle, label: text };
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

        // Debug text for development
        this.debugText = this.add.text(10, 10, '', { fontSize: '16px', fill: '#000' });
    }

    isNearZone(player, zone, radius = 100) {
        const playerCenterX = player.x + player.width/2;
        const playerCenterY = player.y + player.height/2;
        const zoneCenterX = zone.x + zone.width/2;
        const zoneCenterY = zone.y + zone.height/2;
        
        const distance = Phaser.Math.Distance.Between(
            playerCenterX,
            playerCenterY,
            zoneCenterX,
            zoneCenterY
        );
        
        return distance < radius;
    }

    isNearIngredient(player, ingredient, radius = 60) {
        const playerCenterX = player.x + player.width/2;
        const playerCenterY = player.y + player.height/2;
        
        const distance = Phaser.Math.Distance.Between(
            playerCenterX,
            playerCenterY,
            ingredient.x,
            ingredient.y
        );
        
        return distance < radius;
    }

    handleChefInteraction() {
        if (!this.chef.heldIngredient) {
            // Pickup from divider
            if (Math.abs(this.chef.x + this.chef.width - this.zones.divider.x) < 50) {
                const nearbyIngredient = this.placedIngredients.divider.find(ing => {
                    return Math.abs(ing.y - (this.chef.y + this.chef.height/2)) < 50;
                });
                
                if (nearbyIngredient) {
                    this.chef.heldIngredient = {
                        ...nearbyIngredient,
                        gameObject: nearbyIngredient.gameObject,
                        label: nearbyIngredient.label
                    };
                    
                    this.placedIngredients.divider = this.placedIngredients.divider.filter(
                        ing => ing !== nearbyIngredient
                    );
                }
            }

            // Pickup from cooking station
            if (this.isNearZone(this.chef, this.zones.cookingStation)) {
                const nearbyIngredient = this.placedIngredients.cookingStation.find(ing => 
                    Math.abs(ing.y - (this.chef.y + this.chef.height/2)) < 50
                );
                
                if (nearbyIngredient) {
                    this.chef.heldIngredient = {
                        ...nearbyIngredient,
                        gameObject: nearbyIngredient.gameObject,
                        label: nearbyIngredient.label
                    };
                    
                    this.placedIngredients.cookingStation = this.placedIngredients.cookingStation.filter(
                        ing => ing !== nearbyIngredient
                    );
                }
            }
        } else {
            // Drop off logic
            if (this.isNearZone(this.chef, this.zones.cookingStation)) {
                const dropPosition = {
                    x: this.zones.cookingStation.x + this.zones.cookingStation.width/2,
                    y: this.chef.y + this.chef.height/2
                };
                
                this.placedIngredients.cookingStation.push({
                    ...this.chef.heldIngredient,
                    x: dropPosition.x,
                    y: dropPosition.y
                });
                
                this.chef.heldIngredient.gameObject.setPosition(dropPosition.x, dropPosition.y);
                this.chef.heldIngredient.label.setPosition(dropPosition.x, dropPosition.y + 40);
                this.chef.heldIngredient = null;
            }
        }
    }

    handleSousChefInteraction() {
        if (!this.sousChef.heldIngredient) {
            // Check for nearby ingredients in the sidebar
            const nearbyIngredient = this.ingredients.find(ingredient =>
                this.isNearIngredient(this.sousChef, ingredient.gameObject)
            );
    
            if (nearbyIngredient) {
                // Pick up the ingredient
                const newIngredient = {
                    name: nearbyIngredient.name,
                    color: nearbyIngredient.color,
                    gameObject: this.add.circle(
                        this.sousChef.x + this.sousChef.width / 2,
                        this.sousChef.y - 20,
                        20,
                        nearbyIngredient.color
                    ).setInteractive(),
                    label: this.add.text(
                        this.sousChef.x + this.sousChef.width / 2,
                        this.sousChef.y - 30,
                        nearbyIngredient.name,
                        { fontSize: '12px', fill: '#000' }
                    ).setOrigin(0.5)
                };
    
                this.sousChef.heldIngredient = newIngredient;
    
            }
        } else {
            // Drop-off logic for the divider
            if (this.isNearZone(this.sousChef, this.zones.divider)) {
                // Drop off at the divider
                const dropPosition = {
                    x: this.zones.divider.x + Phaser.Math.Between(30, this.zones.divider.width - 30),
                    y: this.sousChef.y + this.sousChef.height / 2
                };
    
                const ingredientImage = this.add.circle(
                    dropPosition.x,
                    dropPosition.y,
                    20,
                    this.sousChef.heldIngredient.color
                );
    
                const ingredientLabel = this.add.text(
                    dropPosition.x,
                    dropPosition.y + 30,
                    this.sousChef.heldIngredient.name,
                    { fontSize: '12px', fill: '#000' }
                ).setOrigin(0.5);
    
                // Add the ingredient to the placedIngredients divider list
                this.placedIngredients.divider.push({
                    name: this.sousChef.heldIngredient.name,
                    color: this.sousChef.heldIngredient.color,
                    gameObject: ingredientImage,
                    label: ingredientLabel,
                    x: dropPosition.x,
                    y: dropPosition.y
                });
    
                // Destroy held ingredient visuals
                this.sousChef.heldIngredient.gameObject.destroy();
                this.sousChef.heldIngredient.label.destroy();
    
                // Clear held ingredient
                this.sousChef.heldIngredient = null;
            }
        }
    }
    
    
    
    
    

    update() {
        const chefSpeed = 5;
        
        // Chef movement
        if (this.keys.up.isDown && this.chef.y > 0) {
            this.chef.y -= chefSpeed;
        }
        if (this.keys.down.isDown && this.chef.y < this.scale.height - this.chef.height) {
            this.chef.y += chefSpeed;
        }
        if (this.keys.left.isDown && this.chef.x > 0) {
            this.chef.x -= chefSpeed;
        }
        if (this.keys.right.isDown && this.chef.x < this.zones.divider.x - this.chef.width) {
            this.chef.x += chefSpeed;
        }

        // Sous chef movement
        if (this.keys.up2.isDown && this.sousChef.y > 0) {
            this.sousChef.y -= chefSpeed;
        }
        if (this.keys.down2.isDown && this.sousChef.y < this.scale.height - this.sousChef.height) {
            this.sousChef.y += chefSpeed;
        }
        if (this.keys.left2.isDown && this.sousChef.x > this.zones.divider.x + this.zones.divider.width) {
            this.sousChef.x -= chefSpeed;
        }
        if (this.keys.right2.isDown && this.sousChef.x < this.scale.width - this.zones.sidebar.width - this.sousChef.width) {
            this.sousChef.x += chefSpeed;
        }

        // Update held ingredients positions
        if (this.chef.heldIngredient) {
            this.chef.heldIngredient.gameObject.setPosition(
                this.chef.x + this.chef.width/2,
                this.chef.y - 20
            );
            this.chef.heldIngredient.label.setPosition(
                this.chef.x + this.chef.width/2,
                this.chef.y - 30
            );
        }

        if (this.sousChef.heldIngredient) {
            this.sousChef.heldIngredient.gameObject.setPosition(
                this.sousChef.x + this.sousChef.width/2,
                this.sousChef.y - 20
            );
            this.sousChef.heldIngredient.label.setPosition(
                this.sousChef.x + this.sousChef.width/2,
                this.sousChef.y - 30
            );
        }
    }
}