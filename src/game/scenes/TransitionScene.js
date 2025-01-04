// scenes/TransitionScene.js
import { Scene } from "phaser";
import { EventBus } from '../EventBus';

export class TransitionScene extends Scene {
  constructor() {
    super("TransitionScene");
  }

  create(data) {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const nextScene = data.nextScene || 'GameScene'; // Fallback to GameScene if none is passed

    const circle = this.add.circle(centerX, centerY, 50, 0x00ff00);
    this.tweens.add({
        targets: circle,
        scaleX: 20,
        scaleY: 20,
        alpha: 0,
        duration: 1000,
        ease: "Cubic.easeOut",
        onComplete: () => {
            this.scene.start(nextScene);
        },
    });

    this.cameras.main.fadeOut(1000, 0, 0, 0);
}

}
