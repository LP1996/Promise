"use strict";
exports.__esModule = true;
var Promise_1 = require("./Promise");
module.exports = {
    // resolved(value: any) {
    //   return new MyPromise(resolve => resolve(value));
    // },
    // rejected(reason: any) {
    //   return new MyPromise((_, reject) => reject(reason));
    // },
    deferred: function () {
        var tempResolve;
        var tempReject;
        var promise = new Promise_1["default"](function (resolve, reject) {
            tempResolve = resolve;
            tempReject = reject;
        });
        return {
            promise: promise,
            resolve: tempResolve,
            reject: tempReject
        };
    }
};
