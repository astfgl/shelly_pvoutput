let CONFIG = {
  KVS_KEY_PVOUTPUT_HEADERS: "script:" + JSON.stringify(Shelly.getCurrentScriptId()) + ":PVOutput-http-headers",
  url: "https://pvoutput.org/service/r2/addstatus.jsp",
  httpHeaders: {
    "Content-Type": "application/x-www-form-urlencoded"
  }
};

var solarImportTotal;
var solarExportTotal;
var gridImportTotal;
var gridExportTotal;

function pushStatus() {
  let sysStatus = Shelly.getComponentStatus("sys");
  //let isoDate = new Date.toISOString();
  print(myDateString);
  
  let em10 = Shelly.getComponentStatus("em1:0");

  let em1Data0 = Shelly.getComponentStatus("em1data:0");
  let gridImport = em1Data0.total_act_energy - gridImportTotal;
  let gridExport = em1Data0.total_act_ret_energy - gridExportTotal;

  let em1Data1 = Shelly.getComponentStatus("em1data:1");
  let solarImport = em1Data1.total_act_energy - solarImportTotal;
  let solarExport = em1Data1.total_act_ret_energy - solarExportTotal;
  
  print("gI gE sI sE: ", gridImport, gridExport, solarImport, solarExport);
  
  let dailyGen = solarExportTotal;
  let currGen = solarExport;
  let dailyUse = solarExportTotal - gridExportTotal + gridImportTotal - solarImportTotal;
  let currUse = solarExport - gridExport + gridImport - solarImport;
  
  print("dG cG dU cU: ", dailyGen, currGen, dailyUse, currUse);
  
  let body = "d=" + myDateString
    + "&t=" + sysStatus.time
    + "&v1=" + JSON.stringify(dailyGen)
    + "&v2=" + JSON.stringify(currGen*12)
    + "&v3=" + JSON.stringify(dailyUse)
    + "&v4=" + JSON.stringify(currUse*12)
    + "&v6=" + JSON.stringify(em10.voltage);

  print("POST", CONFIG.url, CONFIG.httpHeaders, body);

  Shelly.call("HTTP.Request",
    { method: "POST", url: CONFIG.url, headers: CONFIG.httpHeaders, body: body },
    function (result, error_code, error_message) {
      print(JSON.stringify(result), error_code, error_message);
    }
  );

  gridImportTotal = em1Data0.total_act_energy;
  gridExportTotal = em1Data0.total_act_ret_energy;
  solarImportTotal = em1Data1.total_act_energy;
  solarExportTotal = em1Data1.total_act_ret_energy;
}

function initState() {
  let em1Data0 = Shelly.getComponentStatus("em1data:0");
  gridImportTotal = em1Data0.total_act_energy;
  gridExportTotal = em1Data0.total_act_ret_energy;

  let em1Data1 = Shelly.getComponentStatus("em1data:1");
  solarImportTotal = em1Data1.total_act_energy;
  solarExportTotal = em1Data1.total_act_ret_energy;
  
  print("Init: ", gridImportTotal, gridExportTotal, solarImportTotal, solarExportTotal);
}

function loadConfiguration() {
  Shelly.call("KVS.Get",
    { key: CONFIG.KVS_KEY_PVOUTPUT_HEADERS },
    function (result, error_code) {
      if (error_code === 0) {
        for (let prop in result.value) {
          CONFIG.httpHeaders[prop] = result.value[prop];
          //print("CONFIG: ", prop, CONFIG.httpHeaders[prop]);
        }
      }
    }
  );
}

function setConfiguration(apikey, systemId) {
  Shelly.call("KVS.Set",
    { key: CONFIG.KVS_KEY_PVOUTPUT_HEADERS, value: { "X-Pvoutput-Apikey": apikey, "X-Pvoutput-SystemId": systemId } },
    loadConfiguration
  );
}

loadConfiguration();
var myDate = new Date();
var myDateString = myDate.getFullYear() 
  + ('0' + (myDate.getMonth()+1)).slice(-2) 
  + ('0' + myDate.getDate()).slice(-2);
print(myDate);
print(myDateString);
initState();
Timer.set(300000, true, pushStatus);
