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
};

// this is a function that runs at loading time (note the parenthesis at the end)
(function() {
    var displayStepIndex = 0;

    // begin moving the first disc without waiting
    var wait = 0; // milli-seconds

    var lastTime = undefined;

    var solution;

    Game.prototype.displaySolution = function (drawingState) {
        if (this.displayMode) {

            // on the first call, just get the solution
            if (!lastTime) {
                lastTime = drawingState.realTime;
                solution = this.getSolution();
                return;
            }

            var delta = drawingState.realTime - lastTime;
            lastTime = drawingState.realTime;

            // wait until nothing is moving
            if (this.movingUpwards || this.movingVertically || this.movingDownwards)
                return;

            if (displayStepIndex < solution.length) {
                if (wait <= 0) {
                    var step = solution[displayStepIndex];
                    this.tryToMoveDisc(step[0], step[1]);
                    displayStepIndex++;
                    // wait half a second between every two moves
                    wait = 500; // milli-seconds
                } else {
                    wait = Math.max(wait - delta, 0);
                }
            } else {
                this.displayMode = false; // turn off the display mode

                // restore user controls
                enableButtons();
                $('#button-solve-it')[0].disabled = true;
                bindKeysToGame(this);

                // but we will never congratulate player again even when he succeeds again because I assume player just
                // continues to move discs for fun.
            }
        }
    };
})();


