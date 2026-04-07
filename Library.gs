
// Database /////////////////////////////////////////////////////////////////////////////////////////////////////////////

class MasterDB {
  constructor(sheetID,dbName) {
    this.dbSectors = {};
    this.ID = sheetID;
    this.name = dbName;
  }

  initDB(sheetName) {
    this.dbSectors[sheetName] = new DB(SpreadsheetApp.openById(this.ID).getSheetByName(sheetName));
    return this.dbSectors[sheetName];
  }

  find(query,dbWhitelist,range) {
    dbWhitelist = dbWhitelist || [];
    dbWhitelist = dbWhitelist.length == 0 ? Object.keys(this.dbSectors) : dbWhitelist;
    var results = {};
    dbWhitelist.forEach((db) => {
      results[db] = this.dbSectors[db].search(query,range);
    }); 
    return results;
  }
}

class DB {
  constructor(sheetOBJ) {
    this.permissions = {
      "public": {
        "read": false,
        "write": false,
        "SectorWhiteList": false,
        "SectorBlackList": false
      },
      "admin": {
        "read": false,
        "write": false,
        "password": false,
        "SectorWhiteList": false,
        "SectorBlackList": false
      }
    }
    this.sheet = sheetOBJ;
    this.customfns = {};
    this.publicMethods = [];
  }

  newfn(name, func,isPublic) {
    isPublic = isPublic || false;
    const _ = this;
    if (isPublic) this.publicMethods.push(name);
    this.customfns[name] = function() {
      return func(_, ...arguments);
    };
  }

  updatePermissions() {
    var readMethods = ["getRow","getColumn","getCell","find"];
    var writeMethods = ["setRow","appendRow","appendColumn","setColumn","editCell"];
    readMethods.forEach((method) => {
      this.setMethod(method,this.permissions.public.read);
    });    
    writeMethods.forEach((method) => {
      this.setMethod(method,this.permissions.public.write);
    });
  }


  setPermissions(type,args) {
    Object.keys(args).forEach((arg) => {
      this.permissions[type][arg] = args[arg];
    });
    this.updatePermissions();
  }

  setMethod(method,ispub) {
    if (ispub) {
      if (!this.publicMethods.includes(method) && this.methods.includes(method)) {
        this.publicMethods.push(method);
      }
    }else {
      if (this.publicMethods.includes(method) && this.methods.includes(method)) {
        this.publicMethods.splice(this.publicMethods.indexOf(method),1);
      }
    }
  }

  get methods() {
   return Object.getOwnPropertyNames(Object.getPrototypeOf(this)); 
  }

  // Append a row (optional reference parameter not used yet)
  appendRow(data, reference) {
    this.sheet.appendRow(data);
  }

  // Set entire row values (expects array)
  setRow(row, data) {
    const range = this.sheet.getRange(row, 1, 1, data.length);
    range.setValues([data]);
  }

  // Get entire row as array
  getRow(row) {
    const lastCol = this.sheet.getLastColumn();
    const range = this.sheet.getRange(row, 1, 1, lastCol);
    return range.getValues()[0];
  }

  //Remove an entire row
  removeRow(row) {
    this.sheet.deleteRow(row);
    return true;
  }

  // Append column (add new value to the end of a column)
  appendColumn(column, data) {
    const colIndex = this._colToNum(column);
    const lastRow = this.sheet.getLastRow();
    this.sheet.getRange(lastRow + 1, colIndex).setValue(data);
  }

  // Set entire column (expects array)
  setColumn(column, data) {
    const colIndex = this._colToNum(column);
    const range = this.sheet.getRange(1, colIndex, data.length, 1);
    const values = data.map(v => [v]);
    range.setValues(values);
  }

  // Get entire column as array
  getColumn(column) {
    const colIndex = this._colToNum(column);
    const lastRow = this.sheet.getLastRow();
    const range = this.sheet.getRange(1, colIndex, lastRow, 1);
    return range.getValues().flat();
  }

  // Edit a single cell (e.g. "B2" or row/col index)
  editCell(cell, data) {
    const range = this._getCellRange(cell);
    range.setValue(data);
  }

  // Get a single cell value
  getCell(cell) {
    const range = this._getCellRange(cell);
    return range.getValue();
  }

  // Find a value (returns array of results)
  find(query, selectionRange) {
    const range = selectionRange
      ? this.sheet.getRange(selectionRange)
      : this.sheet.getDataRange();

    const values = range.getValues();
    const results = [];

    for (let r = 0; r < values.length; r++) {
      for (let c = 0; c < values[r].length; c++) {
        if (String(values[r][c]).includes(query)) {
          const row = range.getRow() + r;
          const col = range.getColumn() + c;
          const cell = this.sheet.getRange(row, col).getA1Notation();
          results.push({ row, column: this._numToCol(col), cell, value: values[r][c] });
        }
      }
    }
    return results;
  }

