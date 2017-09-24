const CTXT = document.getElementById("canvas").getContext("2d");
const container = document.getElementById("canvasContainer");

const CANVAS_WIDTH = container.offsetWidth;
const CANVAS_HEIGHT = container.offsetHeight * 0.72;
CTXT.canvas.width = CANVAS_WIDTH;
CTXT.canvas.height = CANVAS_HEIGHT;

const BASE_SCREEN_WIDTH = 1920; //screen width in px the target design was for

//minimum space in px between the center of 2 stars
const LARGE_STAR_SPACING = 100 * (CANVAS_WIDTH/BASE_SCREEN_WIDTH);
const MEDIUM_STAR_SPACING = 75 * (CANVAS_WIDTH/BASE_SCREEN_WIDTH);
const SMALL_STAR_SPACING = 50 * (CANVAS_WIDTH/BASE_SCREEN_WIDTH);

const LARGE_STARS_PER_MEGAPIXEL = 19.814;
const MEDIUM_STARS_PER_MEGAPIXEL = 22.644;
const SMALL_STARS_PER_MEGAPIXEL = 35;

const CANVAS_MEGAPIXELS = CANVAS_WIDTH*CANVAS_HEIGHT / 1000000;

const STAR_COLOR = "184, 184, 230"; //color in rgb
const CONSTELLATION_COLOR = "rgba(150, 46, 230, 0.5)";
const NUM_STARS_IN_STEM = 3;

let starParallaxOffsetX = 0;
let easeStarXFunction = null;
let lastFrameTime = 0;

let largeStars = [];
let smallStars = [];
let mediumStars = [];
let constellationStars = [];

window.onload = function setup() {
    generateStars();
    window.requestAnimationFrame(drawStars);
}

function moveStarsWhenLinkClicked(linkNum) {
    offsetStarParallaxX(linkNum * CANVAS_WIDTH * 2);
}

function generateStars() {
    generateLargeStars();
    generateMediumStars();
    generateSmallStars();
    getConstellationStars();
}

function generateLargeStars() {
    const NUM_largeStars = LARGE_STARS_PER_MEGAPIXEL * CANVAS_MEGAPIXELS;
    const LARGE_STAR_RADIUS = 7.5;
    const MIN_PARALLAX = 0.4;
    const MAX_PARALLAX = 0.7;
    const MAX_DEPTH = 0.4;

    largeStars = generateStarArray(NUM_largeStars, LARGE_STAR_RADIUS, MIN_PARALLAX, MAX_PARALLAX, LARGE_STAR_SPACING, MAX_DEPTH);
}

function generateMediumStars() {
    const NUM_mediumStars = MEDIUM_STARS_PER_MEGAPIXEL * CANVAS_MEGAPIXELS;
    const MEDIUM_STAR_RADIUS = 5;
    const MIN_PARALLAX = 0.1;
    const MAX_PARALLAX = 0.3;
    const MAX_DEPTH = 0.55;

    mediumStars = generateStarArray(NUM_mediumStars, MEDIUM_STAR_RADIUS, MIN_PARALLAX, MAX_PARALLAX, MEDIUM_STAR_SPACING, MAX_DEPTH);
}

function generateSmallStars() {
    const NUM_smallStars = SMALL_STARS_PER_MEGAPIXEL * CANVAS_MEGAPIXELS;
    const SMALL_STAR_RADIUS = 2.5;
    const MIN_PARALLAX = 0;
    const MAX_PARALLAX = 0;
    const MAX_DEPTH = 0.72;

    smallStars = generateStarArray(NUM_smallStars, SMALL_STAR_RADIUS, MIN_PARALLAX, MAX_PARALLAX, SMALL_STAR_SPACING, MAX_DEPTH);
}

//lot of input parameters; should probably try and find a way to cut that down/split this methd up
function generateStarArray(numStars, radius, minParallax, maxParallax, minSpacing, maxYDepthPercent) {
    const stars = [];
    for (let i = 0; i < numStars; i++) {
        let star = new Star( Math.random() * CANVAS_WIDTH, 
                Math.random() * container.offsetHeight * maxYDepthPercent,
                radius,
                minParallax + (maxParallax - minParallax) * Math.random());

        let isFarEnoughAwayFromOtherStars = true;
        for (let j = stars.length - 1; j >= 0; j--) {
            if (dist( star.baseX, star.baseY, stars[j].baseX, stars[j].baseY ) 
                    < minSpacing) {
                isFarEnoughAwayFromOtherStars = false;
                j = -1; //forces early exit
            }
        }

        if (isFarEnoughAwayFromOtherStars) {
            stars.push(star);
        }
    }
    return stars;
}

