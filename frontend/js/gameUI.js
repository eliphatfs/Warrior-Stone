var uiQueue = [];
var uiMyMinion = [];
var uiEnemyMinion = [];
var uiDamageQueue = [];
var spliceIndex = 100000;
var UI_REFRESH_DELAY = 100;

function reprHero(hero) {
    return target === hero ? "你" : "敌方";
}

function reprTarget(hero, index) {
    if (index === -1) return target === hero ? "你" : "敌方英雄";
    return reprHero(hero) + "的" + (target === hero ? myMinion : enemyMinion)[index].name;
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
    ret += ((card.special & CHARGE) ? "冲锋 " : "")
    + (card.battlecry ? "战吼 ": "")
    + (card.deathrattle ? "亡语 ": "");
    return ret;
}

function reprCardDetailed(card) {
    return card.name + " [" + card.cost + "]" + reprType(card) + "\n" + (card.type == "M" ? card.damage + "-" + card.health + " " : " ") + (card.type == "W" ? card.damage + "-" + card.durability + " " : " ") + (card.description || "无描述");
}

function queueShowDamage(hero, timeStamp, damage) {
    console.log(timeStamp);
    if (spliceIndex > uiQueue.length) spliceIndex = uiQueue.length;
    uiDamageQueue.push(hero);
    uiDamageQueue.push(timeStamp);
    uiDamageQueue.push(damage);
}

function showModalExpressions() {
    var modal = $("#modalExpressions")[0];
    modal.style.display = "block";
}

function closeModalExpressions() {
    var modal = $("#modalExpressions")[0];
    modal.style.display = "none";
}

function expression(hero, contents) {
    var pack = function() {
        var old;
        uiQueue.push([0, function() {
            var elmID = hero === target ? "#FHB" : "#EHB";
            var elm = $(elmID)[0];
            old = elm.innerHTML;
            elm.innerHTML = "<font size='36'>" + contents + "</font>";
        }]);
        uiQueue.push([1200, function() {
            var elmID = hero === target ? "#FHB" : "#EHB";
            var elm = $(elmID)[0];
            elm.innerHTML = old;
        }]);
    };
    pack();
}

function flushShowDamageQueue() {
    var pack = function() {
        var elms = [], olds = [];
        var heroes = [], indexes = [], damages = [];
        for (var i=0; i<uiDamageQueue.length; i+=3) {
            heroes.push(uiDamageQueue[i]);
            indexes.push(uiDamageQueue[i + 1]);
            damages.push(uiDamageQueue[i + 2]);
        }
        uiQueue.splice(spliceIndex, 0, [1500, function() {
            $("#ACT")[0].disabled = false;
            for(var i=0; i<elms.length; i++)
                elms[i].innerHTML = olds[i];
        }]);
        uiQueue.splice(spliceIndex, 0, [0, function() {
            for(var i=0; i<heroes.length; i++) {
                var elmID;
                if (indexes[i] === -1) {
                    elmID = heroes[i] === target ? "#FHB" : "#EHB";
                } else {
                    console.log(uiMyMinion);
                    console.log(uiEnemyMinion);
                    var pos = getMinionPosByTimeStampRegioned(indexes[i], uiMyMinion, uiEnemyMinion);
                    elmID = "#M" + pos[0] + pos[1];
                }
                var elm = $(elmID)[0];
                var old = elm.innerHTML;
                elms.push(elm);
                olds.push(old);
                showDamageInternal(heroes[i], getMinionPosByTimeStampRegioned(indexes[i], uiMyMinion, uiEnemyMinion)[1], damages[i]);
            }
            rebuildHero();
            rebuildMinions();
        }]);
        spliceIndex = 100000;
        uiDamageQueue = [];
    };
    pack();
}

function showDamageInternal(hero, index, damage) {
    $("#ACT")[0].disabled = true;
    if (index === -1) {
        var elmID = hero === target ? "#FHB" : "#EHB";
        var elm = $(elmID)[0];
        var old = elm.innerHTML;
        elm.innerHTML = "<font color='#e99' size='18px'>-" + damage + "</font>";
    } else {
        var elmID = "#M" + hero + index;
        var elm = $(elmID)[0];
        var old = elm.innerHTML;
        elm.innerHTML = "<font color='#e99' size='18px'>-" + damage + "</font>";
    }
}

function rebuildHero() {
    uiQueue.push([0, rebuildHeroInternal]);
}

