const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();

//Bodyparser config
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//Set API vars
const baseURL = `https://${process.env.BAMBOO_API_KEY}:x@api.bamboohr.com/api/gateway.php/${process.env.BAMBOO_SUBDOMAIN}/v1/`;
const employeePath = `employees/`;
const employeeFields = `firstName,preferredName,birthday,hireDate,originalHireDate,status,department,division`;
const holidayPath = 'time_off/whos_out/?start=2020-01-01';
const holidayFields = '';


const getData = async (url, fields) => {
    try {
        //Set query string params. This step is needed as npm fetch doesn't handle qs
        params = { fields: fields };
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        let res = await fetch(url, {
            method: 'GET',
            headers: {
                accept: 'application/json'
            }
        });
        if (res.status === 200) {
            return await res.json();
        } else {
            console.log(`Failed to fetch from BambooHR (${res.status}): ${res.headers.get('X-BambooHR-Error-Message')}`);
            return null;
        }
    } catch(err) {   
        console.log('Error: ' + err);
        return null;
    }
};


let getEmployeeData = async (employeeId, fields = null) => {
    try {
        let url = new URL(baseURL + employeePath + 'directory');
        return await getData(url, employeeFields);
    } catch(err) {
        console.log(err);
    }    
}

let main = async () => {
    //Grab employee fields
    let dir = await getEmployeeData('directory');
    let employees = dir.employees;
    for (employee of employees) {
        console.log(`${employee.id} ${employee.firstName} ${employee.preferredName}`);
    }
}

main();