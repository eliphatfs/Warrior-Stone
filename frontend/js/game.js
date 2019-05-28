var room = parseInt(getQueryParam("room"));
var target = parseInt(getQueryParam("target"));
var myDeck = [];
var enemyDeck = [];
var myHand = [];
var enemyHand = [];
var myMinion = [];
var enemyMinion = [];
var whoFirst = Math.random() < 0.5 ? 1 : 2;
var me = {health: 30, armor: 0, job: WARRIOR, mana: 0, nextFatigue: 1, skillOn: true, minionNoDeath: false, spellCost5More: false, improvedSkill: false, weapon: null};
var enemy = {health: 30, armor: 0, job: WARRIOR, mana: 0, nextFatigue: 1, skillOn: true, minionNoDeath: false, spellCost5More: false, improvedSkill: false, weapon: null};
var state = "linking";
var selectState = "idle";
var exchangeCardPool = [];
var round = 0;
var targetSelector = function(hero, minionIndex) { return true; };
var targetingCallback = function(hero, minionIndex) {};
var gameHistory = "";
var attackEventQueue = [];
var attackEventWaiter = 0;
var roundEndQueue = [];

function myFriend() {
    return target === 1 ? 2 : 1;
}

function myRound() {
    if (round <= 0) return false;
    if (round % 2 === 1 && whoFirst === target) return true;
    if (round % 2 === 0 && whoFirst !== target) return true;
    return false;
}

function roundStart() {
    delayedCall(function() {
        while (roundEndQueue.length > 0)
            roundEndQueue.shift()();
        
        for (var i=0; i<myHand.length; i++)
            if (myHand[i].removeOnEOR) {
                myHand.splice(i, 1);
                i--;
            }
        for (var i=0; i<enemyHand.length; i++)
            if (enemyHand[i].removeOnEOR) {
                enemyHand.splice(i, 1);
                i--;
            }
        me.minionNoDeath = false;
        enemy.minionNoDeath = false;
        for (var h=1; h<=2; h++)
            for (var i=0; i<7; i++)
                if (getMinion(h, i) && getMinion(h, i).roundend > 0) {
                    activateEffect(getMinion(h, i).roundend, {owner: h, myIndex: i, whoseRoundEnd: myRound() ? myFriend() : target}, [], true, function(a, b, c) {
                    });
                }
        if (myRound()) {
            enemy.spellCost5More = false;
            me.mana = Math.ceil(round / 2);
            if (me.mana > 10) me.mana = 10;
            drawCard(target, 1);
        } else {
            me.spellCost5More = false;
            enemy.mana = Math.ceil(round / 2);
            if (enemy.mana > 10) enemy.mana = 10;
            drawCard(myFriend(), 1);
        }
        for (var i=0; i<myMinion.length; i++) {
            myMinion[i].sleeping = false;
            myMinion[i].firstRound = false;
        }
        for (var i=0; i<enemyMinion.length; i++) {
            enemyMinion[i].sleeping = false;
            enemyMinion[i].firstRound = false;
        }
        me.skillOn = true;
        enemy.skillOn = true;
        $("#ACT")[0].disabled = !myRound();
        $("#ACT")[0].innerHTML = myRound() ? "结束回合": "对手回合";
        rebuildHand();
        rebuildHero();
        rebuildMinions();
    });
}

