import { Game as PhaserGame } from 'phaser';
import { Boot } from './scenes/Boot';
import { CountdownScene } from './scenes/CountdownScene';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import { OvercookedGame } from './scenes/OvercookedGame';
import { Preloader } from './scenes/Preloader';

const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    backgroundColor: '#028af8',
    scene: [
        Boot,
        Preloader,
        MainMenu,
        CountdownScene,
        OvercookedGame,
        GameOver
    ]
};

export class Game extends PhaserGame {
    constructor() {
        super(config);
    }
}

export default function StartGame(containerId) {
    if (document.getElementById(containerId)) {
        return new Game();
    }
    return null;
}