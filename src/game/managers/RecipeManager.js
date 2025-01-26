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
        
        // Log for debugging
        console.log('Cycling to recipe:', {
            name: this.currentRecipe.name,
            image: this.currentRecipe.image,
            ingredients: this.currentRecipe.ingredients
        });

        // Emit recipe update with image property
        EventBus.emit('recipe-updated', {
            name: this.currentRecipe.name,
            image: this.currentRecipe.image
        });
    }

    checkRecipeCompletion(ingredients) {
        if (!this.currentRecipe) return false;
        
        // Log for debugging
        console.log('Checking recipe completion:', {
            required: this.currentRecipe.ingredients,
            placed: ingredients.map(ing => ing.name),
            recipe: this.currentRecipe.name
        });

        const requiredIngredients = this.currentRecipe.ingredients;
        const placedIngredients = ingredients.map(ing => ing.name);
        
        // Check if all required ingredients are present
        const hasAllIngredients = requiredIngredients.every(ingredient => {
            const hasIngredient = placedIngredients.includes(ingredient);
            // Log each ingredient check
            console.log(`Checking ${ingredient}: ${hasIngredient}`);
            return hasIngredient;
        });

        // Check if there are no extra ingredients
        const correctCount = placedIngredients.length === requiredIngredients.length;

        // Log final result
        console.log('Recipe completion result:', {
            hasAllIngredients,
            correctCount,
            isComplete: hasAllIngredients && correctCount
        });

        return hasAllIngredients && correctCount;
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
        
        // Log for debugging
        console.log('Starting with recipe:', {
            name: this.currentRecipe.name,
            image: this.currentRecipe.image,
            ingredients: this.currentRecipe.ingredients
        });

        // Emit initial recipe
        EventBus.emit('recipe-updated', {
            name: this.currentRecipe.name,
            image: this.currentRecipe.image
        });
    }
} 