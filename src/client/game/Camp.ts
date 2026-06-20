import * as Phaser from 'phaser';

export default class Camp {
    scene: Phaser.Scene;
    x: number;
    y: number;
    radius: number;

    sprite?: Phaser.GameObjects.Image;
    campRadius?: Phaser.GameObjects.Arc;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        radius: number = 150
    ) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.radius = radius;
    }

    create() {
        this.sprite = this.scene.add.image(this.x, this.y, 'enemy_camp');
        this.sprite.setOrigin(0.5, 0.5);

        this.campRadius = this.scene.add.circle(
            this.x,
            this.y,
            this.radius
        );

        this.campRadius.setStrokeStyle(4, 0xffff00, 0.5);
    }

    getRandomPositionInRadius() {
        const angle = Phaser.Math.FloatBetween(0, 2 * Math.PI);
        const distance = Phaser.Math.FloatBetween(0, this.radius - 35);

        return {
            x: this.x + distance * Math.cos(angle),
            y: this.y + distance * Math.sin(angle),
        };
    }
}