import { ChefHat, Music, Star, Timer, Trophy, VolumeX } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { EventBus } from '../game/EventBus';

export default function GameUIBar() {
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(120);
    const [currentRecipe, setCurrentRecipe] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [completedIngredients, setCompletedIngredients] = useState(new Set());

    useEffect(() => {
        const handleScore = (newScore) => setScore(newScore);
        const handleTime = (newTime) => setTimeLeft(newTime);
        const handleRecipe = (recipe) => {
            setCurrentRecipe(recipe);
            setCompletedIngredients(new Set()); // Reset completed ingredients for new recipe
        };
        const handleIngredientCompleted = (ingredientName) => {
            setCompletedIngredients(prev => new Set([...prev, ingredientName]));
        };
        const handleIngredientReset = () => {
            setCompletedIngredients(new Set());
        };

        EventBus.addListener('score-updated', handleScore);
        EventBus.addListener('time-updated', handleTime);
        EventBus.addListener('recipe-updated', handleRecipe);
        EventBus.addListener('ingredient-completed', handleIngredientCompleted);
        EventBus.addListener('recipe-reset', handleIngredientReset);

        return () => {
            EventBus.removeListener('score-updated', handleScore);
            EventBus.removeListener('time-updated', handleTime);
            EventBus.removeListener('recipe-updated', handleRecipe);
            EventBus.removeListener('ingredient-completed', handleIngredientCompleted);
            EventBus.removeListener('recipe-reset', handleIngredientReset);
        };
    }, []);

    const toggleMusic = () => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);
        EventBus.emit('toggleMusic', newMutedState);
    };

    const getIngredientImage = (ingredientName) => {
        const assetName = `${ingredientName.toLowerCase()}2`;
        return `/assets/prepped_ingredients/${assetName}.png`;
    };

    // Simulate ingredient completion for demo (in real app, this would be driven by game events)
    const isIngredientCompleted = (ingredient) => {
        return completedIngredients.has(ingredient);
    };

    return (
        <div className="w-64 h-full bg-gradient-to-br from-yellow-600 via-red-500 to-orange-600 flex flex-col p-4 space-y-4 relative overflow-hidden shadow-2xl">
            {/* Mexican pattern overlay */}
            <div className="absolute inset-0 w-full h-full opacity-20" 
                 style={{
                     backgroundImage: `
                         repeating-linear-gradient(45deg, 
                         transparent 0px, 
                         transparent 10px, 
                         rgba(255,99,71,0.3) 10px, 
                         rgba(255,99,71,0.3) 20px),
                         repeating-linear-gradient(-45deg, 
                         transparent 0px, 
                         transparent 10px, 
                         rgba(255,215,0,0.3) 10px, 
                         rgba(255,215,0,0.3) 20px)
                     `
                 }}
            />

            {/* Recipe Card with Enhanced Visual Feedback */}
            <div className="relative bg-gradient-to-br from-yellow-800 to-orange-900 rounded-xl p-4 shadow-xl transform hover:scale-105 transition-transform duration-300 border-2 border-yellow-400">
                <div className="absolute -top-3 -right-3 bg-red-500 rounded-full p-2 shadow-lg border-2 border-yellow-300">
                    <ChefHat className="w-6 h-6 text-yellow-100" />
                </div>
                
                <h2 className="text-2xl font-bold text-yellow-100 mb-3 text-center">
                    {currentRecipe?.name || '¡Nueva Receta!'}
                </h2>
                
                <div className="space-y-2">
                    <h3 className="text-lg font-bold text-yellow-200">Ingredientes:</h3>
                    <ul className="grid grid-cols-2 gap-2">
                        {currentRecipe?.ingredients?.map((ingredient, index) => (
                            <li 
                                key={index}
                                className={`flex flex-col items-center p-2 rounded-lg 
                                         border transition-all duration-300 transform hover:scale-105
                                         ${isIngredientCompleted(ingredient) 
                                           ? 'bg-green-800 bg-opacity-70 border-green-400 shadow-lg shadow-green-900/50' 
                                           : 'bg-orange-800 bg-opacity-70 border-orange-400'}`}
                            >
                                <div className="relative w-16 h-16 flex items-center justify-center mb-1">
                                    <img 
                                        src={getIngredientImage(ingredient)}
                                        alt={ingredient}
                                        className={`w-full h-full object-contain transition-all duration-300
                                                  ${isIngredientCompleted(ingredient) ? 'opacity-100' : 'opacity-80'}`}
                                    />
                                    {isIngredientCompleted(ingredient) && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                                <span className="text-white text-sm">✓</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <span className={`text-xs font-medium text-center
                                                ${isIngredientCompleted(ingredient) 
                                                  ? 'text-green-200' 
                                                  : 'text-yellow-100'}`}>
                                    {ingredient}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Timer Section with Enhanced Rapido Amigo Alert */}
            <div className="relative bg-gradient-to-br from-green-800 to-emerald-900 rounded-xl p-4 shadow-xl transform hover:scale-105 transition-transform duration-300 border-2 border-green-400">
                <div className="absolute -top-3 -left-3 bg-emerald-500 rounded-full p-2 shadow-lg border-2 border-green-300">
                    <Timer className="w-6 h-6 text-green-100" />
                </div>
                
                <h3 className="text-xl font-bold text-green-100 text-center mb-2">Tiempo</h3>
                <div className={`text-4xl font-bold text-center tracking-wider rounded-lg p-2
                               ${timeLeft <= 30 
                                 ? 'bg-red-900 text-yellow-300 animate-pulse' 
                                 : 'bg-gradient-to-r from-green-900 to-emerald-900 text-yellow-300'}`}>
                    {`${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`}
                </div>
                {timeLeft <= 30 && (
                    <div className="mt-2 bg-red-800 rounded-lg p-2 border-2 border-red-500">
                        <p className="text-red-500 text-center font-bold text-sm animate-bounce">
                            ¡Rápido Amigo!
                        </p>
                    </div>
                )}
            </div>

            {/* Score Section */}
            <div className="relative bg-gradient-to-br from-blue-800 to-indigo-900 rounded-xl p-4 shadow-xl transform hover:scale-105 transition-transform duration-300 border-2 border-blue-400">
                <div className="absolute -top-3 -right-3 bg-blue-500 rounded-full p-2 shadow-lg border-2 border-blue-300">
                    <Trophy className="w-6 h-6 text-blue-100" />
                </div>
                
                <h3 className="text-xl font-bold text-blue-100 text-center mb-2">Puntos</h3>
                <div className="flex justify-center items-center space-x-2 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-lg p-2">
                    <div className="text-4xl font-bold text-yellow-300">
                        {score}
                    </div>
                    <Star className="w-6 h-6 text-yellow-400 animate-pulse" />
                </div>
            </div>

            {/* Music Toggle */}
            <button
                onClick={toggleMusic}
                className="mt-auto bg-gradient-to-r from-purple-800 to-fuchsia-900 p-3 rounded-xl 
                         shadow-xl border-2 border-purple-400 hover:from-purple-700 hover:to-fuchsia-800 
                         transition-all duration-300 flex items-center justify-center space-x-2 group
                         transform hover:scale-105"
            >
                {isMuted ? (
                    <VolumeX className="w-6 h-6 text-purple-100 transform group-hover:scale-110 transition-transform duration-300" />
                ) : (
                    <Music className="w-6 h-6 text-purple-100 transform group-hover:scale-110 transition-transform duration-300" />
                )}
                <span className="text-purple-100 font-medium text-sm">
                    {isMuted ? 'Sin Música' : 'Con Música'}
                </span>
            </button>
        </div>
    );
}