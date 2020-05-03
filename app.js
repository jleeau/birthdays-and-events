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
const employeeFields = `firstName,preferredName,displayName,birthday,hireDate,originalHireDate,status,department,division`;
const holidayPath = 'time_off/whos_out/';

// Handles the HTTP request giving a url and fields
const requestHandler = async (url, fields) => {
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



// Get employee data based on a single employee's Id
let getEmployeeData = async (employeeId, fields = null) => {
    try {
        let url = new URL(baseURL + employeePath + employeeId);
        return await requestHandler(url, fields);
    } catch(err) {
        console.log(err);
    }
}


// Get holiday data
let getHolidayData = async(fields = null) => {
    try {
        let url = new URL(baseURL + holidayPath);
        return await requestHandler(url, fields);
    } catch(err) {
        console.log(err);
    }
}


// Posts to a particular slack channel
let postToSlack = async (url, text) => {
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
        if (res.status !== 200) {
            console.log('Failed to post to Slack.');
        }
    } catch(err) {
        console.log('Slack Error: ' + err);
    }
}


// Construct a slack msg based on the employee and their birthday.
let buildSlackMessage = async (name, date, type) => {
    let post = null;

    if (name && date && type) {
        if (type === 'birthday') {
            post = `@channel It's *${name}'s Birthday* today!
            :star2::tada::birthday::balloon:    Happy Birthday *${name}*, have a good one!    :star2::tada::birthday::balloon:`;
        } else if (type === 'anniversary') {
            post = `@channel It's *${name}'s Work Anniversary* today!
            :sparkles::champagne::star2::100::star:    Great to have you on the team *${name}*!    :sparkles::champagne::star2::100::star:
            `;
        }
    }

    
    return post;
}


// Grab the employee's most suitable name for posting
let buildName = (employee) => {
    if (employee) {
        return employee.preferredName ? employee.preferredName : employee.firstName;
    }
    return null;
}


let main = async () => {
    // Fetch all employees from directory first
    let employeeIds = [];               //Store a list of all employee ids found in directoory
    let dir = await getEmployeeData('directory');
    if (dir && dir.employees && dir.employees.length > 0) {
        for (emp of dir.employees) {
            employeeIds.push(emp.id);
        }
    } else {
        console.log(`Could not find any employee data in the directory.`);
    }
    
    // For each employee, search for their employee data one by one via API
    if (employeeIds && employeeIds.length > 0) {
        console.log(`Checking events for ${employeeIds.length} employees...`);
        for (let i = 0; i < employeeIds.length; i++) {
            let employee = await getEmployeeData(employeeIds[i].toString(), employeeFields);        // employee stored as object
            
            if (employee && employee.status === 'Active') {
                let name = buildName(employee);
                let today = new Date();
                // formatted date of employee's birthday this year, e.g. "Sun May 03 2020". Used for comparison to today without time.
                let birthday = employee.birthday ? new Date(`${employee.birthday}-${new Date().getFullYear()}`).toDateString() : null;
                //Check if there's any hire date, AND make sure the original hire date is at least a week ago to filter out newly added peeps
                let anni = employee.originalHireDate && new Date(employee.originalHireDate) < new Date().setDate(-4) ? new Date(`${employee.originalHireDate.substring(5)}-${new Date().getFullYear()}`).toDateString() : null;

                // Compose birthday msg
                if (birthday && birthday === today) {                                               // Check if employee's birthday falls on today
                    console.log(`Posting birthday message for ${name}`);
                    let birthdayMsg = await buildSlackMessage(name, birthday, 'birthday');
                    if (birthdayMsg) {
                        postToSlack(process.env.SLACK_WEBHOOK_JACKY, birthdayMsg);                  // post msg to Jacky's Slack channel
                    }
                }

                // Compose anniversary msg
                if (anni && anni === today) {                                                       //Check if employee's work anni falls on today
                    console.log(`Posting anniversary message for ${name}`);
                    let anniMsg = await buildSlackMessage(name, anni, 'anniversary');
                    if (anniMsg) {
                        postToSlack(process.env.SLACK_WEBHOOK_JACKY, anniMsg);
                    }
                }
            }
        }
    }


    /* Issue: This fetches timeoff, but not holiday/country dates data so can't be used just yet */
    // let fields = {
    //     'start': '2020-01-01',
    //     'end': '2021-01-01'
    // };
    // fields = JSON.stringify(fields);
    // let holidays = await getHolidayData(fields);
    // console.log(holidays);
}

main();