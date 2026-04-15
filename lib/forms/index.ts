import { current, directive, DomElement, setAttribute, VnodeWithDom } from "valyrian.js";
import { createPulseStore } from "valyrian.js/pulses";
import { hasLength, isString } from "valyrian.js/utils";
import { SchemaShield, ValidationError, Validator } from "schema-shield";

type JsonSchema = Record<string, unknown>;
export type FormState = Record<string, unknown>;

export type FormTransform<TState extends FormState> = (value: unknown, state: TState) => unknown;

export type FormTransformMap<TState extends FormState> = Partial<Record<keyof TState | string, FormTransform<TState>>>;

export type FormOptions<TState extends FormState> = {
  state: TState;
  schema: JsonSchema;
  clean?: FormTransformMap<TState>;
  format?: FormTransformMap<TState>;
  onSubmit?: (values: TState) => Promise<void> | void;
};

type FormInternalState<TState extends FormState> = {
  values: TState;
  validationErrors: Record<string, string>;
  submitError: unknown;
  success: boolean;
  isInflight: boolean;
  isDirty: boolean;
};

type FormPulseStore<TState extends FormState> = {
  state: FormInternalState<TState>;
  setField: (name: string, value: unknown) => void;
  setSubmitError: (error: unknown) => void;
  setSuccess: (success: boolean) => void;
  validate: () => boolean;
  setInflight: (inflight: boolean) => void;
  reset: () => void;
};

function getFieldNameFromError(error: ValidationError) {
  const path = String(error.getPath().instancePath || "");
  if (path.startsWith("#/")) {
    const token = path.slice(2).split("/")[0];
    if (token.length > 0) {
      return token.replace(/~1/g, "/").replace(/~0/g, "~");
    }
  }

  if (isString(error.item)) {
    return error.item;
  }

  return null;
}

function getFieldNameFromChain(error: ValidationError) {
  let current: ValidationError | undefined = error;
  while (current) {
    const fieldName = getFieldNameFromError(current);
    if (fieldName) {
      return fieldName;
    }
    current = current.cause;
  }
  return null;
}

function getRootError(error: ValidationError) {
  let current: ValidationError = error;
  while (current.cause) {
    current = current.cause;
  }
  return current;
}

export const formSchemaShield = new SchemaShield({
  failFast: false,
  immutable: false
});

function mapValidationError(error: ValidationError | true | null) {
  if (!error) {
    return {};
  }

  if (error === true) {
    return { _form: "Invalid form data" };
  }

  const fieldName = getFieldNameFromChain(error);
  const rootError = getRootError(error);
  const message = rootError.message || "Invalid form data";

  if (!fieldName) {
    return { _form: message };
  }

  return { [fieldName]: message };
}

export class FormStore<TState extends FormState> {
  private validator: Validator;
  private onSubmit: ((values: TState) => Promise<void> | void) | null;
  private clean: FormTransformMap<TState>;
  private format: FormTransformMap<TState>;
  private pulseStore: FormPulseStore<TState>;
  private metaState: Omit<FormInternalState<TState>, "values" | "isDirty">;

  static get schemaShield() {
    return formSchemaShield;
  }

  constructor(options: FormOptions<TState>) {
    this.validator = formSchemaShield.compile(options.schema);
    this.onSubmit = options.onSubmit || null;
    this.clean = options.clean || {};
    this.format = options.format || {};
    this.metaState = {
      validationErrors: {},
      submitError: null,
      success: false,
      isInflight: false
    };

    const getValidationErrors = (values: TState) => {
      const result = this.validator(values);
      return result.valid ? {} : mapValidationError(result.error);
    };

    const initialValues = options.state;

    this.pulseStore = createPulseStore(
      {
        values: initialValues,
        validationErrors: {},
        submitError: null,
        success: false,
        isInflight: false,
        isDirty: false
      },
      {
        setField(state, name, value) {
          (state.values as FormState)[name] = value;
          state.isDirty = true;
          state.success = false;
        },
        setSubmitError(state, error) {
          state.submitError = error;
        },
        setSuccess(state, success) {
          state.success = success;
        },
        validate(state) {
          state.validationErrors = getValidationErrors(state.values);
          return Object.keys(state.validationErrors).length === 0;
        },
        setInflight(state, inflight) {
          state.isInflight = inflight;
        },
        reset(state) {
          state.values = initialValues;
          state.validationErrors = {};
          state.submitError = null;
          state.success = false;
          state.isInflight = false;
          state.isDirty = false;
        }
      }
    ) as unknown as FormPulseStore<TState>;
  }

  get state() {
    return this.pulseStore.state.values;
  }

  get validationErrors() {
    return this.metaState.validationErrors;
  }

  get submitError() {
    return this.metaState.submitError;
  }

  get success() {
    return this.metaState.success;
  }

  get isInflight() {
    return this.metaState.isInflight;
  }

  get isDirty() {
    return this.pulseStore.state.isDirty;
  }

  get hasValidationErrors() {
    return Object.keys(this.metaState.validationErrors || {}).length > 0;
  }

