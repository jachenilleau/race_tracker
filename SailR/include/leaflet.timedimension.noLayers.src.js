/* 
 * Leaflet TimeDimension v1.1.0 - 2017-10-13 
 * 
 * Copyright 2017 Biel Frontera (ICTS SOCIB) 
 * datacenter@socib.es 
 * http://www.socib.es/ 
 * 
 * Licensed under the MIT license. 
 * 
 * Demos: 
 * http://apps.socib.es/Leaflet.TimeDimension/ 
 * 
 * Source: 
 * git://github.com/socib/Leaflet.TimeDimension.git 
 * 
 */
/*jshint indent: 4, browser:true*/
/*global L*/
/*
 * L.TimeDimension: TimeDimension object manages the time component of a layer.
 * It can be shared among different layers and it can be added to a map, and become
 * the default timedimension component for any layer added to the map.
 */

L.TimeDimension = (L.Layer || L.Class).extend({

    includes: (L.Evented || L.Mixin.Events),

    initialize: function (options) {
        L.setOptions(this, options);
        // _availableTimes is an array with all the available times in ms.
        this._availableTimes = this._generateAvailableTimes();
        this._currentTimeIndex = -1;
        this._loadingTimeIndex = -1;
        this._loadingTimeout = this.options.loadingTimeout || 3000;
        this._syncedLayers = [];
        if (this._availableTimes.length > 0) {
            this.setCurrentTime(this.options.currentTime || this._getDefaultCurrentTime());
        }
        if (this.options.lowerLimitTime) {
            this.setLowerLimit(this.options.lowerLimitTime);
        }
        if (this.options.upperLimitTime) {
            this.setUpperLimit(this.options.upperLimitTime);
        }
    },

    getAvailableTimes: function () {
        return this._availableTimes;
    },

    getCurrentTimeIndex: function () {
        if (this._currentTimeIndex === -1) {
            return this._availableTimes.length - 1;
        }
        return this._currentTimeIndex;
    },

    getCurrentTime: function () {
        var index = -1;
        if (this._loadingTimeIndex !== -1) {
            index = this._loadingTimeIndex;
        } else {
            index = this.getCurrentTimeIndex();
        }
        if (index >= 0) {
            return this._availableTimes[index];
        } else {
            return null;
        }
    },

    isLoading: function () {
        return (this._loadingTimeIndex !== -1);
    },

    setCurrentTimeIndex: function (newIndex) {
        var upperLimit = this._upperLimit || this._availableTimes.length - 1;
        var lowerLimit = this._lowerLimit || 0;
        //clamp the value
        newIndex = Math.min(Math.max(lowerLimit, newIndex), upperLimit);
        if (newIndex < 0) {
            return;
        }
        this._loadingTimeIndex = newIndex;
        var newTime = this._availableTimes[newIndex];
        
        if (this._checkSyncedLayersReady(this._availableTimes[this._loadingTimeIndex])) {
            this._newTimeIndexLoaded();
        } else {
            this.fire('timeloading', {
                time: newTime
            });
            // add timeout of 3 seconds if layers doesn't response
            setTimeout((function (index) {
                if (index == this._loadingTimeIndex) {
                    
                    this._newTimeIndexLoaded();
                }
            }).bind(this, newIndex), this._loadingTimeout);
        }

    },

    _newTimeIndexLoaded: function () {
        if (this._loadingTimeIndex === -1) {
            return;
        }
        var time = this._availableTimes[this._loadingTimeIndex];
        
        this._currentTimeIndex = this._loadingTimeIndex;
        this.fire('timeload', {
            time: time
        });
        this._loadingTimeIndex = -1;
    },
    
    _checkSyncedLayersReady: function (time) {
        for (var i = 0, len = this._syncedLayers.length; i < len; i++) {
            if (this._syncedLayers[i].isReady) {
                if (!this._syncedLayers[i].isReady(time)) {
					return false;                    
                }
            }
        }
        return true;
    },
    
    setCurrentTime: function (time) {
        var newIndex = this._seekNearestTimeIndex(time);
        this.setCurrentTimeIndex(newIndex);
    },

    seekNearestTime: function (time) {
        var index = this._seekNearestTimeIndex(time);
        return this._availableTimes[index];
    },

    nextTime: function (numSteps, loop) {
        if (!numSteps) {
            numSteps = 1;
        }
        var newIndex = this._currentTimeIndex;
        var upperLimit = this._upperLimit || this._availableTimes.length - 1;
        var lowerLimit = this._lowerLimit || 0;
        if (this._loadingTimeIndex > -1) {
            newIndex = this._loadingTimeIndex;
        }
        newIndex = newIndex + numSteps;
        if (newIndex > upperLimit) {
            if (!!loop) {
                newIndex = lowerLimit;
            } else {
                newIndex = upperLimit;
            }
        }
        // loop backwards
        if (newIndex < lowerLimit) {
            if (!!loop) {
                newIndex = upperLimit;
            } else {
                newIndex = lowerLimit;
            }
        }
        this.setCurrentTimeIndex(newIndex);
    },

    prepareNextTimes: function (numSteps, howmany, loop) {
        if (!numSteps) {
            numSteps = 1;
        }

        var newIndex = this._currentTimeIndex;
        var currentIndex = newIndex;
        if (this._loadingTimeIndex > -1) {
            newIndex = this._loadingTimeIndex;
        }
        // assure synced layers have a buffer/cache of at least howmany elements
        for (var i = 0, len = this._syncedLayers.length; i < len; i++) {
            if (this._syncedLayers[i].setMinimumForwardCache) {
                this._syncedLayers[i].setMinimumForwardCache(howmany);
            }
        }
        var count = howmany;
        var upperLimit = this._upperLimit || this._availableTimes.length - 1;
        var lowerLimit = this._lowerLimit || 0;
        while (count > 0) {
            newIndex = newIndex + numSteps;
            if (newIndex > upperLimit) {
                if (!!loop) {
                    newIndex = lowerLimit;
                } else {
                    break;
                }
            }
            if (newIndex < lowerLimit) {
                if (!!loop) {
                    newIndex = upperLimit;
                } else {
                    break;
                }
            }
            if (currentIndex === newIndex) {
                //we looped around the timeline
                //no need to load further, the next times are already loading
                break;
            }
            this.fire('timeloading', {
                time: this._availableTimes[newIndex]
            });
            count--;
        }
    },

    getNumberNextTimesReady: function (numSteps, howmany, loop) {
        if (!numSteps) {
            numSteps = 1;
        }

        var newIndex = this._currentTimeIndex;
        if (this._loadingTimeIndex > -1) {
            newIndex = this._loadingTimeIndex;
        }
        var count = howmany;
        var ready = 0;
        var upperLimit = this._upperLimit || this._availableTimes.length - 1;
        var lowerLimit = this._lowerLimit || 0;
        while (count > 0) {
            newIndex = newIndex + numSteps;
            if (newIndex > upperLimit) {
                if (!!loop) {
                    newIndex = lowerLimit;
                } else {
                    count = 0;
                    ready = howmany;
                    break;
                }
            }
            if (newIndex < lowerLimit) {
                if (!!loop) {
                    newIndex = upperLimit;
                } else {
                    count = 0;
                    ready = howmany;
                    break;
                }
            }
            var time = this._availableTimes[newIndex];
            if (this._checkSyncedLayersReady(time)) {
                ready++;
            }
            count--;
        }
        return ready;
    },

    previousTime: function (numSteps, loop) {
        this.nextTime(numSteps*(-1), loop);
    },

    registerSyncedLayer: function (layer) {
        this._syncedLayers.push(layer);
        layer.on('timeload', this._onSyncedLayerLoaded, this);
    },

    unregisterSyncedLayer: function (layer) {
        var index = this._syncedLayers.indexOf(layer);
        if (index != -1) {
            this._syncedLayers.splice(index, 1);
        }
        layer.off('timeload', this._onSyncedLayerLoaded, this);
    },

    _onSyncedLayerLoaded: function (e) {
        if (e.time == this._availableTimes[this._loadingTimeIndex] && this._checkSyncedLayersReady(e.time)) {
            this._newTimeIndexLoaded();
        }
    },

    _generateAvailableTimes: function () {
        if (this.options.times) {
            return L.TimeDimension.Util.parseTimesExpression(this.options.times);
        } else if (this.options.timeInterval) {
            var tiArray = L.TimeDimension.Util.parseTimeInterval(this.options.timeInterval);
            var period = this.options.period || 'P1D';
            var validTimeRange = this.options.validTimeRange || undefined;
            return L.TimeDimension.Util.explodeTimeRange(tiArray[0], tiArray[1], period, validTimeRange);
        } else {
            return [];
        }
    },

    _getDefaultCurrentTime: function () {
        var index = this._seekNearestTimeIndex(new Date().getTime());
        return this._availableTimes[index];
    },

    _seekNearestTimeIndex: function (time) {
        var newIndex = 0;
        var len = this._availableTimes.length;
        for (; newIndex < len; newIndex++) {
            if (time < this._availableTimes[newIndex]) {
                break;
            }
        }
        // We've found the first index greater than the time. Return the previous
        if (newIndex > 0) {
            newIndex--;
        }
        return newIndex;
    },

    setAvailableTimes: function (times, mode) {
        var currentTime = this.getCurrentTime(),
            lowerLimitTime = this.getLowerLimit(),
            upperLimitTime = this.getUpperLimit();

        if (mode == 'extremes') {
            var period = this.options.period || 'P1D';
            this._availableTimes = L.TimeDimension.Util.explodeTimeRange(new Date(times[0]), new Date(times[times.length - 1]), period);
        } else {
            var parsedTimes = L.TimeDimension.Util.parseTimesExpression(times);
            if (this._availableTimes.length === 0) {
                this._availableTimes = parsedTimes;
            } else if (mode == 'intersect') {
                this._availableTimes = L.TimeDimension.Util.intersect_arrays(parsedTimes, this._availableTimes);
            } else if (mode == 'union') {
                this._availableTimes = L.TimeDimension.Util.union_arrays(parsedTimes, this._availableTimes);
            } else if (mode == 'replace') {
                this._availableTimes = parsedTimes;
            } else {
                throw 'Merge available times mode not implemented: ' + mode;
            }
        }

        if (lowerLimitTime) {
            this.setLowerLimit(lowerLimitTime); //restore lower limit
        }
        if (upperLimitTime) {
            this.setUpperLimit(upperLimitTime); //restore upper limit
        }
        this.setCurrentTime(currentTime);
        this.fire('availabletimeschanged', {
            availableTimes: this._availableTimes,
            currentTime: currentTime
        });
        
    },
    getLowerLimit: function () {
        return this._availableTimes[this.getLowerLimitIndex()];
    },
    getUpperLimit: function () {
        return this._availableTimes[this.getUpperLimitIndex()];
    },
    setLowerLimit: function (time) {
        var index = this._seekNearestTimeIndex(time);
        this.setLowerLimitIndex(index);
    },
    setUpperLimit: function (time) {
        var index = this._seekNearestTimeIndex(time);
        this.setUpperLimitIndex(index);
    },
    setLowerLimitIndex: function (index) {
        this._lowerLimit = Math.min(Math.max(index || 0, 0), this._upperLimit || this._availableTimes.length - 1);
        this.fire('limitschanged', {
            lowerLimit: this._lowerLimit,
            upperLimit: this._upperLimit
        });
    },
    setUpperLimitIndex: function (index) {
        this._upperLimit = Math.max(Math.min(index, this._availableTimes.length - 1), this._lowerLimit || 0);
        this.fire('limitschanged', {
            lowerLimit: this._lowerLimit,
            upperLimit: this._upperLimit
        });
    },
    getLowerLimitIndex: function () {
        return this._lowerLimit;
    },
    getUpperLimitIndex: function () {
        return this._upperLimit;
    }
});

