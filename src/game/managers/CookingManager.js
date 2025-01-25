export class CookingManager {
    constructor(scene) {
        this.scene = scene;
        this.isCooking = false;
        this.cookingSound = null;
    }

    startCooking() {
        if (this.isCooking) return;
        
        this.isCooking = true;

        // Start cooking sound
        this.cookingSound = this.scene.sound.add('cookingKitchenSound', {
            loop: true,
            volume: 0.3
        });
        this.cookingSound.play();
    }

    stopCooking() {
        this.isCooking = false;
        
        if (this.cookingSound) {
            this.cookingSound.stop();
            this.cookingSound.destroy();
            this.cookingSound = null;
        }
    }

    handleCookingStationDropoff(character) {
        if (!character.heldIngredient) return;

        // Start cooking sound when ingredient is dropped
        this.startCooking();

        // Rest of dropoff logic...
    }

    cleanup() {
        this.stopCooking();
    }
} 