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
                image: 'chipsAndGuac_recipe'
            },
            {
                name: 'Guacamole',
                ingredients: ['Avocado', 'Tomato'],
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
        
        console.log('Emitting recipe update:', {
            name: this.currentRecipe.name,
            image: this.currentRecipe.image,
            ingredients: this.currentRecipe.ingredients
        });

        EventBus.emit('recipe-updated', this.currentRecipe);
    }

    checkRecipeCompletion(placedIngredients) {
        if (!this.currentRecipe) return false;

        // Get array of ingredient names
        const placedNames = placedIngredients.map(ing => ing.name);
        
        console.log('Recipe check:', {
            required: this.currentRecipe.ingredients,
            placed: placedNames,
            recipeName: this.currentRecipe.name
        });

        // Check if all required ingredients are present
        const hasAllRequired = this.currentRecipe.ingredients.every(required => 
            placedNames.includes(required)
        );

        // Check if there are no extra ingredients
        const correctCount = placedNames.length === this.currentRecipe.ingredients.length;

        return hasAllRequired && correctCount;
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
        console.log('Starting with recipe:', this.currentRecipe);
        EventBus.emit('recipe-updated', this.currentRecipe);
    }
} 