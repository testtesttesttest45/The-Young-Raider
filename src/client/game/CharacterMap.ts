export type CharacterType = "raider" | "enemy";
export type EnemyAnimationName = "idle" | "move" | "attack";
export type EnemyDirectionalAnimation = {
  spritesheetKey: string;
  framesPerDirection: number;
  frameRate: number;
  repeat: number;
  damageFrames?: number[];
  projectileReleaseFrame?: number;
};
export type EnemyDeathAnimation = {
  spritesheetKey: string;
  frameCount: number;
  frameRate: number;
  repeat: number;
};
export type EnemyAnimationConfig = {
  idle: EnemyDirectionalAnimation;
  move: EnemyDirectionalAnimation;
  attack: EnemyDirectionalAnimation;
  death: EnemyDeathAnimation;
  scale: number;
  healthBarOffsetY: number;
};
export type CharacterDefinition = {
  type: CharacterType;
  name: string;
  cost: number;
  tier: string;
  range: number;
  speed: number;
  damage: number;
  health: number;
  attackSpeed: number;
  attackCount: number;
  projectile: string;
  icon: string;
  idle: string;
  description: string;
  // raider only
  spritesheetKey?: string;
  movingSpritesheetKey?: string;
  attackSpritesheetKey?: string;
  deathSpritesheetKey?: string;
  slashSpritesheetKey?: string;
  dashSlashSpritesheetKey?: string;
  shieldSpritesheetKey?: string;
  shieldMoveSpritesheetKey?: string;
  // enemy only
  enemyAnimations?: EnemyAnimationConfig;
};
const characterMap: Record<number, CharacterDefinition> = {
  1: {
    type: "raider",
    spritesheetKey: "test_idle",
    movingSpritesheetKey: "test_moving",
    attackSpritesheetKey: "test_attack",
    deathSpritesheetKey: "test_death",
    slashSpritesheetKey: "test_slash",
    dashSlashSpritesheetKey: "test_dash",
    shieldSpritesheetKey: "test_shield",
    shieldMoveSpritesheetKey: "test_shield_move",
    name: "The Boy",
    cost: 100,
    tier: "hard",
    range: 110,
    speed: 220,
    damage: 99,
    health: 573,
    attackSpeed: 1.4,
    attackCount: 1,
    projectile: "",
    icon: "darkEtherMessiah",
    idle: "testIdle",
    description:
      "Young and determined, the Boy will stop at nothing to save his village from the evil that has taken over.",
  },
  2: {
    type: "enemy",
    name: "Orc",
    cost: 55,
    tier: "easy",
    health: 170,
    damage: 20,
    range: 75,
    speed: 180,
    attackSpeed: 1.08,
    attackCount: 1,
    projectile: "",
    icon: "orc",
    idle: "character2Idle",
    description: "A basic enemy with moderate health and damage.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "character2_idle",
        framesPerDirection: 41,
        frameRate: 24,
        repeat: -1,
      },
      move: {
        spritesheetKey: "character2_move",
        framesPerDirection: 31,
        frameRate: 24,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "character2_attack",
        framesPerDirection: 25,
        frameRate: 24,
        repeat: 0,
        damageFrames: [15],
      },
      death: {
        spritesheetKey: "character2_die",
        frameCount: 28,
        frameRate: 24,
        repeat: 0,
      },
      scale: 0.75,
      healthBarOffsetY: -48,
    },
  },
  3: {
    type: "enemy",
    name: "Assassin Rat",
    cost: 75,
    tier: "medium",
    health: 120,
    damage: 27,
    range: 68,
    speed: 225,
    attackSpeed: 1.2,
    attackCount: 1,
    projectile: "",
    icon: "assassinRat",
    idle: "character3Idle",
    description:
      "A fast assassin that closes distance quickly and strikes with precision.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "character3_idle",
        framesPerDirection: 25,
        frameRate: 18,
        repeat: -1,
      },
      move: {
        spritesheetKey: "character3_move",
        framesPerDirection: 17,
        frameRate: 22,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "character3_attack",
        framesPerDirection: 24,
        frameRate: 24,
        repeat: 0,
        damageFrames: [14],
      },
      death: {
        spritesheetKey: "character3_die",
        frameCount: 32,
        frameRate: 20,
        repeat: 0,
      },
      scale: 0.72,
      healthBarOffsetY: -46,
    },
  },
  4: {
    type: "enemy",
    name: "Flying Demon",
    cost: 100,
    tier: "hard",
    health: 195,
    damage: 34,
    range: 180,
    speed: 195,
    attackSpeed: 1.67,
    attackCount: 1,
    projectile: "bluePlasmaBall",
    icon: "flyingDemon",
    idle: "character4Idle",
    description: "A durable airborne demon with powerful close-range attacks.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "character4_idle",
        framesPerDirection: 41,
        frameRate: 24,
        repeat: -1,
      },
      move: {
        spritesheetKey: "character4_move",
        framesPerDirection: 17,
        frameRate: 20,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "character4_attack",
        framesPerDirection: 29,
        frameRate: 24,
        repeat: 0,
        damageFrames: [],
      },
      death: {
        spritesheetKey: "character4_die",
        frameCount: 24,
        frameRate: 18,
        repeat: 0,
      },
      scale: 0.78,
      healthBarOffsetY: -52,
    },
  },
  5: {
    type: "enemy",
    name: "Black Knight",
    cost: 100,
    tier: "hard",
    health: 195,
    damage: 34,
    range: 74,
    speed: 195,
    attackSpeed: 2.51,
    attackCount: 1,
    projectile: "",
    icon: "blackKnight",
    idle: "character5Idle",
    description: "A heavily armored knight with strong melee attacks.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "character5_idle",
        framesPerDirection: 101,
        frameRate: 60,
        repeat: -1,
      },
      move: {
        spritesheetKey: "character5_move",
        framesPerDirection: 29,
        frameRate: 25,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "character5_attack",
        framesPerDirection: 46,
        frameRate: 24,
        repeat: 0,
        damageFrames: [32],
      },
      death: {
        spritesheetKey: "character5_die",
        frameCount: 31,
        frameRate: 18,
        repeat: 0,
      },
      scale: 0.78,
      healthBarOffsetY: -52,
    },
  },
  6: {
    type: "enemy",
    name: "Werewolf",
    cost: 100,
    tier: "hard",
    health: 195,
    damage: 2,
    range: 74,
    speed: 195,
    attackSpeed: 1.4,
    attackCount: 4,
    projectile: "",
    icon: "werewolf",
    idle: "character6Idle",
    description: "A fierce werewolf with devastating fast melee attacks.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "character6_idle",
        framesPerDirection: 111,
        frameRate: 60,
        repeat: -1,
      },
      move: {
        spritesheetKey: "character6_move",
        framesPerDirection: 17,
        frameRate: 20,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "character6_attack",
        framesPerDirection: 17,
        frameRate: 20,
        repeat: 0,
        damageFrames: [],
      },
      death: {
        spritesheetKey: "character6_die",
        frameCount: 28,
        frameRate: 20,
        repeat: 0,
      },
      scale: 0.78,
      healthBarOffsetY: -52,
    },
  },
  7: {
    type: "enemy",
    name: "Battle Bee",
    cost: 100,
    tier: "hard",
    health: 195,
    damage: 34,
    range: 50,
    speed: 180,
    attackSpeed: 2.51,
    attackCount: 1,
    projectile: "",
    icon: "battleBee",
    idle: "character7Idle",
    description:
      "The Battle Bee is a fast and agile enemy that has a powerful sting.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "character7_idle",
        framesPerDirection: 41,
        frameRate: 60,
        repeat: -1,
      },
      move: {
        spritesheetKey: "character7_move",
        framesPerDirection: 31,
        frameRate: 25,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "character7_attack",
        framesPerDirection: 23,
        frameRate: 20,
        repeat: 0,
        damageFrames: [12],
      },
      death: {
        spritesheetKey: "character7_die",
        frameCount: 23,
        frameRate: 20,
        repeat: 0,
      },
      scale: 0.78,
      healthBarOffsetY: -52,
    },
  },
  8: {
    type: "enemy",
    name: "Salamnder",
    cost: 100,
    tier: "hard",
    health: 195,
    damage: 34,
    range: 50,
    speed: 180,
    attackSpeed: 1.98,
    attackCount: 1,
    projectile: "",
    icon: "salamander",
    idle: "character8Idle",
    description:
      "Looks cute, but don't be fooled. The Salamander is a dangerous enemy with a fiery bite.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "character8_idle",
        framesPerDirection: 41,
        frameRate: 60,
        repeat: -1,
      },
      move: {
        spritesheetKey: "character8_move",
        framesPerDirection: 16,
        frameRate: 25,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "character8_attack",
        framesPerDirection: 26,
        frameRate: 20,
        repeat: 0,
        damageFrames: [15],
      },
      death: {
        spritesheetKey: "character8_die",
        frameCount: 23,
        frameRate: 20,
        repeat: 0,
      },
      scale: 0.78,
      healthBarOffsetY: -52,
    },
  },
  9: {
    type: "enemy",
    name: "Mushroom",
    cost: 100,
    tier: "hard",
    health: 87,
    damage: 34,
    range: 50,
    speed: 180,
    attackSpeed: 2.51,
    attackCount: 1,
    projectile: "",
    icon: "mushroom",
    idle: "character9Idle",
    description:
      "The Mushroom is a slow but sturdy enemy that can regenerate its health.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "character9_idle",
        framesPerDirection: 41,
        frameRate: 60,
        repeat: -1,
      },
      move: {
        spritesheetKey: "character9_move",
        framesPerDirection: 17,
        frameRate: 25,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "character9_attack",
        framesPerDirection: 26,
        frameRate: 20,
        repeat: 0,
        damageFrames: [16],
      },
      death: {
        spritesheetKey: "character9_die",
        frameCount: 26,
        frameRate: 20,
        repeat: 0,
      },
      scale: 0.78,
      healthBarOffsetY: -52,
    },
  },
  10: {
    type: "enemy",
    name: "Fishman",
    cost: 100,
    tier: "hard",
    health: 87,
    damage: 34,
    range: 130,
    speed: 180,
    attackSpeed: 2.51,
    attackCount: 1,
    projectile: "",
    icon: "fishman",
    idle: "character10Idle",
    description:
      "The Fishman is a slow but sturdy enemy that can regenerate its health.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "character10_idle",
        framesPerDirection: 41,
        frameRate: 60,
        repeat: -1,
      },
      move: {
        spritesheetKey: "character10_move",
        framesPerDirection: 17,
        frameRate: 25,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "character10_attack",
        framesPerDirection: 21,
        frameRate: 20,
        repeat: 0,
        damageFrames: [11],
      },
      death: {
        spritesheetKey: "character10_die",
        frameCount: 28,
        frameRate: 20,
        repeat: 0,
      },
      scale: 0.78,
      healthBarOffsetY: -52,
    },
  },
  11: {
    type: "enemy",
    name: "Bat",
    cost: 100,
    tier: "hard",
    health: 195,
    damage: 34,
    range: 180,
    speed: 195,
    attackSpeed: 5.2,
    attackCount: 1,
    projectile: "blueBullet",
    icon: "bat",
    idle: "character11Idle",
    description: "A durable airborne demon with powerful close-range attacks.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "character11_idle",
        framesPerDirection: 25,
        frameRate: 24,
        repeat: -1,
      },
      move: {
        spritesheetKey: "character11_move",
        framesPerDirection: 13,
        frameRate: 20,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "character11_attack",
        framesPerDirection: 33,
        frameRate: 24,
        repeat: 0,
        damageFrames: [],
      },
      death: {
        spritesheetKey: "character11_die",
        frameCount: 23,
        frameRate: 18,
        repeat: 0,
      },
      scale: 0.52,
      healthBarOffsetY: -52,
    },
  },
  12: {
    type: "enemy",
    name: "Demon King",
    cost: 100,
    tier: "hard",
    health: 195,
    damage: 65,
    range: 160,
    speed: 195,
    attackSpeed: 1.73,
    attackCount: 1,
    projectile: "",
    icon: "demonKing",
    idle: "character12Idle",
    description: "The powerful Demon King with devastating attacks.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "character12_idle",
        framesPerDirection: 41,
        frameRate: 20,
        repeat: -1,
      },
      move: {
        spritesheetKey: "character12_move",
        framesPerDirection: 19,
        frameRate: 25,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "character12_attack",
        framesPerDirection: 31,
        frameRate: 24,
        repeat: 0,
        damageFrames: [20],
      },
      death: {
        spritesheetKey: "character12_die",
        frameCount: 43,
        frameRate: 20,
        repeat: 0,
      },
      scale: 1,
      healthBarOffsetY: -52,
    },
  },
  13: {
    type: "enemy",
    name: "Bishop Knight",
    cost: 100,
    tier: "hard",
    health: 195,
    damage: 65,
    range: 160,
    speed: 195,
    attackSpeed: 1.73,
    attackCount: 1,
    projectile: "",
    icon: "bishopKnight",
    idle: "character13Idle",
    description: "A fierce Bishop Knight with powerful attacks.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "character13_idle",
        framesPerDirection: 41,
        frameRate: 20,
        repeat: -1,
      },
      move: {
        spritesheetKey: "character13_move",
        framesPerDirection: 18,
        frameRate: 20,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "character13_attack",
        framesPerDirection: 26,
        frameRate: 20,
        repeat: 0,
        damageFrames: [16],
      },
      death: {
        spritesheetKey: "character13_die",
        frameCount: 30,
        frameRate: 20,
        repeat: 0,
      },
      scale: 1,
      healthBarOffsetY: -52,
    },
  },
  14: {
    type: "enemy",
    name: "Golem",
    cost: 100,
    tier: "hard",
    health: 295,
    damage: 100,
    range: 160,
    speed: 154,
    attackSpeed: 5.03,
    attackCount: 1,
    projectile: "",
    icon: "golem",
    idle: "character14Idle",
    description: "A fierce Golem with powerful attacks.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "character14_idle",
        framesPerDirection: 51,
        frameRate: 20,
        repeat: -1,
      },
      move: {
        spritesheetKey: "character14_move",
        framesPerDirection: 21,
        frameRate: 20,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "character14_attack",
        framesPerDirection: 39,
        frameRate: 20,
        repeat: 0,
        damageFrames: [29],
      },
      death: {
        spritesheetKey: "character14_die",
        frameCount: 31,
        frameRate: 20,
        repeat: 0,
      },
      scale: 1,
      healthBarOffsetY: -52,
    },
  },
  15: {
    type: "enemy",
    name: "Skeleton",
    cost: 100,
    tier: "hard",
    health: 84,
    damage: 45,
    range: 140,
    speed: 154,
    attackSpeed: 2,
    attackCount: 1,
    projectile: "",
    icon: "skeleton",
    idle: "character15Idle",
    description: "A fierce Skeleton with powerful attacks.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "character15_idle",
        framesPerDirection: 81,
        frameRate: 20,
        repeat: -1,
      },
      move: {
        spritesheetKey: "character15_move",
        framesPerDirection: 21,
        frameRate: 20,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "character15_attack",
        framesPerDirection: 21,
        frameRate: 20,
        repeat: 0,
        damageFrames: [11],
      },
      death: {
        spritesheetKey: "character15_die",
        frameCount: 43,
        frameRate: 20,
        repeat: 0,
      },
      scale: 0.75,
      healthBarOffsetY: -52,
    },
  },
  16: {
    type: "enemy",
    name: "Lizard Warrior",
    cost: 100,
    tier: "hard",
    health: 79,
    damage: 61,
    range: 140,
    speed: 163,
    attackSpeed: 3.2,
    attackCount: 1,
    projectile: "",
    icon: "lizard_warrior",
    idle: "character16Idle",
    description: "A fierce lizard warrior with powerful attacks.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "character16_idle",
        framesPerDirection: 81,
        frameRate: 20,
        repeat: -1,
      },
      move: {
        spritesheetKey: "character16_move",
        framesPerDirection: 17,
        frameRate: 20,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "character16_attack",
        framesPerDirection: 33,
        frameRate: 20,
        repeat: 0,
        damageFrames: [23],
      },
      death: {
        spritesheetKey: "character16_die",
        frameCount: 25,
        frameRate: 20,
        repeat: 0,
      },
      scale: 0.8,
      healthBarOffsetY: -52,
    },
  },
};
export default characterMap;