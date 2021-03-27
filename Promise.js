"use strict";
exports.__esModule = true;
var PromiseStatus;
(function (PromiseStatus) {
    PromiseStatus["PENDING"] = "PENDING";
    PromiseStatus["FULLFILLED"] = "FULLFILLED";
    PromiseStatus["REJECTED"] = "REJECTED";
})(PromiseStatus || (PromiseStatus = {}));
function isFunction(fn) {
    if (!fn) {
        return false;
    }
    return typeof fn === 'function';
}
var MyPromise = /** @class */ (function () {
    function MyPromise(fn) {
        var _this = this;
        this.fullfillCbs = [];
        this.rejectCbs = [];
        this.then = function (onFullfilled, onRejected) {
            var promise = new MyPromise(function () { });
            if (_this.isPending) {
                _this.doPendingThen(onFullfilled, onRejected, promise);
                return promise;
            }
            if (_this.isFullfilled) {
                _this.doFullfilledThen(onFullfilled, promise);
                return promise;
            }
            _this.doRejectedThen(onRejected, promise);
            return promise;
        };
        this["catch"] = function (onRejected) {
            var promise = new MyPromise(function () { });
            _this.doRejectedThen(onRejected, promise);
            return promise;
        };
        this.resolve = function (value) {
            if (_this.isFullfilled || _this.isRejected) {
                return;
            }
            _this.value = value;
            _this.status = PromiseStatus.FULLFILLED;
            _this.excuteCallbacks(_this.fullfillCbs, value);
        };
        this.reject = function (reason) {
            if (_this.isFullfilled || _this.isRejected) {
                return;
            }
            _this.reason = reason;
            _this.status = PromiseStatus.REJECTED;
            _this.excuteCallbacks(_this.rejectCbs, reason);
        };
        this.status = PromiseStatus.PENDING;
        fn(this.resolve, this.reject);
    }
    MyPromise.prototype.resolutionProcedure = function (promise, value) {
        var promiseResolve = promise.resolve;
        var promiseReject = promise.reject;
        if (promise === value) {
            promiseReject(new TypeError('can not resolve promise self'));
            return;
        }
        if (value instanceof MyPromise) {
            this.doValueIsPromiseResolutionProcedure(promise, value);
            return;
        }
        // typeof null === 'object'
        var isFunctionOrObject = value !== null &&
            ['object', 'function'].some(function (type) { return type === typeof value; });
        if (isFunctionOrObject) {
            this.doValueIsObjectResolutionProcedure(promise, value);
            return;
        }
        promiseResolve(value);
    };
    MyPromise.prototype.doValueIsPromiseResolutionProcedure = function (nextPromise, value) {
        var _this = this;
        if (value.isRejected) {
            nextPromise.reject(value.reason);
            return;
        }
        if (value.isFullfilled) {
            this.resolutionProcedure(nextPromise, value.value);
            return;
        }
        value.then(function (value) {
            _this.resolutionProcedure(nextPromise, value);
        }, nextPromise.reject);
    };
    MyPromise.prototype.doValueIsObjectResolutionProcedure = function (nextPromise, value) {
        var promiseResolve = nextPromise.resolve;
        var promiseReject = nextPromise.reject;
        var then;
        try {
            then = value.then;
        }
        catch (err) {
            promiseReject(err);
            return;
        }
        if (!isFunction(then)) {
            promiseResolve(value);
            return;
        }
        this.doValueThenIsFunctionResolutionProcedure(nextPromise, value, then);
    };
    MyPromise.prototype.doValueThenIsFunctionResolutionProcedure = function (nextPromise, value, then) {
        var _this = this;
        var promiseReject = nextPromise.reject;
        var isCalled = false;
        var onFullfilled = function (y) {
            if (isCalled) {
                return;
            }
            isCalled = true;
            try {
                _this.resolutionProcedure(nextPromise, y);
            }
            catch (e) {
                promiseReject(e);
            }
        };
        var onRejected = function (r) {
            if (isCalled) {
                return;
            }
            isCalled = true;
            promiseReject(r);
        };
        try {
            then.call(value, onFullfilled, onRejected);
        }
        catch (e) {
            // 如果在调用过 onFullfilled、onRejected 之后抛出的错误就不再处理了
            !isCalled && promiseReject(e);
        }
    };
    MyPromise.prototype.doPendingThen = function (onFullfilled, onRejected, promise) {
        var wrappedFullfilledCb = this.wrapPendingFullfilledCb(onFullfilled, promise);
        var wrappedRejectedCb = this.wrapPendingRejectedCb(onRejected, promise);
        this.fullfillCbs.push(wrappedFullfilledCb);
        this.rejectCbs.push(wrappedRejectedCb);
    };
    MyPromise.prototype.wrapPendingFullfilledCb = function (onFullfilled, promise) {
        var _this = this;
        return function (value) {
            if (!isFunction(onFullfilled)) {
                promise.resolve(value);
                return;
            }
            try {
                var x = onFullfilled(value);
                _this.resolutionProcedure(promise, x);
            }
            catch (err) {
                promise.reject(err);
            }
        };
    };
    MyPromise.prototype.wrapPendingRejectedCb = function (onRejected, promise) {
        var _this = this;
        return function (reason) {
            if (!isFunction(onRejected)) {
                promise.reject(reason);
                return;
            }
            try {
                var x = onRejected(reason);
                _this.resolutionProcedure(promise, x);
            }
            catch (err) {
                promise.reject(err);
            }
        };
    };
    MyPromise.prototype.doFullfilledThen = function (onFullfilled, promise) {
        var _this = this;
        if (!onFullfilled) {
            setTimeout(function () {
                promise.resolve(_this.value);
            });
            return;
        }
        setTimeout(function () {
            if (!isFunction(onFullfilled)) {
                promise.resolve(_this.value);
                return;
            }
            try {
                var x = onFullfilled(_this.value);
                _this.resolutionProcedure(promise, x);
            }
            catch (err) {
                promise.reject(err);
            }
        });
    };
    MyPromise.prototype.doRejectedThen = function (onRejected, promise) {
        var _this = this;
        if (!onRejected) {
            setTimeout(function () {
                promise.reject(_this.reason);
            });
            return;
        }
        setTimeout(function () {
            if (!isFunction(onRejected)) {
                promise.reject(_this.reason);
                return;
            }
            try {
                var x = onRejected(_this.reason);
                _this.resolutionProcedure(promise, x);
            }
            catch (err) {
                promise.reject(err);
            }
        });
    };
    MyPromise.prototype.excuteCallbacks = function (cbs, data) {
        setTimeout(function () {
            cbs.forEach(function (cb) {
                cb(data);
            });
        });
    };
    Object.defineProperty(MyPromise.prototype, "isPending", {
        get: function () {
            return this.status === PromiseStatus.PENDING;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyPromise.prototype, "isFullfilled", {
        get: function () {
            return this.status === PromiseStatus.FULLFILLED;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MyPromise.prototype, "isRejected", {
        get: function () {
            return this.status === PromiseStatus.REJECTED;
        },
        enumerable: true,
        configurable: true
    });
    return MyPromise;
}());
exports["default"] = MyPromise;
