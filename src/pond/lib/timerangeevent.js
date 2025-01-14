/*
 *  Copyright (c) 2016-2017, The Regents of the University of California,
 *  through Lawrence Berkeley National Laboratory (subject to receipt
 *  of any required approvals from the U.S. Dept. of Energy).
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import _ from "underscore";
import Immutable from "immutable";
import Event from "./event";
import TimeRange from "./timerange";
import util from "./base/util";

/**
 * A `TimeRangeEvent` uses a `TimeRange` to specify the range over
 * which the event occurs and maps that to a data object representing
 * some measurements or metrics during that time range.
 *
 * You supply the timerange as a `TimeRange` object.
 *
 * The data is also specified during construction and maybe either:
 *  1) a Javascript object or simple type
 *  2) an Immutable.Map.
 *  3) Simple measurement
 *
 * If an Javascript object is provided it will be stored internally as an
 * Immutable Map. If the data provided is some other simple type (such as an
 * integer) then it will be equivalent to supplying an object of {value: data}.
 * Data may also be undefined.
 *
 * ```
 * const e = new TimeRangeEvent(timerange, data);
 * ```
 *
 * To get the data out of an TimeRangeEvent instance use `data()`.
 * It will return an Immutable.Map. Alternatively you can call `toJSON()`
 * to return a Javascript object representation of the data, while
 * `toString()` will serialize the entire event to a string.
 *
 * **Example:**
 *
 * Given some source of data that looks like this:
 *
 * ```json
 * const event = {
 *     "start_time": "2015-04-22T03:30:00Z",
 *     "end_time": "2015-04-22T13:00:00Z",
 *     "description": "At 13:33 pacific circuit 06519 went down.",
 *     "title": "STAR-CR5 - Outage",
 *     "completed": true,
 *     "external_ticket": "",
 *     "esnet_ticket": "ESNET-20150421-013",
 *     "organization": "Internet2 / Level 3",
 *     "type": "U"
 * }
 * ```
 *
 * We first extract the begin and end times to build a TimeRange:
 *
 * ```js
 * let b = new Date(event.start_time);
 * let e = new Date(event.end_time);
 * let timerange = new TimeRange(b, e);
 * ```
 *
 * Then we combine the TimeRange and the event itself to create the Event.
 *
 * ```js
 * let outageEvent = new TimeRangeEvent(timerange, sampleEvent);
 * ```
 *
 * Once we have an event we can get access the time range with:
 *
 * ```js
 * outageEvent.begin().getTime()   // 1429673400000
 * outageEvent.end().getTime())    // 1429707600000
 * outageEvent.humanizeDuration()) // "10 hours"
 * ```
 *
 * And we can access the data like so:
 *
 * ```js
 * outageEvent.get("title")  // "STAR-CR5 - Outage"
 * ```
 */
class TimeRangeEvent extends Event {
    /**
     * The creation of an TimeRangeEvent is done by combining two parts:
     * the timerange and the data.
     *
     * To construct you specify a TimeRange, along with the data.
     *
     * To specify the data you can supply either:
     *     - a Javascript object containing key values pairs
     *     - an Immutable.Map, or
     *     - a simple type such as an integer. In the case of the simple type
     *       this is a shorthand for supplying {"value": v}.
     */
    constructor(arg1, arg2) {
        super();

        if (arg1 instanceof TimeRangeEvent) {
            const other = arg1;
            this._d = other._d;
            return;
        } else if (arg1 instanceof Buffer) {
            let avroData;
            try {
                avroData = this.schema().fromBuffer(arg1);
            } catch (err) {
                console.error(
                    "Unable to convert supplied avro buffer to event"
                );
            }
            const range = new TimeRange(avroData.timerange);
            const data = new Immutable.Map(avroData.data);
            this._d = new Immutable.Map({ range, data });
            return;
        } else if (arg1 instanceof Immutable.Map) {
            this._d = arg1;
            return;
        }
        const range = util.timeRangeFromArg(arg1);
        const data = util.dataFromArg(arg2);
        this._d = new Immutable.Map({ range, data });
    }

    /**
     * Returns the timerange as a string
     */
    key() {
        return `${+this.timerange().begin()},${+this.timerange().end()}`;
    }

    /**
     * Returns the TimeRangeEvent as a JSON object, converting all
     * Immutable structures in the process.
     */
    toJSON() {
        return {
            timerange: this.timerange().toJSON(),
            data: this.data().toJSON()
        };
    }

    /**
     * For Avro serialization, this defines the event's key (the TimeRange in this case)
     * as an Avro schema (as an array containing the start and end timestamps in this
     * case)
     */
    static keySchema() {
        return { name: "timerange", type: { type: "array", items: "long" } };
    }

    /**
     * Returns a flat array starting with the timestamp, followed by the values.
     */
    toPoint() {
        return [this.timerange().toJSON(), ..._.values(this.data().toJSON())];
    }

    /**
     * The timerange of this data as a `TimeRange` object
     * @return {TimeRange} TimeRange of this data.
     */
    timerange() {
        return this._d.get("range");
    }

    /**
     * The TimeRange of this event, in UTC, as a string.
     * @return {string} TimeRange of this data.
     */
    timerangeAsUTCString() {
        return this.timerange().toUTCString();
    }

    /**
     * The TimeRange of this event, in Local time, as a string.
     * @return {string} TimeRange of this data.
     */
    timerangeAsLocalString() {
        return this.timerange().toLocalString();
    }

    /**
     * The begin time of this Event
     * @return {Data} Begin time
     */
    begin() {
        return this.timerange().begin();
    }

    /**
     * The end time of this Event
     * @return {Data} End time
     */
    end() {
        return this.timerange().end();
    }

    /**
     * Alias for the begin() time.
     * @return {Data} Time representing this Event
     */
    timestamp() {
        return this.begin();
    }

    /**
     * A human friendly version of the duration of this event
     */
    humanizeDuration() {
        return this.timerange().humanizeDuration();
    }
}

export default TimeRangeEvent;
