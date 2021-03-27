import MyPromise from './Promise';

export default {
  // resolved(value: any) {
  //   return new MyPromise(resolve => resolve(value));
  // },
  // rejected(reason: any) {
  //   return new MyPromise((_, reject) => reject(reason));
  // },
  deferred() {
    let tempResolve;
    let tempReject;
    const promise = new MyPromise((resolve, reject) => {
      tempResolve = resolve;
      tempReject = reject;
    });

    return {
      promise,
      resolve: tempResolve,
      reject: tempReject
    };
  }
}
