import { poly } from "../../shared/poly";
import { BehaviorSubject, Observable, from } from "rxjs";
import { map, tap, switchMap } from "rxjs/operators";
import Schema, { FieldErrorList } from "async-validator";

export type FormDataProto = { [key: string]: any } | any[];
export interface ValidationResult<F extends FormDataProto> {
  valid: boolean;
  errorFields: FieldErrorList;
  value: F;
}

@poly({
  print: false,
  reactives: ["model$", "errorFields$", "valid$"],
})
export default class Form<
  F extends FormDataProto,
  R extends { [key: string]: any }
> {
  model$: BehaviorSubject<F>;
  rules$: BehaviorSubject<R>;
  errorFields$ = new BehaviorSubject<FieldErrorList>({});
  valid$ = new BehaviorSubject(false);

  validator$: Observable<Schema>;
  constructor(model: F, rules?: R) {
    this.model$ = new BehaviorSubject(model);
    this.rules$ = new BehaviorSubject(rules || ({} as any));
    this.validator$ = this.rules$.pipe(map((res) => new Schema(res)));
  }
  check(schema: Schema, res: F) {
    return from(
      new Promise<ValidationResult<F>>((resolve) => {
        schema.validate(res, {}, (errors, fields) => {
          if (errors) {
            resolve({ valid: false, errorFields: fields, value: res });
          } else {
            resolve({ valid: true, errorFields: {}, value: res });
          }
        });
      })
    ).pipe(
      tap((res) => {
        this.valid$.next(res.valid);
        this.errorFields$.next(res.errorFields);
      })
    );
  }
  // validate by hand
  validate() {
    return this.validator$.pipe(
      switchMap((schema) => {
        return this.check(schema, this.model$.value);
      })
    );
  }
  // validate by model change
  validateByModel() {
    return this.model$.pipe(
      switchMap((res) => {
        return this.validator$.pipe(
          switchMap((schema) => {
            return this.check(schema, res);
          })
        );
      })
    );
  }
}