function messageHandler(msg) {
    if (msg.type == "play_card") {
        doAlert("敌方使用了：\n" + reprCardDetailed(enemyHand[msg.index]));
        gameHistory = "敌方使用了" + enemyHand[msg.index].name + "\n" + gameHistory;
        playCard(myFriend(), msg.extras, msg.index);
    }
    else if (msg.type == "attack") {
        if (msg.srch !== target && msg.srci !== -1) {
            enemyMinion[msg.srci].sleeping = true;
        }
        delayedCall(function() { simpleAttack(msg.srch, msg.srci, msg.dsth, msg.dsti); });
    }
    else if (msg.type == "use_skill") {
        doAlert("敌方使用了英雄技能");
        gameHistory = "敌方使用了英雄技能\n" + gameHistory;
        enemy.mana -= 2;
        enemy.armor += enemy.improvedSkill ? 4 : 2;
        enemy.skillOn = false;
        rebuildHero();
    }
    else if (msg.type == "expression") {
        expression(myFriend(), msg.contents);
    }
    else if (msg.type == "enemy_deck") {
        enemyDeck = msg.deck;
        if (target === 2) whoFirst = msg.who_first;
        for (var i=0; i<enemyDeck.length; i++) {
            enemyDeck[i] = $.extend(true, {}, ALL_CARDS[enemyDeck[i]]);
        }
        for (var i=0; i<myDeck.length; i++) {
            myDeck[i] = $.extend(true, {}, ALL_CARDS[myDeck[i]]);
        }
        
        for (var i=0; i<(target === whoFirst ? 3 : 4); i++)
            myHand.push(myDeck.shift());
        for (var i=0; i<(target !== whoFirst ? 3 : 4); i++)
            enemyHand.push(enemyDeck.shift());
        rebuildHand();
        rebuildHero();
        
        $("#ACT")[0].disabled = false;
        $("#ACT")[0].innerHTML = "结束换牌";
        
        $("#game")[0].style.display = "";
        $("#wait")[0].style.display = "none";
        
        state = "changing card";
    } else if (msg.type == "exchange_card") {
        for (var i=0; i<msg.op.length; i++) {
            enemyDeck.splice(msg.op[i][1], 0, enemyHand.splice(msg.op[i][0], 1)[0]);
        }
        for (var i=0; i<msg.op.length; i++) {
            enemyHand.push(enemyDeck.shift());
        }
        if (enemyHand.length === 4)
            enemyHand.push(ALL_CARDS[17]);
        rebuildHero();
        var todo = function() {
            if (state == "waiting exchange") {
                state = "round";
                round = 1;
                roundStart();
            } else setTimeout(todo, 500);
        }
        setTimeout(todo, 500);
    } else if (msg.type == "end_round") {
        round++;
        roundStart();
    } else if (msg.type == "sync") {
        myMinion = msg.values[1];
        enemyMinion = msg.values[0];
        me = msg.values[3];
        enemy = msg.values[2];
        myHand = msg.values[5];
        enemyHand = msg.values[4];
        myDeck = msg.values[7];
        enemyDeck = msg.values[6];
        round = msg.values[8];
        $("#ACT")[0].disabled = !myRound();
        $("#ACT")[0].innerHTML = myRound() ? "结束回合": "对手回合";
        rebuildHand();
        rebuildHero();
        rebuildMinions();
    } else if (msg.type == "surrender") {
        spellAttack(enemy.health + enemy.armor, myFriend(), -1, "敌方英雄");
    }
}

function showHistory() {
    var splt = gameHistory.split("\n");
    if (splt.length > 12) {
        splt.splice(12, 10000);
        gameHistory = splt.join("\n");
    }
    doAlert(gameHistory);
}

