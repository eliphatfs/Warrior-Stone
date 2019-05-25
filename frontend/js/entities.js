var timeStamp = 0;

function Minion(card, hero) {
    var minion = $.extend(true, {}, card);
    minion.card = card;
    minion.timeStamp = timeStamp;
    for (var i=0; i<7; i++)
        if (getMinion(hero, i) && getMinion(hero, i).feature === 1 && minion.damage <= 3)
            minion.special |= CHARGE;
    minion.sleeping = ((minion.special & CHARGE) === 0);
    minion.firstRound = true;
    minion.highlight = false;
    minion.maxHealth = minion.health;
    timeStamp++;
    return minion;
}
