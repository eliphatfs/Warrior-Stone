var timeStamp = 0;

function Minion(card) {
    var minion = $.extend(true, {}, card);
    minion.card = card;
    minion.timeStamp = timeStamp;
    minion.sleeping = true;
    timeStamp++;
    return minion;
}
