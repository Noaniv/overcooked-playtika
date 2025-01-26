import React, { useEffect, useRef, useState } from 'react';
import { EventBus } from '../game/EventBus';

const RecipeDisplay = () => {
    const [currentRecipe, setCurrentRecipe] = useState(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const handleRecipeUpdate = (recipe) => {
            console.log('Recipe update received in RecipeDisplay:', recipe);
            setCurrentRecipe(recipe);
            
            requestAnimationFrame(() => {
                if (recipe && canvasRef.current && window.game) {
                    const canvas = canvasRef.current;
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    const texture = window.game.textures.get(recipe.image);
                    console.log('Texture found:', texture, 'for key:', recipe.image);
                    
                    if (texture) {
                        const frame = texture.getSourceImage();
                        console.log('Frame:', frame);
                        try {
                            ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
                        } catch (error) {
                            console.error('Error drawing image:', error);
                        }
                    } else {
                        console.warn('No texture found for:', recipe.image);
                    }
                }
            });
        };

        console.log('Setting up recipe update listener');
        EventBus.on('recipe-updated', handleRecipeUpdate);

        return () => {
            console.log('Cleaning up recipe update listener');
            EventBus.off('recipe-updated', handleRecipeUpdate);
        };
    }, []);

    if (!currentRecipe) {
        console.log('No current recipe');
        return null;
    }

    const renderIngredientIcons = () => {
        return (
            <div className="flex flex-wrap gap-4 justify-center mt-4">
                {currentRecipe.ingredients.map((ingredient, index) => {
                    const iconKey = `${ingredient.toLowerCase()}1`;
                    return (
                        <div key={index} className="ingredient-icon-container bg-gradient-to-r from-orange-800 to-red-800 border-2 border-yellow-400 hover:border-yellow-300 transition-all duration-300">
                            <canvas
                                width={50}
                                height={50}
                                className="ingredient-icon"
                                ref={canvas => {
                                    if (canvas && window.game) {
                                        const ctx = canvas.getContext('2d');
                                        const texture = window.game.textures.get(iconKey);
                                        if (texture) {
                                            const frame = texture.getSourceImage();
                                            ctx.clearRect(0, 0, 50, 50);
                                            ctx.drawImage(frame, 0, 0, 50, 50);
                                        }
                                    }
                                }}
                            />
                            <span className="text-yellow-300 text-xs mt-1 font-bold">{ingredient}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="recipe-display-container bg-gradient-to-b from-orange-950 to-red-950">
            <div className="recipe-display p-4">
                <h3 className="text-yellow-300 text-lg font-bold mb-2 bg-gradient-to-r from-orange-800 to-red-800 p-2 rounded-lg text-center shadow-lg">{currentRecipe.name}</h3>
                <canvas
                    ref={canvasRef}
                    width={200}
                    height={150}
                    className="recipe-image rounded-lg border-2 border-yellow-400 shadow-lg"
                />
                <div className="text-yellow-300 mt-4">
                    <p className="font-bold text-center bg-gradient-to-r from-orange-800 to-red-800 p-2 rounded-lg shadow-md">Ingredients:</p>
                    {renderIngredientIcons()}
                </div>
            </div>
        </div>
    );
};

export default RecipeDisplay;