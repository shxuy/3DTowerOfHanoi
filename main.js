/** the main file
*/

var m4 = twgl.m4; // abbreviation
var v3 = twgl.v3;

function setup() {

    var canvas = $('#myCanvas')[0];
    var gl = canvas.getContext('webgl');

    // start a new game
    var game = new Game();

    // make a fake drawing state for the object initialization
    var drawingState = {
        gl : gl
    }
    initializeObjects(game, drawingState);

    // compile the shader program for shadow
    compileShadowProgram(drawingState);

    // create a frame buffer object for shadow
    var framebuffer = createFramebufferForShadow(drawingState);

    // support user interactions
    bindButtonsToGame(game);
    bindKeysToGame(game);
    var ab = new ArcBall(canvas);

    var realTime;
    var lastTime;

    /**
     * the main function
    */
    function draw() {
        // check whether the game is over
        game.checkResult();

        // advance the clock appropriately (unless its stopped)
        var curTime = Date.now();
        realTime += (curTime - lastTime);
        lastTime = curTime;

        // figure out the transforms
        var eye = [0, 150, 300];
        var target = [0, 0, 0];
        var up = [0, 1, 0];
        var cameraM = m4.lookAt(eye, target, up);

        var viewM = twgl.m4.inverse(cameraM);
        viewM = m4.multiply(ab.getMatrix(), viewM);

        var fieldOfView = Math.PI / 4;
        var projectionM = m4.perspective(fieldOfView, 3, 10, 1000);

        // get lighting information
        var lightPosition = [-180, 200, -80]; // the position of a single light in world coordinate
        var lightDirection = v3.normalize(v3.subtract(lightPosition, target)); // now light direction is in world coordinate
        lightDirection = m4.transformPoint(viewM, lightDirection); // but we need light direction in camera coordinate,
        // as said in allObjects.js

        var lightViewM = m4.inverse(m4.lookAt(lightPosition, target, up));

        var lightProjectionM = m4.ortho(-200, 200, -200, 200, -200, 200);
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

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer); // draw to the framebuffer
        // first, let's clear the background
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        allObjects.forEach(function (object) {
            if(object.drawBefore)
                object.drawBefore(drawingState);
        });

        gl.bindFramebuffer(gl.FRAMEBUFFER, null); // return the frame buffer pointer to the system, now we can draw
        // on the screen
        // let's clear the screen as a whiteboard
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // bind shadow depth map texture to TMU0
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, framebuffer.texture);

        allObjects.forEach(function (object) {
            if(object.draw)
                object.draw(drawingState);
        });

        allObjects.forEach(function (object) {
            if(object.drawAfter)
                object.drawAfter(drawingState); // no drawAfter functions actually
        });
        
        window.requestAnimationFrame(draw);
    }
    draw();
}
window.onload = setup;