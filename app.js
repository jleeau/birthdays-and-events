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
// const holidayPath = 'time_off/whos_out/?start=2020-01-01';
// const holidayFields = '';

//Grab the data.
const getData = async (url, fields) => {
    try {
        //Set query string params. This step is needed as node-fetch doesn't handle qs params
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
        let url = new URL(baseURL + employeePath + employeeId);
        return await getData(url, fields);
    } catch(err) {
        console.log(err);
    }
}


let postToSlack = async (text) => {
    const url = process.env.SLACK_WEBHOOK_JACKY;
    const body = {text: text};

    try {
        let res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        console.log('Slack send status: ' + res.status + ' ' + res.statusText);
        if (res.status === 200) {
            console.log('Successfully posted to Slack.');
        } else {
            console.log('Failed to post to Slack.');
        }
    } catch(err) {
        console.log('Slack Error: ' + err);
    }
}


let buildSlackMessage = async (employee) => {
    let post;
    if (employee && employee.preferredName) {
        post = `@channel It's *${employee.preferredName}'s Birthday* today!
        :clap::skin-tone-3::tada::birthday::balloon:    Happy Birthday *${employee.preferredName}*, have a good one!    :clap::skin-tone-3::tada::birthday::balloon:`;
    }
    
    return post;
}

let main = async () => {
    // let dir = await getEmployeeData('directory');           //Get all employees in the directory
    // let employees = dir.employees;
    // for (employee of employees) {
    //     console.log(`${employee.id} ${employee.firstName} ${employee.preferredName}`);
    // }

    let employee = await getEmployeeData('0', employeeFields);
    if (employee) {
        let birthdayMsg = await buildSlackMessage(employee);
        postToSlack(birthdayMsg);
    }
}

main();