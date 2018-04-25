# 3D tower of Hanoi drawn by WebGL

## Introduction
The Tower of Hanoi is a mathematical game or puzzle. It consists of three rods and a number of disks of different sizes,
 which can slide onto any rod. The puzzle starts with the disks in a neat stack in ascending order of size on one rod, 
 the smallest at the top, thus making a conical shape.

The objective of the game is to move the entire stack to another rod, obeying the following simple rules:
1. Only one disk can be moved at a time.
2. Each move consists of taking the upper disk from one of the stacks and placing it on top of another stack.
3. No disk may be placed on top of a smaller disk.

## Ways to run the program
1. Here is the GitHub Pages link for the game: https://shxuy.github.io/3DTowerOfHanoi/index.html
2. Download all files and run index.html in your native browser
3. Modify paths of JavaScript files in index.html and use your own server

## Ways of control
1. You could drag the screen by mouse to adjust the view
2. You could click buttons on the web page to move discs
3. You could also press keys denoted in texts of buttons to move discs instead of clicking buttons. Here is the list of 
hot keys:

    | key | motion                                      |
    | --- | ------------------------------------------- |
    | Q   | move a disc from the 1st rod to the 2nd rod |
    | A   | move a disc from the 1st rod to the 3rd rod |
    | W   | move a disc from the 2nd rod to the 1st rod |
    | S   | move a disc from the 2nd rod to the 3rd rod |
    | E   | move a disc from the 3rd rod to the 1st rod |
    | D   | move a disc from the 3rd rod to the 2nd rod |
4. You could click the button 'solve it' to watch the solving animation

## Animation performance
| browser\platform | Windows  | Mac OS      | Ubuntu |
| :--------------: | :------: | :---------: | :----: |
| **Chrome**       | frozen   | frozen      | frozen |
| **Firefox**      | untested | untested    | fluent |
| **Safari**       | N/A      | very frozen | N/A    |
| **Edges**        | crash    | N/A         | N/A    |
  
If you want make animation more fluent, please use a smaller number for framebuffer.resolution defined in allObjects.js 
at the expense of aliasing of the shadow.

## Code modification suggestions
1. If you want to adjust the position of camera in world coordinate, the angele of field of view or the position of 
light in world coordinate, please change numbers in function draw in main.js
2. If you want to adjust the position or the size of rods and discs, or the flying altitude of the moving disc, please
modify numbers in function Game in gameLogic.js
3. If you want to speed up the moving disc, please modify variable movingSpeed defined in 
Game.prototype.updateDiscPosition in gameLogic.js
4. I use some parallel lights, but you can swift to a dot light with a lot of work. I give out a brief instruction in
main.js

## Miscellaneous
1. It is best for computers or iPads, not mobile phones.
2. I meant to let users use mouse to drag and drop any discs, but the implementation will be too complicated without a 
physics engine because I have to implement collusion detection and mouse selection detection by myself. It is unwise 
to reinvent the wheel and WebGL is a little low-level for games so I suggest you choosing any game engine such as 
three.js to realize the feature. 

