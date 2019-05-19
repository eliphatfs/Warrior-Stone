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
            setTimeout(fetchMessage, 100);
        },
        error: function(xhr, err, opt) {
            setTimeout(acknowledgeMessage, 500);
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
            acknowledgeMessage();
            messageHandler(resp.data);
        },
        error: function(xhr, err, opt) {
            setTimeout(fetchMessage, 500);
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
        },
        error: function(xhr, err, opt) {
            sendMessage({type: "sync", "values": [myMinion, enemyMinion, me, enemy, myHand, enemyHand, myDeck, enemyDeck, round]});
        }
    });
}

function forceSync() {
    sendMessage({type: "sync", "values": [myMinion, enemyMinion, me, enemy, myHand, enemyHand, myDeck, enemyDeck, round]});
}
