var timeStamp = 0;

function Minion(card) {
    var minion = $.extend(true, {}, card);
    minion.card = card;
    minion.timeStamp = timeStamp;
    minion.sleeping = true;
    minion.highlight = false;
    minion.maxHealth = minion.health;
    timeStamp++;
    return minion;
}