  // --- Helpers ---

  _colToNum(col) {
    if (typeof col === 'number') return col;
    let num = 0;
    for (let i = 0; i < col.length; i++) {
      num = num * 26 + (col.charCodeAt(i) - 64);
    }
    return num;
  }

  _numToCol(num) {
    let col = "";
    while (num > 0) {
      const rem = (num - 1) % 26;
      col = String.fromCharCode(65 + rem) + col;
      num = Math.floor((num - 1) / 26);
    }
    return col;
  }  

  _getCellRange(cell) {
    if (typeof cell === 'string') {
      return this.sheet.getRange(cell);
    } else if (Array.isArray(cell)) {
      const [row, col] = cell;
      return this.sheet.getRange(row, col);
    } else {
      throw new Error('Invalid cell identifier');
    }
  }

  _SHA256(input) {
    var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input);
    var hexHash = '';
    for (var i = 0; i < rawHash.length; i++) {
      var hashVal = rawHash[i];
      if (hashVal < 0) {
        hashVal += 256;
      }
      if (hashVal.toString(16).length == 1) {
        hexHash += '0';
      }
      hexHash += hashVal.toString(16);
    }
    return hexHash;
  }
}




// Networking ////////////////////////////////////////////////////////////////////////////////////////////////////////////
class NetWorkHandler {
  constructor() {
    this.paths = {};
    this.logs = [];
    this.processors = {};
  }

  CustomProccess(parameter,func) {
    var _ = this;
    this.processors[parameter] = {
      "parameter": parameter,
      "func": function(parameters) {
        return func(_,parameters);
      }
    }
    return this.processors[parameter];
  }

  NewRoute(path,func,dataWhitelist) {
    if (typeof dataWhitelist == "string") { dataWhitelist = [dataWhitelist]; }
    if (typeof dataWhitelist !== "object") { dataWhitelist = "any"; }
    //Grab the <this> as super
    var _ = this;
    this.paths[path] = {
      "path": path,
      "func": function(body) {
        if (!dataWhitelist.includes(typeof body) && dataWhitelist !== "any") {
          _.Log(`data type "${typeof body}" not accepted for "${path}". \naccepted types: ${dataWhitelist}`,"WARN");
          return null;
        }
        // some black magic javascript fuckery going on here
        return func(_,body);
      }
    }
    return this.paths[path];
  }

  Log(message,type) {
    type = type || "LOG"
    this.logs.push(`[${type}]: ${message}`);
  }

  printLog() {
    Logger.log("NETWORKING LIBRARY LOG:")
    this.logs.forEach((log) => {
      Logger.log(log);
    })
  }

  newResponse(type,data) {
    var res;
    switch (type) {
      case "noPath":
        res = JSON.stringify({"response":"error","message":"No path specified"});
      break;
      case "pathNotFound":
        res = JSON.stringify({"response":"error","message":"Path not found"})
      break;
      case "JSON": 
        res = JSON.stringify(data);
      break;
      case "OK":
        res = JSON.stringify({"response":"OK","message": data || {}})
      break;
      case "ERROR":
        res = JSON.stringify({"response": "ERROR","message": data || {}})
      break
      default:
        res = JSON.stringify({"response":"error","message":"unknown error"});
      break;
    }
    // Logger.log(res)
    this.Log("response output: " + res);
    return res;
  }

  process(e) {
    var response;
    let parameters = e.parameter;
  /*
    parameter structure
    {
      "path": "/path",
      "body": <content>,
    }
  */
    if (parameters.path == undefined) {
      return ContentService.createTextOutput(this.newResponse("noPath")).setMimeType(ContentService.MimeType.JSON)
    }
    if (parameters.body) {
      try {
        parameters.body = JSON.parse(parameters.body);
      }catch {}
    }    
    for (let key in parameters) {
      if (this.processors[key] !== undefined) {
        parameters = this.processors[key].func(parameters);
      }
    }

    if (Object.keys(this.paths).includes(parameters.path)) {
      //Path found
      response = this.paths[parameters.path].func(parameters.body);
    }else {
      //Path not found
      response = this.newResponse("pathNotFound",parameters);
    }
    //encrypt result if using AES?
    Logger.log("NETWORK RESPONSE: " + response);
    return ContentService.createTextOutput(response).setMimeType(ContentService.MimeType.JSON);
  }
}


