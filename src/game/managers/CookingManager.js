export class CookingManager {
    constructor(scene) {
        this.scene = scene;
        this.isCooking = false;
        this.cookingSound = null;
        this.cookingTimer = null;
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

        // Set timer to stop cooking sound after 3 seconds
        this.cookingTimer = this.scene.time.delayedCall(3000, () => {
            this.stopCooking();
        });

        // Get current ingredients at cooking station
        const ingredients = this.scene.ingredientManager.placedIngredients.cookingStation;
        
        // Log current cooking state
        console.log('Starting cooking with ingredients:', ingredients);

        // Check if we have the right ingredients for the current recipe
        const isRecipeComplete = this.scene.recipeManager.checkRecipeCompletion(ingredients);
        
        console.log('Recipe completion check:', isRecipeComplete);

        if (isRecipeComplete) {
            // Get the current recipe
            const currentRecipe = this.scene.recipeManager.currentRecipe;
            console.log('Completing recipe:', currentRecipe.name);

            // Create the completed meal
            this.scene.cookingResult = this.scene.add.image(
                this.scene.zoneManager.getZone('cookingStation').x + 100,
                this.scene.zoneManager.getZone('cookingStation').y + 100,
                currentRecipe.result
            ).setScale(0.3);

            // Clear ingredients
            this.scene.ingredientManager.clearCookingStation();

            // Complete the recipe
            this.scene.recipeManager.completeRecipe();
        }
    }

    stopCooking() {
        this.isCooking = false;
        
        if (this.cookingSound) {
            this.cookingSound.stop();
            this.cookingSound.destroy();
            this.cookingSound = null;
        }

        if (this.cookingTimer) {
            this.cookingTimer.remove();
            this.cookingTimer = null;
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