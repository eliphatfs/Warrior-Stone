function baseEffect(eventData, extras, isWrite) {
    
}

function drawCard(hero, count) {
    if (hero === target)
        for (var i=0; i<count; i++) {
            if (myDeck.length === 0) {
                doAlert("你受到了" + me.nextFatigue + "点疲劳伤害");
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
