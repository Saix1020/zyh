var uuid = require('node-uuid');

for(var i=0; i <100; ++i){
    console.log('"' + uuid.v4()+'",');
}