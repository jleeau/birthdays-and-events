const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const convert = require('xml-js');          //https://www.npmjs.com/package/xml-js

const app = express();

//Bodyparser config
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


let url = new URL('https://f00e01b873e6344ab2dde269da4966768828bb1d:x@api.bamboohr.com/api/gateway.php/shieldgeo/v1/employees/0');

const getData = async url => {
    try {
        //Set query string params. This step is needed as npm fetch doesn't handle qs
        params = {
            fields: 'firstName,lastName,preferredName,birthday,hireDate,originalHireDate,status,department,division,supervisor'
        }
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        let res = await fetch(url, {
            method: 'GET',
            headers: {
                accept: 'application/json'
            }
        });

        if (res.status >= 200 || res.status <= 299) {
            console.log('Done fetching: ' + res.status);
            return await res.json();            //https://f00e01b873e6344ab2dde269da4966768828bb1d:x@api.bamboohr.com/api/gateway.php/shieldgeo/v1/employees/directory
        }

        console.log('Failed to fetch anything from BambooHR... ' + res.status + ' ' + res.headers.get('X-BambooHR-Error-Message'));
        return null;
    } catch(err) {   
        console.log('Error: ' + err);
    }
    
    
};

let main = async () => {
    try {
        let data = await getData(url);
        if (data) {
            console.log(data);
        } else {
            console.log('No result found...');
        }
    } catch(err) {
        console.log(err);
    }
}

main();


var getAttr = (arr, search) => {
    if (arr) {
        return employee.field.find(field => field._attributes.id === search)._text;
    }
    return null;
}