  get hasSubmitError() {
    return this.metaState.submitError !== null;
  }

  private isDelegatedSubmitEvent(event?: Event) {
    return Boolean(current.event && (!event || current.event === event));
  }

  private setValidationErrors(validationErrors: Record<string, string>, event?: Event) {
    this.metaState.validationErrors = validationErrors;

    if (!this.isDelegatedSubmitEvent(event)) {
      this.pulseStore.validate();
    }

    return Object.keys(validationErrors).length === 0;
  }

  private setInflight(inflight: boolean, event?: Event) {
    this.metaState.isInflight = inflight;

    if (!this.isDelegatedSubmitEvent(event)) {
      this.pulseStore.setInflight(inflight);
    }
  }

  private setSubmitError(error: unknown, event?: Event) {
    this.metaState.submitError = error;

    if (!this.isDelegatedSubmitEvent(event)) {
      this.pulseStore.setSubmitError(error);
    }
  }

  formatValue(name: string, value: unknown) {
    return name in this.format ? this.format[name]!(value, this.state) : value;
  }

  setField(name: string, rawValue: unknown) {
    const cleanedValue = name in this.clean ? this.clean[name]!(rawValue, this.state) : rawValue;
    this.pulseStore.setField(name, cleanedValue);
    this.metaState.success = false;
  }

  setSuccess(success: boolean, event?: Event) {
    this.metaState.success = success;
    if (!this.isDelegatedSubmitEvent(event)) {
      this.pulseStore.setSuccess(success);
    }
  }

  validate() {
    const result = this.validator(this.state);
    return this.setValidationErrors(result.valid ? {} : mapValidationError(result.error));
  }

  async submit(event?: Event) {
    event?.preventDefault();

    const validationErrors = this.validator(this.state);
    const isValid = this.setValidationErrors(validationErrors.valid ? {} : mapValidationError(validationErrors.error), event);

    if (!isValid) {
      return false;
    }

    if (this.isInflight) {
      return false;
    }

    this.setInflight(true, event);
    this.setSuccess(false, event);
    this.setSubmitError(null, event);

    try {
      if (this.onSubmit) {
        await this.onSubmit(this.state);
      }
      this.setSuccess(true, event);
      return true;
    } catch (error) {
      this.setSubmitError(error, event);
      return false;
    } finally {
      this.setInflight(false, event);
    }
  }

  reset() {
    this.pulseStore.reset();
    this.metaState.validationErrors = {};
    this.metaState.submitError = null;
    this.metaState.success = false;
    this.metaState.isInflight = false;
  }
}

directive("form", (formStore: FormStore<FormState>, vnode: VnodeWithDom) => {
  if (vnode.tag !== "form") {
    return;
  }

  const userOnSubmit = vnode.props.onsubmit as ((event: Event) => void) | undefined;

  const onSubmitHandler = async (event: Event) => {
    event.preventDefault();
    await formStore.submit();

    if (userOnSubmit) {
      userOnSubmit(event);
    }
  };

  setAttribute("onsubmit", onSubmitHandler, vnode);
});

directive("field", (formStore: FormStore<FormState>, vnode: VnodeWithDom) => {
  const name = vnode.props.name;

  if (!isString(name) || hasLength(name, 0)) {
    return;
  }

  const type = vnode.props.type ? vnode.props.type : "text";
  const tagName = vnode.tag;
  const stateValue = formStore.state[name];
  const dom = vnode.dom;
  let method = "oninput";

  if (type === "checkbox") {
    setAttribute("checked", Boolean(stateValue), vnode);
    method = "onchange";
  } else if (type === "radio") {
    const radioValue = vnode.props.value ?? dom.value;
    const normalizedStateValue = stateValue == null ? "" : stateValue;
    const normalizedRadioValue = radioValue == null ? "" : radioValue;
    setAttribute("checked", String(normalizedStateValue) === String(normalizedRadioValue), vnode);
    method = "onchange";
  } else if (tagName === "select" || tagName === "textarea" || tagName === "input") {
    setAttribute("value", formStore.formatValue(name, stateValue), vnode);
  }

  if (method === "oninput") {
    const userOnInput = vnode.props.oninput as ((event: Event) => void) | undefined;
    const onInputHandler = (event: Event) => {
      const target = event.target as unknown as DomElement;

      formStore.setField(name, target.value);

      if (userOnInput) {
        userOnInput(event);
      }
    };
    setAttribute("oninput", onInputHandler, vnode);
  }

  if (method === "onchange") {
    const userOnChange = vnode.props.onchange as ((event: Event) => void) | undefined;

    const onChangeHandler = (event: Event) => {
      if (formStore.success) {
        formStore.setSuccess(false);
      }

      const target = event.target as unknown as DomElement;
      if (type === "checkbox") {
        formStore.setField(name, Boolean(target.checked));
      } else if (type === "radio") {
        formStore.setField(name, target.value);
      }

      if (userOnChange) {
        userOnChange(event);
      }
    };

    setAttribute("onchange", onChangeHandler, vnode);
  }
});
