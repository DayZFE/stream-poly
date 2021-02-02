import { Lifecycle, poly } from "../../shared/poly";
import { BehaviorSubject, from, merge } from "rxjs";
import { tap, switchMap, map, takeUntil } from "rxjs/operators";
import Schema, { FieldErrorList } from "async-validator";

export interface ValidationResult {
  valid: boolean;
  errorFields: FieldErrorList;
  value: any;
}

@poly
export default class Form<
  F extends BehaviorSubject<any>,
  R extends { [key: string]: any }
> extends Lifecycle {
  model$: F;
  errorFields$ = new BehaviorSubject<FieldErrorList>({});
  valid$ = new BehaviorSubject(false);
  touched$ = new BehaviorSubject(false);
  focus$ = new BehaviorSubject(false);
  rules: R | undefined;
  validator = new Schema({});

  blur$ = new BehaviorSubject(true);
  constructor(model: F, rules?: R) {
    super();
    this.model$ = model;
    this.rules = rules;
    if (this.rules) {
      this.validator = new Schema(this.rules);
    }
    // connect focus with blur
    this.focus$
      .pipe(
        takeUntil(this.over$),
        map((el) => !el)
      )
      .subscribe(this.blur$);

    // render with model change and focus change
    merge(this.model$, this.focus$)
      .pipe(takeUntil(this.over$))
      .subscribe(this.render$);
  }
  validate() {
    return from(
      new Promise<ValidationResult>((resolve) => {
        this.validator.validate(this.model$.value, {}, (errors, fields) => {
          if (errors) {
            resolve({
              valid: false,
              errorFields: fields,
              value: this.model$.value,
            });
          } else {
            resolve({ valid: true, errorFields: {}, value: this.model$.value });
          }
        });
      })
    ).pipe(
      tap((res) => {
        this.valid$.next(res.valid);
        this.errorFields$.next(res.errorFields);
        // render while validation
        this.render$.next();
      })
    );
  }
  // validate by model change
  validateByModel() {
    return this.model$.pipe(
      switchMap((model) => {
        return this.validate();
      })
    );
  }
}
