import { BehaviorSubject, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { v4 as uuid } from "uuid";
import {
  getCurrentInstance,
  inject,
  onBeforeMount,
  onBeforeUnmount,
  onBeforeUpdate,
  onErrorCaptured,
  onMounted,
  onRenderTracked,
  onRenderTriggered,
  onUnmounted,
  onUpdated,
  provide,
} from "vue";

/**
 * get provider's type support
 *
 * @export
 * @template T
 * @param {((new (...args: any[]) => T) | ((...args: any[]) => T))} poly
 * @returns
 */
export function cataly<T>(
  poly: (new (...args: any[]) => T) | ((...args: any[]) => T)
) {
  return (undefined as unknown) as T | undefined;
}

/**
 * defined provider
 *
 * @export
 * @param {string} injectionKey
 * @returns
 */
export function provider(injectionKey: string) {
  return function (target: any, key: string, des: any) {
    let instance: any = undefined;
    if (target.providerKeys__ === undefined) {
      target.providerKeys__ = [];
    }
    target.providerKeys__.push(key);
    des.get = function () {
      if (target.inited__) return instance;
      if (instance === undefined) {
        instance = inject(injectionKey, undefined);
      }
      return instance;
    };
  };
}

export class Lifecycle {
  beforeMount$ = new Subject();
  mounted$ = new Subject();
  beforeUpdate$ = new Subject();
  updated$ = new Subject();
  beforeUnmount$ = new Subject();
  unmounted$ = new Subject();
  errorCaptured$ = new Subject();
  renderTracked$ = new Subject();
  renderTriggered$ = new Subject();
  over$ = this.unmounted$;
  render$ = new Subject();
  constructor() {
    onBeforeMount(() => {
      this.beforeMount$.next();
    });
    onMounted(() => {
      this.mounted$.next();
    });
    onBeforeUpdate(() => {
      this.beforeUpdate$.next();
    });
    onUpdated(() => {
      this.updated$.next();
    });
    onBeforeUnmount(() => {
      this.beforeUnmount$.next();
    });
    onUnmounted(() => {
      this.unmounted$.next();
    });
    onErrorCaptured((err) => {
      this.errorCaptured$.next(err);
    });
    onRenderTracked(() => {
      this.renderTracked$.next();
    });
    onRenderTriggered(() => {
      this.renderTriggered$.next();
    });
  }
}

/**
 * define a poly
 *
 * @export
 * @param {*} target
 * @returns
 */
export function poly(target: any) {
  return class extends target {
    constructor(...params: any[]) {
      super(...params);
      // initialize provider
      if (target.prototype.providerKeys__) {
        target.prototype.providerKeys__.forEach((key: string) => {
          this[key];
        });
      }
      if (this.render$) {
        let instance = getCurrentInstance();
        const subscription = this.render$.subscribe(() => {
          if (!instance) {
            instance = getCurrentInstance();
          }
          if (instance && instance.proxy && instance.proxy.$forceUpdate) {
            instance.proxy.$forceUpdate();
          }
        });
        onUnmounted(() => {
          subscription.unsubscribe();
        });
      }
      // for debug, generate providers tree
      this.children__ = [] as any[];
      const beforePoly: any = inject("poly-node", undefined);
      if (beforePoly) {
        beforePoly.children__.push(this);
      }
      // provide all
      this.id = this.id || uuid();
      provide(this.id, this);
      provide(target.name, this);
      provide("poly-node", this);
      target.prototype.inited__ = true;
    }
  } as any;
}

class Another {
  name = "sfsfs";
}

// exmaple with rx
@poly
class PolyTest1 {
  test$ = new BehaviorSubject("test");
  constructor() {
    this.test$.next("new test");
  }
}

// reactive to template vm
@poly
class PolyTest2 extends Lifecycle {
  test$ = new BehaviorSubject("test");
  constructor() {
    super();
    this.test$.next("new test");
    // subscribe some stream to render$ subject
    this.test$.pipe(takeUntil(this.over$)).subscribe(this.render$);
  }
}

// example with provider
@poly
class PolyTest3 {
  @provider(Another.name)
  get another() {
    return cataly(Another);
  }
  @provider(Another.name)
  get anotherCopy() {
    return cataly(Another);
  }
  constructor() {
    console.log(this.another);
  }
}

// example with provider and lifecycle
@poly
class PolyTest4 extends Lifecycle {
  @provider(Another.name)
  get another() {
    return cataly(Another);
  }
  @provider(Another.name)
  get anotherCopy() {
    return cataly(Another);
  }
  test$ = new BehaviorSubject("test");
  constructor() {
    super();
    this.mounted$.pipe(takeUntil(this.unmounted$)).subscribe(() => {
      console.log("mounted");
      this.test$.next("new test");
    });
    setTimeout(() => {
      this.test$.next("timeout mounted");
    }, 2000);
    this.test$.pipe(takeUntil(this.over$)).subscribe(this.render$);
  }
}
