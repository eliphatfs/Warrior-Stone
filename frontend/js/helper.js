function doConfirm(hint, positiveAction, negativeAction) {
    if (confirm(hint)) {
        if (positiveAction)
            positiveAction();
    } else {
        if (negativeAction)
            negativeAction();
    }
}

function doAlert(hint) {
    alert(hint);
}

function randInt(low, high) {
    return low + Math.floor(Math.random() * (high - low));
}

function getQueryParam(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var reg_rewrite = new RegExp("(^|/)" + name + "/([^/]*)(/|$)", "i");
    var r = window.location.search.substr(1).match(reg);
    var q = window.location.pathname.substr(1).match(reg_rewrite);
    if (r != null) {
        return unescape(r[2]);
    } else if (q != null) {
        return unescape(q[2]);
    } else {
        return null;
    }
}

BASE_ADDR = "http://127.0.0.1:59095"
