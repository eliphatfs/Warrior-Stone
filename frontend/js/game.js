var room = parseInt(getQueryParam("room"));
var target = parseInt(getQueryParam("target"));
var myDeck = [];
var enemyDeck = [];
var myHand = [];
var enemyHand = [];
var myMinion = [];
var enemyMinion = [];
var whoFirst = Math.random() < 0.5 ? 1 : 2;
var me = {health: 30, armor: 0, job: WARRIOR, mana: 0, nextFatigue: 1, skillOn: true};
var enemy = {health: 30, armor: 0, job: WARRIOR, mana: 0, nextFatigue: 1, skillOn: true};
var state = "linking";
var selectState = "idle";
var exchangeCardPool = [];
var round = 0;
var targetSelector = function(hero, minionIndex) { return true; };
var targetingCallback = function(hero, minionIndex) {};
var gameHistory = "";

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
    if (myRound()) {
        me.mana = Math.ceil(round / 2);
        drawCard(target, 1);
    } else {
        enemy.mana = Math.ceil(round / 2);
        drawCard(myFriend(), 1);
    }
    for (var i=0; i<myMinion.length; i++)
        myMinion[i].sleeping = false;
    for (var i=0; i<enemyMinion.length; i++)
        enemyMinion[i].sleeping = false;
    $("#ACT")[0].disabled = !myRound();
    $("#ACT")[0].innerHTML = myRound() ? "结束回合": "对手回合";
    rebuildHero();
    rebuildMinions();
}

function messageHandler(msg) {
    if (msg.type == "play_card") {
        doAlert("敌方使用了：\n" + reprCardDetailed(enemyHand[msg.index]));
        gameHistory = "敌方使用了" + enemyHand[msg.index].name + "\n" + gameHistory;
        playCard(myFriend(), msg.extras, msg.index);
    }
    else if (msg.type == "use_skill") {
        doAlert("敌方使用了英雄技能");
        gameHistory = "敌方使用了英雄技能\n" + gameHistory;
        enemy.mana -= 2;
        enemy.armor += 2;
        enemy.skillOn = false;
        rebuildHero();
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
            enemyDeck.splice(msg.op[i][1], 0, enemyHand.splice(msg.op[i][0], 1));
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
    }
}

function showHistory() {
    doAlert(gameHistory);
}

function playCard(hero, extras, index) {
    var hand = hero === target ? myHand : enemyHand;
    var minion = hero === target ? myMinion : enemyMinion;
    var eminion = hero !== target ? myMinion : enemyMinion;
    var he = hero === target ? me : enemy;
    he.mana -= hand[index].cost;
    var isWrite = hero === target;
    
    for (var i=0; i<minion.length; i++)
        if (minion[i].useevent > 0)
            activateEffect(minion[i].useevent, {hero: hero, index: index}, extras, isWrite, function(a,b,c){});
    for (var i=0; i<eminion.length; i++)
        if (eminion[i].useevent > 0)
            activateEffect(eminion[i].useevent, {hero: hero, index: index}, extras, isWrite, function(a,b,c){});
    
    var defered = false;
    if (hand[index].type === "M") {
        if (hand[index].battlecry > 0) {
            defered = true;
            activateEffect(hand[index].battlecry, {hero: hero, index: index}, extras, isWrite, function(a,b,c){
                minion.push(Minion(hand[index]));
                rebuildMinions();
                if (isWrite) sendMessage({"type": "play_card", "index": index, "extras": extras});
                hand.splice(index, 1);
                
                rebuildHand();
                rebuildHero();
            });
        } else {
            minion.push(Minion(hand[index]));
            rebuildMinions();
        }
    } else if (hand[index].type === "S") {
        defered = true;
        activateEffect(hand[index].useevent, {hero: hero, index: index}, extras, isWrite, function(a,b,c){
            if (isWrite) sendMessage({"type": "play_card", "index": index, "extras": extras});
            hand.splice(index, 1);
            
            rebuildHand();
            rebuildHero();
        });
    }
    
    if (!defered) {
        if (isWrite) sendMessage({"type": "play_card", "index": index, "extras": extras});
        hand.splice(index, 1);
        
        rebuildHand();
        rebuildHero();
    }
}

function showDamage(hero, index, then) {
    if (index === -1) {
        var he = hero === target ? me : enemy;
    } else {
        var pref = hero === target ? "F" : "E";
    }
    then();
}

function dealDamage(hero, index, damage) {
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
                if (enemy.health <= 0 && me.health <= 0) doAlert("打成平手");
            }
        }
    }
    else {
        var minion = hero === target ? myMinion : enemyMinion;
        minion[index].health -= damage;
        if (minion[index].health <= 0) {
            minion.splice(index, 1);
        }
        rebuildMinions();
    }
}

function hitCard(index) {
    if (state == "changing card") {
        doConfirm("更换这张卡牌吗？\n" + reprCardDetailed(myHand[index]), function() {
            var targetPlace = randInt(5, myDeck.length - 1);
            myDeck.splice(targetPlace, 0, myHand.splice(index, 1));
            exchangeCardPool.push([index, targetPlace]);
            rebuildHero();
            rebuildHand();
        });
    } else if (myRound()) {
        if (myHand[index].cost > me.mana) {
            doAlert("费用不足！\n" + reprCardDetailed(myHand[index]));
        } else {
            doConfirm("使用这张卡牌吗？\n" + reprCardDetailed(myHand[index]), function() {
                gameHistory = "你使用了" + myHand[index].name + "\n" + gameHistory;
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
        targetSelector = function(hero, index) { return hero !== index; };
        targetingCallback = function(thero, tindex) {
            dealDamage(thero, tindex, myMinion[index].damage);
            myMinion[index].sleeping = true;
            rebuildMinions();
        }
    } else {
        doAlert(reprCardDetailed(myMinion[index]));
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
    }
}

function skill() {
    if (me.skillOn) {
        if (me.mana >= 2) {
            me.mana -= 2;
            me.armor += 2;
            me.skillOn = false;
            sendMessage({"type": "use_skill"});
            rebuildHero();
        } else {
            doAlert("费用不足：" + me.mana + " < 2！");
        }
    } else doAlert("英雄技能当前不可用");
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
