# <span style="color:red;">HEADS UP! These docs are unfinished!</span>
# Database Library
- [[GASLib Docs#Database Setup|Setting up a database]]
- Managing a database
	- [[GASLib Docs#The `DB` Class|The DB Class]]
	- [[GASLib Docs#Custom Database functions|Custom functions]]
	- [[GASLib Docs#Database Permissions and Private/Public Methods|Permissions and Methods]]
- Networking integration & example

# Database Setup

### The `MasterDB` Class
The GASLIB has 2 main classes: `MasterDB` and `DB`.
`MasterDB(string sheetID, string dbName)` is a way of storing multiple sub-databases on the same google sheet. It takes 2 arguments, `sheetID` and `dbName`. 
`MasterDB` has the following contents:
- `object dbSectors`
- `string ID`
- `string name`
- `function initDB(sheetName)`
- `function find(query, object array dbWhitelist, string range)`

The `MasterDB` is created by creating a new instance of the class.
```javascript
const myMasterDatabase = new MasterDB("<sheetID>","myDatabase");
```
New databases can be initialized whiten the `MasterDB` object by calling `initDB(string sheetName)` This will append the new sub-database to the `MasterDB` object and will also return the created object. See more on the `DB` object [[GASLib Docs#The `DB` Class|here]].
```javascript
const myMasterDatabase = new MasterDB("<sheetID>","myDatabase");
myMasterDatabase.initDB("Sheet1");
const subDB = myMasterDatabase.init("Sheet2");

console.log(myMasterDatabase.dbSectors); 
//outputs => {"Sheet 1": <DB object>, "Sheet 2": <DB object>}
```
The `MasterDB` also has a `find` function, this will search the whitelisted databases (or a blank array for every database) for a specific value in a specific search range. See more on how databases search [[GASLib Docs#Searching the `DB`|here]]. 
```javascript
console.log(myMasterDatabase.search("Hello world!",[],"A:A")); // Search ALL databases for the value "Hello world!" in the A column.
//outputs => {"Sheet 1": <search result>}
```

### The `DB` Class
The main database class is the `DB` class. This is the constructor for the actual database object. It takes in 1 argument `sheetObj` which is a google sheet object. 
the `DB` class contains the following:
- `object permissions` (.public and .private)
- `sheetObject sheet`
- `object customfns`
- `array publicMethods`
- `function newfn(string name, function func, bool isPublic)`
- `array methods`
- `function setMethod(method, ispub)`
- `function setPermissions(type, args)`
- `function updatePermissions()`
- Data retrieval/setting
	- `function appendRow(data)`
	- `function setRow(row, data)`
	- `function getRow(row)`
	- `function appendColumn(column, data)`
	- `function setColumn(column, data)`
	- `function getColumn(column)`
	- `function editCell(cell, data)`
	- `function getCell(cell)`
	- `function find(query, selectionRange)`
- Helper functions
	- `_colToNum(col)`
	- `_numToCol(num)`
	- `_getCellRange(cell)`
	- `_SHA256(input)`

A database is created by creating a new instance of the class.
```javascript
const myDatabase = new DB(SpreadsheetApp.openById("<sheetID>").getSheetByName("Sheet1"));
```
Adding or reading data from the sheet is done with one of the many row, column, or cell functions (see above) they all return the value(s) at a given location.
```javascript
const myDatabase = new DB(SpreadsheetApp.openById("<sheetID>").getSheetByName("Sheet1"));
myDatabase.appendRow(["username","password","test"]); //imagine appending to row "1"
myDatabase.getRow(1); //would output ["username","password","test"]

myDatabase.appendColumn("A",["value1","value2"]);
myDatabase.getColumn("A"); //would output ["username","value1","value2"]

myDatabase.getCell("A2"); // would return "value1" 
```
##### Searching the `DB`
You can also search through a range for a specific value using `.find(query, selectionRange)` This returns all instances of a value in a given range and returns an array of JSON objects structured like `{row= <number>, column= <string>, cell= <string>, value= <string>}`

```javascript
const myDatabase = new DB(SpreadsheetApp.openById("<sheetID>").getSheetByName("Sheet1"));

myDatabase.appendColumn("A",["value1","value2","value3"]);

myDatabase.find("value1","A:A");
//output => [{row=1, column="A", cell="A1", value="value1"}]
```
#### Custom Database functions
The `DB` class also allows custom functions that operate within the database, they are really nothing special other than the fact they are added to the created `DB` object. You can create a custom function by calling `.newfn(string name, function func, bool isPublic)` for the `func` argument, the first argument passed to it will always be the database object it was created in. In this example I use `self` to reference it. The `isPublic` argument, is used to help set up the permission structure within the database. More on database permissions [[GASLib Docs#Database Permissions and Private/Public Methods|here]]. This example also uses the built in `_SHA256` helper function, just because it is commonly used by me. 
```javascript
const myDatabase = new DB(SpreadsheetApp.openById("<sheetID>").getSheetByName("Sheet1"));

myDatabase.newfn("createAccount",function(self,username,password){
	self.appendRow([username,self._SHA256(password)]);
},true);
```
Custom functions are called by calling their key from the `.customfns` object within the `DB` class.
```javascript
const myDatabase = new DB(SpreadsheetApp.openById("<sheetID>").getSheetByName("Sheet1"));

myDatabase.newfn("createAccount",function(self,username,password){
	self.appendRow([username,self._SHA256(password)]);
},true);

myDatabase.customfns.newAcc("myUsername","password");
// appends the row ["myUsername","5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"] to the database
```
#### Database Permissions and Private/Public Methods
<span style="color:grey;">*Note - Database permissions is a creatively new feature and may be unfinished. They are also completely optional* </span>
Databases can have either public or private methods. "public" methods are functions and values that are marked to be freely used by outside code, of course you can do this normally but the main purpose of creating public or private methods is to provide the framework for networking interactions.
The `permissions` table inside the database object can be used to allow certain database methods by default for 2 different profiles, `public` and `admin`. Permissions can be set by using the `setPermissions(type, args)` function. Not every permission has to be provided, multiple permissions can be updated in one call. (`setPermissions` automatically calls `updatePermissions`)
```javascript
const myDatabase = new DB(SpreadsheetApp.openById("<sheetID>").getSheetByName("Sheet1"));
myDatabase.setPermissions("public",{
	"read": true,
	"write": false,
	"SectorBlackList": "B:B"
});
```
In this example, it creates a new database and enables public `read` permissions, and blacklists the column `B` from being read or write within public use.

The `updatePermissions()` function is called when `permissions` is updated. It automatically adds or removes items from `publicMethods` and should rarely be used as it is automatically called by `setPermissions`.
##### List of Default Database Permissions
- **Public**
	- `read` (boolean)
		- Allows public reading of database values 
	- `write` (boolean)
		- Allows public writing of values to a database
	- `SectorWhiteList` (false | string)
		- `false` by default. Allows only values in the provided range to be read or written to.
	- `SectorBlackList` (false | string)
		- `false` by default. Prevents values in the provided range from being read or written. 
- **Admin**
	- Contains all permissions listed in `public`
	- `password` (string/SHA256 hash)
		- Stores a password hash for verifying admin access to the database, 
##### Method Publicity
Methods are functions and values included inside the database such as `appendRow` and `find`. To set a method as public or private you can call `setMethod(string method, bool ispublic)` This will add or remove a method from the `publicMethods` array.
```javascript
const myDatabase = new DB(SpreadsheetApp.openById("<sheetID>").getSheetByName("Sheet1"));

myDatabase.setMethod("_SHA256",true); //Makes the _SHA256() function public 

console.log(myDatabase.methods); //outputs an array ["appendRow","setMethod",... etc]
console.log(myDatabase.publicMethods); //outputs all public methods in an array, like ["_SHA256"]
```
<small><i>You can get a list of all methods in the database by calling `methods` which will return an array of property names.</i></small>

Updating method publicity should rarely be needed considering custom functions define their publicity when created, and all read/write functions are handled by the database permission system, but it is nice to have when needed.
