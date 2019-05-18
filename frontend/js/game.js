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

function myFriend() {
    return target === 1 ? 2 : 1;
}

function reprType(card) {
    return card.type == "S" ? "法术" : card.type == "M" ? "随从" : card.type == "W" ? "武器" : "未知";
}

function reprDesc(card) {
    var ret = "";
    if (card.type == "M")
        ret += card.damage + "-" + card.health + " ";
    else if (card.type == "W")
        ret += card.damage + "-" + card.durability + " ";
    ret += ((card.special & TAUNT) ? "嘲讽 " : "")
    + (card.battlecry ? "战吼 ": "")
    + (card.deathrattle ? "亡语 ": "");
    return ret;
}

function reprCardDetailed(card) {
    return card.name + " [" + card.cost + "]" + reprType(card) + "\n" + (card.type == "M" ? card.damage + "-" + card.health + " " : " ") + (card.type == "W" ? card.damage + "-" + card.durability + " " : " ") + (card.description || "无描述");
}

function rebuildHero() {
    $("#EH")[0].innerHTML = enemy.health;
    $("#EA")[0].innerHTML = enemy.armor;
    $("#EM")[0].innerHTML = enemy.mana;
    $("#ECH")[0].innerHTML = enemyHand.length;
    $("#ECD")[0].innerHTML = enemyDeck.length;
    $("#EHS")[0].innerHTML = enemy.skillOn ? "可用" : "已使用";
    
    $("#FH")[0].innerHTML = me.health;
    $("#FA")[0].innerHTML = me.armor;
    $("#FM")[0].innerHTML = me.mana;
    $("#FCH")[0].innerHTML = myHand.length;
    $("#FCD")[0].innerHTML = myDeck.length;
    $("#FHS")[0].innerHTML = me.skillOn ? "可用" : "已使用";
}

function rebuildHand() {
    $("#Hand")[0].innerHTML = "";
    for (var i=0; i<myHand.length; i++) {
        var proto = '<button type="button" style="min-width: 20%; text-align: center" id="H_$(ID)" onclick="hitCard($(ID))">[<span id="HC_$(ID)">$(COST)</span>] <span id="HN_$(ID)">$(NAME)</span><br /><span id="HD_$(ID)">$(DESC)</span></button>';
        while (proto.indexOf("$(ID)") != -1)
            proto = proto.replace("$(ID)", i);
        var card = myHand[i];
        proto = proto.replace("$(NAME)", card.name || "未命名");
        proto = proto.replace("$(COST)", card.cost);
        proto = proto.replace("$(DESC)", reprType(card) + "<br />" + reprDesc(card));
        $("#Hand")[0].innerHTML += proto;
    }
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
        playCard(myFriend(), msg.extras, msg.index);
    }
    else if (msg.type == "use_skill") {
        doAlert("敌方使用了英雄技能");
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

function rebuildMinions() {
    $("#FMS")[0].innerHTML = "";
    for (var i=0; i<myMinion.length; i++) {
        var card = myMinion[i].card;
        var proto = '<button type="button" style="min-width:13%; text-align: center" id="M$(OWNER)$(ID)" onclick="hitMinion($(OWNER), $(ID))">$(NAME)<br />攻 $(ATK)<br />血 $(HP)<br />$(DESC)</button>';
        proto = proto.replace("$(NAME)", card.name || "未命名");
        proto = proto.replace("$(HP)", myMinion[i].health);
        proto = proto.replace("$(OWNER)", target);
        proto = proto.replace("$(ID)", i);
        proto = proto.replace("$(OWNER)", target);
        proto = proto.replace("$(ID)", i);
        proto = proto.replace("$(ATK)", myMinion[i].damage);
        proto = proto.replace("$(DESC)", ((myMinion[i].special & TAUNT) ? "嘲讽" : "") + (myMinion[i].sleeping ? "Zzzz": "随从"));
        $("#FMS")[0].innerHTML += proto;
    }
    $("#EMS")[0].innerHTML = "";
    for (var i=0; i<enemyMinion.length; i++) {
        var card = enemyMinion[i].card;
        var proto = '<button type="button" style="min-width:13%; text-align: center" id="M$(OWNER)$(ID)" onclick="hitMinion($(OWNER), $(ID))">$(NAME)<br />攻 $(ATK)<br />血 $(HP)<br />$(DESC)</button>';
        proto = proto.replace("$(NAME)", card.name || "未命名");
        proto = proto.replace("$(HP)", enemyMinion[i].health);
        proto = proto.replace("$(OWNER)", myFriend());
        proto = proto.replace("$(OWNER)", myFriend());
        proto = proto.replace("$(ID)", i);
        proto = proto.replace("$(ID)", i);
        proto = proto.replace("$(ATK)", enemyMinion[i].damage);
        proto = proto.replace("$(DESC)", ((enemyMinion[i].special & TAUNT) ? "嘲讽" : "") + (enemyMinion[i].sleeping ? "Zzzz": "随从"));
        $("#EMS")[0].innerHTML += proto;
    }
}

function acknowledgeMessage() {
    $.ajax({
        url: BASE_ADDR + '/acknowledge_message',
        type: 'post',
        data: JSON.stringify({
            "room": room,
            "target": target
        }),
        dataType: 'json',
        success: function(resp) {
            setTimeout(fetchMessage, 30);
        },
        error: function(xhr, err, opt) {
            doAlert("您因为断线而输掉了比赛。");
        }
    });
}

function fetchMessage() {
    $.ajax({
        url: BASE_ADDR + '/fetch_message_blocked',
        type: 'post',
        data: JSON.stringify({
            "room": room,
            "target": target
        }),
        dataType: 'json',
        success: function(resp) {
            messageHandler(resp.data);
            acknowledgeMessage();
        },
        error: function(xhr, err, opt) {
            setTimeout(fetchMessage, 100);
        }
    });
}

function sendMessage(content) {
    $.ajax({
        url: BASE_ADDR + '/post_message',
        type: 'post',
        data: JSON.stringify({
            "room": room,
            "target": myFriend(),
            "message": content
        }),
        dataType: 'json',
        success: function(resp) {
        }
    });
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
