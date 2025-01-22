export class RecipeManager {
    constructor(scene) {
        this.scene = scene;
        this.recipes = [
            {
                name: 'Taco',
                image: 'taco_recipe',
                result: 'taco_complete',
                ingredients: ['Tortilla', 'Cheese', 'Tomato'],
                points: 40
            },
            {
                name: 'Burrito',
                image: 'burrito_recipe',
                result: 'burrito_complete',
                ingredients: ['Tortilla', 'Meat', 'Tomato'],
                points: 40
            },
            {
                name: 'Chips and Guac',
                image: 'chipsandguac_recipe',
                result: 'chipsandguac_complete',
                ingredients: ['Tortilla', 'Avocado', 'Tomato'],
                points: 40
            },
            {
                name: 'Guacamole',
                image: 'guacamole_recipe',
                result: 'guacamole_complete',
                ingredients: ['Tortilla', 'Avocado', 'Tomato'],
                points: 40
            }
        ];
        this.currentRecipe = this.recipes[0];
        this.recipeDisplay = null;
    }

    initializeDisplay(x, y) {
        this.recipeDisplay = this.scene.add.image(x, y, this.currentRecipe.image)
            .setOrigin(0.5)
            .setScale(0.4);
    }

    cycleToNextRecipe() {
        const recipeIndex = (this.recipes.indexOf(this.currentRecipe) + 1) % this.recipes.length;
        this.currentRecipe = this.recipes[recipeIndex];
        
        if (this.recipeDisplay) {
            this.scene.tweens.add({
                targets: this.recipeDisplay,
                alpha: 0,
                duration: 150,
                onComplete: () => {
                    this.recipeDisplay.setTexture(this.currentRecipe.image);
                    this.scene.tweens.add({
                        targets: this.recipeDisplay,
                        alpha: 1,
                        duration: 150
                    });
                }
            });
        }
    }

    checkRecipeCompletion(placedIngredients) {
        if (!this.currentRecipe) return false;

        const requiredIngredients = this.currentRecipe.ingredients;
        const placedIngredientNames = placedIngredients.map(ing => ing.name);

        // Check if all required ingredients are in the cooking station
        return requiredIngredients.every(ingredient => 
            placedIngredientNames.includes(ingredient)
        ) && placedIngredientNames.length === requiredIngredients.length;
    }

    completeRecipe() {
        if (!this.currentRecipe) return;

        // Show completed meal image
        this.scene.cookingResult = this.scene.add.image(
            this.scene.zoneManager.getZone('cookingStation').x + this.scene.zoneManager.getZone('cookingStation').width / 2,
            this.scene.zoneManager.getZone('cookingStation').y + this.scene.zoneManager.getZone('cookingStation').height / 2,
            this.currentRecipe.result
        )
        .setOrigin(0.5)
        .setScale(0.5);

        // Store the completed recipe name for pickup
        this.scene.cookingResult.recipeName = this.currentRecipe.name;
        this.scene.cookingResult.points = this.currentRecipe.points;

        // Clear current ingredients
        this.scene.ingredientManager.clearCookingStation();

        // Initialize pickup timer in the scene
        this.scene.initializePickupTimer();

        // Move to next recipe
        this.cycleToNextRecipe();
    }
} 