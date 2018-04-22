/** the main file
 *
 * If you want to adjust the position of camera in world coordinate, the angele of field of view or the position of
 * light in world coordinate, please change numbers in function draw in main.js
 * If you want to adjust the position or the size of rods and discs, or the flying altitude of the moving disc, please
 * modify numbers in function Game in gameLogic.js
 *
 * I use some parallel lights, but you can swift to a dot light with a lot of work. I give out a brief instruction in
 * main.js
 *
 * If the animation is too frozen on your computer, please use a smaller number of framebuffer.resolution in
 * allObjects.js at the expense of aliasing of the shadow
 *
*/

var m4 = twgl.m4; // abbreviation
var v3 = twgl.v3;

function setup() {

    var canvas = $('#myCanvas')[0];
    var gl = canvas.getContext('webgl'); // gl should not be a global variable and it should be wrapped in object
    // drawingState defined in allObjects.js so that you could draw many animations on one web page.

    // start a new game
    var game = new Game();

    // make a fake drawing state for the object initialization
    var drawingState = {
        gl : gl
    }
    initializeObjects(game, drawingState); // use drawingState.gl

    // compile the shader program for shadow
    compileShadowProgram(drawingState); // use drawingState.gl

    // create a frame buffer object for shadow
    var framebuffer = createFramebufferForShadow(drawingState); // use drawingState.gl

    // support user interactions
    bindButtonsToGame(game);
    bindKeysToGame(game);
    var ab = new ArcBall(canvas);

    var realTime = 0; // since alert will interrupt the animation frame drawing procedure, we could not just use
     // performance.now()
    var lastTime = 0;

    var frameIndex = 0;
    var frameCount = 10; // compute user's fps every 10 frames
    var startTimestamp = performance.now(); // for computing user's fps

    var fps = 60; // I assume frame per second is 60 Hz, which will be corrected soon in function draw.

    /**
     * the main drawing function
    */
    function draw() {
        // check whether the game is over
        game.checkResult();

        // figure out the transforms
        var eye = [0, 150, 300];
        var target = [0, 0, 0];
        var up = [0, 1, 0];
        var cameraM = m4.lookAt(eye, target, up);

        var viewM = m4.inverse(cameraM);
        viewM = m4.multiply(ab.getMatrix(), viewM);

        var fieldOfView = Math.PI / 4;
        var projectionM = m4.perspective(fieldOfView, 2, 10, 1000);

        // get lighting information
        var lightPosition = [300, 150, 300]; // the position of a single light in world coordinate
        var lightDirection = v3.subtract(lightPosition, target); // now light direction is in world coordinate
        lightDirection = m4.transformPoint(viewM, lightDirection); // but we need light direction in camera coordinate,
        // as said in allObjects.js

        var lightViewM = m4.inverse(m4.lookAt(lightPosition, target, up));

        var lightProjectionM = m4.ortho(-3000, 3000, -3000, 3000, -3000, 3000); // 3000 is big enough, but 30 is
        // too small for projection matrix. If you use 30, the shadow map may not contain every objects in the world

        /* Because I use parallel light, I use orthogonal projection here.
        If you want to use dot light, please do following things:
        1. use perspective projection here
        2. pass lightPosition in camera coordinate to fragment shaders of every object. which means you should add
               lightPosition = m4.transformPoint(viewM, lightPosition);
           here and add it to the variable drawingState and add
               uniform vec3 uLightPosition;
           in fragment shaders of every object
        3. Compute light direction in camera coordinate for every vertex in fragment shaders of every object

        Here is an example for ground-fs: (only two places are changed)

        #ifdef GL_ES
            precision highp float;
        #endif
        uniform vec3 uColor;
        // delete: uniform vec3 uLightDirection;
        // add uLightPosition:
        uniform vec3 uLightPosition;
        uniform vec3 uLightColor;
        uniform sampler2D uShadowMap;
        varying vec3 fNormal;
        varying vec3 fPosition;
        varying vec4 vPositionFromLight;

        vec2 blinnPhongShading(vec3 lightDirection, float lightIntensity, float ambientCoefficient,
            float diffuseCoefficient, float specularCoefficient, float specularExponent)
        {
            // nothing's changed here, so I omit this part.
        }

        void main(void) {
            vec3 shadowCoordinate = (vPositionFromLight.xyz / vPositionFromLight.w) / 2.0 + 0.5;
            float depth = texture2D(uShadowMap, shadowCoordinate.xy).a;
            float visibility = (shadowCoordinate.z > depth + 0.005) ? 0.5 : 1.0;
            // replace: vec2 light = blinnPhongShading(uLightDirection, 1.0, 0.4, 1.0, 1.5, 30.0); by:
            vec2 light = blinnPhongShading(uLightPosition - fPosition, 1.0, 0.4, 1.0, 1.5, 30.0);
            vec3 ambientAndDiffuseColor = light.x * uColor;
            vec3 specularColor = light.y * uLightColor;
	        gl_FragColor = vec4(visibility * (ambientAndDiffuseColor + specularColor), 1.0);
        }
        */

        var lightColor = normalizeRgb(255, 255, 255); // white light

        // make a real drawing state for drawing
        drawingState = {
            gl : gl,
            projection : projectionM,
            view : viewM,
            camera : cameraM,
            lightDirection : lightDirection,
            lightColor: lightColor,
            lightProjection : lightProjectionM,
            lightView : lightViewM,
            shadowMap : framebuffer.texture,
            realTime : realTime,
        }

        // update the moving disc's position in world coordinate
        game.updateDiscPosition(drawingState);

        // draw to the framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.viewport(0, 0, framebuffer.resolution, framebuffer.resolution); // never forget to set viewport as our
        // texture's size

        // first, let's clear the background in the frame buffer
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        allObjects.forEach(function (object) {
            if(object.drawBefore)
                object.drawBefore(drawingState);
        });

        // return the frame buffer pointer to the system, now we can draw on the screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, myCanvas.width, myCanvas.height); // never forget to reset viewport as canvas's size

        // let's clear the screen as a whiteboard
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        allObjects.forEach(function (object) {
            if(object.draw)
                object.draw(drawingState);
        });

        allObjects.forEach(function (object) {
            if(object.drawAfter)
                object.drawAfter(drawingState); // no drawAfter functions actually
        });

        // advance the clock appropriately (unless its stopped)
        realTime += 1000 / fps;
        frameIndex++;

        // update fps
        if (frameIndex == frameCount) {
            fps = Math.round(frameCount * 1000 / (performance.now() - startTimestamp));
            frameIndex = 0;
            startTimestamp = performance.now();
        }
        console.log(fps);

        window.requestAnimationFrame(draw);
    }
    draw();
}
window.onload = setup;