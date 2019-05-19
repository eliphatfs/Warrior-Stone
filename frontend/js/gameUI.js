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

function rebuildMinions() {
    $("#FMS")[0].innerHTML = "";
    for (var i=0; i<myMinion.length; i++) {
        var card = myMinion[i].card;
        var proto = '<button type="button" style="min-width:13%; text-align: center; $(EXTRA)" id="M$(OWNER)$(ID)" onclick="hitMinion($(OWNER), $(ID))">$(NAME)<br />攻 $(ATK)<br />血 $(HP)<br />$(DESC)</button>';
        proto = proto.replace("$(NAME)", card.name || "未命名");
        proto = proto.replace("$(HP)", myMinion[i].health);
        proto = proto.replace("$(OWNER)", target);
        proto = proto.replace("$(ID)", i);
        proto = proto.replace("$(OWNER)", target);
        proto = proto.replace("$(ID)", i);
        proto = proto.replace("$(ATK)", myMinion[i].damage);
        proto = proto.replace("$(EXTRA)", myMinion[i].highlight ? "background-color: #beb": "");
        proto = proto.replace("$(DESC)", ((myMinion[i].special & TAUNT) ? "嘲讽" : "") + (myMinion[i].sleeping ? "Zzzz": "随从"));
        $("#FMS")[0].innerHTML += proto;
    }
    $("#EMS")[0].innerHTML = "";
    for (var i=0; i<enemyMinion.length; i++) {
        var card = enemyMinion[i].card;
        var proto = '<button type="button" style="min-width:13%; text-align: center; $(EXTRA)" id="M$(OWNER)$(ID)" onclick="hitMinion($(OWNER), $(ID))">$(NAME)<br />攻 $(ATK)<br />血 $(HP)<br />$(DESC)</button>';
        proto = proto.replace("$(NAME)", card.name || "未命名");
        proto = proto.replace("$(HP)", enemyMinion[i].health);
        proto = proto.replace("$(OWNER)", myFriend());
        proto = proto.replace("$(OWNER)", myFriend());
        proto = proto.replace("$(ID)", i);
        proto = proto.replace("$(ID)", i);
        proto = proto.replace("$(EXTRA)", enemyMinion[i].highlight ? "background-color: #beb": "");
        proto = proto.replace("$(ATK)", enemyMinion[i].damage);
        proto = proto.replace("$(DESC)", ((enemyMinion[i].special & TAUNT) ? "嘲讽" : "") + (enemyMinion[i].sleeping ? "Zzzz": "随从"));
        $("#EMS")[0].innerHTML += proto;
    }
}
