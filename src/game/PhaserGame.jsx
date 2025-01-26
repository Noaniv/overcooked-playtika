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
                width: 1260,
                height: 768,
                scale: {
                    mode: Phaser.Scale.NONE,
                    autoCenter: Phaser.Scale.CENTER_BOTH,
                    parent: localRef.current,
                    width: 1260,
                    height: 768
                },
                physics: {
                    default: 'arcade',
                    arcade: {
                        gravity: { y: 0 },
                        debug: false
                    }
                },
                backgroundColor: '#000000'
            };
            
            gameRef.current = new Game(localRef.current, config);
            
            if (ref) {
                ref.current = {
                    scene: gameRef.current.scene,
                    game: gameRef.current
                };
            }

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

    return (
        <div ref={localRef} style={{
            width: '1260px',
            height: '768px',
            flexShrink: 0,
            flexGrow: 0,
            position: 'relative'
        }}>
            {/* Game will be mounted here */}
        </div>
    );
});

PhaserGame.displayName = 'PhaserGame'; // Add display name for dev tools

// Props definitions
PhaserGame.propTypes = {
    currentActiveScene: PropTypes.func 
}

export { PhaserGame };
