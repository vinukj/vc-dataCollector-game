import { processFeatureData } from './datapi.js'; // Ensure correct import

// BLE Constants
const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

const bleButton = document.getElementById("ble-button");
const bleStatus = document.getElementById("ble-status");
const playerNameInput = document.getElementById("player-name");
const shotNameInput = document.getElementById("shot-name");

let bluetoothDevice = null;
let characteristic = null;

// Feature Headers
const featureHeaders = [
    "AccelX_Mean", "AccelX_StdDev", "AccelX_Variance",
    "AccelY_Mean", "AccelY_StdDev", "AccelY_Variance",
    "AccelZ_Mean", "AccelZ_StdDev", "AccelZ_Variance",
    "GyroX_Mean", "GyroX_StdDev", "GyroX_Variance",
    "LA_X_Mean", "LA_X_StdDev", "LA_X_Variance"
];

// Connect to BLE Device
// Connect to BLE Device
async function connectToBLE() {
    try {
        // Check if the device is already connected
        if (bluetoothDevice && bluetoothDevice.gatt && bluetoothDevice.gatt.connected) {
            bleStatus.textContent = `Status: Already connected to ${bluetoothDevice.name}`;
            console.log(`Already connected to ${bluetoothDevice.name}`);
            return;
        }

        // Request a BLE device
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            filters: [{ services: [SERVICE_UUID] }]
        });

        bleStatus.textContent = `Status: Connecting to ${bluetoothDevice.name}...`;
        console.log(`Connecting to ${bluetoothDevice.name}...`);

        // Connect to GATT server
        const server = await bluetoothDevice.gatt.connect();
        console.log("GATT server connected.");

        // Get the primary service
        const service = await server.getPrimaryService(SERVICE_UUID);

        // Get the characteristic
        characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

        // Start notifications
        await characteristic.startNotifications();
        characteristic.addEventListener("characteristicvaluechanged", handleBLEData);

        // Update UI
        bleStatus.textContent = `Status: Connected to ${bluetoothDevice.name}`;
        bleButton.textContent = "Disconnect from BLE";
        console.log("BLE Connected and Subscribed.");
    } catch (error) {
        console.error("Connection failed:", error);
        bleStatus.textContent = "Status: Connection failed!";
    }
}
// Handle Incoming BLE Data
function handleBLEData(event) {
    const rawValue = event.target.value;

    let value = "";
    for (let i = 0; i < rawValue.byteLength; i++) {
        value += String.fromCharCode(rawValue.getUint8(i));
    }

    value = value.trim();
    console.log("Received BLE Data (Raw):", value);

    if (value === "start") {
        document.dispatchEvent(new CustomEvent("BLEStartReceived"));
    } else {
        // Call processFeatureData in datapi.js
        if (typeof processFeatureData === "function") {
            processFeatureData(value);
        } else {
            console.error("processFeatureData function is not defined!");
        }
    }
}

// Disconnect BLE Device
function disconnectBLE() {
    if (bluetoothDevice && bluetoothDevice.gatt.connected) {
        bluetoothDevice.gatt.disconnect();
        bleStatus.textContent = "Status: Disconnected";
        bleButton.textContent = "Connect to BLE";
        console.log("BLE Disconnected.");
    }
}

bleButton.addEventListener("click", () => {
    if (!bluetoothDevice || !bluetoothDevice.gatt.connected) {
        connectToBLE();
    } else {
        disconnectBLE();
    }
});