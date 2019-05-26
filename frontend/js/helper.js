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

function printCallStack() {
    var i = 0;
    var fun = arguments.callee;
    do {
        fun = fun.arguments.callee.caller;
        console.log(++i + ': ' + fun);
    } while (fun);
}

function randInt(low, high) {
    return low + Math.floor(Math.random() * (high - low));
}

function randChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
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

BASE_ADDR = "http://192.168.43.1:59095"
