function baseEffect(eventData, extras, isWrite, then) {
    
}

// 幸运币
function moreManaEffect(eventData, extras, isWrite, then) {
    if (eventData.hero === target)
        me.mana += 1;
    else
        enemy.mana += 1;
    delayedCall(function() {
        rebuildHero();
        then(eventData, extras, isWrite);
    });
}

// 怒火中烧
function innerBreak(eventData, extras, isWrite, then) {
    if (isWrite) {
        selectState = "targeting";
        targetSelector = function(hero, index) {
            return index !== -1;
        };
        if (!checkSelectionTargets()) {
            selectState = "failed";
            return;
        }
        targetingCallback = function(thero, tindex) {
            extras.push(thero);
            extras.push(tindex);
            delayedCall(function(){
                getMinion(thero, tindex).damage += 2;
                spellAttack(1, thero, tindex, "你使用怒火中烧");
            });
            delayedCall(function(){
                then(eventData, extras, isWrite);
            });
        }
    } else {
        var h = extras.shift();
        var ind = extras.shift();
        delayedCall(function(){
            getMinion(h, ind).damage += 2;
            spellAttack(1, h, ind, "敌方使用怒火中烧");
        });
        delayedCall(function() {
            then(eventData, extras, isWrite);
        });
    }
}

// 斩杀
function killInperfect(eventData, extras, isWrite, then) {
    if (isWrite) {
        selectState = "targeting";
        targetSelector = function(hero, index) {
            return index !== -1 && getMinion(hero, index).health < getMinion(hero, index).maxHealth;
        };
        if (!checkSelectionTargets()) {
            selectState = "failed";
            return;
        }
        targetingCallback = function(thero, tindex) {
            extras.push(thero);
            extras.push(tindex);
            extras.push(getMinion(thero, tindex).health);
            delayedCall(function(){
                spellAttack(getMinion(thero, tindex).health, thero, tindex, "你使用斩杀");
            });
            delayedCall(function(){
                then(eventData, extras, isWrite);
            });
        }
    } else {
        var h = extras.shift();
        var ind = extras.shift();
        var dmg = extras.shift();
        delayedCall(function(){
            spellAttack(dmg, h, ind, "敌方使用斩杀");
        });
        delayedCall(function() {
            then(eventData, extras, isWrite);
        });
    }
}

// 对所有随从造成一点伤害
function do1ToAllMinions(eventData, extras, isWrite, then) {
    delayedCall(function(){
        for (var h=1; h<=2; h++)
            for (var i=0; i<7; i++)
                if (getMinion(h, i))
                    spellAttackNoFlushQueue(1, h, i, reprHero(eventData.hero) + "使用" + getHand(eventData.hero, eventData.index));
        flushAttackQueue();
    });
    delayedCall(function(){
        then(eventData, extras, isWrite);
    });
}

// 战路
function battleWay(eventData, extras, isWrite, then) {
    do1ToAllMinions(eventData, extras, isWrite, function() {
        var card = $.extend(true, {}, ALL_CARDS[5]);
        then(eventData, extras, isWrite);
        card.removeOnEOR = true;
        var hand = isWrite ? myHand : enemyHand;
        delayedCall(function() {
            hand.push(card);
            rebuildHand();
            rebuildHero();
        });
    })
}

// 战斗怒火
function battleDrawCard(eventData, extras, isWrite, then) {
    var he = isWrite ? me : enemy;
    var minion = isWrite ? myMinion : enemyMinion;
    delayedCall(function() {
        var count = 0;
        if (he.health < 30) ++count;
        for (var i=0; i<minion.length; i++) if (minion[i].health < minion[i].maxHealth) ++count;
        then(eventData, extras, isWrite);
        drawCard(eventData.hero, count);
    });
}

// 爆牌鱼
function letsDraw2Cards(eventData, extras, isWrite, then) {
    delayedCall(function() {
        then(eventData, extras, isWrite);
        drawCard(1, 1);
        drawCard(2, 1);
        drawCard(1, 1);
        drawCard(2, 1);
    });
}

