const gameContainer = document.getElementById("game-container");
const gifAnimation = document.createElement("img");

// Static Image and GIF File Paths
const staticImagePath = "./animation_static.png";
const gifPath = "./animation.gif";

// Setup GIF Animation
gifAnimation.id = "gif-animation";
gifAnimation.src = staticImagePath; // Start with static image
gifAnimation.alt = "GIF Animation";
gifAnimation.style.display = "block"; // Initially show the static image
gifAnimation.style.maxWidth = "100%";
gifAnimation.style.maxHeight = "100%";
gifAnimation.style.objectFit = "contain";

// Append to Game Container
gameContainer.innerHTML = ""; // Clear any existing content
gameContainer.appendChild(gifAnimation);

const gifDuration = 5000; // Duration in milliseconds for one GIF loop
let isPlaying = false;
let gifTimeout;

// Function to Play the GIF
function playGIF() {
    if (isPlaying) return; // Prevent multiple triggers

    console.log("Starting GIF...");
    isPlaying = true;

    // Clear any existing status message
    clearStatusMessage();

    // Force reload GIF to ensure it restarts
    gifAnimation.src = `${gifPath}?t=${Date.now()}`;
    gifAnimation.style.display = "block";

    // Stop GIF after its duration
    gifTimeout = setTimeout(() => {
        stopGIF();
    }, gifDuration);
}

// Function to Stop the GIF
function stopGIF() {
    console.log("Stopping GIF...");
    gifAnimation.src = staticImagePath; // Revert to static image
    isPlaying = false;
    clearTimeout(gifTimeout);
}

// Function to display a status message
export function showStatusMessage(message, color = "black") {
    const messageElement = document.getElementById("status-message");
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.color = color;
        messageElement.style.visibility = "visible";
    }
}

// Function to clear the status message
export function clearStatusMessage() {
    const messageElement = document.getElementById("status-message");
    if (messageElement) {
        messageElement.textContent = "";
        messageElement.style.visibility = "hidden";
    }
}

// BLE Start Event Listener
document.addEventListener("BLEStartReceived", () => {
    console.log("BLE Command Received: Starting GIF animation");
    playGIF();
});

// Preload GIF and Static Image to reduce load time
const preloadStaticImage = new Image();
preloadStaticImage.src = staticImagePath;

const preloadGIF = new Image();
preloadGIF.src = gifPath;

console.log("Static Image and GIF Preloaded.");