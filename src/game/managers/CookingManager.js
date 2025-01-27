export class CookingManager {
    constructor(scene) {
        this.scene = scene;
        this.isCooking = false;
        this.cookingSound = null;
        this.cookingSoundTimer = null;
    }

    startCooking() {
        if (this.isCooking) return;
        
        this.isCooking = true;

        // Start cooking sound
        this.cookingSound = this.scene.sound.add('cookingKitchenSound', {
            loop: false,
            volume: 0.3
        });
        this.cookingSound.play();

        // Set timer to stop cooking sound after 3 seconds
        this.cookingSoundTimer = this.scene.time.delayedCall(3000, () => {
            this.isCooking = false;
        
            if (this.cookingSound) {
                this.cookingSound.stop();
                this.cookingSound.destroy();
                this.cookingSound = null;
            }
            if (this.cookingSoundTimer) {
                this.cookingSoundTimer.remove();
                this.cookingSoundTimer = null;
            }
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

            const cookingStation = this.scene.zoneManager.getZone('cookingStation');
            
            // Create the completed meal with all necessary properties
            const completedMeal = {
                name: currentRecipe.name,
                gameObject: this.scene.add.image(
                    cookingStation.x + cookingStation.width / 2,
                    cookingStation.y + cookingStation.height / 2,
                    currentRecipe.result
                ).setScale(0.2),
                isCompletedMeal: true,
                points: 50,
                result: currentRecipe.result,
                state: 'completed'
            };

            // Clear ingredients
            this.scene.ingredientManager.clearCookingStation();

            // Add completed meal to cooking station
            this.scene.ingredientManager.placedIngredients.cookingStation.push(completedMeal);

            // Complete the recipe
            this.scene.recipeManager.completeRecipe();

            // Start the timer for the completed meal
            this.scene.ingredientManager.startCompletedMealTimer(completedMeal);
        }
    }

    stopCooking() {
        this.isCooking = false;
        
        if (this.cookingSound) {
            this.cookingSound.stop();
            this.cookingSound.destroy();
            this.cookingSound = null;
        }

        if (this.cookingSoundTimer) {
            this.cookingSoundTimer.remove();
            this.cookingSoundTimer = null;
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