'use strict';

/**
 * a stupid artificial intelligence
 */

Game.prototype.getSolution = function() {
    var solution = [];

    if (this.hasSucceeded) {
        return solution;
    }

    // restore to the initial state
    for (var i = this.playerSteps.length - 1; i >= 0 ; i--) {
        solution.push([this.playerSteps[i][1]], [this.playerSteps[i][0]]);
    }

    /**
     * derive the solution of 3 towers of Hanoi problem by recursion
     * @param n: the number of discs
     * @param source: the index of the rod which has all discs at the beginning of the game (typically, source is 1)
     * @param temporary: the index of the rod which has not all discs at the beginning of the game and it is not the
        target rod (typically, temporary is 2)
     * @param destination: the index of the target rod in the game (typically, destination is 3)
     */
    function hanoi(n, source, temporary, destination) {
        if (n > 0) {
            // move n - 1 discs from source rod to temporary rod via destination rod
            hanoi(n - 1, source, destination, temporary);
            // move the n-th disc from source rod to destination rod
            solution.push([source, destination]);
            // move n - 1 discs from temporary rod to destination rod via temporary rod
            hanoi(n - 1, temporary, source, destination);
        }
    }

    hanoi(this.getNumberOfDiscs(), 1, 2, 3);

    return solution;
}

Game.prototype.displaySolution = function () {
    if (this.hasSucceeded) {
        alert('You have already succeeded!');
        $('#button-solve-it')[0].disabled = true;
        return;
    }

    if (this.movingUpwards || this.movingVertically || this.movingDownwards) {
        alert('please wait until the current animation is ended.');
        return;
    }

    disableButtons();
    disableKeys();

    var solution = this.getSolution();

    for (step in solution) {
        game.tryToMoveDisc(step[0], step[1]);

        // waiting for the end of a move
        while (this.movingUpwards || this.movingVertically || this.movingDownwards)
            continue;

        // wait half a second
        var wait = 500; // milli-seconds
        var nextTime = Date.now() + wait;
        while (Date.now() < nextTime)
            continue;
    }
}