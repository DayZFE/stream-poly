import { BehaviorSubject } from "rxjs";
import { distinctUntilChanged, map, pluck, takeUntil } from "rxjs/operators";
import { cataly, Lifecycle, poly, provider } from "../../shared/poly";
import Form from "./Form";

@poly
export default class FormItem extends Lifecycle {
  @provider(Form.name)
  get form() {
    return cataly(Form);
  }
  errors$ = new BehaviorSubject<string | undefined>(undefined);
  key = "";
  constructor(key: string) {
    super();
    if (this.form === undefined) {
      throw new Error("[poly]form item must used under form");
    }
    this.key = key;
    this.form.errorFields$
      .pipe(
        takeUntil(this.over$),
        pluck(key),
        map((el: any) => (el && el.message ? el.message : undefined)),
        distinctUntilChanged()
      )
      .subscribe((res) => {
        this.errors$.next(res);
        this.render$.next();
      });
  }
}
