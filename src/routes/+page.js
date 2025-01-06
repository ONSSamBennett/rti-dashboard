import { base } from "$app/paths";
import { csvParse, autoType } from "d3-dsv";

const dataUrl = `${base}/data/data.csv`;

export async function load({ fetch }) {
    const res = await fetch(dataUrl);
    const str = await res.text();
    const array = csvParse(str, autoType);

    const current = array[array.length - 1];
    const previous = array[array.length - 2];

    const deaths_registered = {
        value: current.number_of_deaths,
        change: current.number_of_deaths - previous.number_of_deaths,
        percent_change: 100 * ((current.number_of_deaths - previous.number_of_deaths) / previous.number_of_deaths)
    };

    const expected_comparison = {
        value: current.number_of_deaths - current.expected_deaths,
        percent_difference: 100 * ((current.number_of_deaths - current.expected_deaths) / current.expected_deaths)
    };

    return { array, current, deaths_registered, expected_comparison };
}