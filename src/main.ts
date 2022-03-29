import { FreeAtHome } from 'free-at-home';

const freeAtHome = new FreeAtHome();

async function main() {
  const virtualSwitch = await freeAtHome.createSwitchingActuatorDevice("123switch", "Virtual Switch");
  virtualSwitch.setAutoKeepAlive(true);
  virtualSwitch.isAutoConfirm = true;
  virtualSwitch.on('isOnChanged', (value: boolean) => {
    console.log("switch state is:", (value) ? "on" : "off");
  });

  const virtualDimming = await freeAtHome.createDimActuatorDevice("123Dim", "Virtual Dimming");
  virtualDimming.setAutoKeepAlive(true);
  virtualDimming.isAutoConfirm = true;
  virtualDimming.on('isOnChanged', (value: boolean) => {
    console.log("dimming state is:", (value) ? "on" : "off");
  });
  virtualDimming.on("absoluteValueChanged", (value: number) => {
    console.log("dimming value is:", value );
  });
}

main();

// Get notified about changes in the configuration of the add on
//#################################################################################

import {ScriptingHost} from 'free-at-home';
import {ScriptingAPI as API} from 'free-at-home'

const metaData = ScriptingHost.readMetaData();

const scriptingHost = new ScriptingHost.ScriptingHost(metaData.id);

scriptingHost.on("configurationChanged", (configuration: API.Configuration) => {
  console.log(configuration);
});

scriptingHost.connectToConfiguration();


// Signal handling for a smooth shutdown of an add on
//#################################################################################

if (process.platform === "win32") {
  const rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on("SIGINT", function () {
    process.emit("SIGINT" as any);
  });
}

process.on('SIGINT', async () => {
  console.log("SIGINT received, cleaning up...")
  await freeAtHome.markAllDevicesAsUnresponsive();
  console.log("clean up finished, exiting procces")
  process.exit();
});
process.on('SIGTERM', async () => {
  console.log("SIGTERM received, cleaning up...")
  await freeAtHome.markAllDevicesAsUnresponsive();
  console.log("clean up finished, exiting procces")
  process.exit();
});