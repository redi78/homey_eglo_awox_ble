'use strict';

const BLE_SERVICES_GENERIC_ACCESS = '1800';
const BLE_CHARACTERISTICS_DEVICE_NAME = '0x09';
const BLE_CHARACTERISTICS_APPEARANCE = '2a01'; // noch nicht bearbeitet

const BLE_SERVICES_DEVICE_INFORMATION = '180a';
const BLE_CHARACTERISTICS_MODEL_NUMBER_STRING = '2a24';
const BLE_CHARACTERISTICS_FIRMWARE_REVISION_STRING = '2a26'; // noch nicht bearbeitet
const BLE_CHARACTERISTICS_HARDWARE_REVISION_STRING = '2a27';
const BLE_CHARACTERISTICS_MANUFACTURER_Name_STRING = '2a29'; // noch nicht bearbeitet

const Homey = require('homey');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class Eglo_Awox_SmartlightDriver extends Homey.Driver {

    onInit() {
        this.log('Eglo_Awox_SmartlightDriver has been inited');
    }

    async onPairListDevices(data) {
        try {
            this.log('Pair listing of devices started');
            const deviceList = await this.discoverLights();
            this.log('Pair listing of devices completed');
            return deviceList;
        } catch (error) {
            this.log('Error during pair listing of devices:', error);
            throw error;
        }
    }

    async discoverLights() {
        try {
            this.log('Device discovery started');
            // discover all peripherals that have AwoX Company Identifier (0x0160)
            const bleAdvertisements = await Homey.ManagerBLE.discover();

            const eglo_awox_Lights = [];

            for (let i = 0; i < bleAdvertisements.length; i++) {
                const manufacturerID = bleAdvertisements[i].manufacturerData.readInt16LE();
                this.log("Found a device with manufacturer ID:", manufacturerID);

                if (manufacturerID == 0x0160) {
                    this.log("Connecting to an Eglo_AwoX device...");
                    // Connect to the BLE device
                    const blePeripheral = await bleAdvertisements[i].connect();
                    this.log("Connected to an Eglo_AwoX device...");

                    await sleep(100);

                    // Discover everything after connecting to the BLE device
                    await blePeripheral.discoverAllServicesAndCharacteristics();
                    this.log("Discovered an Eglo_AwoX device...");

                    // Get device info
                    const device_name = await blePeripheral.read(BLE_SERVICES_GENERIC_ACCESS, BLE_CHARACTERISTICS_DEVICE_NAME);
                    const appearance = await blePeripheral.read(BLE_SERVICES_GENERIC_ACCESS, BLE_CHARACTERISTICS_APPEARANCE);
                    const model_number = await blePeripheral.read(BLE_SERVICES_DEVICE_INFORMATION, BLE_CHARACTERISTICS_MODEL_NUMBER_STRING);
                    const firmware_version = await blePeripheral.read(BLE_SERVICES_DEVICE_INFORMATION, BLE_CHARACTERISTICS_FIRMWARE_REVISION_STRING);
                    const hardware_revision = await blePeripheral.read(BLE_SERVICES_DEVICE_INFORMATION, BLE_CHARACTERISTICS_HARDWARE_REVISION_STRING);
                    const manufacturer_name = await blePeripheral.read(BLE_SERVICES_DEVICE_INFORMATION, BLE_CHARACTERISTICS_MANUFACTURER_Name_STRING);

                    // Convert Buffer to human-readable string
                    const deviceNameStr = device_name.toString('utf-8').replace(/\0/g, '');
                    const appearanceStr = appearance.toString('utf-8').replace(/\0/g, '');
                    const firmwareVersionStr = firmware_version.toString('utf-8').replace(/\0/g, '');
                    const manufacturerNameStr = manufacturer_name.toString('utf-8').replace(/\0/g, '');
                    const modelNumberStr = model_number.toString('utf-8').replace(/\0/g, '');
                    const hardwareRevisionStr = hardware_revision.toString('utf-8').replace(/\0/g, '');

                    const device = {
                        name: manufacturerNameStr + " " + deviceNameStr + " (" + bleAdvertisements[i].uuid + ")",
                        data: {
                            uuid: bleAdvertisements[i].uuid,
                            firmware_version: firmwareVersionStr,
                            manufacturer_name: manufacturerNameStr,
                            model_number: modelNumberStr,
                            hardware_revision: hardwareRevisionStr,
                        },
                    };
                    eglo_awox_Lights.push(device);

                    await blePeripheral.disconnect();
                }
            }
            return eglo_awox_Lights;
        } catch (error) {
            await blePeripheral.disconnect();
            throw error;
        }
    }

}

module.exports = Eglo_Awox_SmartlightDriver;
