import { BehaviorSubject } from "rxjs";
import { distinctUntilChanged, pluck, takeUntil } from "rxjs/operators";
import { cataly, Lifecycle, poly, provider } from "../../shared/poly";
import { get, set } from "lodash";
import Form from "./Form";
import FormItem from "./FormItem";

@poly
export default class Input<T> extends Lifecycle {
  @provider(Form.name)
  get form() {
    return cataly(Form);
  }
  @provider(FormItem.name)
  get formitem() {
    return cataly(FormItem);
  }
  value$: BehaviorSubject<T>;
  standalone = true;
  disabled$ = new BehaviorSubject(false);
  constructor(defaultValue: T) {
    super();
    this.value$ = new BehaviorSubject(defaultValue);
    if (this.form !== undefined && this.formitem !== undefined) {
      this.standalone = false;
      const key = this.formitem.key;
      const keyArr = key.split(".");
      // form value is superior
      const formDefault = get(this.form.model$.value, keyArr);
      this.value$.next(formDefault);
      // value change
      this.value$
        .pipe(takeUntil(this.over$), distinctUntilChanged())
        .subscribe((res) => {
          this.render$.next();
          if (!this.form) return;
          set(this.form.model$.value, keyArr, res);
          this.form.model$.next({ ...this.form.model$.value });
        });
    }
  }
}
