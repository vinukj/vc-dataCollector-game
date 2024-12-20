// BLE Constants
const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

const bleButton = document.getElementById("ble-button");
const bleStatus = document.getElementById("ble-status");

let bluetoothDevice = null;
let characteristic = null;
// Buffer to accumulate incoming BLE data
let bleDataBuffer = "";

// Connect to BLE Device
async function connectToBLE() {
    try {
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            filters: [{ services: [SERVICE_UUID] }]
        });

        bleStatus.textContent = `Status: Connecting to ${bluetoothDevice.name}...`;
        const server = await bluetoothDevice.gatt.connect();
        const service = await server.getPrimaryService(SERVICE_UUID);
        characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

        await characteristic.startNotifications();
        characteristic.addEventListener("characteristicvaluechanged", handleBLEData);

        bleStatus.textContent = `Status: Connected to ${bluetoothDevice.name}`;
        bleButton.textContent = "Disconnect from BLE";

        console.log("BLE Connected and Subscribed.");
    } catch (error) {
        console.error("Connection failed:", error);
        bleStatus.textContent = "Status: Connection failed!";
    }
}

// Buffer to accumulate incoming BLE data


// Handle Incoming BLE Data
// Handle Incoming BLE Data
function handleBLEData(event) {
    const rawValue = event.target.value; // Get raw BLE data

    // Convert rawValue to a string explicitly
    let value = "";
    for (let i = 0; i < rawValue.byteLength; i++) {
        value += String.fromCharCode(rawValue.getUint8(i));
    }

    value = value.trim(); // Clean up whitespace
    console.log("Received BLE Data (Raw):", value);

    if (value === "start") {
      //  console.log("BLE Command Received: Start");
        document.dispatchEvent(new CustomEvent("BLEStartReceived"));
    } else {
        //console.log("Received Features String:", value);

        // Parse features into an array
        const features = value.split(",").map(parseFloat);
       // console.log("Parsed Features Array:", features);
    }
}

function processCompleteBLEData(data) {
    console.log("Received BLE Data:", data);

    // Example: Check for specific commands
    if (data === "start") {
        document.dispatchEvent(new CustomEvent("BLEStartReceived"));
    } else {
        // Process or display the complete features string
        console.log("Features Received:", data);
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