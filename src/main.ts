import { FreeAtHome } from '@busch-jaeger/free-at-home';

const freeAtHome = new FreeAtHome();
freeAtHome.activateSignalHandling();

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

import {AddOn} from '@busch-jaeger/free-at-home';

const metaData = AddOn.readMetaData();

const addOn = new AddOn.AddOn(metaData.id);

addOn.on("configurationChanged", (configuration: AddOn.Configuration) => {
  console.log(configuration);
});

addOn.connectToConfiguration();
