import { base } from "$app/paths";
import { csvParse, autoType } from "d3-dsv";

const dataUrl = `${base}/data/data.csv`;
const holidaysUrl = `${base}/data/bank-holiday.json`;

function nextFriday(date) {
    const offset = (7 + 5 - date.getDay()) % 7;
    return +date + (offset * 1000 * 60 * 60 * 24);
}

export async function load({ fetch }) {
    const str = await (await fetch(dataUrl)).text();
    const array = csvParse(str, autoType);

    const json = await (await fetch(holidaysUrl)).json();
    const holidays = json["england-and-wales"].events
        .map(d => nextFriday(new Date(d.date)))
        .filter(d => d >= +array[0].date && d <= +array[array.length - 1].date);
    
    for (const d of array) d.bank_holiday = holidays.includes(+d.date);

    const current = array[array.length - 1];
    const previous = array[array.length - 2];

    const deaths_registered = {
        value: current.number_of_deaths,
        change: current.number_of_deaths - previous.number_of_deaths,
        percent_change: 100 * ((current.number_of_deaths - previous.number_of_deaths) / previous.number_of_deaths)
    };

    const deaths_registered_england = {
        value: current.num_england,
        change: current.num_england - previous.num_england,
        percent_change: 100 * ((current.num_england - previous.num_england) / previous.num_england)
    };

const covid = {
    value_due_to: current.covid_due_to,
    value_involving: current.covid_with,
    percent_due_to: 100 * (current.covid_due_to / current.number_of_deaths),
    percent_involving: 100 * (current.covid_with / current.number_of_deaths)
 
}
const flu = {
    value_due_to: current.flu_due_to,
    value_involving: current.flu_with,
    percent_due_to: 100 * (current.flu_due_to / current.number_of_deaths),
    percent_involving: 100 * (current.flu_with / current.number_of_deaths)
 
}


    const deaths_registered_wales = {
        value: current.num_wales,
        change: current.num_wales - previous.num_wales,
        percent_change: 100 * ((current.num_wales - previous.num_wales) / previous.num_wales)
    };

    const expected_comparison = {
        value: current.number_of_deaths - current.expected_deaths,
        percent_difference: 100 * ((current.number_of_deaths - current.expected_deaths) / current.expected_deaths)
    };

    const expected_comparison_england = {
        value: current.num_england - current.exp_england,
        percent_difference: 100 * ((current.num_england - current.exp_england) / current.exp_england)
    };

    const expected_comparison_wales = {
        value: current.number_of_deaths - current.expected_deaths,
        percent_difference: 100 * ((current.number_of_deaths - current.expected_deaths) / current.expected_deaths)
    };

    return { array, current, deaths_registered, expected_comparison, expected_comparison_england, deaths_registered_england,expected_comparison_wales, deaths_registered_wales, flu, covid};
}