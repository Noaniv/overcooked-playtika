import PropTypes from 'prop-types';
import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react';
import GameUIBar from '../components/GameUIBar';
import { EventBus } from './EventBus';
import StartGame from './main';

export const PhaserGame = forwardRef(function PhaserGame({ currentActiveScene }, ref) {
    const game = useRef();
    const [score, setScore] = useState(0);
    const [currentRecipe, setCurrentRecipe] = useState('');
    const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds

    // Create the game inside a useLayoutEffect hook to avoid the game being created outside the DOM
    useLayoutEffect(() => {
        if (game.current === undefined)
        {
            game.current = StartGame("game-container");
            // Expose game instance globally for music control
            window.game = game.current;
            
            if (ref !== null)
            {
                ref.current = { game: game.current, scene: null };
            }

            // Initialize music state
            EventBus.emit('musicStateChanged', false);
        }

        return () => {
            if (game.current)
            {
                game.current.destroy(true);
                game.current = undefined;
                window.game = undefined;
            }
        }
    }, [ref]);

    useEffect(() => {
        EventBus.on('current-scene-ready', (currentScene) => {
            if (currentActiveScene instanceof Function)
            {
                currentActiveScene(currentScene);
            }
            ref.current.scene = currentScene;
        });

        // Listen for score updates from the game
        const scoreHandler = (newScore) => setScore(newScore);
        const recipeHandler = (recipe) => setCurrentRecipe(recipe);
        const timeHandler = (time) => setTimeLeft(time);

        EventBus.on('score-updated', scoreHandler);
        EventBus.on('recipe-updated', recipeHandler);
        EventBus.on('time-updated', timeHandler);

        return () => {
            EventBus.removeListener('current-scene-ready');
            EventBus.off('score-updated', scoreHandler);
            EventBus.off('recipe-updated', recipeHandler);
            EventBus.off('time-updated', timeHandler);
        }
    }, [currentActiveScene, ref]);

    return (
        <div style={{ 
            position: 'relative', 
            width: '100%', 
            height: '100%',
            display: 'flex',
            justifyContent: 'center'
        }}>
            <GameUIBar 
                score={score}
                currentRecipe={currentRecipe}
                timeLeft={timeLeft}
            />
            <div id="game-container" style={{ 
                marginLeft: '80px',  // Space for UI bar
                flex: '0 1 auto', // Don't grow, allow shrink, auto basis
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                maxWidth: 'calc(100% - 80px)' // Prevent overflow
            }}></div>
        </div>
    );
});

// Props definitions
PhaserGame.propTypes = {
    currentActiveScene: PropTypes.func 
}
