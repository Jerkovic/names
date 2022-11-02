const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const _ = require('lodash');

const url = 'https://eventor.orientering.se/Events?startDate=2022-11-01&endDate=2022-11-30&mode=List';

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function scrapeEventPage(id) {
    const url = 'https://eventor.orientering.se/Events/Show/' + id + '?culture=en-GB';
    const response = await axios(url)
    const html = response.data;
    const $ = cheerio.load(html);

    const eventName = $('#main > div > div.eventInfoTableContainer > table:nth-child(1) > tbody > tr:nth-child(1) > td').text();
    const status = $('#main > div > div.eventInfoTableContainer > table:nth-child(1) > tbody > tr:nth-child(4) > td').text();
    const punch = $('#main > div > div.eventInfoTableContainer > table:nth-child(1) > tbody > tr:nth-child(14) > td').text();
    const classes = $('#main > div > div.eventInfoTableContainer > table:nth-child(2) > tbody > tr:nth-child(1) > td').text();
    const classArr = classes.split(',').map((e) => e.trim());

    const openClasses = $('#main > div > div.eventInfoTableContainer > table:nth-child(2) > tbody > tr:nth-child(2) > td').text();
    const openClassArr = openClasses.split(',').map((e) => e.trim());
    return {id, status, eventName, status, classes: classArr, openClasses: openClassArr}
}

async function crawler()
{
    const response = await axios(url)
    const html = response.data;
    const $ = cheerio.load(html);
    const rows = $('#eventList > table > tbody > tr');
    let data = [];
    rows.each(function (index, element) {
        const test = $(this);
        const status = "created"
        const cancelled = test.attr("class") === "canceled";
        const dates = $(this).children("td:nth-child(1)").text();
        const event = $(this).children("td:nth-child(2)").text();
        const eventUrl = $(this).children("td:nth-child(2)").children("a")[0].attribs.href;

        const eventId = eventUrl.match(/(\d+)/)[1];

        const organizers = $(this).children("td:nth-child(3)").children("span");
        const orgs = [];
        organizers.each(function (index, element) {
            orgs.push(($(this).text()));
        });
        const region = $(this).children("td:nth-child(4)").text();
        const discipline = $(this).children("td:nth-child(5)").text();
        const eventClass = $(this).children("td:nth-child(6)").text();
        const eventForm = $(this).children("td:nth-child(7)").text();
        const eventDistance = $(this).children("td:nth-child(8)").text();
        const timeOfEvent = $(this).children("td:nth-child(9)").text();

        let startD;
        let endD;

        if (dates.indexOf("-") >= 0) {
            const parts = dates.split("-");
            const yes = parts.map((p) => {
                return p.trim().substring(3, 9)
            })
            const start = yes[0].split("/");
            const end = yes[1].split("/");
            const startDay = start[0].trim();
            const startMonth = start[1].trim();
            const endDay = end[0].trim();
            const endMonth = end[1].trim();
            startD = new Date(2022,parseInt(startMonth)-1,parseInt(startDay), 11, 30);
            endD = new Date(2022,parseInt(endMonth)-1,parseInt(endDay), 18, 0);

            if (endD <= startD) {
                startD = new Date(2021,parseInt(startMonth)-1,parseInt(startDay), 11, 30);
            }

        } else {
            const yes = dates.trim().substring(3, 8).split("/");
            const startDay = yes[0].trim();
            const startMonth = yes[1].trim();
            startD = new Date(2022,parseInt(startMonth)-1,parseInt(startDay), 11, 30, 0);
            endD = startD;

        }
        const tournament = {
            Id: eventId,
            Status: status,
            StartDateTime: startD,
            EndDateTime: endD,
            IsCancelled: cancelled,
            Organizers: orgs,
            Region: region,
            EventName: event,
            EventForm: eventForm === "" ? "I" : eventForm,
            EventClass: eventClass,
            EventDiscipline: discipline === "" ? "F" : discipline,
            EventDistance: eventDistance,
            TimeOfDay: timeOfEvent === "" ? "D" : timeOfEvent, // D, N or C
        }
        data.push(tournament);
    })
    return data;
}

crawler().then((data) => {
    const promises = data.map((item) => scrapeEventPage(item.Id))
    Promise.all(promises).then((values) => {
        fs.writeFileSync('./data/EventsInfo-11.json', JSON.stringify(values, null, 1));
    });

})

