const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const convert = require('xml-js');          //https://www.npmjs.com/package/xml-js

const app = express();

//Bodyparser config
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


//const url = 'https://jsonplaceholder.typicode.com/posts/1';
const url = 'https://f00e01b873e6344ab2dde269da4966768828bb1d:x@api.bamboohr.com/api/gateway.php/shieldgeo/v1/employees/directory';

const getData = async url => {
    try {
        let response = await fetch(url);
        let xml = await response.text();            //https://f00e01b873e6344ab2dde269da4966768828bb1d:x@api.bamboohr.com/api/gateway.php/shieldgeo/v1/employees/directory
        let obj = convert.xml2js(xml, {compact: true, spaces: 2});
        if (obj && obj.directory) {
            return obj.directory;
        }
        return null;
    } catch(err) {   
        console.log('Error: ' + err);
    }
    
    
};

let main = async () => {
    try {
        let data = await getData(url);
        if (data) {
            let employeeNames = [];
            //console.log(JSON.stringify(result, null, 2));
            for (employee of data.employees.employee) {
                employeeNames.push(employee.field[0]._text);
            }
            console.log(employeeNames);
        } else {
            console.log('No result found...');
        }
    } catch(err) {
        console.log(err);
    }
}

main();