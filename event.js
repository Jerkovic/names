const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const _ = require('lodash');

const url = 'https://eventor.orientering.se/Events/Show/36517?culture=en-GB';

axios(url)
    .then(response => {
        const html = response.data;
        const $ = cheerio.load(html);
        const eventName = $('#main > div > div.eventInfoTableContainer > table:nth-child(1) > tbody > tr:nth-child(1) > td').text();
        const status = $('#main > div > div.eventInfoTableContainer > table:nth-child(1) > tbody > tr:nth-child(4) > td').text();
        const punch = $('#main > div > div.eventInfoTableContainer > table:nth-child(1) > tbody > tr:nth-child(14) > td').text();
        const classes = $('#main > div > div.eventInfoTableContainer > table:nth-child(2) > tbody > tr:nth-child(1) > td').text();
        const classArr = classes.split(',').map((e) => e.trim());

        const openClasses = $('#main > div > div.eventInfoTableContainer > table:nth-child(2) > tbody > tr:nth-child(2) > td').text();
        const openClassArr = openClasses.split(',').map((e) => e.trim());
        console.log(eventName, ' - ', status, ' - ', punch, classArr, ' ', openClassArr);
    })
    .catch(console.error);

