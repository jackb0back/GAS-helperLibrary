//example 
const netWork = new NetWorkHandler();
const TestDB = new DB(SpreadsheetApp.openById("SHEET_ID").getSheetByName("Sheet1"))
TestDB.setPermissions("admin",{
  "password": TestDB._SHA256("password"),
  "read": true,
  "write": true 
});
TestDB.setPermissions("public",{
  "read": true,
  "write": false,
  "SectorBlackList": "B:B"
})

TestDB.newfn("newAcc",function(self,username,password) {
  self.appendRow([username,Utilities.base64Encode(password)]);
  return "Added account"
},true)

netWork.NewRoute("/balls",function(self,body) {
  // Logger.log(self)
  // Logger.log(body)
  Logger.log(Object.keys(self.paths));
  Logger.log(body);
  return self.newResponse("OK","Called /balls correctly") 
});

netWork.NewRoute("/dbMethods",function(self,body) {
  Logger.log("Public methods: " + JSON.stringify(TestDB.publicMethods))
  return self.newResponse("OK",TestDB.publicMethods);
});

netWork.NewRoute("/db",function(self,body) {
  /*
  body {
    "method": "newAcc",
    "args": [<item1>,<item2>]
  }
  */
  var res;
  var data
  if (TestDB.publicMethods.includes(body.method)) {
    if (Object.keys(TestDB.customfns).includes(body.method)) {
      data = TestDB.customfns[body.method](...body.args);
    }else {
      data = TestDB[body.method](...body.args);
    }
    res = self.newResponse("OK",data)
  }else {
    res = self.newResponse("ERROR","Method not public")
  }
  return res;
})

function doPost(e) {
  const resp = netWork.process(e);
  Logger.log("NETWORK RESPONSE: " + resp);
  return resp;
}

///

function test() {
  Logger.log(TestDB.publicMethods)
}

function DBTest() {
  // Logger.log(TestDB.find("ABC","A:A"))
  Logger.log(TestDB.customfns.newAcc("Test user","password"))
}

function NetTest() {
  doPost({
    "parameter": {
      "path": "/db",
      "body": {
        "method": "newAcc",
        "args": ["User2","mydihiswet"]
      }
    } 
  });
  netWork.printLog();
}
