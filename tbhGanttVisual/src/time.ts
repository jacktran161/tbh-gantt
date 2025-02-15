//A header lib for date and time fns

import { precisionRound } from "d3";
import { roundOptions } from "./lib";
import * as dayjs from 'dayjs';


////////////////////////////////////////////////////////////////
//  CONSTANTS
////////////////////////////////////////////////////////////////
export const monthArray: string[] = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

export const mmm: string[] = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
];

export const m: string[] = [
    'J',
    'F',
    'M',
    'A',
    'M',
    'J',
    'J',
    'A',
    'S',
    'O',
    'N',
    'D'
];

export const daysPerMonth: number[] = [
    31,
    28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31
];

export const millisPerSecond: number = 1000;
export const secondsPerMinute: number = 60;
export const minutesPerHour: number = 60;
export const hoursPerDay: number = 24;
export const daysPerWeek: number = 7;
export const monthsPerYear: number = 12;
/**
 * The number of days in a non-leap year.
 */
export const daysPerYear: number = 365;

////////////////////////////////////////////////////////////////
//  YEAR TO DAYS
////////////////////////////////////////////////////////////////

/**
 * Returns the number of days in the specified year accounting for leap years.
 * @param year the year to count the days.
 */
export function totalDaysPerYear(year: number): number {
    let y: number = Math.floor(year);//convert to whole number
    if (isLeapYear(y)) { return 366; } else { return 365; }
}

export function remainingDaysInYear(d: dayjs.Dayjs): number {
    return dayjs(new Date(d.year() + 1, 0, 1)).diff(d, 'd', true);
}

export function daysElapsedInYear(d: dayjs.Dayjs): number {
    return d.diff(dayjs(new Date(d.year(), 0, 1)), 'd', true);
}

export function remainingDaysInMonth(d: dayjs.Dayjs): number {
    return dayjs(new Date(d.year(), d.month()+1, 1)).diff(d, 'd', true);
}

export function daysElapsedInMonth(d: dayjs.Dayjs): number {
    return d.diff(dayjs(new Date(d.year(), d.month(), 1)), 'd', true);
}
////////////////////////////////////////////////////////////////
//  SUPPORT FUNCTIONS
////////////////////////////////////////////////////////////////

export function epoch0(): Date {
    return new Date(1970, 1, 1);
}

/**
 * Is the year a leap year?
 * @param year Gregorian and prolaptic Gregorian BCE calendar with defined 0 year.
 * @returns If the year is a leap year.
 */
export function isLeapYear(year: number): boolean {
    return (Math.abs(year) % 4 == 0 && Math.abs(year) % 100 !== 0) || (Math.abs(year) % 400 == 0);
}

/**
 * Returns the number of days in the epoch timeline between two dates.
 * @param start The start date.
 * @param end The end date.
 * @param round Rounds the number of days to the nearest integer. Rounds up if >0, does not round if == 0, rounds down otherwise.
 * @returns the number of days between the two dates rounded down.
 */
export function daysBetween(start: Date, end: Date, round?: number): number {
    if (round > 0) {
        return Math.ceil((end.valueOf() - start.valueOf()) / (
            millisPerSecond *
            secondsPerMinute *
            minutesPerHour *
            hoursPerDay));
    } else if ((round == 0) || (round == undefined)) {
        return (end.valueOf() - start.valueOf()) / (
            millisPerSecond *
            secondsPerMinute *
            minutesPerHour *
            hoursPerDay);
    } else {
        return Math.floor((end.valueOf() - start.valueOf()) / (
            millisPerSecond *
            secondsPerMinute *
            minutesPerHour *
            hoursPerDay));
    }

}

/**
 * Returns the number of months between two dates. TODO ROUND OPTIONS
 * @param start The start date.
 * @param end The end date.
 * @param round Rounds the number of months to the nearest integer. Rounds up if >0, does not round if == 0, rounds down otherwise.
 * @returns the number of days between the two dates rounded down.
 */
