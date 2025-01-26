import PropTypes from 'prop-types';
import React, { forwardRef, useEffect, useRef } from 'react';
import { EventBus } from './EventBus';
import { Game } from './main';

const PhaserGame = forwardRef((props, ref) => {
    const localRef = useRef(null);
    const gameRef = useRef(null);

    useEffect(() => {
        if (localRef.current && !gameRef.current) {
            const config = {
                type: Phaser.AUTO,
                width: 1024,
                height: 768,
                scale: {
                    mode: Phaser.Scale.NONE, // Don't auto-scale
                    autoCenter: Phaser.Scale.NO_CENTER // Don't auto-center
                },
                // ... rest of config
            };
            gameRef.current = new Game(localRef.current, config);
            
            // Expose the game instance to the parent component through ref
            if (ref) {
                ref.current = {
                    scene: gameRef.current.scene,
                    game: gameRef.current
                };
            }

            // Make game instance globally available
            window.game = gameRef.current;
        }

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
                window.game = null;
            }
        };
    }, [ref]);

    useEffect(() => {
        EventBus.on('current-scene-ready', (currentScene) => {
            if (props.currentActiveScene instanceof Function) {
                props.currentActiveScene(currentScene);
            }
        });

        return () => {
            EventBus.removeListener('current-scene-ready');
        };
    }, [props.currentActiveScene]);

    return <div id="game-container" ref={localRef} />;
});

PhaserGame.displayName = 'PhaserGame'; // Add display name for dev tools

// Props definitions
PhaserGame.propTypes = {
    currentActiveScene: PropTypes.func 
}

export { PhaserGame };
