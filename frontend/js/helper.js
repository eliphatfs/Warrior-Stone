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
