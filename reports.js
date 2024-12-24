import { SUPABASE_URL, API_KEY, TABLE_NAME } from "./config.js";

// HTML Elements
const reportContainer = document.getElementById("report-container");
const downloadCsvBtn = document.getElementById("download-csv");
const shotCountBtn = document.getElementById("get-shot-count");
const playerShotsBtn = document.getElementById("get-player-shots");

const reportTitle = document.getElementById("report-title");
const tableHead = document.getElementById("table-head");
const tableBody = document.getElementById("table-body");
const reportTable = document.getElementById("report-table");

// Fetch all data from Supabase
async function fetchAllData() {
    const pageSize = 1000; // Number of rows to fetch per request
    let offset = 0; // Starting offset
    let allData = []; // To store all rows

    while (true) {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=*&offset=${offset}&limit=${pageSize}`,
            {
                headers: {
                    apikey: API_KEY,
                    Authorization: `Bearer ${API_KEY}`,
                },
            }
        );

        if (!response.ok) throw new Error("Failed to fetch data from Supabase");

        const data = await response.json();

        // Break if no more rows are returned
        if (data.length === 0) break;

        // Append fetched rows to the result array
        allData = allData.concat(data);

        // Increase offset for the next batch
        offset += pageSize;

        console.log(`Fetched ${data.length} rows, Total: ${allData.length}`);
    }

    console.log(`Fetched a total of ${allData.length} rows from Supabase.`);
    return allData;
}
// Function to convert JSON to CSV
function jsonToCSV(data) {
    const headers = [
        "shot_name", "AccelX_Mean", "AccelX_StdDev", "AccelX_Variance",
        "AccelY_Mean", "AccelY_StdDev", "AccelY_Variance",
        "AccelZ_Mean", "AccelZ_StdDev", "AccelZ_Variance",
        "GyroX_Mean", "GyroX_StdDev", "GyroX_Variance",
        "LA_X_Mean", "LA_X_StdDev", "LA_X_Variance"
    ];

    const rows = data.map(row => {
        const features = row.features || {}; // Handle missing 'features' field
        return [
            row.shot_name || "N/A",
            features.AccelX_Mean || "", features.AccelX_StdDev || "", features.AccelX_Variance || "",
            features.AccelY_Mean || "", features.AccelY_StdDev || "", features.AccelY_Variance || "",
            features.AccelZ_Mean || "", features.AccelZ_StdDev || "", features.AccelZ_Variance || "",
            features.GyroX_Mean || "", features.GyroX_StdDev || "", features.GyroX_Variance || "",
            features.LA_X_Mean || "", features.LA_X_StdDev || "", features.LA_X_Variance || ""
        ].join(",");
    });

    rows.unshift(headers.join(",")); // Add headers as the first row
    return rows.join("\n");
}

// Download Entire Data as CSV
async function downloadCSV() {
    try {
        const data = await fetchAllData();
        const csvContent = jsonToCSV(data);

        // Trigger download
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = "shot_data.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        console.log("CSV downloaded successfully.");
    } catch (error) {
        console.error("Error downloading CSV:", error.message);
    }
}

// Shots Per Shot Type
async function getShotCount() {
    try {
        const data = await fetchAllData();
        const shotCounts = {};
        let totalShots = 0;

        // Count shots per type
        data.forEach(row => {
            const shotName = row.shot_name;
            shotCounts[shotName] = (shotCounts[shotName] || 0) + 1;
            totalShots++;
        });

        reportTitle.textContent = "Shots Per Shot Type";
        const headers = ["Shot Name", "Count"];
        const rows = Object.entries(shotCounts);

        // Add total row
        rows.push(["Total", totalShots]);
        generateTable(headers, rows);
    } catch (error) {
        console.error("Error fetching shot count:", error.message);
    }
}

// Shots Per Player
async function getPlayerShots() {
    try {
        const data = await fetchAllData();
        const playerCounts = {};
        const shotTypes = new Set();

        // Count shots per player and shot type
        data.forEach(row => {
            const playerName = row.player_name;
            const shotName = row.shot_name;
            shotTypes.add(shotName);

            if (!playerCounts[playerName]) playerCounts[playerName] = {};
            playerCounts[playerName][shotName] = (playerCounts[playerName][shotName] || 0) + 1;
        });

        // Generate table rows
        const headers = ["Player Name", ...Array.from(shotTypes), "Total"];
        const rows = [];
        const totals = {};

        Object.entries(playerCounts).forEach(([player, shots]) => {
            let playerTotal = 0;
            const row = [player];

            Array.from(shotTypes).forEach(shot => {
                const count = shots[shot] || 0;
                row.push(count);
                playerTotal += count;

                // Add to column totals
                totals[shot] = (totals[shot] || 0) + count;
            });

            row.push(playerTotal); // Add total for this player
            rows.push(row);
        });

        // Add totals row
        const totalsRow = ["Total"];
        let grandTotal = 0;

        Array.from(shotTypes).forEach(shot => {
            const count = totals[shot] || 0;
            totalsRow.push(count);
            grandTotal += count;
        });

        totalsRow.push(grandTotal);
        rows.push(totalsRow);

        reportTitle.textContent = "Shots Per Player";
        generateTable(headers, rows);
    } catch (error) {
        console.error("Error fetching player shots:", error.message);
    }
}

// Function to generate a table
function generateTable(headers, rows) {
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    // Populate headers
    const headRow = document.createElement("tr");
    headers.forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;
        headRow.appendChild(th);
    });
    tableHead.appendChild(headRow);

    // Populate rows
    rows.forEach(row => {
        const tr = document.createElement("tr");
        row.forEach(cell => {
            const td = document.createElement("td");
            td.textContent = cell;
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });

    reportTable.classList.remove("hidden");
}

// Event Listeners
downloadCsvBtn.addEventListener("click", downloadCSV);
shotCountBtn.addEventListener("click", getShotCount);
playerShotsBtn.addEventListener("click", getPlayerShots);