function rebuildHeroInternal() {
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
    uiQueue.push([0, rebuildHandInternal]);
}

function rebuildHandInternal() {
    $("#Hand")[0].innerHTML = "";
    for (var i=0; i<myHand.length; i++) {
        var proto = '<button type="button" style="min-width: 20%; text-align: center" id="H_$(ID)" onclick="hitCard($(ID))">[<span id="HC_$(ID)">$(COST)</span>] <span id="HN_$(ID)">$(NAME)</span><br /><span id="HD_$(ID)">$(DESC)</span></button>';
        while (proto.indexOf("$(ID)") != -1)
            proto = proto.replace("$(ID)", i);
        var card = myHand[i];
        proto = proto.replace("$(NAME)", card.name || "未命名");
        proto = proto.replace("$(COST)", card.cost + (me.spellCost5More && card.type === 'S' ? "<+5>" : ""));
        proto = proto.replace("$(DESC)", reprType(card) + "<br />" + reprDesc(card));
        $("#Hand")[0].innerHTML += proto;
    }
}

function rebuildMinions() {
    // printCallStack();
    uiMyMinion = myMinion.concat();
    uiEnemyMinion = enemyMinion.concat();
    uiQueue.push([200, function() {
        rebuildMinionsInternal();
    }]);
}

function rebuildMinionsInternal() {
    $("#FMS")[0].innerHTML = "";
    for (var i=0; i<uiMyMinion.length; i++) {
        var card = uiMyMinion[i].card;
        var proto = '<button type="button" style="min-width:13%; text-align: center; $(EXTRA)" id="M$(OWNER)$(ID)" onclick="hitMinion($(OWNER), $(ID))">$(NAME)<br />攻 $(ATK)<br />血 $(HP)<br />$(DESC)</button>';
        proto = proto.replace("$(NAME)", card.name || "未命名");
        proto = proto.replace("$(HP)", uiMyMinion[i].health);
        proto = proto.replace("$(OWNER)", target);
        proto = proto.replace("$(ID)", i);
        proto = proto.replace("$(OWNER)", target);
        proto = proto.replace("$(ID)", i);
        proto = proto.replace("$(ATK)", uiMyMinion[i].damage);
        proto = proto.replace("$(EXTRA)", uiMyMinion[i].highlight ? "background-color: #beb": "");
        proto = proto.replace("$(DESC)", ((uiMyMinion[i].special & SILENCE) ? "沉默" : "") + ((uiMyMinion[i].special & CHARGE) ? "冲锋" : "") + ((uiMyMinion[i].special & TAUNT) ? "嘲讽" : "") + (uiMyMinion[i].sleeping ? "Zzzz": "随从"));
        $("#FMS")[0].innerHTML += proto;
    }
    $("#EMS")[0].innerHTML = "";
    for (var i=0; i<uiEnemyMinion.length; i++) {
        var card = uiEnemyMinion[i].card;
        var proto = '<button type="button" style="min-width:13%; text-align: center; $(EXTRA)" id="M$(OWNER)$(ID)" onclick="hitMinion($(OWNER), $(ID))">$(NAME)<br />攻 $(ATK)<br />血 $(HP)<br />$(DESC)</button>';
        proto = proto.replace("$(NAME)", card.name || "未命名");
        proto = proto.replace("$(HP)", uiEnemyMinion[i].health);
        proto = proto.replace("$(OWNER)", myFriend());
        proto = proto.replace("$(OWNER)", myFriend());
        proto = proto.replace("$(ID)", i);
        proto = proto.replace("$(ID)", i);
        proto = proto.replace("$(EXTRA)", uiEnemyMinion[i].highlight ? "background-color: #beb": "");
        proto = proto.replace("$(ATK)", uiEnemyMinion[i].damage);
        proto = proto.replace("$(DESC)", ((uiEnemyMinion[i].special & SILENCE) ? "沉默" : "") + ((uiEnemyMinion[i].special & CHARGE) ? "冲锋" : "") + ((uiEnemyMinion[i].special & TAUNT) ? "嘲讽" : "") + (uiEnemyMinion[i].sleeping ? "Zzzz": "随从"));
        $("#EMS")[0].innerHTML += proto;
    }
}

setInterval(function() {
    while (uiQueue.length > 0) {
        if (uiQueue[0][0] > 0) {
            uiQueue[0][0] -= UI_REFRESH_DELAY;
            break;
        } else {
            uiQueue.shift()[1]();
        }
    }
}, UI_REFRESH_DELAY);
