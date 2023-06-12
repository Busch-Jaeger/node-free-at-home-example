import { FreeAtHome } from '@busch-jaeger/free-at-home';
import { AddOn } from '@busch-jaeger/free-at-home';
import { SplitUnitChannel } from '@busch-jaeger/free-at-home/lib/virtualChannels/splitUnitChannel';
import { DaikinAC, DaikinDiscovery, ModelInfoResponse, ControlInfo, Mode } from "daikin-controller"

const metaData = AddOn.readMetaData();
const addOn = new AddOn.AddOn(metaData.id);
addOn.connectToConfiguration();
addOn.on("configurationChanged", async (configuration: AddOn.Configuration) => {
  if(configuration["default"].items !== undefined) {
    const units: string = configuration["default"].items["units"];
    if(units) {
      for(const address of units.split(",").filter(a => a)) {
        void tryAddUnit(address);
      }
    }
  }
});

const freeAtHome = new FreeAtHome();
freeAtHome.activateSignalHandling();

type Unit = {
  twin: SplitUnitChannel,
  io: DaikinAC,
  ipAddress: string,
};

var units: Unit[] = [];

async function tryAddUnit(ipAddress: string) {
  if(!ipAddress) {
    // no valid address given
    return;
  }
  if(units.some(u => u.ipAddress == ipAddress)) {
    // already connected
    return;
  }
  var unit = new DaikinAC(ipAddress, {
    "useGetToPost": true,
  }, async (error, response) => {
    if(error) {
      console.error(`failed to connect to ${ipAddress}: ${error}`);
    } else if(response) {
      await addUnit(ipAddress, unit, response);
    }
  });
}

async function addUnit(ipAddress: string, unit: DaikinAC, info: ModelInfoResponse) {
  const twin = await freeAtHome.createSplitUnitDevice("dainkin_ac_" + ipAddress.replace(/\./g, "_"), "Daikin Air Conditioner " + info.model);
  twin.setAutoKeepAlive(false);
  twin.isAutoConfirm = false;
  units.push({
    twin: twin,
    io: unit,
    ipAddress: ipAddress,
  });
  // react on events from free at home
  twin.on("isOnChanged", (value) => {
    unit.setACControlInfo({
      power: value,
    }, (error, response) => {
      if(error) {
        console.error(`failed to update power for ${ipAddress}: ${error}`);
      } else if(response) {
        applyControlInfo(twin, response);
      }
    });
  });
  twin.on("setPointTemperatureChanged", (value) => {
    unit.setACControlInfo({
      targetTemperature: value
    }, (error, response) => {
      if(error) {
        console.error(`failed to update set point temperature for ${ipAddress}: ${error}`);
      } else if(response) {
        applyControlInfo(twin, response);
      }
    });
  });
  twin.on("setModeCooling", () => {
    if(unit.currentACControlInfo && !unit.currentACControlInfo.power) {
      return;
    }
    unit.setACControlInfo({
      mode: 3
    }, (error, response) => {
      if(error) {
        console.error(`failed to update mode for ${ipAddress}: ${error}`);
      } else if(response) {
        applyControlInfo(twin, response);
      }
    });
  });
  twin.on("setModeHeating", () => {
    if(unit.currentACControlInfo && !unit.currentACControlInfo.power) {
      return;
    }
    unit.setACControlInfo({
      mode: 4
    }, (error, response) => {
      if(error) {
        console.error(`failed to update mode for ${ipAddress}: ${error}`);
      } else if(response) {
        applyControlInfo(twin, response);
      }
    });
  });
  twin.on("setModeAuto", () => {
    if(unit.currentACControlInfo && !unit.currentACControlInfo.power) {
      return;
    }
    unit.setACControlInfo({
      mode: 0
    }, (error, response) => {
      if(error) {
        console.error(`failed to update mode for ${ipAddress}: ${error}`);
      } else if(response) {
        applyControlInfo(twin, response);
      }
    });
  });
}

function applyControlInfo(twin: SplitUnitChannel, info: ControlInfo) {
  twin.setOn(Boolean(info.power));
  if(info.mode == 3) {
    twin.setModeCooling();
  } else if(info.mode == 4) {
    twin.setModeHeating();
  } else {
    twin.setModeAuto();
  }
  if(typeof(info.targetTemperature) === "number") {
    twin.sendSetPointTemperature(info.targetTemperature);
  }
}

async function refreshUnit(unit: Unit) {
  unit.io.getACControlInfo((error, response) => {
    if(error) {
      console.error(`failed to read control info from ${unit.ipAddress}: ${error}`);
    } else if(response) {
      unit.twin.triggerKeepAlive();
      applyControlInfo(unit.twin, response);
    }
  });
}

async function lookup() {
  for(const unit of units) {
    await refreshUnit(unit);
  }
}

const mainLoop = setInterval(lookup, 10000);
const discovery = new DaikinDiscovery(1000, async devices => {
  for(const device in devices) {
    await tryAddUnit(device);
  }
});