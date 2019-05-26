var TAUNT = 1;
var DRAGON = 2;
var CHARGE = 4;

var WARRIOR = 1;

function Card(cost) { return {cost: cost, job: 0}; }

function CardMinion(cost, damage, health, special, battlecry, deathrattle, hurtevent, roundend, useevent, optionalFeature) {
    var proto = Card(cost);
    proto.type = "M";
    proto.damage = damage;
    proto.health = health;
    proto.battlecry = battlecry;
    proto.deathrattle = deathrattle;
    proto.hurtevent = hurtevent;
    proto.roundend = roundend;
    proto.useevent = useevent;
    proto.special = special;
    proto.feature = optionalFeature;
    return proto;
}

function CardWeapon(cost, damage, durability, battlecry, deathrattle, hurtevent) {
    var proto = Card(cost);
    proto.type = "W";
    proto.damage = damage;
    proto.durability = durability;
    proto.battlecry = battlecry;
    proto.deathrattle = deathrattle;
    proto.hurtevent = hurtevent;
    return proto;
}

function CardSpell(cost, useevent) {
    var proto = Card(cost);
    proto.type = "S";
    proto.useevent = useevent;
    return proto;
}

function specialize(job) {
    return function(card) {
        card.job = job;
        return card;
    };
}

function endescriptify(name, description) {
    return function(card) {
        card.name = name;
        card.description = description;
        return card;
    };
}

// 1: 对一个随从造成一点伤害，使其增加2点攻击力
// 2: 消灭一个受伤的随从
// 3: 对所有随从造成一点伤害，回响
// 4: 每有一个受伤的友方角色，抽一张牌
// 5: 每当你召唤一个攻击力≤3的随从，获得冲锋
// 6: 对所有随从造成一点伤害
// 7: 每有一个随从受到伤害，抽一张牌
// 8: 抽一张牌，本回合内你的随从血量不能
// 9: 受到伤害时抽一张牌
// 10: 双方抽两张牌
// 11: 每当受到不致命的伤害时召唤一个奴隶主
// 12: 随机选择一个随从，消灭其他所有随从
// 13: 下回合你的对手法术法力消耗+5
// 14: 你的所有手牌法力消耗-1
// 15: 获得一个额外的法力水晶

// OF1: 战歌

var ALL_CARDS = [
    endescriptify("怒火中烧", "对一个随从造成一点伤害，使其增加2点攻击力")(CardSpell(0, 1)),
    endescriptify("斩杀", "消灭一个受伤的随从")(CardSpell(1, 2)),
    endescriptify("旋风斩", "对所有随从造成一点伤害")(CardSpell(1, 6)),
    endescriptify("蹒跚", "嘲讽，亡语：对所有随从造成一点伤害")(CardMinion(2, 1, 3, TAUNT, 0, 6, 0, 0, 0)),
    endescriptify("战斗怒吼", "抽一张牌，本回合内你的随从血量不能<1")(CardSpell(2, 8)),
    endescriptify("战路", "对所有随从造成一点伤害，回响")(CardSpell(2, 3)),
    endescriptify("战斗怒火", "每有一个受伤的友方角色，抽一张牌")(CardSpell(2, 4)),
    endescriptify("暴乱", "每有一个随从受到伤害，+1攻击")(CardMinion(3, 2, 4, 0, 0, 0, 7, 0, 0)),
    endescriptify("战歌", "当你召唤一个攻击力≤3的随从，使其获得冲锋")(CardMinion(3, 2, 3, 0, 0, 0, 0, 0, 5, 1)),
    endescriptify("苦痛", "受到伤害时抽一张牌")(CardMinion(3, 1, 3, 0, 0, 0, 9, 0, 0)),
    endescriptify("暴虐食尸鬼", "战吼：对所有随从造成一点伤害")(CardMinion(3, 3, 3, 0, 6, 0, 0, 0, 0)),
    endescriptify("爆牌鱼", "战吼：双方抽两张牌")(CardMinion(3, 2, 2, 0, 10, 0, 0, 0, 0)),
    endescriptify("死咬", "冲锋，亡语：对所有随从造成一点伤害")(CardMinion(4, 4, 2, CHARGE, 0, 6, 0, 0, 0)),
    endescriptify("奴隶主", "每当受到不致命的伤害时召唤一个奴隶主")(CardMinion(5, 3, 3, 0, 0, 0, 11, 0, 0)),
    endescriptify("绝命乱斗", "随机选择一个随从，消灭其他所有随从")(CardSpell(5, 12)),
    endescriptify("洛欧塞布", "战吼：下回合你的对手法术法力消耗+5")(CardMinion(5, 5, 5, 0, 13, 0, 0, 0, 0)),
    endescriptify("大帝", "回合结束时，你的所有手牌法力消耗-1")(CardMinion(6, 5, 5, 0, 0, 0, 0, 14, 0)),
    endescriptify("幸运币", "获得一个额外的法力水晶")(CardSpell(0, 15)),
    endescriptify("蜘蛛坦克", "机械")(CardMinion(3, 3, 4, 0, 0, 0, 0, 0, 0)),
    endescriptify("冰风雪人", "")(CardMinion(4, 4, 5, 0, 0, 0, 0, 0, 0)),
    endescriptify("淡水鳄", "野兽")(CardMinion(2, 2, 3, 0, 0, 0, 0, 0, 0)),
    endescriptify("盾牌猛击", "对一个随从造成等同于护甲值的伤害")(CardSpell(1, 16)),
    endescriptify("盾牌侍女", "战吼：护甲+5")(CardMinion(6, 5, 5, 0, 17, 0, 0, 0, 0)),
    endescriptify("铜墙铁壁", "护甲+5")(CardSpell(1, 17)),
    endescriptify("王牌猎人", "战吼：消灭一个攻击力≥7的随从")(CardMinion(5, 4, 2, 0, 21, 0, 0, 0, 0)),
    endescriptify("红龙", "战吼：将一方英雄的生命值置为15")(CardMinion(9, 8, 8, 0, 20, 0, 0, 0, 0)),
    endescriptify("死亡领主", "嘲讽，亡语：从对方牌库中随机召唤一个随从")(CardMinion(3, 2, 8, TAUNT, 0, 19, 0, 0, 0)),
    endescriptify("图哈特", "战吼：升级你的基础英雄技能")(CardMinion(6, 6, 3, 0, 18, 0, 0, 0, 0))
];