L.Map.addInitHook(function () {
    if (this.options.timeDimension) {
        this.timeDimension = L.timeDimension(this.options.timeDimensionOptions || {});
    }
});

L.timeDimension = function (options) {
    return new L.TimeDimension(options);
};

/*
 * L.TimeDimension.Util
 */

L.TimeDimension.Util = {
    getTimeDuration: function(ISODuration) {
        if (typeof nezasa === 'undefined') {
            throw "iso8601-js-period library is required for Leatlet.TimeDimension: https://github.com/nezasa/iso8601-js-period";
        }
        return nezasa.iso8601.Period.parse(ISODuration, true);
    },

    addTimeDuration: function(date, duration, utc) {
        if (typeof utc === 'undefined') {
            utc = true;
        }
        if (typeof duration == 'string' || duration instanceof String) {
            duration = this.getTimeDuration(duration);
        }
        var l = duration.length;
        var get = utc ? "getUTC" : "get";
        var set = utc ? "setUTC" : "set";

        if (l > 0 && duration[0] != 0) {
            date[set + "FullYear"](date[get + "FullYear"]() + duration[0]);
        }
        if (l > 1 && duration[1] != 0) {
            date[set + "Month"](date[get + "Month"]() + duration[1]);
        }
        if (l > 2 && duration[2] != 0) {
            // weeks
            date[set + "Date"](date[get + "Date"]() + (duration[2] * 7));
        }
        if (l > 3 && duration[3] != 0) {
            date[set + "Date"](date[get + "Date"]() + duration[3]);
        }
        if (l > 4 && duration[4] != 0) {
            date[set + "Hours"](date[get + "Hours"]() + duration[4]);
        }
        if (l > 5 && duration[5] != 0) {
            date[set + "Minutes"](date[get + "Minutes"]() + duration[5]);
        }
        if (l > 6 && duration[6] != 0) {
            date[set + "Seconds"](date[get + "Seconds"]() + duration[6]);
        }
    },

    subtractTimeDuration: function(date, duration, utc) {
        if (typeof duration == 'string' || duration instanceof String) {
            duration = this.getTimeDuration(duration);
        }
        var subDuration = [];
        for (var i = 0, l = duration.length; i < l; i++) {
            subDuration.push(-duration[i]);
        }
        this.addTimeDuration(date, subDuration, utc);
    },

    parseAndExplodeTimeRange: function(timeRange) {
        var tr = timeRange.split('/');
        var startTime = new Date(Date.parse(tr[0]));
        var endTime = new Date(Date.parse(tr[1]));
        var duration = tr.length > 2 ? tr[2] : "P1D";

        return this.explodeTimeRange(startTime, endTime, duration);
    },

    explodeTimeRange: function(startTime, endTime, ISODuration, validTimeRange) {
        var duration = this.getTimeDuration(ISODuration);
        var result = [];
        var currentTime = new Date(startTime.getTime());
        var minHour = null,
            minMinutes = null,
            maxHour = null,
            maxMinutes = null;
        if (validTimeRange !== undefined) {
            var validTimeRangeArray = validTimeRange.split('/');
            minHour = validTimeRangeArray[0].split(':')[0];
            minMinutes = validTimeRangeArray[0].split(':')[1];
            maxHour = validTimeRangeArray[1].split(':')[0];
            maxMinutes = validTimeRangeArray[1].split(':')[1];
        }
        while (currentTime < endTime) {
            if (validTimeRange === undefined ||
                (currentTime.getUTCHours() >= minHour && currentTime.getUTCHours() <= maxHour)
            ) {
                if ((currentTime.getUTCHours() != minHour || currentTime.getUTCMinutes() >= minMinutes) &&
                    (currentTime.getUTCHours() != maxHour || currentTime.getUTCMinutes() <= maxMinutes)) {
                    result.push(currentTime.getTime());
                }
            }
            this.addTimeDuration(currentTime, duration);
        }
        if (currentTime >= endTime){
            result.push(endTime.getTime());
        }
        return result;
    },

    parseTimeInterval: function(timeInterval) {
        var parts = timeInterval.split("/");
        if (parts.length != 2) {
            throw "Incorrect ISO9601 TimeInterval: " + timeInterval;
        }
        var startTime = Date.parse(parts[0]);
        var endTime = null;
        var duration = null;
        if (isNaN(startTime)) {
            // -> format duration/endTime
            duration = this.getTimeDuration(parts[0]);
            endTime = Date.parse(parts[1]);
            startTime = new Date(endTime);
            this.subtractTimeDuration(startTime, duration, true);
            endTime = new Date(endTime);
        } else {
            endTime = Date.parse(parts[1]);
            if (isNaN(endTime)) {
                // -> format startTime/duration
                duration = this.getTimeDuration(parts[1]);
                endTime = new Date(startTime);
                this.addTimeDuration(endTime, duration, true);
            } else {
                // -> format startTime/endTime
                endTime = new Date(endTime);
            }
            startTime = new Date(startTime);
        }
        return [startTime, endTime];
    },

    parseTimesExpression: function(times) {
        var result = [];
        if (!times) {
            return result;
        }
        if (typeof times == 'string' || times instanceof String) {
            var timeRanges = times.split(",");
            var timeRange;
            var timeValue;
            for (var i=0, l=timeRanges.length; i<l; i++){
                timeRange = timeRanges[i];
                if (timeRange.split("/").length == 3) {
                    result = result.concat(this.parseAndExplodeTimeRange(timeRange));
                } else {
                    timeValue = Date.parse(timeRange);
                    if (!isNaN(timeValue)) {
                        result.push(timeValue);
                    }
                }
            }
        } else {
            result = times;
        }
        return result.sort(function(a, b) {
            return a - b;
        });
    },

    intersect_arrays: function(arrayA, arrayB) {
        var a = arrayA.slice(0);
        var b = arrayB.slice(0);
        var result = [];
        while (a.length > 0 && b.length > 0) {
            if (a[0] < b[0]) {
                a.shift();
            } else if (a[0] > b[0]) {
                b.shift();
            } else /* they're equal */ {
                result.push(a.shift());
                b.shift();
            }
        }
        return result;
    },

    union_arrays: function(arrayA, arrayB) {
        var a = arrayA.slice(0);
        var b = arrayB.slice(0);
        var result = [];
        while (a.length > 0 && b.length > 0) {
            if (a[0] < b[0]) {
                result.push(a.shift());
            } else if (a[0] > b[0]) {
                result.push(b.shift());
            } else /* they're equal */ {
                result.push(a.shift());
                b.shift();
            }
        }
        if (a.length > 0) {
            result = result.concat(a);
        } else if (b.length > 0) {
            result = result.concat(b);
        }
        return result;
    }

};

