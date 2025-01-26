import { EventBus } from '../EventBus';

export class RecipeManager {
    constructor(scene) {
        this.scene = scene;
        this.currentRecipe = null;
        this.recipes = [
            {
                name: 'Taco',
                ingredients: ['Tortilla', 'Meat', 'Cheese'],
                result: 'taco_complete',
                image: 'taco_recipe'
            },
            {
                name: 'Burrito',
                ingredients: ['Tortilla', 'Meat', 'Tomato'],
                result: 'burrito_complete',
                image: 'burrito_recipe'
            },
            {
                name: 'Chips and Guac',
                ingredients: ['Tortilla', 'Avocado', 'Tomato'],
                result: 'chipsandguac_complete',
                image: 'chipsandguac_recipe'
            },
            {
                name: 'Guacamole',
                ingredients: ['Tortilla', 'Avocado', 'Tomato'],
                result: 'guacamole_complete',
                image: 'guacamole_recipe'
            },
            {
                name: 'Nachos',
                ingredients: ['Tortilla', 'Meat', 'Tomato'],
                result: 'nachos_complete',
                image: 'nachos_recipe'
            },
            {
                name: 'Sope',
                ingredients: ['Tortilla', 'Meat', 'Tomato'],
                result: 'sope_complete',
                image: 'sope_recipe'
            },
            {
                name: 'Mexican Salad',
                ingredients: ['Tortilla', 'Meat', 'Tomato'],
                result: 'mexicanSalad_complete',
                image: 'mexicanSalad_recipe'
            },
            {
                name: 'Cheese Wrap',
                ingredients: ['Tortilla', 'Meat', 'Tomato'],
                result: 'cheeseWrap_complete',
                image: 'cheeseWrap_recipe'
            }
        ];
    }

    cycleToNextRecipe() {
        const recipeIndex = (this.recipes.indexOf(this.currentRecipe) + 1) % this.recipes.length;
        this.currentRecipe = this.recipes[recipeIndex];
        
        // Emit recipe update with both name and image
        EventBus.emit('recipe-updated', {
            name: this.currentRecipe.name,
            image: this.currentRecipe.image
        });
    }

    checkRecipeCompletion(ingredients) {
        if (!this.currentRecipe) return false;
        
        const requiredIngredients = this.currentRecipe.ingredients;
        const placedIngredients = ingredients.map(ing => ing.name);
        
        return requiredIngredients.every(ingredient => 
            placedIngredients.includes(ingredient)
        );
    }

    completeRecipe() {
        // Award points
        this.scene.addPoints(50);
        
        // Move to next recipe
        this.cycleToNextRecipe();
    }

    // Initialize with first recipe
    start() {
        this.currentRecipe = this.recipes[0];
        // Emit initial recipe with both name and image
        EventBus.emit('recipe-updated', {
            name: this.currentRecipe.name,
            image: this.currentRecipe.image
        });
    }
} 