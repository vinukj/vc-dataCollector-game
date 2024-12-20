import { SUPABASE_URL, API_KEY, TABLE_NAME } from "./config.js";
import { showStatusMessage, clearStatusMessage } from "./scriptvid.js";

// Process Features and Construct JSON
export function processFeatureData(data) {
    console.log("Processing Feature Data:", data);

    const featureHeaders = [
        "AccelX_Mean", "AccelX_StdDev", "AccelX_Variance",
        "AccelY_Mean", "AccelY_StdDev", "AccelY_Variance",
        "AccelZ_Mean", "AccelZ_StdDev", "AccelZ_Variance",
        "GyroX_Mean", "GyroX_StdDev", "GyroX_Variance",
        "LA_X_Mean", "LA_X_StdDev", "LA_X_Variance"
    ];

    const features = data.split(",").map(parseFloat).filter(num => !isNaN(num));

    if (features.length !== featureHeaders.length) {
        console.warn("Feature data length mismatch or invalid format. Ignoring data.");
        return;
    }

    const jsonData = {
        player_name: document.getElementById("player-name").value || "Unknown Player",
        shot_name: document.getElementById("shot-name").value || "Unknown Shot",
        features: {}
    };

    for (let i = 0; i < featureHeaders.length; i++) {
        jsonData.features[featureHeaders[i]] = features[i];
    }

    console.log("Constructed JSON:", JSON.stringify(jsonData, null, 2));

    // Call postFeatureData to send data to Supabase
    postFeatureData(jsonData);
}

// Post Feature Data to Supabase
async function postFeatureData(jsonData) {
    console.log("Sending data to Supabase...");

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": API_KEY,
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify(jsonData)
        });

        if (!response.ok) {
            const errorText = await response.text(); // Capture error details
            throw new Error(`Supabase API Error: ${errorText}`);
        }

        // Handle cases with no response body
        let result = null;
        const contentLength = response.headers.get("Content-Length");
        if (contentLength && parseInt(contentLength) > 0) {
            result = await response.json(); // Parse response only if content exists
        } else {
            result = { message: "No response body. Data insertion likely succeeded." };
        }

        console.log("Data successfully pushed to Supabase:", result);

        // Display success message
        showStatusMessage("Shot recorded", "green");
    } catch (error) {
        console.error("Error sending data to Supabase:", error.message);

        // Optionally, you can show an error message on failure
        showStatusMessage("Failed to record shot. Please try again.", "red");
    }
}

// Fetch all data from Supabase
export async function fetchAllData() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}`, {
        headers: {
            "apikey": API_KEY,
            "Authorization": `Bearer ${API_KEY}`
        }
    });

    if (!response.ok) throw new Error("Failed to fetch data from Supabase");
    return await response.json();
}