function drawCard(hero, count) {
    if (hero === target)
        for (var i=0; i<count; i++) {
            if (myDeck.length === 0) {
                doAlert("你受到了" + me.nextFatigue + "点疲劳伤害");
                gameHistory = "你受到了" + me.nextFatigue + "点疲劳伤害\n" + gameHistory;
                dealDamage(target, -1, me.nextFatigue, "疲劳");
                ++me.nextFatigue;
                continue;
            }
            var card = myDeck.shift();
            if (myHand.length >= 10) {
                doAlert("手牌已满，损失了：\n" + reprCardDetailed(card));
                continue;
            }
            doAlert("抽到手牌：\n" + reprCardDetailed(card));
            myHand.push(card);
        }
    else
        for (var i=0; i<count; i++) {
            if (enemyDeck.length === 0) {
                doAlert("敌方英雄受到了" + enemy.nextFatigue + "点疲劳伤害");
                gameHistory = "敌方英雄受到了" + enemy.nextFatigue + "点疲劳伤害\n" + gameHistory;
                dealDamage(myFriend(), -1, enemy.nextFatigue, "疲劳");
                ++enemy.nextFatigue;
                continue;
            }
            var card = enemyDeck.shift();
            if (enemyHand.length >= 10) {
                doAlert("敌方手牌已满，损失了：\n" + reprCardDetailed(card));
                continue;
            }
            enemyHand.push(card);
        }
    rebuildHand();
    rebuildHero();
}

function wakeSleep(eventData, extras, isWrite, then) {
    delayedCall(function() {
        then(eventData, extras, isWrite);
    });
}

function battleBurn(eventData, extras, isWrite, then) {
    var he = eventData.hero === target ? me : enemy;
    he.minionNoDeath = true;
    then(eventData, extras, isWrite);
    drawCard(eventData.hero, 1);
}

function shieldDrawCard(eventData, extras, isWrite, then) {
    var he = eventData.hero === target ? me : enemy;
    he.armor += 5;
    then(eventData, extras, isWrite);
    drawCard(eventData.hero, 1);
}

function messyFight(eventData, extras, isWrite, then) {
    var totalCount = myMinion.length + enemyMinion.length;
    if (totalCount < 2) {
        doAlert("没有足够多的随从");
    } else {
        if (isWrite) {
            var gid = randInt(0, totalCount);
            var keepH = gid < myMinion.length ? target : myFriend();
            var keepI = gid >= myMinion.length ? gid - myMinion.length : gid;
            extras.push(keepH);
            extras.push(keepI);
            for (var h=1; h<=2; h++) {
                for (var i=0; i<7; i++) {
                    if (keepI == i && keepH == h) continue;
                    if (!getMinion(h, i)) continue;
                    spellAttackNoFlushQueue(getMinion(h, i).health, h, i, "你使用绝命乱斗");
                }
            }
            flushAttackQueue();
            then(eventData, extras, isWrite);
        } else {
            var keepH = extras.shift();
            var keepI = extras.shift();
            for (var h=1; h<=2; h++) {
                for (var i=0; i<7; i++) {
                    if (keepI == i && keepH == h) continue;
                    if (!getMinion(h, i)) continue;
                    spellAttackNoFlushQueue(getMinion(h, i).health, h, i, "敌方英雄使用绝命乱斗");
                }
            }
            flushAttackQueue();
            then(eventData, extras, isWrite);
        }
    }
}

// 每有一个随从受到伤害，+1攻击
function draw1card(eventData, extras, isWrite, then) {
    if (eventData.dsti !== -1)
        getMinion(eventData.owner, eventData.myIndex).damage++;
    delayedCall(function() { rebuildMinions(); });
    then(eventData, extras, isWrite);
}

// 受到伤害，抽一张牌
function draw1cardWhenHit(eventData, extras, isWrite, then) {
    if (eventData.dsti === eventData.myIndex && eventData.dsth === eventData.owner)
        delayedCall(function() { drawCard(eventData.owner, 1); });
    then(eventData, extras, isWrite);
}

// 奴隶主
function lord(eventData, extras, isWrite, then) {
    if (eventData.dsti === eventData.myIndex && eventData.dsth === eventData.owner && !eventData.killing) {
        if (!getMinion(eventData.dsth, 6))
            delayedCall(function() {
                if (eventData.dsth === target)
                    myMinion.splice(eventData.myIndex + 1, 0, Minion(ALL_CARDS[13], eventData.owner));
                else
                    enemyMinion.splice(eventData.myIndex + 1, 0, Minion(ALL_CARDS[13], eventData.owner));
            });
    }
    then(eventData, extras, isWrite);
}