function playCard(hero, extras, index) {
    var hand = hero === target ? myHand : enemyHand;
    var minion = hero === target ? myMinion : enemyMinion;
    var eminion = hero !== target ? myMinion : enemyMinion;
    var he = hero === target ? me : enemy;
    he.mana -= hand[index].cost + (hand[index].type == "S" && he.spellCost5More ? 5 : 0);
    var isWrite = hero === target;
    
    if (target === 1) {
        for (var i=0; i<minion.length; i++)
            if (minion[i].useevent > 0)
                activateEffect(minion[i].useevent, {hero: hero, index: index}, extras, isWrite, function(a,b,c){});
        for (var i=0; i<eminion.length; i++)
            if (eminion[i].useevent > 0)
                activateEffect(eminion[i].useevent, {hero: hero, index: index}, extras, isWrite, function(a,b,c){});
    } else {
        for (var i=0; i<eminion.length; i++)
            if (eminion[i].useevent > 0)
                activateEffect(eminion[i].useevent, {hero: hero, index: index}, extras, isWrite, function(a,b,c){});
        for (var i=0; i<minion.length; i++)
            if (minion[i].useevent > 0)
                activateEffect(minion[i].useevent, {hero: hero, index: index}, extras, isWrite, function(a,b,c){});
    }
    
    var defered = false;
    if (hand[index].type === "M") {
        if (hand[index].battlecry > 0) {
            defered = true;
            activateEffect(hand[index].battlecry, {hero: hero, index: index}, extras, isWrite, function(a,b,c){
                if (isWrite) gameHistory = "你使用了" + myHand[index].name + "\n" + gameHistory;
                minion.push(Minion(hand[index], hero));
                rebuildMinions();
                if (isWrite) sendMessage({"type": "play_card", "index": index, "extras": extras});
                hand.splice(index, 1);
                
                rebuildHand();
                rebuildHero();
            });
        } else {
            minion.push(Minion(hand[index], hero));
            rebuildMinions();
        }
    } else if (hand[index].type === "W") {
        if (hand[index].battlecry > 0) {
            defered = true;
            activateEffect(hand[index].battlecry, {hero: hero, index: index}, extras, isWrite, function(a,b,c){
                if (isWrite) gameHistory = "你使用了" + myHand[index].name + "\n" + gameHistory;
                he.weapon = Weapon(hand[index], hero);
                // rebuildHero();
                if (isWrite) sendMessage({"type": "play_card", "index": index, "extras": extras});
                hand.splice(index, 1);
                
                rebuildHand();
                rebuildHero();
            });
        } else {
            he.weapon = Weapon(hand[index], hero);
        }
    } else if (hand[index].type === "S") {
        defered = true;
        activateEffect(hand[index].useevent, {hero: hero, index: index}, extras, isWrite, function(a,b,c){
            if (isWrite) gameHistory = "你使用了" + myHand[index].name + "\n" + gameHistory;
            if (isWrite) sendMessage({"type": "play_card", "index": index, "extras": extras});
            hand.splice(index, 1);
            
            rebuildHand();
            rebuildHero();
        });
    }
    
    if (!defered) {
        if (isWrite) gameHistory = "你使用了" + myHand[index].name + "\n" + gameHistory;
        if (isWrite) sendMessage({"type": "play_card", "index": index, "extras": extras});
        hand.splice(index, 1);
        
        rebuildHand();
        rebuildHero();
    }
}

function getMinionByTimeStamp(ts) {
    var minion;
    minion = myMinion;
    for (var i=0; i<7; i++)
        if (minion[i] && minion[i].timeStamp === ts)
            return minion[i];
    minion = enemyMinion;
    for (var i=0; i<7; i++)
        if (minion[i] && minion[i].timeStamp === ts)
            return minion[i];
    return null;
}

function getMinionByTimeStampRegioned(ts, mine, his) {
    var minion;
    minion = mine;
    for (var i=0; i<7; i++)
        if (minion[i] && minion[i].timeStamp === ts)
            return minion[i];
    minion = his;
    for (var i=0; i<7; i++)
        if (minion[i] && minion[i].timeStamp === ts)
            return minion[i];
    return null;
}

function getMinionPosByTimeStampRegioned(ts, mine, his) {
    if (ts === -1)
        return [-1, -1];
    var minion;
    minion = mine;
    for (var i=0; i<7; i++)
        if (minion[i] && minion[i].timeStamp === ts)
            return [target, i];
    minion = his;
    for (var i=0; i<7; i++)
        if (minion[i] && minion[i].timeStamp === ts)
            return [myFriend(), i];
    return null;
}

