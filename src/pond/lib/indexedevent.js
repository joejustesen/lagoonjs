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
import Index from "./index";
import Event from "./event";
import util from "./base/util";

/**
 * An `IndexedEvent` uses an `Index` to specify a timerange over which the event
 * occurs and maps that to a data object representing some measurement or metric
 * during that time range.
 *
 * You can supply the index as a string or as an Index object.
 *
 * Example Indexes are:
 *  * 1d-1565 is the entire duration of the 1565th day since the UNIX epoch
 *  * 2014-03 is the entire duration of march in 2014
 *
 * The range, as expressed by the `Index`, is provided by the convenience method
 * `range()`, which returns a `TimeRange` instance. Alternatively the begin
 * and end times represented by the Index can be found with `begin()`
 * and `end()` respectively.
 *
 * The data is also specified during construction, and is generally expected to
 * be an object or an Immutable Map. If an object is provided it will be stored
 * internally as an Immutable Map. If the data provided is some other type then
 * it will be equivalent to supplying an object of `{value: data}`. Data may be
 * undefined.
 *
 * The get the data out of an IndexedEvent instance use `data()`. It will return
 * an Immutable.Map.
 */
class IndexedEvent extends Event {
    /**
     * The creation of an IndexedEvent is done by combining two parts:
     * the Index and the data.
     *
     * To construct you specify an Index, along with the data.
     *
     * The index may be an Index, or a string.
     *
     * To specify the data you can supply either:
     *     - a Javascript object containing key values pairs
     *     - an Immutable.Map, or
     *     - a simple type such as an integer. In the case of the simple type
     *       this is a shorthand for supplying {"value": v}.
     */
    constructor(arg1, arg2, arg3) {
        super();

        if (arg1 instanceof IndexedEvent) {
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

            this._d = new Immutable.Map();
            this._d = this._d.set("index", new Index(avroData.index));
            this._d = this._d.set("data", new Immutable.Map(avroData.data));
            return;
        } else if (arg1 instanceof Immutable.Map) {
            this._d = arg1;
            return;
        }
        const index = util.indexFromArgs(arg1, arg3);
        const data = util.dataFromArg(arg2);
        this._d = new Immutable.Map({ index, data });
    }

    /**
     * Returns the timestamp (as ms since the epoch)
     */
    key() {
        return this.indexAsString();
    }

    /**
     * For Avro serialization, this defines the event's key (the Index)
     * as a simple string
     */
    static keySchema() {
        return { name: "index", type: "string" };
    }

    /**
     * Express the IndexedEvent as a JSON object
     */
    toJSON() {
        return { index: this.indexAsString(), data: this.data().toJSON() };
    }

    /**
     * Returns a flat array starting with the index, followed by the values.
     */
    toPoint() {
        return [this.indexAsString(), ..._.values(this.data().toJSON())];
    }

    /**
     * Returns the Index associated with the data in this Event
     * @return {Index} The Index
     */
    index() {
        return this._d.get("index");
    }

    /**
     * Returns the Index as a string, same as event.index().toString()
     * @return {string} The Index
     */
    indexAsString() {
        return this.index().asString();
    }

    /**
     * The TimeRange of this data, in UTC, as a string.
     * @return {string} TimeRange of this data.
     */
    timerangeAsUTCString() {
        return this.timerange().toUTCString();
    }

    /**
     * The TimeRange of this data, in Local time, as a string.
     * @return {string} TimeRange of this data.
     */
    timerangeAsLocalString() {
        return this.timerange().toLocalString();
    }

    /**
     * The TimeRange of this data
     * @return {TimeRange} TimeRange of this data.
     */
    timerange() {
        return this.index().asTimerange();
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
}

export default IndexedEvent;
