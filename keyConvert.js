const fs = require('fs');


const jsonFile = fs.readFileSync('./Fb_Admin_Key.json', 'utf-8');


const base64Encoded = Buffer.from(jsonFile).toString('base64');


console.log(base64Encoded);