function dealDamage(hero, index, damage, source) {
    if (index !== -1)
        queueShowDamage(hero, getMinion(hero, index).timeStamp, damage);
    else
        queueShowDamage(hero, -1, damage);
    if (index === -1) {
        var he = hero === target ? me : enemy;
        if (damage <= he.armor) {
            he.armor -= damage;
            rebuildHero();
        } else {
            damage -= he.armor;
            he.armor = 0;
            he.health -= damage;
            rebuildHero();
            if (he.health <= 0) {
                if (me.health <= 0 && enemy.health > 0) doAlert("败  北");
                if (enemy.health <= 0 && me.health > 0) doAlert("胜利");
            }
        }
    }
    else {
        var minion = hero === target ? myMinion : enemyMinion;
        minion[index].health -= damage;
        var defered = false;
        if (minion[index].health <= 0) {
            var he = hero === target ? me : enemy;
            if (he.minionNoDeath) {
                minion[index].health = 1;
                attackEventQueue.push([minion[index].timeStamp, function() {
                    for (var h=1; h<=2; h++)
                        for (var i=0; i<7; i++) {
                            if (getMinion(h, i) && getMinion(h, i).hurtevent > 0) {
                                defered = true;
                                activateEffect(getMinion(h, i).hurtevent, {owner: h, myIndex: i, dsti: index, dsth: hero, killing: false}, [], true, function(a, b, c) {
                                });
                            }
                        }
                }]);
            }
            else {
                attackEventQueue.push([minion[index].timeStamp, function() {
                    for (var h=1; h<=2; h++)
                        for (var i=0; i<7; i++) {
                            if (getMinion(h, i) && getMinion(h, i).hurtevent > 0) {
                                defered = true;
                                activateEffect(getMinion(h, i).hurtevent, {owner: h, myIndex: i, dsti: index, dsth: hero, killing: true}, [], true, function(a, b, c) {
                                });
                            }
                        }
                }]);  // TODO: isWrite
                gameHistory = source + "消灭了" + minion[index].name + "\n" + gameHistory;
                var ts = minion[index].timeStamp;
                attackEventQueue.push([minion[index].timeStamp + 100000, function() {
                    for (var i=0; i<7; i++)
                        if (minion[i] && minion[i].timeStamp === ts)
                            if (minion[i].deathrattle > 0) {
                                minion[i].highlight = true;
                                var thiz = minion.splice(i, 1)[0];
                                defered = true;
                                activateEffect(thiz.deathrattle, {hero: hero}, [], target === 1, function(a, b, c) {
                                });
                            } else minion.splice(i, 1);
                }]);
            }
        } else {
            attackEventQueue.push([minion[index].timeStamp, function() {
                for (var h=1; h<=2; h++)
                    for (var i=0; i<7; i++) {
                        if (getMinion(h, i) && getMinion(h, i).hurtevent) {
                            defered = true;
                            activateEffect(getMinion(h, i).hurtevent, {owner: h, myIndex: i, dsti: index, dsth: hero, killing: false}, [], true, function(a, b, c) {
                            });
                        }
                    }
            }]);
        }
    }
}

function surrender() {
    doConfirm("确定投降吗？", function() {
        spellAttack(me.health + me.armor, target, -1, "你");
        sendMessage({"type": "surrender"});
    });
}

function hitCard(index) {
    if (state == "changing card") {
        doConfirm("更换这张卡牌吗？\n" + reprCardDetailed(myHand[index]), function() {
            var targetPlace = randInt(5, myDeck.length - 1);
            myDeck.splice(targetPlace, 0, myHand.splice(index, 1)[0]);
            exchangeCardPool.push([index, targetPlace]);
            rebuildHero();
            rebuildHand();
        });
    } else if (myRound()) {
        if (myHand[index].cost + (myHand[index].type == "S" && me.spellCost5More ? 5 : 0) > me.mana) {
            doAlert("费用不足！\n" + reprCardDetailed(myHand[index]));
        } else if (myHand[index].type === "M" && myMinion.length >= 7) {
            doAlert("随从位已满！\n" + reprCardDetailed(myHand[index]));
        } else {
            doConfirm("使用这张卡牌吗？\n" + reprCardDetailed(myHand[index]), function() {
                playCard(target, new Array(), index);
            });
        }
    } else if (state == "round") {
        doAlert("卡牌详情：\n" + reprCardDetailed(myHand[index]));
    }
}