// 大帝
function costSub1(eventData, extras, isWrite, then) {
    if (eventData.whoseRoundEnd != eventData.owner) return;
    var hand = eventData.whoseRoundEnd === target ? myHand : enemyHand;
    for (var i=0; i<hand.length; i++) {
        if (hand[i].cost > 0) hand[i].cost -= 1;
    }
    delayedCall(function() { rebuildHand(); then(eventData, extras, isWrite); });
}

// 洛欧塞布
function costAdd5(eventData, extras, isWrite, then) {
    var he = eventData.hero === target ? enemy : me;
    he.spellCost5More = true;
    delayedCall(function() { rebuildHand(); then(eventData, extras, isWrite); });
}

// 盾猛
function armorHit(eventData, extras, isWrite, then) {
    var he = eventData.hero === target ? me : enemy;
    if (isWrite) {
        selectState = "targeting";
        targetSelector = function(hero, index) {
            return index !== -1;
        };
        if (!checkSelectionTargets()) {
            selectState = "failed";
            return;
        }
        targetingCallback = function(thero, tindex) {
            extras.push(thero);
            extras.push(tindex);
            extras.push(he.armor);
            var damager = he.armor;
            delayedCall(function(){
                spellAttack(damager, thero, tindex, "你使用盾牌猛击");
            });
            delayedCall(function(){
                then(eventData, extras, isWrite);
            });
        }
    } else {
        var h = extras.shift();
        var ind = extras.shift();
        var dmg = extras.shift();
        delayedCall(function(){
            spellAttack(dmg, h, ind, "敌方使用盾牌猛击");
        });
        delayedCall(function() {
            then(eventData, extras, isWrite);
        });
    }
}

// 怒袭
function bashHit(eventData, extras, isWrite, then) {
    var he = eventData.hero === target ? me : enemy;
    if (isWrite) {
        selectState = "targeting";
        targetSelector = function(hero, index) {
            return true;
        };
        if (!checkSelectionTargets()) {
            selectState = "failed";
            return;
        }
        targetingCallback = function(thero, tindex) {
            extras.push(thero);
            extras.push(tindex);
            he.armor += 3;
            spellAttack(3, thero, tindex, "你使用怒袭");
            then(eventData, extras, isWrite);
        }
    } else {
        var h = extras.shift();
        var ind = extras.shift();
        he.armor += 3;
        spellAttack(3, h, ind, "敌方使用怒袭");
        then(eventData, extras, isWrite);
    }
}

// 叠甲
function gainArmor(count) {
    return function(eventData, extras, isWrite, then) {
        var he = eventData.hero === target ? me : enemy;
        he.armor += count;
        delayedCall(function() {
            rebuildHero();
            then(eventData, extras, isWrite);
        });
    }
}

function improvedSkill(eventData, extras, isWrite, then) {
    var he = eventData.hero === target ? me : enemy;
    he.improvedSkill = true;
    he.skillOn = true;
    uiQueue.push([0, function() {
        $("#" + (eventData.hero === target ? "F" : "E") + "HSD")[0].innerHTML = "获得4护甲";
    }]);
    rebuildHero();
    then(eventData, extras, isWrite);
}

function enemySummonMinion(eventData, extras, isWrite, then) {
    var hisDeck = eventData.hero === target ? enemyDeck : myDeck;
    var hisMinion = eventData.hero === target ? enemyMinion : myMinion;
    var theChoice = -1;
    for (var i=0; i<hisDeck.length; i++) {
        if (hisDeck[i].type == "M") {
            theChoice = i;
            break;
        }
    }
    if (theChoice > -1) {
        var card = hisDeck.splice(theChoice, 1)[0];
        hisMinion.push(Minion(card, eventData.hero === target ? myFriend() : target));
    }
    then(eventData, extras, isWrite);
}

