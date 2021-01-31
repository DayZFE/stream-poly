import { v4 as uuid } from "uuid";
import { BehaviorSubject, Subscription } from "rxjs";
import { getCurrentInstance, inject, onUnmounted, provide } from "vue";

/**
 * poly root to analysis
 *
 * @export
 * @class PolyRoot
 */
export class PolyRoot {
  children__: any[] = [];
  constructor() {
    provide("ploy-node", this);
  }
}

/**
 * poly meta config
 *
 * @export
 * @interface PolyMeta
 */
export interface PolyMeta {
  print?: boolean;
  reactives?: string[];
  deps?: { key: string; value: string };
}

/**
 * poly descriptor
 *
 * @export
 * @template T
 * @param {PolyMeta} [meta]
 * @returns
 */
export function poly<T extends new (...args: any[]) => any>(meta?: PolyMeta) {
  return function (target: T) {
    return class extends target {
      tokenId = uuid();
      logicId = target.name;
      // child injection
      children__: any[] = [];
      private reactives = meta?.reactives || [];
      private print = meta?.print || false;
      private deps: { key: string; value: string }[] =
        meta?.deps || ([] as any);

      private subscribers: { key: string; value: BehaviorSubject<any> }[] = [];
      private subscriptions: { key: string; value: Subscription }[] = [];
      constructor(...args: any[]) {
        super(...args);
        // handle injections
        for (let item of this.deps) {
          this[item.key] = inject(item.value, undefined);
          if (this.print && this[item.key] === undefined) {
            console.warn(`[poly] lose link to dep - ${item.key}`);
          }
        }
        // handle subscribers
        for (let key of this.reactives) {
          if (
            key[key.length - 1] === "$" &&
            this[key] instanceof BehaviorSubject
          ) {
            this.subscribers.push({ key, value: this[key] });
          } else if (this.print) {
            console.warn(
              `[poly] only BehaviorSubject will react to view, wrong key - ${key}`
            );
          }
        }
        for (let item of this.subscribers) {
          const instance = getCurrentInstance();
          const subscription = item.value.subscribe((res) => {
            // force update for behavior subject's subscription
            if (instance && instance.proxy && instance.proxy.$forceUpdate) {
              instance.proxy.$forceUpdate();
            }
            if (this.print) {
              console.log(
                `[poly]${this.logicId}[${this.tokenId}] subscription: ${item.key}:`
              );
              console.dir(res);
            }
          });
          this.subscriptions.push({ key: item.key, value: subscription });
        }
        // handle unsubscribe
        onUnmounted(() => {
          for (let subscription of this.subscriptions) {
            subscription.value.unsubscribe();
          }
        });
        // handle analysis support
        const beforeNode: any = inject("poly-node", undefined);
        if (beforeNode !== undefined && beforeNode.children__) {
          beforeNode.children__.push(this);
        }
        // handle provide
        provide(this.tokenId, this);
        provide(this.logicId, this);
        // provide a poly node to analysis
        provide("poly-node", this);
      }
    };
  };
}
