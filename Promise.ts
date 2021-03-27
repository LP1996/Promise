type resolve = (value: any) => void;
type reject = (error: any) => void;
type PromiseFn = (resolve: resolve, reject: reject) => void;
type callback = (...args: any[]) => void;

enum PromiseStatus {
  PENDING = 'PENDING',
  FULLFILLED = 'FULLFILLED',
  REJECTED = 'REJECTED'
}

function isFunction(fn: any) {
  if (!fn) {
    return false;
  }

  return typeof fn === 'function';
}

class MyPromise {
  private status: PromiseStatus;
  private value: any;
  private reason: any;
  private fullfillCbs: callback[] = [];
  private rejectCbs: callback[] = [];

  constructor(fn: PromiseFn) {
    this.status = PromiseStatus.PENDING;
    fn(this.resolve, this.reject);
  }

  public then = (onFullfilled?: any, onRejected?: any) => {
    const promise = new MyPromise(() => {});

    if (this.isPending) {
      this.doPendingThen(onFullfilled, onRejected, promise);
      return promise;
    }

    if (this.isFullfilled) {
      this.doFullfilledThen(onFullfilled, promise);
      return promise;
    }

    this.doRejectedThen(onRejected, promise);

    return promise;
  }

  public catch = (onRejected: any) => {
    const promise = new MyPromise(() => {});
    this.doRejectedThen(onRejected, promise);
    return promise;
  }

  public resolve = (value: any) => {
    if (this.isFullfilled || this.isRejected) {
      return;
    }

    this.value = value;
    this.status = PromiseStatus.FULLFILLED;
    this.excuteCallbacks(this.fullfillCbs, value);
  }

  public reject = (reason: any) => {
    if (this.isFullfilled || this.isRejected) {
      return;
    }

    this.reason = reason;
    this.status = PromiseStatus.REJECTED;
    this.excuteCallbacks(this.rejectCbs, reason);
  }

  private resolutionProcedure(promise: MyPromise, value: any) {
    const promiseResolve = promise.resolve;
    const promiseReject = promise.reject;

    if (promise === value) {
      promiseReject(new TypeError('can not resolve promise self'));
      return;
    }

    if (value instanceof MyPromise) {
      this.doValueIsPromiseResolutionProcedure(promise, value);
      return;
    }

    // typeof null === 'object'
    const isFunctionOrObject = value !== null &&
      ['object', 'function'].some(type => type === typeof value);
    if (isFunctionOrObject) {
      this.doValueIsObjectResolutionProcedure(promise, value);
      return;
    }

    promiseResolve(value);
  }

  private doValueIsPromiseResolutionProcedure(nextPromise: MyPromise, value: MyPromise) {
    if (value.isRejected) {
      nextPromise.reject(value.reason);
      return;
    }

    if (value.isFullfilled) {
      this.resolutionProcedure(nextPromise, value.value);
      return;
    }

    value.then(
      (value: any) => {
        this.resolutionProcedure(nextPromise, value);
      },
      nextPromise.reject
    );
  }

  private doValueIsObjectResolutionProcedure(nextPromise: MyPromise, value: (Function | object) & { then: any }) {
    const promiseResolve = nextPromise.resolve;
    const promiseReject = nextPromise.reject;

    let then;
    try {
      then = value.then;
    } catch (err) {
      promiseReject(err);
      return;
    }

    if (!isFunction(then)) {
      promiseResolve(value);
      return;
    }

    this.doValueThenIsFunctionResolutionProcedure(nextPromise, value, then);
  }

  private doValueThenIsFunctionResolutionProcedure(nextPromise: MyPromise, value: any, then: Function) {
    const promiseReject = nextPromise.reject;

    let isCalled = false;
    const onFullfilled = (y: any) => {
      if (isCalled) {
        return;
      }

      isCalled = true;

      try {
        this.resolutionProcedure(nextPromise, y);
      } catch (e) {
        promiseReject(e);
      }
    };

    const onRejected = (r: any) => {
      if (isCalled) {
        return;
      }

      isCalled = true;
      promiseReject(r);
    };

    try {
      then.call(
        value,
        onFullfilled,
        onRejected
      );
    } catch (e) {
      // 如果在调用过 onFullfilled、onRejected 之后抛出的错误就不再处理了
      !isCalled && promiseReject(e);
    }
  }

  private doPendingThen(onFullfilled: any, onRejected: any, promise: MyPromise) {
    const wrappedFullfilledCb = this.wrapPendingFullfilledCb(onFullfilled, promise);
    const wrappedRejectedCb = this.wrapPendingRejectedCb(onRejected, promise);

    this.fullfillCbs.push(wrappedFullfilledCb);
    this.rejectCbs.push(wrappedRejectedCb);
  }

  private wrapPendingFullfilledCb(onFullfilled: any, promise: MyPromise) {
    return (value: any) => {
      if (!isFunction(onFullfilled)) {
        promise.resolve(value);
        return;
      }

      try {
        const x = onFullfilled(value);
        this.resolutionProcedure(promise, x);
      } catch (err) {
        promise.reject(err);
      }
    };
  }

  private wrapPendingRejectedCb(onRejected: any, promise: MyPromise) {
    return (reason: any) => {
      if (!isFunction(onRejected)) {
        promise.reject(reason);
        return;
      }

      try {
        const x = onRejected(reason);
        this.resolutionProcedure(promise, x);
      } catch (err) {
        promise.reject(err);
      }
    }
  }

  private doFullfilledThen(onFullfilled: any, promise: MyPromise) {
    if (!onFullfilled) {
      setTimeout(() => {
        promise.resolve(this.value);
      });
      return;
    }

    setTimeout(() => {
      if (!isFunction(onFullfilled)) {
        promise.resolve(this.value);
        return;
      }

      try {
        const x = onFullfilled(this.value);
        this.resolutionProcedure(promise, x);
      } catch (err) {
        promise.reject(err);
      }
    });
  }

  private doRejectedThen(onRejected: any, promise: MyPromise) {
    if (!onRejected) {
      setTimeout(() => {
        promise.reject(this.reason);
      });
      return;
    }

    setTimeout(() => {
      if (!isFunction(onRejected)) {
        promise.reject(this.reason);
        return;
      }

      try {
        const x = onRejected(this.reason);
        this.resolutionProcedure(promise, x);
      } catch (err) {
        promise.reject(err);
      }
    });
  }

  private excuteCallbacks(cbs: callback[], data: any) {
    setTimeout(() => {
      cbs.forEach(cb => {
        cb(data)
      });
    });
  }

  private get isPending() {
    return this.status === PromiseStatus.PENDING;
  }

  private get isFullfilled() {
    return this.status === PromiseStatus.FULLFILLED;
  }

  private get isRejected() {
    return this.status === PromiseStatus.REJECTED;
  }
}

export default MyPromise;
