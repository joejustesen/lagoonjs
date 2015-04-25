
var moment = require("moment");
var _ = require("underscore");

var TimeRange = require("./range");
var Bucket = require("./bucket");

var units = {
    "s": {"label": "seconds", "length": 1},
    "m": {"label": "minutes", "length": 60},
    "h": {"label": "hours", "length": 60*60},
    "d": {"label": "days", "length": 60*60*24}
}


/**
 * A BucketGenerator
 *
 * To use a BucketGenerator you supply the size of the buckets you want
 * e.g. "1h" for hourly. Then you call bucket() as needed, each time
 * with a date. The bucket containing that date will be returned.
 *
 * Buckets can then be used to aggregate data.
 *
 * @param {string} size The size of the bucket (e.g. 1d, 6h, 5m, 30s)
 */
class Generator {

    constructor(size) {
        this.size = size;
        this.length = Generator.getLengthFromSize(size);
    }

    /**
     * Takes the size (e.g. 1d, 6h, 5m, 30s) and returns the length
     * of the bucket in ms.
     */
    static getLengthFromSize(size) {
        var num, unit, length;

        //size should be two parts, a number and a letter. From the size
        //we can get the length
        var re = /([0-9]+)([smhd])/;
        var parts = re.exec(size);
        if (parts && parts.length >= 3) {
            num = parseInt(parts[1]);
            unit = parts[2];
            length = num * units[unit].length * 1000;
        }
        return length;
    }


    static getBucketPosFromDate(date, length) {
        //console.log("getBucketPosFromDate", date)
        var dd = moment.utc(date).valueOf();
        return parseInt(dd/=length, 10);
    }

    bucketIndex(date) {
        var pos = Generator.getBucketPosFromDate(date, this.length);
        var index = this.size + "-" + pos;
        return index;
    }

    /**
     * Date in is assumed to be local and that the bucket will be
     * created in UTC time. Note that this doesn't really matter
     * for seconds, minutes, or hours. But days will be offset from
     * midnight to midnight, depending on local timezone.
     */
    bucket(date) {
        var index = this.bucketIndex(date);
        return new Bucket(index);
    }
}

module.exports = Generator;