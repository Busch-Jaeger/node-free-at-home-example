import { FreeAtHome } from 'free-at-home';

import { MediaPlayerChannel } from 'free-at-home';

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

  const virtualMediaPlayer = await freeAtHome.createMediaPlayerDevice("123Media", "Virtual Media Player");
  virtualMediaPlayer.setAutoKeepAlive(true);
  // virtualMediaPlayer.isAutoConfirm = true;

  let volume = 0;

  virtualMediaPlayer.on("playModeChanged", (value: MediaPlayerChannel.PlayMode.playing | MediaPlayerChannel.PlayMode.paused) => {
    virtualMediaPlayer.setPlayMode(value);
    switch (value) {
      case MediaPlayerChannel.PlayMode.playing:
        virtualMediaPlayer.setTitle("Playing ...");
        break;
      case MediaPlayerChannel.PlayMode.paused:
        virtualMediaPlayer.setTitle("Paused ...");
        break;
    }
  });

  virtualMediaPlayer.on("playVolumeChanged", (value: number) => {
    volume = value;
    virtualMediaPlayer.setVolume(value);
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

//provide a RPC interface
//#################################################################################

import {RPC} from 'free-at-home';

const rpc = new RPC.RpcWebsocket(metaData.id);

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

rpc.addMethod("testCall", async (params: Partial<RPC.JSONRPCParams> | undefined) => {
  params?.toString();
  await sleep(100);
  return { data: "test" };
});

rpc.addMethod("upload", async (params: Partial<RPC.JSONRPCParams> | undefined) => {
  params?.toString();
  await sleep(100);
  RPC.UploadAuxiliaryDeviceData(metaData.id, "data blob");
  // return { data: "test" };
});

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