function act() {
    if (state == "changing card") {
        for (var i=myHand.length; i<(target === whoFirst ? 3 : 4); i++)
            myHand.push(myDeck.shift());
        if (myHand.length === 4)
            myHand.push(ALL_CARDS[17]);
        rebuildHand();
        rebuildHero();
        state = "waiting exchange";
        $("#ACT")[0].disabled = true;
        $("#ACT")[0].innerHTML = "等待对手换牌..";
        sendMessage({"type": "exchange_card", "op": exchangeCardPool});
    }
    else if (myRound()) {
        sendMessage({"type": "end_round"});
        round++;
        roundStart();
    }
}

function getDamage(hero, index) {
    if (index === -1) {
        var he = hero === target ? me : enemy;
        if (hero === target && myRound() && he.weapon) return he.weapon.damage;
        else if (hero === myFriend() && !myRound() && he.weapon) return he.weapon.damage;
        return 0;
    }
    var minion = hero === target ? myMinion : enemyMinion;
    return minion[index].damage;
}

function getMinion(hero, index) {
    var minion = hero === target ? myMinion : enemyMinion;
    return minion[index];
}

function getHand(hero, index) {
    var cards = hero === target ? myHand : enemyHand;
    return cards[index];
}

function flushAttackQueue() {
    flushShowDamageQueue();
    attackEventQueue.sort(function(a, b) {
        if (a.length === 2 && b.length !== 2) return -1;
        if (b.length === 2 && a.length !== 2) return 1;
        if (a.length === 2 && b.length === 2) {
            if (a[0] > b[0]) return 1;
            if (a[0] < b[0]) return -1;
        }
        return 0;
    });
    while (attackEventQueue.length > 0 && attackEventWaiter <= 0) {
        var elm = attackEventQueue.shift();
        if (elm.length === 2) elm[1]();
        else elm();
    }
}

function simpleAttack(srch, srci, dsth, dsti) {
    var pack = function() {
        if (getDamage(dsth, dsti) > 0) {
            dealDamage(srch, srci, getDamage(dsth, dsti), reprTarget(dsth, dsti));
        }
        if (getDamage(srch, srci) > 0) {
            dealDamage(dsth, dsti, getDamage(srch, srci), reprTarget(srch, srci));
        }
        flushAttackQueue();
    };
    pack();
}

function spellAttack(dmg, dsth, dsti, srcDisp) {
    var pack = function() {
        dealDamage(dsth, dsti, dmg, srcDisp || "");
        flushAttackQueue();
    };
    pack();
}

function spellAttackNoFlushQueue(dmg, dsth, dsti, srcDisp) {
    var pack = function() {
        dealDamage(dsth, dsti, dmg, srcDisp || "");
    };
    pack();
}

function delayedCall(func) {
    if (attackEventWaiter > 0) attackEventQueue.push(func);
    else func();
}

function checkSelectionTargets() {
    for (var i=-1; i<myMinion.length; i++)
        if (targetSelector(target, i)) return true;
    for (var i=-1; i<enemyMinion.length; i++)
        if (targetSelector(myFriend(), i)) return true;
    doAlert("没有适合的目标！");
    return false;
}