/*
 * L.TimeDimension.Player
 */
//'use strict';
L.TimeDimension.Player = (L.Layer || L.Class).extend({

    includes: (L.Evented || L.Mixin.Events),
    initialize: function(options, timeDimension) {
        L.setOptions(this, options);
        this._timeDimension = timeDimension;
        this._paused = false;
        this._buffer = this.options.buffer || 5;
        this._minBufferReady = this.options.minBufferReady || 1;
        this._waitingForBuffer = false;
        this._loop = this.options.loop || false;
        this._steps = 1;
        this._timeDimension.on('timeload', (function(data) {
            this.release(); // free clock
            this._waitingForBuffer = false; // reset buffer
        }).bind(this));
        this.setTransitionTime(this.options.transitionTime || 1000);
        
        this._timeDimension.on('limitschanged availabletimeschanged timeload', (function(data) {
            this._timeDimension.prepareNextTimes(this._steps, this._minBufferReady, this._loop);
        }).bind(this));
    },


    _tick: function() {
        var maxIndex = this._getMaxIndex();
        var maxForward = (this._timeDimension.getCurrentTimeIndex() >= maxIndex) && (this._steps > 0);
        var maxBackward = (this._timeDimension.getCurrentTimeIndex() == 0) && (this._steps < 0);
        if (maxForward || maxBackward) {
            // we reached the last step
            if (!this._loop) {
                this.pause();
                this.stop();
                this.fire('animationfinished');
                return;
            }
        }

        if (this._paused) {
            return;
        }
        var numberNextTimesReady = 0,
            buffer = this._bufferSize;

        if (this._minBufferReady > 0) {
            numberNextTimesReady = this._timeDimension.getNumberNextTimesReady(this._steps, buffer, this._loop);
            // If the player was waiting, check if all times are loaded
            if (this._waitingForBuffer) {
                if (numberNextTimesReady < buffer) {
                    
                    this.fire('waiting', {
                        buffer: buffer,
                        available: numberNextTimesReady
                    });
                    return;
                } else {
                    // all times loaded
                    
                    this.fire('running');
                    this._waitingForBuffer = false;
                }
            } else {
                // check if player has to stop to wait and force to full all the buffer
                if (numberNextTimesReady < this._minBufferReady) {
                    
                    this._waitingForBuffer = true;
                    this._timeDimension.prepareNextTimes(this._steps, buffer, this._loop);
                    this.fire('waiting', {
                        buffer: buffer,
                        available: numberNextTimesReady
                    });
                    return;
                }
            }
        }
        this.pause();
        this._timeDimension.nextTime(this._steps, this._loop);
        if (buffer > 0) {
            this._timeDimension.prepareNextTimes(this._steps, buffer, this._loop);
        }
    },
    
    _getMaxIndex: function(){
       return Math.min(this._timeDimension.getAvailableTimes().length - 1, 
                       this._timeDimension.getUpperLimitIndex() || Infinity);
    },

    start: function(numSteps) {
        if (this._intervalID) return;
        this._steps = numSteps || 1;
        this._waitingForBuffer = false;
        if (this.options.startOver){
            if (this._timeDimension.getCurrentTimeIndex() === this._getMaxIndex()){
                 this._timeDimension.setCurrentTimeIndex(this._timeDimension.getLowerLimitIndex() || 0);
            }
        }
        this.release();
        this._intervalID = window.setInterval(
            L.bind(this._tick, this),
            this._transitionTime);
        this._tick();
        this.fire('play');
        this.fire('running');
    },

    stop: function() {
        if (!this._intervalID) return;
        clearInterval(this._intervalID);
        this._intervalID = null;
        this._waitingForBuffer = false;
        this.fire('stop');
    },

    pause: function() {
        this._paused = true;
    },

    release: function () {
        this._paused = false;
    },

    getTransitionTime: function() {
        return this._transitionTime;
    },

    isPlaying: function() {
        return this._intervalID ? true : false;
    },

    isWaiting: function() {
        return this._waitingForBuffer;
    },
    isLooped: function() {
        return this._loop;
    },

    setLooped: function(looped) {
        this._loop = looped;
        this.fire('loopchange', {
            loop: looped
        });
    },

    setTransitionTime: function(transitionTime) {
        this._transitionTime = transitionTime;
        if (typeof this._buffer === 'function') {
            this._bufferSize = this._buffer.call(this, this._transitionTime, this._minBufferReady, this._loop);
            
        } else {
            this._bufferSize = this._buffer;
        }
        if (this._intervalID) {
            this.stop();
            this.start(this._steps);
        }
        this.fire('speedchange', {
            transitionTime: transitionTime,
            buffer: this._bufferSize
        });
    },

    getSteps: function() {
        return this._steps;
    }
});

