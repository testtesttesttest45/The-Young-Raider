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
export type RaiderDefinition = {
  type: "raider";

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

  spritesheetKey: string;
  movingSpritesheetKey: string;
  attackSpritesheetKey: string;
  deathSpritesheetKey: string;
  slashSpritesheetKey: string;
  dashSlashSpritesheetKey: string;
  shieldSpritesheetKey: string;
  shieldMoveSpritesheetKey: string;
};

export type EnemyDefinition = {
  type: "enemy";

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

  enemyAnimations: EnemyAnimationConfig;
};

export type CharacterDefinition = RaiderDefinition | EnemyDefinition;

export const RAIDER_STATS = {
  range: 110,
  speed: 210,
  damage: 54,
  health: 373,
  attackSpeed: 1.6,
  attackCount: 1,
  projectile: "",
} as const;
const characterMap: Record<number, CharacterDefinition> = {
  1: {
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
    idle: "enemy1Idle",
    description: "A basic enemy with moderate health and damage.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "enemy1_idle",
        framesPerDirection: 41,
        frameRate: 24,
        repeat: -1,
      },
      move: {
        spritesheetKey: "enemy1_move",
        framesPerDirection: 31,
        frameRate: 24,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "enemy1_attack",
        framesPerDirection: 25,
        frameRate: 24,
        repeat: 0,
        damageFrames: [15],
      },
      death: {
        spritesheetKey: "enemy1_die",
        frameCount: 28,
        frameRate: 24,
        repeat: 0,
      },
      scale: 0.75,
      healthBarOffsetY: -48,
    },
  },
  2: {
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
    idle: "enemy2Idle",
    description:
      "A fast assassin that closes distance quickly and strikes with precision.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "enemy2_idle",
        framesPerDirection: 25,
        frameRate: 18,
        repeat: -1,
      },
      move: {
        spritesheetKey: "enemy2_move",
        framesPerDirection: 17,
        frameRate: 22,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "enemy2_attack",
        framesPerDirection: 24,
        frameRate: 24,
        repeat: 0,
        damageFrames: [14],
      },
      death: {
        spritesheetKey: "enemy2_die",
        frameCount: 32,
        frameRate: 20,
        repeat: 0,
      },
      scale: 0.72,
      healthBarOffsetY: -46,
    },
  },
  3: {
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
    idle: "enemy3Idle",
    description: "A durable airborne demon with powerful close-range attacks.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "enemy3_idle",
        framesPerDirection: 41,
        frameRate: 24,
        repeat: -1,
      },
      move: {
        spritesheetKey: "enemy3_move",
        framesPerDirection: 17,
        frameRate: 20,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "enemy3_attack",
        framesPerDirection: 29,
        frameRate: 24,
        repeat: 0,
        damageFrames: [],
      },
      death: {
        spritesheetKey: "enemy3_die",
        frameCount: 24,
        frameRate: 18,
        repeat: 0,
      },
      scale: 0.78,
      healthBarOffsetY: -52,
    },
  },
  4: {
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
    idle: "enemy4Idle",
    description: "A heavily armored knight with strong melee attacks.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "enemy4_idle",
        framesPerDirection: 101,
        frameRate: 60,
        repeat: -1,
      },
      move: {
        spritesheetKey: "enemy4_move",
        framesPerDirection: 29,
        frameRate: 25,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "enemy4_attack",
        framesPerDirection: 46,
        frameRate: 24,
        repeat: 0,
        damageFrames: [32],
      },
      death: {
        spritesheetKey: "enemy4_die",
        frameCount: 31,
        frameRate: 18,
        repeat: 0,
      },
      scale: 0.78,
      healthBarOffsetY: -52,
    },
  },
  5: {
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
    idle: "enemy5Idle",
    description: "A fierce werewolf with devastating fast melee attacks.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "enemy5_idle",
        framesPerDirection: 111,
        frameRate: 60,
        repeat: -1,
      },
      move: {
        spritesheetKey: "enemy5_move",
        framesPerDirection: 17,
        frameRate: 20,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "enemy5_attack",
        framesPerDirection: 17,
        frameRate: 20,
        repeat: 0,
        damageFrames: [],
      },
      death: {
        spritesheetKey: "enemy5_die",
        frameCount: 28,
        frameRate: 20,
        repeat: 0,
      },
      scale: 0.78,
      healthBarOffsetY: -52,
    },
  },
  6: {
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
    idle: "enemy6Idle",
    description:
      "The Battle Bee is a fast and agile enemy that has a powerful sting.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "enemy6_idle",
        framesPerDirection: 41,
        frameRate: 60,
        repeat: -1,
      },
      move: {
        spritesheetKey: "enemy6_move",
        framesPerDirection: 31,
        frameRate: 25,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "enemy6_attack",
        framesPerDirection: 23,
        frameRate: 20,
        repeat: 0,
        damageFrames: [12],
      },
      death: {
        spritesheetKey: "enemy6_die",
        frameCount: 23,
        frameRate: 20,
        repeat: 0,
      },
      scale: 0.78,
      healthBarOffsetY: -52,
    },
  },
  7: {
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
    idle: "enemy7Idle",
    description:
      "Looks cute, but don't be fooled. The Salamander is a dangerous enemy with a fiery bite.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "enemy7_idle",
        framesPerDirection: 41,
        frameRate: 60,
        repeat: -1,
      },
      move: {
        spritesheetKey: "enemy7_move",
        framesPerDirection: 16,
        frameRate: 25,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "enemy7_attack",
        framesPerDirection: 26,
        frameRate: 20,
        repeat: 0,
        damageFrames: [15],
      },
      death: {
        spritesheetKey: "enemy7_die",
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
    idle: "enemy8Idle",
    description:
      "The Mushroom is a slow but sturdy enemy that can regenerate its health.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "enemy8_idle",
        framesPerDirection: 41,
        frameRate: 60,
        repeat: -1,
      },
      move: {
        spritesheetKey: "enemy8_move",
        framesPerDirection: 17,
        frameRate: 25,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "enemy8_attack",
        framesPerDirection: 26,
        frameRate: 20,
        repeat: 0,
        damageFrames: [16],
      },
      death: {
        spritesheetKey: "enemy8_die",
        frameCount: 26,
        frameRate: 20,
        repeat: 0,
      },
      scale: 0.78,
      healthBarOffsetY: -52,
    },
  },
  9: {
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
    idle: "enemy9Idle",
    description:
      "The Fishman is a slow but sturdy enemy that can regenerate its health.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "enemy9_idle",
        framesPerDirection: 41,
        frameRate: 60,
        repeat: -1,
      },
      move: {
        spritesheetKey: "enemy9_move",
        framesPerDirection: 17,
        frameRate: 25,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "enemy9_attack",
        framesPerDirection: 21,
        frameRate: 20,
        repeat: 0,
        damageFrames: [11],
      },
      death: {
        spritesheetKey: "enemy9_die",
        frameCount: 28,
        frameRate: 20,
        repeat: 0,
      },
      scale: 0.78,
      healthBarOffsetY: -52,
    },
  },
  10: {
    type: "enemy",
    name: "Bat",
    cost: 100,
    tier: "hard",
    health: 195,
    damage: 18,
    range: 180,
    speed: 195,
    attackSpeed: 3.2,
    attackCount: 1,
    projectile: "blueBullet",
    icon: "bat",
    idle: "enemy10Idle",
    description: "A durable airborne demon with powerful close-range attacks.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "enemy10_idle",
        framesPerDirection: 25,
        frameRate: 24,
        repeat: -1,
      },
      move: {
        spritesheetKey: "enemy10_move",
        framesPerDirection: 13,
        frameRate: 20,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "enemy10_attack",
        framesPerDirection: 33,
        frameRate: 24,
        repeat: 0,
        damageFrames: [],
      },
      death: {
        spritesheetKey: "enemy10_die",
        frameCount: 23,
        frameRate: 18,
        repeat: 0,
      },
      scale: 0.52,
      healthBarOffsetY: -52,
    },
  },
  11: {
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
    idle: "enemy11Idle",
    description: "The powerful Demon King with devastating attacks.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "enemy11_idle",
        framesPerDirection: 41,
        frameRate: 20,
        repeat: -1,
      },
      move: {
        spritesheetKey: "enemy11_move",
        framesPerDirection: 19,
        frameRate: 25,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "enemy11_attack",
        framesPerDirection: 31,
        frameRate: 24,
        repeat: 0,
        damageFrames: [20],
      },
      death: {
        spritesheetKey: "enemy11_die",
        frameCount: 43,
        frameRate: 20,
        repeat: 0,
      },
      scale: 1,
      healthBarOffsetY: -52,
    },
  },
  12: {
    type: "enemy",
    name: "Bishop Knight",
    cost: 100,
    tier: "hard",
    health: 130,
    damage: 35,
    range: 160,
    speed: 195,
    attackSpeed: 1.43,
    attackCount: 1,
    projectile: "",
    icon: "bishopKnight",
    idle: "enemy12Idle",
    description: "A fierce Bishop Knight with powerful attacks.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "enemy12_idle",
        framesPerDirection: 41,
        frameRate: 20,
        repeat: -1,
      },
      move: {
        spritesheetKey: "enemy12_move",
        framesPerDirection: 18,
        frameRate: 20,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "enemy12_attack",
        framesPerDirection: 26,
        frameRate: 20,
        repeat: 0,
        damageFrames: [16],
      },
      death: {
        spritesheetKey: "enemy12_die",
        frameCount: 30,
        frameRate: 20,
        repeat: 0,
      },
      scale: 1,
      healthBarOffsetY: -52,
    },
  },
  13: {
    type: "enemy",
    name: "Golem",
    cost: 100,
    tier: "hard",
    health: 295,
    damage: 25,
    range: 132,
    speed: 154,
    attackSpeed: 3.03,
    attackCount: 1,
    projectile: "",
    icon: "golem",
    idle: "enemy13Idle",
    description: "A fierce Golem with powerful attacks.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "enemy13_idle",
        framesPerDirection: 51,
        frameRate: 20,
        repeat: -1,
      },
      move: {
        spritesheetKey: "enemy13_move",
        framesPerDirection: 21,
        frameRate: 20,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "enemy13_attack",
        framesPerDirection: 39,
        frameRate: 20,
        repeat: 0,
        damageFrames: [29],
      },
      death: {
        spritesheetKey: "enemy13_die",
        frameCount: 31,
        frameRate: 20,
        repeat: 0,
      },
      scale: 1,
      healthBarOffsetY: -52,
    },
  },
  14: {
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
    idle: "enemy14Idle",
    description: "A fierce Skeleton with powerful attacks.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "enemy14_idle",
        framesPerDirection: 81,
        frameRate: 20,
        repeat: -1,
      },
      move: {
        spritesheetKey: "enemy14_move",
        framesPerDirection: 21,
        frameRate: 20,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "enemy14_attack",
        framesPerDirection: 21,
        frameRate: 20,
        repeat: 0,
        damageFrames: [11],
      },
      death: {
        spritesheetKey: "enemy14_die",
        frameCount: 43,
        frameRate: 20,
        repeat: 0,
      },
      scale: 0.75,
      healthBarOffsetY: -52,
    },
  },
  15: {
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
    idle: "enemy15Idle",
    description: "A fierce lizard warrior with powerful attacks.",
    enemyAnimations: {
      idle: {
        spritesheetKey: "enemy15_idle",
        framesPerDirection: 81,
        frameRate: 20,
        repeat: -1,
      },
      move: {
        spritesheetKey: "enemy15_move",
        framesPerDirection: 17,
        frameRate: 20,
        repeat: -1,
      },
      attack: {
        spritesheetKey: "enemy15_attack",
        framesPerDirection: 33,
        frameRate: 20,
        repeat: 0,
        damageFrames: [23],
      },
      death: {
        spritesheetKey: "enemy15_die",
        frameCount: 25,
        frameRate: 20,
        repeat: 0,
      },
      scale: 0.8,
      healthBarOffsetY: -52,
    },
  },
  16: {
    type: "raider",
    ...RAIDER_STATS,
    spritesheetKey: "raider1_idle",
    movingSpritesheetKey: "raider1_move",
    attackSpritesheetKey: "raider1_attack",
    deathSpritesheetKey: "raider1_die",
    slashSpritesheetKey: "raider1_slash",
    dashSlashSpritesheetKey: "raider1_dash",
    shieldSpritesheetKey: "raider1_shield",
    shieldMoveSpritesheetKey: "raider1_shield_move",
    name: "The Boy",
    cost: 100,
    tier: "hard",
    icon: "raider1Icon",
    idle: "raider1Idle",
    description:
      "Young and determined, the Boy will stop at nothing to save his village from the evil that has taken over.",
  },
  17: {
    type: "raider",
    ...RAIDER_STATS,
    spritesheetKey: "raider2_idle",
    movingSpritesheetKey: "raider2_move",
    attackSpritesheetKey: "raider2_attack",
    deathSpritesheetKey: "raider2_die",
    slashSpritesheetKey: "raider2_slash",
    dashSlashSpritesheetKey: "raider2_dash",
    shieldSpritesheetKey: "raider2_shield",
    shieldMoveSpritesheetKey: "raider2_shield_move",
    name: "Castle Raider",
    cost: 100,
    tier: "hard",
    icon: "raider2Icon",
    idle: "raider2Idle",
    description: "A brave raider who has fought many battles and is ready to take on any challenge.",
  },
  18: {
    type: "raider",
    ...RAIDER_STATS,
    spritesheetKey: "raider3_idle",
    movingSpritesheetKey: "raider3_move",
    attackSpritesheetKey: "raider3_attack",
    deathSpritesheetKey: "raider3_die",
    slashSpritesheetKey: "raider3_slash",
    dashSlashSpritesheetKey: "raider3_dash",
    shieldSpritesheetKey: "raider3_shield",
    shieldMoveSpritesheetKey: "raider3_shield_move",
    name: "Glorious Raider",
    cost: 100,
    tier: "hard",
    icon: "raider3Icon",
    idle: "raider3Idle",
    description:
      "The Raider in shining armor",
  },
  19: {
    type: "raider",
    ...RAIDER_STATS,
    spritesheetKey: "raider4_idle",
    movingSpritesheetKey: "raider4_move",
    attackSpritesheetKey: "raider4_attack",
    deathSpritesheetKey: "raider4_die",
    slashSpritesheetKey: "raider4_slash",
    dashSlashSpritesheetKey: "raider4_dash",
    shieldSpritesheetKey: "raider4_shield",
    shieldMoveSpritesheetKey: "raider4_shield_move",
    name: "Chicken Raider",
    cost: 100,
    tier: "hard",
    icon: "raider4Icon",
    idle: "raider4Idle",
    description:
      "The King of Chickens, this raider can be unlocked by defeating the Saturday King stage.",
  },
  20: {
    type: "enemy",

    name: "Saturday King",

    cost: 0,

    tier: "king",

    health: RAIDER_STATS.health * 2.89,

    damage: RAIDER_STATS.damage * 2.89,

    range: RAIDER_STATS.range - 0.3,

    speed: RAIDER_STATS.speed - 30,

    attackSpeed: RAIDER_STATS.attackSpeed,

    attackCount: RAIDER_STATS.attackCount,

    projectile: "",

    icon: "raider4Icon",

    idle: "raider4Idle",

    description: "The Saturday King. Defeat him to unlock Chicken Raider.",

    enemyAnimations: {
      idle: {
        spritesheetKey: "raider4_idle",

        framesPerDirection: 41,

        frameRate: 24,

        repeat: -1,
      },

      move: {
        spritesheetKey: "raider4_move",

        framesPerDirection: 21,

        frameRate: 24,

        repeat: -1,
      },

      attack: {
        spritesheetKey: "raider4_attack",

        framesPerDirection: 30,

        frameRate: 24,

        repeat: 0,

        damageFrames: [20],
      },

      death: {
        spritesheetKey: "raider4_die",

        frameCount: 69,

        frameRate: 24,

        repeat: 0,
      },

      scale: 0.75,

      healthBarOffsetY: -48,
    },
  },
  21: {
    type: "raider",
    ...RAIDER_STATS,
    spritesheetKey: "raider5_idle",
    movingSpritesheetKey: "raider5_move",
    attackSpritesheetKey: "raider5_attack",
    deathSpritesheetKey: "raider5_die",
    slashSpritesheetKey: "raider5_slash",
    dashSlashSpritesheetKey: "raider5_dash",
    shieldSpritesheetKey: "raider5_shield",
    shieldMoveSpritesheetKey: "raider5_shield_move",
    name: "Bear Raider",
    cost: 100,
    tier: "hard",
    icon: "raider5Icon",
    idle: "raider5Idle",
    description:
      "The King of Bears, this raider can be unlocked by defeating the Sunday King stage.",
  },
  22: {
    type: "enemy",

    name: "Sunday King",

    cost: 0,

    tier: "king",

    health: RAIDER_STATS.health * 3,

    damage: RAIDER_STATS.damage * 3,

    range: RAIDER_STATS.range - 0.3,

    speed: RAIDER_STATS.speed - 30,

    attackSpeed: RAIDER_STATS.attackSpeed,

    attackCount: RAIDER_STATS.attackCount,

    projectile: "",

    icon: "raider5Icon",

    idle: "raider5Idle",

    description: "The Sunday King. Defeat him to unlock Bear Raider.",

    enemyAnimations: {
      idle: {
        spritesheetKey: "raider5_idle",

        framesPerDirection: 41,

        frameRate: 24,

        repeat: -1,
      },

      move: {
        spritesheetKey: "raider5_move",

        framesPerDirection: 21,

        frameRate: 24,

        repeat: -1,
      },

      attack: {
        spritesheetKey: "raider5_attack",

        framesPerDirection: 30,

        frameRate: 24,

        repeat: 0,

        damageFrames: [20],
      },

      death: {
        spritesheetKey: "raider5_die",

        frameCount: 69,

        frameRate: 24,

        repeat: 0,
      },

      scale: 0.75,

      healthBarOffsetY: -48,
    },
  },
  23: {
    type: "raider",
    ...RAIDER_STATS,
    spritesheetKey: "raider6_idle",
    movingSpritesheetKey: "raider6_move",
    attackSpritesheetKey: "raider6_attack",
    deathSpritesheetKey: "raider6_die",
    slashSpritesheetKey: "raider6_slash",
    dashSlashSpritesheetKey: "raider6_dash",
    shieldSpritesheetKey: "raider6_shield",
    shieldMoveSpritesheetKey: "raider6_shield_move",
    name: "Chem Raider",
    cost: 100,
    tier: "hard",
    icon: "raider6Icon",
    idle: "raider6Idle",
    description:
      "A former chemist turned raider, this raider can be unlocked by defeating the Monday King stage.",
  },
  24: {
    type: "enemy",

    name: "Monday King",

    cost: 0,

    tier: "king",

    health: RAIDER_STATS.health * 2.75,

    damage: RAIDER_STATS.damage * 2.75,

    range: RAIDER_STATS.range - 0.3,

    speed: RAIDER_STATS.speed - 30,

    attackSpeed: RAIDER_STATS.attackSpeed,

    attackCount: RAIDER_STATS.attackCount,

    projectile: "",

    icon: "raider6Icon",

    idle: "raider6Idle",

    description: "The Monday King. Defeat him to unlock Chem Raider.",

    enemyAnimations: {
      idle: {
        spritesheetKey: "raider6_idle",

        framesPerDirection: 41,

        frameRate: 24,

        repeat: -1,
      },

      move: {
        spritesheetKey: "raider6_move",

        framesPerDirection: 21,

        frameRate: 24,

        repeat: -1,
      },

      attack: {
        spritesheetKey: "raider6_attack",

        framesPerDirection: 30,

        frameRate: 24,

        repeat: 0,

        damageFrames: [20],
      },

      death: {
        spritesheetKey: "raider6_die",

        frameCount: 69,

        frameRate: 24,

        repeat: 0,
      },

      scale: 0.75,

      healthBarOffsetY: -48,
    },
  },
  25: {
    type: "raider",
    ...RAIDER_STATS,
    spritesheetKey: "raider7_idle",
    movingSpritesheetKey: "raider7_move",
    attackSpritesheetKey: "raider7_attack",
    deathSpritesheetKey: "raider7_die",
    slashSpritesheetKey: "raider7_slash",
    dashSlashSpritesheetKey: "raider7_dash",
    shieldSpritesheetKey: "raider7_shield",
    shieldMoveSpritesheetKey: "raider7_shield_move",
    name: "Space Raider",
    cost: 100,
    tier: "hard",
    icon: "raider7Icon",
    idle: "raider7Idle",
    description:
      "A raider from outer space, this raider can be unlocked by defeating the Tuesday King stage.",
  },
  26: {
    type: "enemy",

    name: "Tuesday King",

    cost: 0,

    tier: "king",

    health: RAIDER_STATS.health * 2.67,

    damage: RAIDER_STATS.damage * 2.67,

    range: RAIDER_STATS.range - 0.3,

    speed: RAIDER_STATS.speed - 30,

    attackSpeed: RAIDER_STATS.attackSpeed,

    attackCount: RAIDER_STATS.attackCount,

    projectile: "",

    icon: "raider7Icon",

    idle: "raider7Idle",

    description: "The Tuesday King. Defeat him to unlock Space Raider.",

    enemyAnimations: {
      idle: {
        spritesheetKey: "raider7_idle",

        framesPerDirection: 41,

        frameRate: 24,

        repeat: -1,
      },

      move: {
        spritesheetKey: "raider7_move",

        framesPerDirection: 21,

        frameRate: 24,

        repeat: -1,
      },

      attack: {
        spritesheetKey: "raider7_attack",

        framesPerDirection: 30,

        frameRate: 24,

        repeat: 0,

        damageFrames: [20],
      },

      death: {
        spritesheetKey: "raider7_die",

        frameCount: 69,

        frameRate: 24,

        repeat: 0,
      },

      scale: 0.75,

      healthBarOffsetY: -48,
    },
  },
  27: {
    type: "raider",
    ...RAIDER_STATS,
    spritesheetKey: "raider8_idle",
    movingSpritesheetKey: "raider8_move",
    attackSpritesheetKey: "raider8_attack",
    deathSpritesheetKey: "raider8_die",
    slashSpritesheetKey: "raider8_slash",
    dashSlashSpritesheetKey: "raider8_dash",
    shieldSpritesheetKey: "raider8_shield",
    shieldMoveSpritesheetKey: "raider8_shield_move",
    name: "Mecha Raider",
    cost: 100,
    tier: "hard",
    icon: "raider8Icon",
    idle: "raider8Idle",
    description:
      "Created from advanced technology to defend mankind, this raider can be unlocked by defeating the Wednesday King stage.",
  },
  28: {
    type: "enemy",

    name: "Wednesday King",

    cost: 0,

    tier: "king",

    health: RAIDER_STATS.health * 3.5,

    damage: RAIDER_STATS.damage * 3.5,

    range: RAIDER_STATS.range - 0.3,

    speed: RAIDER_STATS.speed - 30,

    attackSpeed: RAIDER_STATS.attackSpeed,

    attackCount: RAIDER_STATS.attackCount,

    projectile: "",

    icon: "raider8Icon",

    idle: "raider8Idle",

    description: "The Wednesday King. Defeat him to unlock Mecha Raider.",

    enemyAnimations: {
      idle: {
        spritesheetKey: "raider8_idle",

        framesPerDirection: 41,

        frameRate: 24,

        repeat: -1,
      },

      move: {
        spritesheetKey: "raider8_move",

        framesPerDirection: 21,

        frameRate: 24,

        repeat: -1,
      },

      attack: {
        spritesheetKey: "raider8_attack",

        framesPerDirection: 30,

        frameRate: 24,

        repeat: 0,

        damageFrames: [20],
      },

      death: {
        spritesheetKey: "raider8_die",

        frameCount: 69,

        frameRate: 24,

        repeat: 0,
      },

      scale: 0.75,

      healthBarOffsetY: -48,
    },
  },
  29: {
    type: "raider",
    ...RAIDER_STATS,
    spritesheetKey: "raider9_idle",
    movingSpritesheetKey: "raider9_move",
    attackSpritesheetKey: "raider9_attack",
    deathSpritesheetKey: "raider9_die",
    slashSpritesheetKey: "raider9_slash",
    dashSlashSpritesheetKey: "raider9_dash",
    shieldSpritesheetKey: "raider9_shield",
    shieldMoveSpritesheetKey: "raider9_shield_move",
    name: "Fullmetal Raider",
    cost: 100,
    tier: "hard",
    icon: "raider9Icon",
    idle: "raider9Idle",
    description:
      "A raider with a full metal armor, this raider can be unlocked by defeating the Thursday King stage.",
  },
  30: {
    type: "enemy",

    name: "Thursday King",

    cost: 0,

    tier: "king",

    health: RAIDER_STATS.health * 4,

    damage: RAIDER_STATS.damage * 3.3,

    range: RAIDER_STATS.range - 0.3,

    speed: RAIDER_STATS.speed - 30,

    attackSpeed: RAIDER_STATS.attackSpeed,

    attackCount: RAIDER_STATS.attackCount,

    projectile: "",

    icon: "raider9Icon",

    idle: "raider9Idle",

    description: "The Thursday King. Defeat him to unlock Fullmetal Raider.",

    enemyAnimations: {
      idle: {
        spritesheetKey: "raider9_idle",

        framesPerDirection: 41,

        frameRate: 24,

        repeat: -1,
      },

      move: {
        spritesheetKey: "raider9_move",

        framesPerDirection: 21,

        frameRate: 24,

        repeat: -1,
      },

      attack: {
        spritesheetKey: "raider9_attack",

        framesPerDirection: 30,

        frameRate: 24,

        repeat: 0,

        damageFrames: [20],
      },

      death: {
        spritesheetKey: "raider9_die",

        frameCount: 69,

        frameRate: 24,

        repeat: 0,
      },

      scale: 0.75,

      healthBarOffsetY: -48,
    },
  },
  31: {
    type: "raider",
    ...RAIDER_STATS,
    spritesheetKey: "raider10_idle",
    movingSpritesheetKey: "raider10_move",
    attackSpritesheetKey: "raider10_attack",
    deathSpritesheetKey: "raider10_die",
    slashSpritesheetKey: "raider10_slash",
    dashSlashSpritesheetKey: "raider10_dash",
    shieldSpritesheetKey: "raider10_shield",
    shieldMoveSpritesheetKey: "raider10_shield_move",
    name: "Alien Raider",
    cost: 100,
    tier: "hard",
    icon: "raider10Icon",
    idle: "raider10Idle",
    description:
      "A mysterious Raider from another world, this raider can be unlocked by defeating the Friday King stage.",
  },
  32: {
    type: "enemy",

    name: "Friday King",

    cost: 0,

    tier: "king",

    health: RAIDER_STATS.health * 3.4,

    damage: RAIDER_STATS.damage * 3.25,

    range: RAIDER_STATS.range - 0.3,

    speed: RAIDER_STATS.speed - 30,

    attackSpeed: RAIDER_STATS.attackSpeed,

    attackCount: RAIDER_STATS.attackCount,

    projectile: "",

    icon: "raider10Icon",

    idle: "raider10Idle",

    description: "The Friday King. Defeat him to unlock Alien Raider.",

    enemyAnimations: {
      idle: {
        spritesheetKey: "raider10_idle",

        framesPerDirection: 41,

        frameRate: 24,

        repeat: -1,
      },

      move: {
        spritesheetKey: "raider10_move",

        framesPerDirection: 21,

        frameRate: 24,

        repeat: -1,
      },

      attack: {
        spritesheetKey: "raider10_attack",

        framesPerDirection: 30,

        frameRate: 24,

        repeat: 0,

        damageFrames: [20],
      },

      death: {
        spritesheetKey: "raider10_die",

        frameCount: 69,

        frameRate: 24,

        repeat: 0,
      },

      scale: 0.75,

      healthBarOffsetY: -48,
    },
  },
  33: {
    type: "raider",
    ...RAIDER_STATS,
    spritesheetKey: "raider11_idle",
    movingSpritesheetKey: "raider11_move",
    attackSpritesheetKey: "raider11_attack",
    deathSpritesheetKey: "raider11_die",
    slashSpritesheetKey: "raider11_slash",
    dashSlashSpritesheetKey: "raider11_dash",
    shieldSpritesheetKey: "raider11_shield",
    shieldMoveSpritesheetKey: "raider11_shield_move",
    name: "Jester Raider",
    cost: 100,
    tier: "hard",
    icon: "raider11Icon",
    idle: "raider11Idle",
    description:
      "A playful and unpredictable Raider, the Jester Raider uses tricks and illusions to outsmart enemies.",
  },
  34: {
    type: "raider",
    ...RAIDER_STATS,
    spritesheetKey: "raider12_idle",
    movingSpritesheetKey: "raider12_move",
    attackSpritesheetKey: "raider12_attack",
    deathSpritesheetKey: "raider12_die",
    slashSpritesheetKey: "raider12_slash",
    dashSlashSpritesheetKey: "raider12_dash",
    shieldSpritesheetKey: "raider12_shield",
    shieldMoveSpritesheetKey: "raider12_shield_move",
    name: "Samurai Raider",
    cost: 100,
    tier: "hard",
    icon: "raider12Icon",
    idle: "raider12Idle",
    description:
      "A skilled and disciplined warrior, the Samurai Raider leaves no room for error in battle.",
  },
  35: {
    type: "raider",
    ...RAIDER_STATS,
    spritesheetKey: "raider13_idle",
    movingSpritesheetKey: "raider13_move",
    attackSpritesheetKey: "raider13_attack",
    deathSpritesheetKey: "raider13_die",
    slashSpritesheetKey: "raider13_slash",
    dashSlashSpritesheetKey: "raider13_dash",
    shieldSpritesheetKey: "raider13_shield",
    shieldMoveSpritesheetKey: "raider13_shield_move",
    name: "Ninja Raider",
    cost: 100,
    tier: "hard",
    icon: "raider13Icon",
    idle: "raider13Idle",
    description:
      "The Ninja Raider leaves no trace behind.",
  },
};
export default characterMap;
