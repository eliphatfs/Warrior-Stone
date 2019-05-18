var room = parseInt(getQueryParam("room"));
var target = parseInt(getQueryParam("target"));
var myDeck = [];
var enemyDeck = [];
var myHand = [];
var enemyHand = [];
var whoFirst = Math.random() < 0.5 ? 1 : 2;
var me = {health: 30, armor: 0, job: WARRIOR, mana: 0};
var enemy = {health: 30, armor: 0, job: WARRIOR, mana: 0};
var state = "linking";
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
    $("#EM")[0].innerHTML = enemy.armor;
    $("#ECH")[0].innerHTML = enemyHand.length;
    $("#ECD")[0].innerHTML = enemyDeck.length;
    
    $("#FH")[0].innerHTML = me.health;
    $("#FA")[0].innerHTML = me.armor;
    $("#FCH")[0].innerHTML = myHand.length;
    $("#FCD")[0].innerHTML = myDeck.length;
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
    } else {
        enemy.mana = Math.ceil(round / 2);
    }
    $("#ACT")[0].disabled = !myRound();
    $("#ACT")[0].innerHTML = myRound() ? "结束回合": "对手回合";
}

function messageHandler(msg) {
    if (msg.type == "enemy_deck") {
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

function hitCard(index) {
    if (state == "changing card") {
        doConfirm("更换这张卡牌吗？\n" + reprCardDetailed(myHand[index]), function() {
            var targetPlace = randInt(5, myDeck.length - 1);
            myDeck.splice(targetPlace, 0, myHand.splice(index, 1));
            exchangeCardPool.push([index, targetPlace]);
            rebuildHero();
            rebuildHand();
        });
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
