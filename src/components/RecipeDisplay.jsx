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
                } else {
                    console.warn('Missing required elements:', {
                        hasRecipe: !!recipe,
                        hasCanvas: !!canvasRef.current,
                        hasGame: !!window.game
                    });
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

    console.log('Rendering recipe:', currentRecipe);

    return (
        <div className="recipe-display">
            <h3 className="text-white mb-2">{currentRecipe.name}</h3>
            <canvas
                ref={canvasRef}
                width={200}
                height={200}
                className="recipe-image"
                style={{ border: '1px solid white' }}
            />
            <div className="text-white mt-2">
                <p>Ingredients:</p>
                <ul>
                    {currentRecipe.ingredients.map((ingredient, index) => (
                        <li key={index}>{ingredient}</li>
                    ))}
                </ul>
            </div>
            <div className="text-xs text-gray-400 mt-2">
                {/* <p>Recipe: {currentRecipe.name}</p>
                <p>Image key: {currentRecipe.image}</p> */}
            </div>
        </div>
    );
};

export default RecipeDisplay; 