function hitMinion(hero, index) {
    if (selectState == "targeting") {
        if (!targetSelector(hero, index)) {
            doAlert("选择了无效的目标");
        } else {
            targetingCallback(hero, index);
            selectState = "";
        }
    } else if (myRound() && hero === target && !myMinion[index].sleeping) {
        selectState = "targeting";
        targetSelector = function(hero, index) {
            if (hero === target)
                return false;
            var taunt = false;
            for (var i=0; i<enemyMinion.length; i++)
                if (enemyMinion[i].special & TAUNT) {
                    taunt = true; break;
                }
            if (taunt && (index === -1 || (enemyMinion[index].special & TAUNT) === 0))
                return false;
            return true;
        };
        targetingCallback = function(thero, tindex) {
            myMinion[index].sleeping = true;
            delayedCall(function(){ simpleAttack(target, index, thero, tindex); });
            sendMessage({"type": "attack", "srch": hero, "srci": index, "dsth": thero, "dsti": tindex});
        };
    } else {
        doAlert(reprCardDetailed(getMinion(hero, index)));
    }
}

function hitEnemyHero() {
    if (selectState == "targeting") {
        if (!targetSelector(myFriend(), -1)) {
            doAlert("选择了无效的目标");
        } else {
            targetingCallback(myFriend(), -1);
            selectState = "";
        }
    }
}

function hitMyHero() {
    if (selectState == "targeting") {
        if (!targetSelector(target, -1)) {
            doAlert("选择了无效的目标");
        } else {
            targetingCallback(target, -1);
            selectState = "";
        }
    } else if (myRound() && me.weapon && !me.weapon.sleeping) {
        selectState = "targeting";
        targetSelector = function(hero, index) {
            if (hero === target)
                return false;
            var taunt = false;
            for (var i=0; i<enemyMinion.length; i++)
                if (enemyMinion[i].special & TAUNT) {
                    taunt = true; break;
                }
            if (taunt && (index === -1 || (enemyMinion[index].special & TAUNT) === 0))
                return false;
            return true;
        };
        targetingCallback = function(thero, tindex) {
            me.weapon.sleeping = true;
            me.weapon.durability--;
            if (me.weapon.durability <= 0) {
                attackEventQueue.push([me.weapon.timeStamp + 100000, function() {activateEffect(me.weapon.deathrattle, {hero: target}, [], target === 1, function(a, b, c) {
                               })}]);
                me.weapon = null;
            }
            delayedCall(function(){ simpleAttack(target, -1, thero, tindex); });
            sendMessage({"type": "attack", "srch": hero, "srci": -1, "dsth": thero, "dsti": tindex});
        }
    } else {
        showModalExpressions();
    }
}

function skill() {
    if (me.skillOn && myRound()) {
        if (me.mana >= 2) {
            me.mana -= 2;
            me.armor += me.improvedSkill ? 4 : 2;
            me.skillOn = false;
            sendMessage({"type": "use_skill"});
            rebuildHero();
        } else {
            doAlert("费用不足：" + me.mana + " < 2！");
        }
    } else doAlert("英雄技能当前不可用");
}

function sendExpressionInternal(contents) {
    sendMessage({"type": "expression", "contents": contents});
    expression(target, contents);
}

function sendExpression(which) {
    closeModalExpressions();
    if (which < 3) {
        if (which === 0) sendExpressionInternal("你好。");
        else if (which === 1) sendExpressionInternal("打得不错。");
        else if (which === 2) sendExpressionInternal("真厉害。");
    } else {
        if (which === 3) sendExpressionInternal("谢谢。");
        else if (which === 4) sendExpressionInternal("发生这种事我很抱歉。");
        else if (which === 5) sendExpressionInternal("我要粉碎你！");
    }
}

$.ajax({
    url: BASE_ADDR + '/load_deck',
    type: 'post',
    data: JSON.stringify({
        "name": getQueryParam("deck")
    }),
    dataType: 'json',
    success: function(resp) {
        myDeck = resp.data;
        myDeck = myDeck.sort(function(a, b) { return Math.random() < 0.5 ? -1 : 1; });
        sendMessage({"type": "enemy_deck", "deck": myDeck, "who_first": whoFirst});
        fetchMessage();
    }
});
