(function () {
'use strict';

var requestAnimationFrame = window.requestAnimationFrame ||
    window["mozRequestAnimationFrame"] ||
    window.webkitRequestAnimationFrame ||
    window["msRequestAnimationFrame"] ||
    (function (cb) { return window.setTimeout(cb, 1000 / 60); });

var flakes = [];
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var flakeCount = 400;
var mX = -100;
var mY = -100;
function resize() {
    canvas.width = canvas.scrollWidth;
    canvas.height = canvas.scrollHeight;
    flakeCount = Math.min(400, canvas.width / 5);
}
function snow() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (flakeCount > flakes.length) {
        for (var i = flakes.length; i < flakeCount; i++)
            flakes.push(create());
    }
    for (var i = 0; i < flakes.length; i++) {
        var flake = flakes[i], x = mX, y = mY, minDist = 150, x2 = flake.x, y2 = flake.y;
        var dist = Math.sqrt((x2 - x) * (x2 - x) + (y2 - y) * (y2 - y));
        if (dist < minDist) {
            var force = minDist / (dist * dist), xcomp = (x - x2) / dist, ycomp = (y - y2) / dist, deltaV = force / 2;
            flake.velX -= deltaV * xcomp;
            flake.velY -= deltaV * ycomp;
        }
        else {
            flake.velX *= 0.98;
            if (flake.velY <= flake.speed) {
                flake.velY = flake.speed;
            }
            flake.velX += Math.cos((flake.step += 0.05)) * flake.stepSize;
        }
        ctx.fillStyle = "rgba(255,255,255," + flake.opacity + ")";
        flake.y += flake.velY;
        flake.x += flake.velX;
        if (flake.y >= canvas.height || flake.y <= 0) {
            if (reset(flake) === false) {
                flakes.splice(i--, 1);
                continue;
            }
        }
        if (flake.x >= canvas.width || flake.x <= 0) {
            if (reset(flake) === false) {
                flakes.splice(i--, 1);
                continue;
            }
        }
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
        ctx.fill();
    }
    requestAnimationFrame(snow);
}
function reset(flake) {
    if (flakeCount < flakes.length) {
        return false;
    }
    flake.x = Math.floor(Math.random() * canvas.width);
    flake.y = 0;
    flake.size = Math.random() * 3 + 2;
    flake.speed = Math.random() * 1 + 0.5;
    flake.velY = flake.speed;
    flake.velX = 0;
    flake.opacity = Math.random() * 0.5 + 0.3;
    return true;
}
function create() {
    var x = Math.floor(Math.random() * canvas.width), y = Math.floor(Math.random() * canvas.height), size = Math.random() * 3 + 2, speed = Math.random() * 1 + 0.5, opacity = Math.random() * 0.5 + 0.3;
    return {
        speed: speed,
        velY: speed,
        velX: 0,
        x: x,
        y: y,
        size: size,
        stepSize: Math.random() / 30,
        step: 0,
        opacity: opacity
    };
}
function init() {
    flakeCount = canvas.width / 5;
    for (var i = 0; i < flakeCount; i++) {
        flakes.push(create());
    }
    snow();
}
var splash = document.querySelector(".splash");
if (splash) {
    splash.addEventListener("mousemove", function (e) {
        mX = e.clientX, mY = e.clientY;
    });
}
document.addEventListener("DOMContentLoaded", function () {
    window.addEventListener("resize", resize);
    resize();
    init();
});

}());
//# sourceMappingURL=canvas.js.map