function Star(x, y, radius, parallaxAmt) {
    this.baseX = x;
    this.baseY = y;
    this.radius = radius;
    this.parallaxAmt = parallaxAmt;

    this.getX = function getX() {
        const scrollAmtX = window.scrollX + starParallaxOffsetX;
        const currentX = this.baseX * (1 - this.parallaxAmt * scrollAmtX / window.innerWidth);
        return currentX;
    };
    this.getY = function getY() {
        const scrollAmtY = window.scrollY;
        const currentY = this.baseY * (1 - this.parallaxAmt * scrollAmtY / window.innerHeight);
        return currentY;
    };
}

function getConstellationStars() {
    const FIRST_STAR_X = 100 * ((CANVAS_WIDTH > BASE_SCREEN_WIDTH) ? CANVAS_WIDTH/BASE_SCREEN_WIDTH : 1);
    const FIRST_STAR_Y = container.offsetHeight * 0.239;
    
    const ALL_STARS = largeStars.concat(mediumStars).concat(smallStars);

    //gets the 1st star and stars making up the "stem" of the constellation
    constellationStars[0] = getFirstStar(FIRST_STAR_X, FIRST_STAR_Y);
    for (let i = 1; i < NUM_STARS_IN_STEM; i++) {
        constellationStars[i] = getClosestStarInArray(constellationStars[i-1].baseX, constellationStars[i-1].baseY, ALL_STARS, true);
    }

    //gets the two vertices of the triangle, one above and one below 
    constellationStars[NUM_STARS_IN_STEM] = getClosestStarInArray(constellationStars[NUM_STARS_IN_STEM - 1].baseX, constellationStars[NUM_STARS_IN_STEM - 1].baseY, ALL_STARS, true, false, true);

    constellationStars[NUM_STARS_IN_STEM + 1] = getClosestStarInArray(constellationStars[NUM_STARS_IN_STEM - 1].baseX, constellationStars[2].baseY, ALL_STARS, true, true, false);
}

//gets star closest to target
function getFirstStar(targetX, targetY) {
    let closestStarCandidates = [];

    closestStarCandidates.push(getClosestStarInArray(targetX, targetY, largeStars));
    closestStarCandidates.push(getClosestStarInArray(targetX, targetY, mediumStars));
    closestStarCandidates.push(getClosestStarInArray(targetX, targetY, smallStars));
    
    return getClosestStarInArray(targetX, targetY, closestStarCandidates);
}

//needs refactoring due to large # of arguments; probably break into a couple methods for if right/higher/lower
function getClosestStarInArray(targetX, targetY, starArray, mustBeToRight, mustBeHigher, mustBeLower) {
    let minDist = Number.POSITIVE_INFINITY;
    let closestStar = starArray[Math.floor(Math.random() * starArray.length)];
    for (let i = 0, len = starArray.length; i < len; i++) {
        const ignoreStar = (mustBeToRight && targetX >= starArray[i].baseX)
                || (mustBeHigher && targetY <= starArray[i].baseY)
                || (mustBeLower && targetY >= starArray[i].baseY);
        if (!ignoreStar) {
            const distance = dist(targetX, targetY, starArray[i].baseX, starArray[i].baseY);
            if (distance < minDist) {
                minDist = distance;
                closestStar = starArray[i];
            }
        }
    }
    return closestStar;
}

function dist(x1, y1, x2, y2) {
    return Math.sqrt( (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2) );
}

function drawStars(currentTime) {
    CTXT.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (easeStarXFunction) { easeStarXFunction(currentTime - lastFrameTime) };
    drawConstellationLines();
    
    drawStarArray(largeStars);
    drawStarArray(mediumStars);
    drawStarArray(smallStars);

    lastFrameTime = currentTime;
    window.requestAnimationFrame(drawStars);
}

function drawStarArray(starArray) {
    for (let i = starArray.length - 1; i >= 0; i--) {
        drawStar(starArray[i]);
    }
}