export function monthsBetween(start: Date, end: Date, round?: number): number {
    //let t: number = end.valueOf() - start.valueOf();
    let m: number[] = [start.getMonth(), end.getMonth()];

    //if they are in the same month
    if (m[0] == m[1]) {
        if (isLeapYear(start.getFullYear()) && m[0] == 1) { //we are in a leap february
            return roundOptions(
                (daysPerMonth[m[0]] + 1) *
                ((end.valueOf() - start.valueOf()) /
                    (millisPerSecond * secondsPerMinute * minutesPerHour * hoursPerDay))
                , round);
        } else {
            return roundOptions(daysPerMonth[m[0]] *
                ((end.valueOf() - start.valueOf()) /
                    (millisPerSecond * secondsPerMinute * minutesPerHour * hoursPerDay))
                , round);
        }
    }

    //if they are in the same year
    if (yearsBetween(start, end, 0) < 1) {
        //proportion of first month
        let t: number = monthsBetween(start, new Date(start.getFullYear(),
            start.getMonth() + 1, 1, 0, 0, 0, 0), 0);

        //guard clause check that our for loop will run more then once
        if (m[1] - m[0] == 1) {//we only have one more month left, add the proportion of the second month
            return roundOptions(t + monthsBetween(end, new Date(end.getFullYear(),
                end.getMonth() + 1, 1, 0, 0, 0, 0), 0), round);
        }

        //there are more than 2 months left
        //sum from the second month onwards to the second to last month
        for (let i = m[0] + 1; i < m[1] - 1; i++) {
            t += daysPerMonth[i];
        }

        //return and add the last proportion of the last month
        return roundOptions(t + monthsBetween(new Date(end.getFullYear(),
            end.getMonth() + 1, 1, 0, 0, 0, 0), end, 0), round);
    }

    //they are not in the same year
    //get the year number difference and proceed like with the above if statement

    //the months between now and the end of the year
    let t: number = monthsBetween(start, new Date(start.getFullYear() + 1, 0, 1, 0, 0, 0, 0));
    let y: number[] = [end.getFullYear(), start.getFullYear()]

    //if there are only 2 years spanned
    if (y[1] - y[0] == 1) {
        //add the time between the start of the last year and the end date
        return roundOptions(t + monthsBetween(new Date(end.getFullYear(), 0, 1, 0, 0, 0, 0), end, 0)
            , round);
    }

    //there are more than 2 years left
    t += ((m[1] - m[0]) - 2) * 12; //ignore the start and end years

    //return and add the proportion of the last year
    return roundOptions(t + monthsBetween(new Date(end.getFullYear(), 0, 1, 0, 0, 0, 0), end, 0)
        , round);
}

/**
 * Returns the number of years between two dates. NOT FULLY IMPLEMENTED
 * @param start The start date.
 * @param end The end date.
 * @param round Rounds the number of years to the nearest integer. Rounds up if >0, does not round if == 0, rounds down otherwise.
 * @returns the number of days between the two dates rounded down.
 */
export function yearsBetween(start: Date, end: Date, round?: number): number {
    //TODO get partial years
    return roundOptions(end.getFullYear() - start.getFullYear(), round);
}


// export function numberOfLeapYearsBetween(startDay: number, endDay: number): number {
//     //todo
//     return 0;
// }

//BADLY NAMED
// export function date(dayIndex: number): string {
//     return '0000-00-00T00:00:00';
// }

// export function year(dayIndex: number): number {
//     var deltaYears = Math.floor(dayIndex / totalDaysPerYear(2001));

//     return 1970 + Math.floor(dayIndex / totalDaysPerYear(2001));
// }

// export function month(dayIndex: number): string {
//     return '0000-00-00T00:00:00';
// }

// export function day(dayIndex: number): string {
//     return '0000-00-00T00:00:00';
// }