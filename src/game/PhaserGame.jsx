import Phaser from 'phaser';
import React, { useEffect } from 'react';
import { Boot } from './scenes/Boot'; // You might need to create this
import { MainMenu } from './scenes/MainMenu'; // Make sure you have this scene
import { OvercookedGame } from './scenes/OvercookedGame';
import { Preloader } from './scenes/Preloader';
import { CountdownScene } from './scenes/CountdownScene';

export const PhaserGame = () => {
    useEffect(() => {
        const config = {
            type: Phaser.AUTO,
            parent: 'phaser-game',
            width: 1024,
            height: 768,
            backgroundColor: '#000000',
            scene: [Boot, Preloader, MainMenu, OvercookedGame, CountdownScene],
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            },
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        };

        const game = new Phaser.Game(config);

        // Cleanup on unmount
        return () => {
            game.destroy(true);
        };
    }, []);

    return <div id="phaser-game" />;
};

export default PhaserGame;