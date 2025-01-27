import { EventBus } from '../EventBus';

export class RecipeManager {
    constructor(scene) {
        this.scene = scene;
        this.currentRecipe = null;
        this.recipes = [
            {
                name: 'Taco',
                ingredients: ['Tortilla', 'Meat', 'Tomato'],
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
                result: 'chipsAndGuac_complete',
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
                ingredients: ['Tortilla', 'Meat', 'Tomato', 'Cheese'],
                result: 'nachos_complete',
                image: 'nachos_recipe'
            },
            {
                name: 'Sope',
                ingredients: ['Tortilla', 'Meat', 'Tomato',"Avocado"],
                result: 'sope_complete',
                image: 'sope_recipe'
            },
            {
                name: 'Mexican Salad',
                ingredients: ['Tortilla', 'Meat', 'Tomato', 'Cheese'],
                result: 'mexicanSalad_complete',
                image: 'mexicanSalad_recipe'
            },
            {
                name: 'Taquito',
                ingredients: ['Tortilla', 'Meat', 'Tomato', 'Avocado'],
                result: 'cheeseWrap_complete',
                image: 'cheeseWrap_recipe'
            }
        ];
    }

    cycleToNextRecipe() {
        // Get a random index different from the current recipe
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * this.recipes.length);
        } while (this.recipes[newIndex] === this.currentRecipe && this.recipes.length > 1);
        
        this.currentRecipe = this.recipes[newIndex];
        
        console.log('Emitting recipe update:', {
            name: this.currentRecipe.name,
            image: this.currentRecipe.image,
            ingredients: this.currentRecipe.ingredients
        });

        EventBus.emit('recipe-updated', this.currentRecipe);
    }

    checkRecipeCompletion(placedIngredients) {
        if (!this.currentRecipe) {
            console.log('No current recipe to check');
            return false;
        }

        if (!Array.isArray(placedIngredients) || placedIngredients.length === 0) {
            console.log('No ingredients placed or invalid input');
            return false;
        }

        console.log('Checking recipe completion for:', this.currentRecipe.name);
        console.log('Required ingredients:', this.currentRecipe.ingredients);
        console.log('Placed ingredients:', placedIngredients.map(ing => ({
            name: ing.name,
            state: ing.state
        })));

        // Get array of ingredient names, ensuring they're all prepped
        const placedNames = placedIngredients
            .filter(ing => ing.state === 'prepped')
            .map(ing => ing.name);

        // Debug logging
        console.log('Recipe completion check:', {
            required: this.currentRecipe.ingredients,
            placed: placedNames,
            recipeName: this.currentRecipe.name,
            allPrepped: placedIngredients.every(ing => ing.state === 'prepped')
        });

        // Check if all ingredients are prepped
        if (!placedIngredients.every(ing => ing.state === 'prepped')) {
            console.log('Not all ingredients are prepped');
            return false;
        }

        // Check if all required ingredients are present (case-insensitive comparison)
        const hasAllRequired = this.currentRecipe.ingredients.every(required => {
            const found = placedNames.some(placed => 
                placed.toLowerCase() === required.toLowerCase()
            );
            console.log(`Checking for ${required}: ${found}`);
            return found;
        });

        // Check if there are no extra ingredients
        const correctCount = placedNames.length === this.currentRecipe.ingredients.length;

        const isComplete = hasAllRequired && correctCount;
        console.log('Recipe completion result:', {
            hasAllRequired,
            correctCount,
            isComplete,
            placedCount: placedNames.length,
            requiredCount: this.currentRecipe.ingredients.length
        });

        return isComplete;
    }

    completeRecipe() {
        if (!this.currentRecipe) {
            console.warn('Cannot complete recipe: no current recipe');
            return;
        }

        console.log('Completing recipe:', this.currentRecipe.name);

        // Award points
        this.scene.addPoints(50);
        
        // Emit completion event with recipe result
        EventBus.emit('recipe-completed', {
            name: this.currentRecipe.name,
            result: this.currentRecipe.result
        });
        
        // Move to next recipe
        this.cycleToNextRecipe();
    }

    // Initialize with first recipe
    start() {
        // Choose a random recipe to start with
        const randomIndex = Math.floor(Math.random() * this.recipes.length);
        this.currentRecipe = this.recipes[randomIndex];
        console.log('Starting with recipe:', this.currentRecipe);
        EventBus.emit('recipe-updated', this.currentRecipe);
    }
} 