function drawStar(star) {
    CTXT.fillStyle = `rgba(${STAR_COLOR}, ${starOpacity(star.getY())} )`;
    drawCircle( wrapXCoord(star.getX()), star.getY(), star.radius );
}

function starOpacity(starY) {
    const MIN_OPACITY = 0.2;
    const START_OPACITY_DROP = container.offsetHeight * 0.4;
    const END_OPACITY_DROP = CANVAS_HEIGHT;
    
    return (starY < START_OPACITY_DROP) ? 1 : 1 - (1-MIN_OPACITY) * (starY - START_OPACITY_DROP) / (END_OPACITY_DROP - START_OPACITY_DROP);
} 

function drawCircle(x, y, radius) {
    CTXT.beginPath();
    CTXT.arc(x - radius/2, y - radius/2, radius, 0, Math.PI * 2)
    CTXT.fill();
}

function wrapXCoord(xCoord, maxOffsetFromScreen) {
    return xCoord % window.innerWidth + ((xCoord < 0) ? window.innerWidth : 0);
}

function offsetStarParallaxX(newOffsetAmt) {
    const DURATION = 1000;
    const newStarOffsetX = easeOutValue(starParallaxOffsetX, newOffsetAmt, DURATION);
    const isInitialDeltaNegative = (newOffsetAmt - starParallaxOffsetX) < 0;
    easeStarXFunction = function (msSinceLastCalled) {
        const newOffset = newStarOffsetX(msSinceLastCalled);
        const delta = newOffset - starParallaxOffsetX;
        const directionHasChanged = (isInitialDeltaNegative) 
                ? (delta) > 0
                : (delta) < 0

        if (Math.abs(delta) < 1 || directionHasChanged) {
            easeStarXFunction = null;
        } else {
            starParallaxOffsetX = newOffset;
        }
    };
}

function easeOutValue(startValue, endValue, durationInMilliseconds) {
    let currentTime = 0;
    return function getCurrentValue(timeSinceLastCalled) {
        currentTime += timeSinceLastCalled;
        return quadraticEaseOut(currentTime, startValue, endValue,
             durationInMilliseconds);
    };
}

//more of a utility function; better place to put it?
function quadraticEaseOut(timeSinceStart, startValue, endValue, duration) {
    const percentDone = timeSinceStart / duration;
    const targetValueChange = endValue - startValue;

    return -targetValueChange * percentDone * (percentDone-2) + startValue;
}

function drawConstellationLines() {
    CTXT.strokeStyle = CONSTELLATION_COLOR;
    CTXT.lineWidth = 5;
    CTXT.lineCap = "round";
    for (let i = 1, len = NUM_STARS_IN_STEM; i < len; i++) {
        drawConstellationLine(i-1, i);
    }

    //draws the triangle
    drawConstellationLine(NUM_STARS_IN_STEM - 1, NUM_STARS_IN_STEM);
    drawConstellationLine(NUM_STARS_IN_STEM - 1, NUM_STARS_IN_STEM + 1);
    drawConstellationLine(NUM_STARS_IN_STEM, NUM_STARS_IN_STEM + 1);
}

function drawConstellationLine(startStarIndex, endStarIndex) {
    const LINE_SPACING_OFF_STAR = 10;
    const MIN_LINE_SIZE = 25;

    const startStar = constellationStars[startStarIndex];
    const endStar = constellationStars[endStarIndex];

    const vectorToNextStar = { 
        x: endStar.getX() - startStar.getX(),
        y: endStar.getY() - startStar.getY()
    };
    const magnitude = dist(vectorToNextStar.x, vectorToNextStar.y, 0, 0);

    if (true || magnitude > MIN_LINE_SIZE) {
        vectorToNextStar.x /= magnitude;
        vectorToNextStar.y /= magnitude;

        const startSpace = LINE_SPACING_OFF_STAR + startStar.radius;
        const endSpace = LINE_SPACING_OFF_STAR + endStar.radius;

        CTXT.beginPath();
        CTXT.moveTo(startStar.getX() + vectorToNextStar.x * startSpace,
                startStar.getY() + vectorToNextStar.y * startSpace);
        CTXT.lineTo(endStar.getX() - vectorToNextStar.x * endSpace,
                endStar.getY() - vectorToNextStar.y * endSpace);
        CTXT.stroke();
    }
}