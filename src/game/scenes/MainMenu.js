import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class MainMenu extends Scene
{
    logoTween;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.add.image(512, 384, 'mainMenuBackground');
        this.logo = this.add.image(512, 300, 'logo').setDepth(100);
        //add background to main menu text below with no image
        
        const mainMenuText = this.add.text(512, 460, 'Main Menu', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setDepth(100).setOrigin(0.5);
    
        // Make the text interactive with a hover effect
        
        mainMenuText.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.changeScene());
    
        // Only try to play music if it exists and isn't already playing
        if (this.game.music && !this.game.music.isPlaying && !this.sound.locked) {
            try {
                this.game.music.play();
                EventBus.emit('musicStateChanged', false);
            } catch (error) {
                console.error('Error playing music in MainMenu:', error);
            }
        }

        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        if (this.logoTween)
        {
            this.logoTween.stop();
            this.logoTween = null;
        }
        this.scene.start('CountdownScene');
    }

    moveLogo (reactCallback)
    {
        if (this.logoTween)
        {
            if (this.logoTween.isPlaying())
            {
                this.logoTween.pause();
            }
            else
            {
                this.logoTween.play();
            }
        }
        else
        {
            this.logoTween = this.tweens.add({
                targets: this.logo,
                x: { value: 750, duration: 3000, ease: 'Back.easeInOut' },
                y: { value: 80, duration: 1500, ease: 'Sine.easeOut' },
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    if (reactCallback)
                    {
                        reactCallback({
                            x: Math.floor(this.logo.x),
                            y: Math.floor(this.logo.y)
                        });
                    }
                }
            });
        }
    }
}