/*jshint indent: 4, browser:true*/
/*global L*/

/*
 * L.Control.TimeDimension: Leaflet control to manage a timeDimension
 */

L.UI = L.ui = L.UI || {};
L.UI.Knob = L.Draggable.extend({
    options: {
        className: 'knob',
        step: 1,
        rangeMin: 0,
        rangeMax: 10
            //minValue : null,
            //maxValue : null
    },
    initialize: function(slider, options) {
        L.setOptions(this, options);
        this._element = L.DomUtil.create('div', this.options.className || 'knob', slider);
        L.Draggable.prototype.initialize.call(this, this._element, this._element);
        this._container = slider;
        this.on('predrag', function() {
            this._newPos.y = 0;
            this._newPos.x = this._adjustX(this._newPos.x);
        }, this);
        this.on('dragstart', function() {
            L.DomUtil.addClass(slider, 'dragging');
        });
        this.on('dragend', function() {
            L.DomUtil.removeClass(slider, 'dragging');
        });
        L.DomEvent.on(this._element, 'dblclick', function(e) {
            this.fire('dblclick', e);
        }, this);
        L.DomEvent.disableClickPropagation(this._element);
        this.enable();
    },

    _getProjectionCoef: function() {
        return (this.options.rangeMax - this.options.rangeMin) / (this._container.offsetWidth || this._container.style.width);
    },
    _update: function() {
        this.setPosition(L.DomUtil.getPosition(this._element).x);
    },
    _adjustX: function(x) {
        var value = this._toValue(x) || this.getMinValue();
        return this._toX(this._adjustValue(value));
    },

    _adjustValue: function(value) {
        value = Math.max(this.getMinValue(), Math.min(this.getMaxValue(), value)); //clamp value
        value = value - this.options.rangeMin; //offsets to zero

        //snap the value to the closet step
        value = Math.round(value / this.options.step) * this.options.step;
        value = value + this.options.rangeMin; //restore offset
        value = Math.round(value * 100) / 100; // *100/100 to avoid floating point precision problems

        return value;
    },

    _toX: function(value) {
        var x = (value - this.options.rangeMin) / this._getProjectionCoef();
        //
        return x;
    },

    _toValue: function(x) {
        var v = x * this._getProjectionCoef() + this.options.rangeMin;
        //
        return v;
    },

    getMinValue: function() {
        return this.options.minValue || this.options.rangeMin;
    },
    getMaxValue: function() {
        return this.options.maxValue || this.options.rangeMax;
    },

    setStep: function(step) {
        this.options.step = step;
        this._update();
    },

    setPosition: function(x) {
        L.DomUtil.setPosition(this._element,
            L.point(this._adjustX(x), 0));
        this.fire('positionchanged');
    },
    getPosition: function() {
        return L.DomUtil.getPosition(this._element).x;
    },

    setValue: function(v) {
        //
        this.setPosition(this._toX(v));
    },

    getValue: function() {
        return this._adjustValue(this._toValue(this.getPosition()));
    }
});


