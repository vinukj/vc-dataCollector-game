// Container setup
const container = document.getElementById("game-container");

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// Create pitch
const pitchGeometry = new THREE.BoxGeometry(3, 0.1, 15);
const pitchMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const pitch = new THREE.Mesh(pitchGeometry, pitchMaterial);
pitch.position.y = -0.5;
scene.add(pitch);

// Create stumps
function createStumps(positionZ) {
    const stumpGroup = new THREE.Group();
    const stumpMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    for (let i = -0.2; i <= 0.2; i += 0.2) {
        const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 16), stumpMaterial);
        stump.position.set(i, 0, positionZ);
        stumpGroup.add(stump);
    }
    return stumpGroup;
}

const bowlingStumps = createStumps(-7);
const battingStumps = createStumps(7);
scene.add(bowlingStumps);
scene.add(battingStumps);

// Bowler (stick figure)
const bowlerGroup = new THREE.Group();
const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });

// Head
const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), bodyMaterial);
head.position.set(0, 1.2, -10);
bowlerGroup.add(head);

// Body
const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1, 16), bodyMaterial);
body.position.set(0, 0.6, -10);
bowlerGroup.add(body);

// Arms (holds the ball)
const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.1), bodyMaterial);
arm.position.set(0.4, 1.0, -10);
bowlerGroup.add(arm);

// Ball in the bowler's hand
const ballGeometry = new THREE.SphereGeometry(0.2, 32, 32);
const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.set(0.6, 1.0, -10); // Positioned in bowler's hand
bowlerGroup.add(ball);

scene.add(bowlerGroup);


// Ball and motion state variables
let ballPosition, velocity, bowlerPositionZ;
let isBallReleased, hasBounced, isAnimationStarted, hasReachedWicket;

// Time tracking variables
let startTime, bounceTime, wicketTime;

// Function to reset animation state
function resetAnimationState() {
    ballPosition = { x: 0.6, y: 1.0, z: -10 }; // Ball starts in bowler's hand
    velocity = { x: 0, y: 0.05, z: 0.15 };     // Initial velocity of ball
    bowlerPositionZ = -12;                     // Reset bowler starting position
    isBallReleased = false;
    hasBounced = false;
    isAnimationStarted = true;
    hasReachedWicket = false;

    // Reset ball and bowler position
    ball.position.set(ballPosition.x, ballPosition.y, ballPosition.z);
    bowlerGroup.position.z = bowlerPositionZ;

    console.log("Animation state reset. Starting...");
}


// Camera position
camera.position.set(0, 2, 10);
camera.lookAt(0, 0, 0);


// Event listener for BLE trigger
document.addEventListener("BLEStartReceived", () => {
    console.log("BLE Command Received: Starting bowler animation");
    resetAnimationState(); // Reset the state when 'start' command is received
    startTime = performance.now();
});

// Animate the bowler and ball
function animate() {
    requestAnimationFrame(animate);

    if (isAnimationStarted) {
        // Bowler run-up
        if (bowlerPositionZ < -7) {
            bowlerPositionZ += 0.05; // Move bowler towards the stump
            bowlerGroup.position.z = bowlerPositionZ;

            // Move ball with bowler until release
            if (!isBallReleased) {
                ballPosition.z = bowlerPositionZ;
                ball.position.set(ballPosition.x, ballPosition.y, ballPosition.z);
            }
        } else if (!isBallReleased) {
            // Release the ball when the bowler reaches the stump
            isBallReleased = true;
            // bowlerGroup.remove(ball); // Remove ball from bowler's hand
            // scene.add(ball);          // Add ball to the scene independently
            console.log("Ball Released!");
        }

        // Ball motion after release
        if (isBallReleased) {
            velocity.y += -0.004; // Apply gravity
            ballPosition.y += velocity.y; // Vertical movement
            ballPosition.z += velocity.z; // Forward movement

            // Bounce logic
            if (ballPosition.y <= 0.2 && !hasBounced) {
                bounceTime = performance.now();
                hasBounced = true;
                velocity.y = 0.08; // Ball bounces upward
                bounceTime = performance.now();
                console.log(`Ball Bounced! Time to Bounce: ${(bounceTime - startTime).toFixed(2)} ms`);
            }

            // Stop ball near batting stumps
            if (ballPosition.z >= 6.8 && !hasReachedWicket) {
                velocity.z = 0;
                velocity.y = 0;
                ballPosition.y = 0.2; // Ensure ball is at ground level
                wicketTime = performance.now();
                isAnimationStarted = false; // Stop animation
                hasReachedWicket = true; // Prevent further logs
                console.log(`Ball Reached Wicket Proximity! Time to Wicket: ${(wicketTime - startTime).toFixed(2)} ms`);
            }

            ball.position.set(ballPosition.x, ballPosition.y, ballPosition.z);
        }
    }

    renderer.render(scene, camera);
}

// Responsive handling
window.addEventListener("resize", () => {
    renderer.setSize(container.clientWidth, container.clientHeight);
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
});

animate();