function setHealthTo15(eventData, extras, isWrite, then) {
    if (isWrite) {
        selectState = "targeting";
        targetSelector = function(hero, index) {
            return index === -1;
        };
        if (!checkSelectionTargets()) {
            selectState = "failed";
            return;
        }
        targetingCallback = function(thero, tindex) {
            extras.push(thero);
            var he = thero === target ? me : enemy;
            he.health = 15;
            then(eventData, extras, isWrite);
        }
    } else {
        var h = extras.shift();
        var he = h === target ? me : enemy;
        he.health = 15;
        then(eventData, extras, isWrite);
    }
}

function silenceMinion(minion) {
    minion.special = SILENCE;
    minion.deathrattle = 0;
    minion.battlecry = 0;
    minion.useevent = 0;
    minion.roundend = 0;
    minion.hurtevent = 0;
    minion.feature = 0;
}

// 猫头鹰
function theEagles(eventData, extras, isWrite, then) {
    if (isWrite) {
        selectState = "targeting";
        targetSelector = function(hero, index) {
            return index !== -1;
        };
        if (!checkSelectionTargets()) {
            extras.push(0);
            selectState = "skipped";
            then(eventData, extras, isWrite);
            return;
        }
        targetingCallback = function(thero, tindex) {
            extras.push(1);
            extras.push(thero);
            extras.push(tindex);
            silenceMinion(getMinion(thero, tindex));
            then(eventData, extras, isWrite);
        }
    } else {
        if (extras.shift() === 0) {
            then(eventData, extras, isWrite);
            return;
        }
        var h = extras.shift();
        var ind = extras.shift();
        silenceMinion(getMinion(h, ind));
        then(eventData, extras, isWrite);
    }
}

function killMinionDamage7(eventData, extras, isWrite, then) {
    if (isWrite) {
        selectState = "targeting";
        targetSelector = function(hero, index) {
            return index !== -1 && getMinion(hero, index) && getMinion(hero, index).damage >= 7;
        };
        if (!checkSelectionTargets()) {
            extras.push(0);
            selectState = "skipped";
            then(eventData, extras, isWrite);
            return;
        }
        targetingCallback = function(thero, tindex) {
            extras.push(1);
            extras.push(thero);
            extras.push(tindex);
            extras.push(getMinion(thero, tindex).health);
            spellAttack(getMinion(thero, tindex).health, thero, tindex, "你使用王牌猎人");
            then(eventData, extras, isWrite);
        }
    } else {
        if (extras.shift() === 0) {
            then(eventData, extras, isWrite);
            return;
        }
        var h = extras.shift();
        var ind = extras.shift();
        var dmg = extras.shift();
        delayedCall(function(){
            spellAttack(dmg, h, ind, "敌方使用王牌猎人");
            then(eventData, extras, isWrite);
        });
    }
}

function revenge(eventData, extras, isWrite, then) {
    var he = eventData.hero === target ? me : enemy;
    var dmg = he.health > 12 ? 1 : 3;
    delayedCall(function(){
        for (var h=1; h<=2; h++)
            for (var i=0; i<7; i++)
                if (getMinion(h, i))
                    spellAttackNoFlushQueue(dmg, h, i, reprHero(eventData.hero) + "使用复仇");
        flushAttackQueue();
    });
    delayedCall(function(){
        then(eventData, extras, isWrite);
    });
}

var ALL_EFFECTS = {
    "15": moreManaEffect,
    "1": innerBreak,
    "2": killInperfect,
    "3": battleWay,
    "4": battleDrawCard,
    "5": wakeSleep,
    "6": do1ToAllMinions,
    "7": draw1card,
    "8": battleBurn,
    "9": draw1cardWhenHit,
    "10": letsDraw2Cards,
    "11": lord,
    "12": messyFight,
    "13": costAdd5,
    "14": costSub1,
    "16": armorHit,
    "17": gainArmor(5),
    "18": improvedSkill,
    "19": enemySummonMinion,
    "20": setHealthTo15,
    "21": killMinionDamage7,
    "22": bashHit,
    "23": theEagles,
    "24": revenge,
    "25": shieldDrawCard
}

function activateEffect(effect, eventData, extras, isWrite, then) {
    if (effect === 0) return;
    if (!ALL_EFFECTS[effect + ""]) {
        return then(eventData, extras, isWrite);
    }
    ALL_EFFECTS[effect + ""](eventData, extras, isWrite, then);
}