/*
 * L.Control.TimeDimension: Leaflet control to manage a timeDimension
 */

L.Control.TimeDimension = L.Control.extend({
    options: {
        styleNS: 'leaflet-control-timecontrol',
        position: 'bottomleft',
        title: 'Time Control',
        backwardButton: true,
        forwardButton: true,
        playButton: true,
        playReverseButton: false,
        loopButton: false,
        displayDate: true,
        timeSlider: true,
        timeSliderDragUpdate: false,
        limitSliders: false,
        limitMinimumRange: 5,
        speedSlider: true,
        minSpeed: 0.1,
        maxSpeed: 10,
        speedStep: 0.1,
        timeSteps: 1,
        autoPlay: false,
        playerOptions: {
            transitionTime: 1000
        }
    },

    initialize: function(options) {
        L.Control.prototype.initialize.call(this, options);
        this._dateUTC = true;
        this._timeDimension = this.options.timeDimension || null;
    },

    onAdd: function(map) {
        var container;
        this._map = map;
        if (!this._timeDimension && map.timeDimension) {
            this._timeDimension = map.timeDimension;
        }
        this._initPlayer();

        container = L.DomUtil.create('div', 'leaflet-bar leaflet-bar-horizontal leaflet-bar-timecontrol');
        if (this.options.backwardButton) {
            this._buttonBackward = this._createButton('Backward', container);
        }
        if (this.options.playReverseButton) {
            this._buttonPlayReversePause = this._createButton('Play Reverse', container);
        }
        if (this.options.playButton) {
            this._buttonPlayPause = this._createButton('Play', container);
        }
        if (this.options.forwardButton) {
            this._buttonForward = this._createButton('Forward', container);
        }
        if (this.options.loopButton) {
            this._buttonLoop = this._createButton('Loop', container);
        }
        if (this.options.displayDate) {
            this._displayDate = this._createButton('Date', container);
        }
        if (this.options.timeSlider) {
            this._sliderTime = this._createSliderTime(this.options.styleNS + ' timecontrol-slider timecontrol-dateslider', container);
        }
        if (this.options.speedSlider) {
            this._sliderSpeed = this._createSliderSpeed(this.options.styleNS + ' timecontrol-slider timecontrol-speed', container);
        }

        this._steps = this.options.timeSteps || 1;

        this._timeDimension.on('timeload',  this._update, this);
        this._timeDimension.on('timeload',  this._onPlayerStateChange, this);
        this._timeDimension.on('timeloading', this._onTimeLoading, this);

        this._timeDimension.on('limitschanged availabletimeschanged', this._onTimeLimitsChanged, this);

        L.DomEvent.disableClickPropagation(container);

        return container;
    },
    addTo: function() {
        //To be notified AFTER the component was added to the DOM
        L.Control.prototype.addTo.apply(this, arguments);
        this._onPlayerStateChange();
        this._onTimeLimitsChanged();
        this._update();
        return this;
    },
    onRemove: function() {
        this._player.off('play stop running loopchange speedchange', this._onPlayerStateChange, this);
        this._player.off('waiting', this._onPlayerWaiting, this);
        //this._player = null;  keep it for later re-add

        this._timeDimension.off('timeload',  this._update, this);
        this._timeDimension.off('timeload',  this._onPlayerStateChange, this);
        this._timeDimension.off('timeloading', this._onTimeLoading, this);
        this._timeDimension.off('limitschanged availabletimeschanged', this._onTimeLimitsChanged, this);
    },

    _initPlayer: function() {
        if (!this._player){ // in case of remove/add
            if (this.options.player) {
                this._player = this.options.player;
            } else {
                this._player = new L.TimeDimension.Player(this.options.playerOptions, this._timeDimension);
            }
        }
        if (this.options.autoPlay) {
            this._player.start(this._steps);
        }
        this._player.on('play stop running loopchange speedchange', this._onPlayerStateChange, this);
        this._player.on('waiting', this._onPlayerWaiting, this);
        this._onPlayerStateChange();
    },

    _onTimeLoading : function(data) {
        if (data.time == this._timeDimension.getCurrentTime()) {
            if (this._displayDate) {
                L.DomUtil.addClass(this._displayDate, 'loading');
            }
        }
    },

    _onTimeLimitsChanged: function() {
        var lowerIndex = this._timeDimension.getLowerLimitIndex(),
            upperIndex = this._timeDimension.getUpperLimitIndex(),
            max = this._timeDimension.getAvailableTimes().length - 1;

        if (this._limitKnobs) {
            this._limitKnobs[0].options.rangeMax = max;
            this._limitKnobs[1].options.rangeMax = max;
            this._limitKnobs[0].setValue(lowerIndex || 0);
            this._limitKnobs[1].setValue(upperIndex || max);
        }
        if (this._sliderTime) {
            this._sliderTime.options.rangeMax = max;
            this._sliderTime._update();
        }
    },

    _onPlayerWaiting: function(evt) {
        if (this._buttonPlayPause && this._player.getSteps() > 0) {
            L.DomUtil.addClass(this._buttonPlayPause, 'loading');
            this._buttonPlayPause.innerHTML = this._getDisplayLoadingText(evt.available, evt.buffer);
        }
        if (this._buttonPlayReversePause && this._player.getSteps() < 0) {
            L.DomUtil.addClass(this._buttonPlayReversePause, 'loading');
            this._buttonPlayReversePause.innerHTML = this._getDisplayLoadingText(evt.available, evt.buffer);
        }
    },
    _onPlayerStateChange: function() {
        if (this._buttonPlayPause) {
            if (this._player.isPlaying() && this._player.getSteps() > 0) {
                L.DomUtil.addClass(this._buttonPlayPause, 'pause');
                L.DomUtil.removeClass(this._buttonPlayPause, 'play');
            } else {
                L.DomUtil.removeClass(this._buttonPlayPause, 'pause');
                L.DomUtil.addClass(this._buttonPlayPause, 'play');
            }
            if (this._player.isWaiting() && this._player.getSteps() > 0) {
                L.DomUtil.addClass(this._buttonPlayPause, 'loading');
            } else {
                this._buttonPlayPause.innerHTML = '';
                L.DomUtil.removeClass(this._buttonPlayPause, 'loading');
            }
        }
        if (this._buttonPlayReversePause) {
            if (this._player.isPlaying() && this._player.getSteps() < 0) {
                L.DomUtil.addClass(this._buttonPlayReversePause, 'pause');
            } else {
                L.DomUtil.removeClass(this._buttonPlayReversePause, 'pause');
            }
            if (this._player.isWaiting() && this._player.getSteps() < 0) {
                L.DomUtil.addClass(this._buttonPlayReversePause, 'loading');
            } else {
                this._buttonPlayReversePause.innerHTML = '';
                L.DomUtil.removeClass(this._buttonPlayReversePause, 'loading');
            }
        }
        if (this._buttonLoop) {
            if (this._player.isLooped()) {
                L.DomUtil.addClass(this._buttonLoop, 'looped');
            } else {
                L.DomUtil.removeClass(this._buttonLoop, 'looped');
            }
        }
        if (this._sliderSpeed && !this._draggingSpeed) {
            var speed =  this._player.getTransitionTime() || 1000;//transitionTime
            speed = Math.round(10000 / speed) /10; // 1s / transition
            this._sliderSpeed.setValue(speed);
        }
    },

    _update: function() {
        if (!this._timeDimension) {
            return;
        }
        if (this._timeDimension.getCurrentTimeIndex() >= 0) {
            var date = new Date(this._timeDimension.getCurrentTime());
            if (this._displayDate) {
                L.DomUtil.removeClass(this._displayDate, 'loading');
                this._displayDate.innerHTML = this._getDisplayDateFormat(date);
            }
            if (this._sliderTime && !this._slidingTimeSlider) {
                this._sliderTime.setValue(this._timeDimension.getCurrentTimeIndex());
            }
        } else {
            if (this._displayDate) {
                this._displayDate.innerHTML = this._getDisplayNoTimeError();
            }
        }
    },

    _createButton: function(title, container) {
        var link = L.DomUtil.create('a', this.options.styleNS + ' timecontrol-' + title.toLowerCase(), container);
        link.href = '#';
        link.title = title;

        L.DomEvent
            .addListener(link, 'click', L.DomEvent.stopPropagation)
            .addListener(link, 'click', L.DomEvent.preventDefault)
            .addListener(link, 'click', this['_button' + title.replace(/ /i, '') + 'Clicked'], this);

        return link;
    },

    _createSliderTime: function(className, container) {
        var sliderContainer,
            sliderbar,
            max,
            knob, limits;
        sliderContainer = L.DomUtil.create('div', className, container);
        /*L.DomEvent
            .addListener(sliderContainer, 'click', L.DomEvent.stopPropagation)
            .addListener(sliderContainer, 'click', L.DomEvent.preventDefault);*/

        sliderbar = L.DomUtil.create('div', 'slider', sliderContainer);
        max = this._timeDimension.getAvailableTimes().length - 1;

        if (this.options.limitSliders) {
            limits = this._limitKnobs = this._createLimitKnobs(sliderbar);
        }
        knob = new L.UI.Knob(sliderbar, {
            className: 'knob main',
            rangeMin: 0,
            rangeMax: max
        });
        knob.on('dragend', function(e) {
            var value = e.target.getValue();
            this._sliderTimeValueChanged(value);
            this._slidingTimeSlider = false;
        }, this);
        knob.on('drag', function(e) {
            this._slidingTimeSlider = true;
            var time = this._timeDimension.getAvailableTimes()[e.target.getValue()];
            if (time) {
                var date = new Date(time);
                if (this._displayDate) {
                  this._displayDate.innerHTML = this._getDisplayDateFormat(date);
                }
                if (this.options.timeSliderDragUpdate){
                    this._sliderTimeValueChanged(e.target.getValue());
                }
            }
        }, this);

        knob.on('predrag', function() {
            var minPosition, maxPosition;
            if (limits) {
                //limits the position between lower and upper knobs
                minPosition = limits[0].getPosition();
                maxPosition = limits[1].getPosition();
                if (this._newPos.x < minPosition) {
                    this._newPos.x = minPosition;
                }
                if (this._newPos.x > maxPosition) {
                    this._newPos.x = maxPosition;
                }
            }
        }, knob);
        L.DomEvent.on(sliderbar, 'click', function(e) {
            if (L.DomUtil.hasClass(e.target, 'knob')) {
                return; //prevent value changes on drag release
            }
            var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e),
                x = L.DomEvent.getMousePosition(first, sliderbar).x;
            if (limits) { // limits exits
                if (limits[0].getPosition() <= x && x <= limits[1].getPosition()) {
                    knob.setPosition(x);
                    this._sliderTimeValueChanged(knob.getValue());
                }
            } else {
                knob.setPosition(x);
                this._sliderTimeValueChanged(knob.getValue());
            }

        }, this);
        knob.setPosition(0);

        return knob;
    },


    _createLimitKnobs: function(sliderbar) {
        L.DomUtil.addClass(sliderbar, 'has-limits');
        var max = this._timeDimension.getAvailableTimes().length - 1;
        var rangeBar = L.DomUtil.create('div', 'range', sliderbar);
        var lknob = new L.UI.Knob(sliderbar, {
            className: 'knob lower',
            rangeMin: 0,
            rangeMax: max
        });
        var uknob = new L.UI.Knob(sliderbar, {
            className: 'knob upper',
            rangeMin: 0,
            rangeMax: max
        });


        L.DomUtil.setPosition(rangeBar, 0);
        lknob.setPosition(0);
        uknob.setPosition(max);

        //Add listeners for value changes
        lknob.on('dragend', function(e) {
            var value = e.target.getValue();
            this._sliderLimitsValueChanged(value, uknob.getValue());
        }, this);
        uknob.on('dragend', function(e) {
            var value = e.target.getValue();
            this._sliderLimitsValueChanged(lknob.getValue(), value);
        }, this);

        //Add listeners to position the range bar
        lknob.on('drag positionchanged', function() {
            L.DomUtil.setPosition(rangeBar, L.point(lknob.getPosition(), 0));
            rangeBar.style.width = uknob.getPosition() - lknob.getPosition() + 'px';
        }, this);

        uknob.on('drag positionchanged', function() {
            rangeBar.style.width = uknob.getPosition() - lknob.getPosition() + 'px';
        }, this);

        //Add listeners to prevent overlaps
        uknob.on('predrag', function() {
            //bond upper to lower
            var lowerPosition = lknob._toX(lknob.getValue() + this.options.limitMinimumRange);
            if (uknob._newPos.x <= lowerPosition) {
                uknob._newPos.x = lowerPosition;
            }
        }, this);

        lknob.on('predrag', function() {
            //bond lower to upper
            var upperPosition = uknob._toX(uknob.getValue() - this.options.limitMinimumRange);
            if (lknob._newPos.x >= upperPosition) {
                lknob._newPos.x = upperPosition;
            }
        }, this);

        lknob.on('dblclick', function() {
            this._timeDimension.setLowerLimitIndex(0);
        }, this);
        uknob.on('dblclick', function() {
            this._timeDimension.setUpperLimitIndex(this._timeDimension.getAvailableTimes().length - 1);
        }, this);

        return [lknob, uknob];
    },


    _createSliderSpeed: function(className, container) {
        var sliderContainer = L.DomUtil.create('div', className, container);
        /* L.DomEvent
            .addListener(sliderContainer, 'click', L.DomEvent.stopPropagation)
            .addListener(sliderContainer, 'click', L.DomEvent.preventDefault);
*/
        var speedLabel = L.DomUtil.create('span', 'speed', sliderContainer);
        var sliderbar = L.DomUtil.create('div', 'slider', sliderContainer);
        var initialSpeed = Math.round(10000 / (this._player.getTransitionTime() || 1000)) / 10;
        speedLabel.innerHTML = this._getDisplaySpeed(initialSpeed);

        var knob = new L.UI.Knob(sliderbar, {
            step: this.options.speedStep,
            rangeMin: this.options.minSpeed,
            rangeMax: this.options.maxSpeed
        });

        knob.on('dragend', function(e) {
            var value = e.target.getValue();
            this._draggingSpeed = false;
            speedLabel.innerHTML = this._getDisplaySpeed(value);
            this._sliderSpeedValueChanged(value);
        }, this);
        knob.on('drag', function(e) {
            this._draggingSpeed = true;
            speedLabel.innerHTML = this._getDisplaySpeed(e.target.getValue());
        }, this);
         knob.on('positionchanged', function (e) {
            speedLabel.innerHTML = this._getDisplaySpeed(e.target.getValue());
        }, this);

        L.DomEvent.on(sliderbar, 'click', function(e) {
            if (e.target === knob._element) {
                return; //prevent value changes on drag release
            }
            var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e),
                x = L.DomEvent.getMousePosition(first, sliderbar).x;
            knob.setPosition(x);
            speedLabel.innerHTML = this._getDisplaySpeed(knob.getValue());
            this._sliderSpeedValueChanged(knob.getValue());
        }, this);
        return knob;
    },

    _buttonBackwardClicked: function() {
        this._timeDimension.previousTime(this._steps);
    },

    _buttonForwardClicked: function() {
        this._timeDimension.nextTime(this._steps);
    },
    _buttonLoopClicked: function() {
        this._player.setLooped(!this._player.isLooped());
    },

    _buttonPlayClicked: function() {
        if (this._player.isPlaying()) {
            this._player.stop();
        } else {
            this._player.start(this._steps);
        }
    },

    _buttonPlayReverseClicked: function() {
        if (this._player.isPlaying()) {
            this._player.stop();
        } else {
            this._player.start(this._steps * (-1));
        }
    },

    _buttonDateClicked: function(){
        this._toggleDateUTC();
    },

    _sliderTimeValueChanged: function(newValue) {
        this._timeDimension.setCurrentTimeIndex(newValue);
    },

    _sliderLimitsValueChanged: function(lowerLimit, upperLimit) {
        this._timeDimension.setLowerLimitIndex(lowerLimit);
        this._timeDimension.setUpperLimitIndex(upperLimit);
    },

    _sliderSpeedValueChanged: function(newValue) {
        this._player.setTransitionTime(1000 / newValue);
    },

    _toggleDateUTC: function() {
        if (this._dateUTC) {
            L.DomUtil.removeClass(this._displayDate, 'utc');
            this._displayDate.title = 'Local Time';
        } else {
            L.DomUtil.addClass(this._displayDate, 'utc');
            this._displayDate.title = 'UTC Time';
        }
        this._dateUTC = !this._dateUTC;
        this._update();
    },

    _getDisplayDateFormat: function(date) {
        return this._dateUTC ? date.toISOString() : date.toLocaleString();
    },
    _getDisplaySpeed: function(fps) {
        return fps + 'fps';
    },
    _getDisplayLoadingText: function(available, buffer) {
        return '<span>' + Math.floor(available / buffer * 100) + '%</span>';
    },
    _getDisplayNoTimeError: function() {
        return 'Time not available';
    }

});

L.Map.addInitHook(function() {
    if (this.options.timeDimensionControl) {
        this.timeDimensionControl = L.control.timeDimension(this.options.timeDimensionControlOptions || {});
        this.addControl(this.timeDimensionControl);
    }
});

L.control.timeDimension = function(options) {
    return new L.Control.TimeDimension(options);
};