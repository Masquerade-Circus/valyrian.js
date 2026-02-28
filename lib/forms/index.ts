import { directive, setAttribute, VnodeWithDom } from "valyrian.js";
import { createPulseStore } from "valyrian.js/pulses";
import { deepCloneUnfreeze, isFunction, isString } from "valyrian.js/utils";
import { SchemaShield, ValidationError, Validator } from "schema-shield";

type JsonSchema = Record<string, unknown>;
export type FormState = Record<string, unknown>;

type FormControl = {
  name?: string;
  type?: string;
  tagName?: string;
  value?: unknown;
  checked?: boolean;
  disabled?: boolean;
  getAttribute?: (name: string) => string | null;
  vnode?: { props?: Record<string, unknown> };
};

type FormNode = {
  nodeType?: number;
  childNodes?: FormNode[];
  tagName?: string;
  type?: string;
  disabled?: boolean;
  getAttribute?: (name: string) => string | null;
  vnode?: { props?: Record<string, unknown> };
};

export type FormTransformContext<TState extends FormState> = {
  name: keyof TState | string;
  state: TState;
  control: FormControl | null;
  event?: Event;
};

export type FormTransform<TState extends FormState> = (
  value: unknown,
  context: FormTransformContext<TState>
) => unknown;

export type FormTransformMap<TState extends FormState> = Partial<
  Record<keyof TState | string, FormTransform<TState>>
>;

export type FormValidationMode = "safe" | "fast";

export type FormOptions<TState extends FormState> = {
  state: TState;
  schema: JsonSchema;
  clean?: FormTransformMap<TState>;
  format?: FormTransformMap<TState>;
  onSubmit?: (values: TState) => Promise<void> | void;
  validationMode?: FormValidationMode;
};

type FormInternalState<TState extends FormState> = {
  values: TState;
  errors: Record<string, string>;
  isInflight: boolean;
  isDirty: boolean;
};

type FormInternalPulses<TState extends FormState> = {
  setField: (state: FormInternalState<TState>, name: string, value: unknown) => void;
  validate: (state: FormInternalState<TState>) => boolean;
  setInflight: (state: FormInternalState<TState>, inflight: boolean) => void;
  reset: (state: FormInternalState<TState>) => void;
};

type FormPulseStore<TState extends FormState> = {
  state: FormInternalState<TState>;
  setField: (name: string, value: unknown) => void;
  validate: () => boolean;
  setInflight: (inflight: boolean) => void;
  reset: () => void;
};

type ControlBinding = {
  formStore: FormStore<FormState>;
  name: string;
  type: string;
  onInputHandler: (event: Event) => void;
  onChangeHandler: (event: Event) => void;
};

type FormBinding = {
  formStore: FormStore<FormState>;
  onSubmitHandler: (event: Event) => Promise<void>;
};

const controlBindingKey = Symbol("forms-control-binding");
const formBindingKey = Symbol("forms-form-binding");

function getTagName(node: FormNode | FormControl) {
  return String(node.tagName || "").toUpperCase();
}

function getNodeAttribute(node: FormNode | FormControl, attributeName: string) {
  if (!isFunction(node.getAttribute)) {
    return null;
  }
  return node.getAttribute(attributeName);
}

function getNodeName(node: FormControl) {
  const vnodeName = node.vnode?.props?.name;
  if (isString(vnodeName)) {
    return vnodeName;
  }

  if (isString(node.name)) {
    return node.name;
  }

  const attributeName = getNodeAttribute(node, "name");
  return isString(attributeName) ? attributeName : "";
}

function getNodeType(node: FormControl) {
  return String(node.type || getNodeAttribute(node, "type") || "").toLowerCase();
}

function decodeJsonPointerToken(token: string) {
  return token.replace(/~1/g, "/").replace(/~0/g, "~");
}

function getFieldNameFromError(error: ValidationError) {
  const path = String(error.getPath().instancePath || "");
  if (path.startsWith("#/")) {
    const token = path.slice(2).split("/")[0];
    if (token.length > 0) {
      return decodeJsonPointerToken(token);
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

function walkElements(root: FormNode, visitor: (node: FormNode) => void) {
  const children = root.childNodes || [];
  for (const child of children) {
    if (!child || child.nodeType !== 1) {
      continue;
    }
    visitor(child);
    walkElements(child, visitor);
  }
}

function getControls(formDom: FormNode) {
  const controls: FormControl[] = [];

  walkElements(formDom, (node) => {
    const tagName = getTagName(node);
    if (tagName !== "INPUT" && tagName !== "SELECT" && tagName !== "TEXTAREA") {
      return;
    }

    const control = node as unknown as FormControl;
    const controlName = getNodeName(control);
    if (controlName.length === 0) {
      return;
    }

    control.name = controlName;
    controls.push(control);
  });

  return controls;
}

function getSubmitters(formDom: FormNode) {
  const submitters: FormNode[] = [];

  walkElements(formDom, (node) => {
    const tagName = getTagName(node);
    const nodeType = String(node.type || getNodeAttribute(node, "type") || "").toLowerCase();
    if ((tagName === "BUTTON" || tagName === "INPUT") && nodeType === "submit") {
      submitters.push(node);
    }
  });

  return submitters;
}

function setControlValue(control: FormControl, value: unknown) {
  control.value = value == null ? "" : value;
}

export class FormStore<TState extends FormState> {
  static #schemaShield = FormStore.createSchemaShield();

  #validator: Validator;
  #onSubmit: ((values: TState) => Promise<void> | void) | null;
  #clean: FormTransformMap<TState>;
  #format: FormTransformMap<TState>;
  #validationMode: FormValidationMode;
  #pulseStore: FormPulseStore<TState>;

  static get schemaShield() {
    return this.#schemaShield;
  }

  static createSchemaShield() {
    const schemaShield = new SchemaShield({
      failFast: false,
      immutable: false
    });

    schemaShield.addFormat(
      "url",
      (value: unknown) => {
        if (!isString(value)) {
          return false;
        }

        try {
          const parsedUrl = new URL(value);
          return parsedUrl.protocol.length > 0;
        } catch {
          return false;
        }
      },
      true
    );

    return schemaShield;
  }

  constructor(options: FormOptions<TState>) {
    this.#validator = FormStore.#schemaShield.compile(options.schema);
    this.#onSubmit = options.onSubmit || null;
    this.#clean = options.clean || {};
    this.#format = options.format || {};
    this.#validationMode = options.validationMode || "safe";

    const getValidationErrors = (values: TState) => {
      const valuesToValidate =
        this.#validationMode === "safe" ? deepCloneUnfreeze(values) : (values as unknown as Record<string, unknown>);

      const result = this.#validator(valuesToValidate);
      return result.valid ? {} : this.#mapValidationError(result.error);
    };

    const initialValues = deepCloneUnfreeze(options.state);

    this.#pulseStore = createPulseStore<FormInternalState<TState>, FormInternalPulses<TState>>(
      {
        values: deepCloneUnfreeze(initialValues),
        errors: {},
        isInflight: false,
        isDirty: false
      },
      {
        setField(state, name, value) {
          (state.values as FormState)[name] = value;
          state.isDirty = true;
          state.errors = getValidationErrors(state.values);
        },
        validate(state) {
          state.errors = getValidationErrors(state.values);
          return Object.keys(state.errors).length === 0;
        },
        setInflight(state, inflight) {
          state.isInflight = inflight;
        },
        reset(state) {
          state.values = deepCloneUnfreeze(initialValues);
          state.errors = {};
          state.isInflight = false;
          state.isDirty = false;
        }
      }
    ) as unknown as FormPulseStore<TState>;
  }

  get state() {
    return this.#pulseStore.state.values;
  }

  get errors() {
    return this.#pulseStore.state.errors;
  }

  get isInflight() {
    return this.#pulseStore.state.isInflight;
  }

  get isDirty() {
    return this.#pulseStore.state.isDirty;
  }

  #runTransform(
    map: FormTransformMap<TState>,
    name: string,
    value: unknown,
    control: FormControl | null,
    event?: Event
  ) {
    const transform = map[name];
    if (!transform) {
      return value;
    }

    return transform(value, {
      name,
      state: this.state,
      control,
      event
    });
  }

  formatValue(name: string, value: unknown, control: FormControl | null = null) {
    return this.#runTransform(this.#format, name, value, control);
  }

  setField(name: string, rawValue: unknown, control: FormControl | null = null, event?: Event) {
    const cleanedValue = this.#runTransform(this.#clean, name, rawValue, control, event);
    this.#pulseStore.setField(name, cleanedValue);
  }

  #mapValidationError(error: ValidationError | true | null) {
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

  validate() {
    return this.#pulseStore.validate();
  }

  async submit(event?: Event) {
    event?.preventDefault();

    if (!this.validate()) {
      return false;
    }

    if (this.isInflight) {
      return false;
    }

    this.#pulseStore.setInflight(true);

    try {
      if (this.#onSubmit) {
        await this.#onSubmit(this.state);
      }
      return true;
    } finally {
      this.#pulseStore.setInflight(false);
    }
  }

  reset() {
    this.#pulseStore.reset();
  }
}

export const formSchemaShield = FormStore.schemaShield;

function bindControl(formStore: FormStore<FormState>, control: FormControl, vnode: VnodeWithDom) {
  const name = getNodeName(control);
  if (name.length === 0) {
    return;
  }

  control.name = name;

  const type = getNodeType(control);
  const tagName = getTagName(control);
  const stateValue = formStore.state[name];

  if (type === "checkbox") {
    control.checked = Boolean(stateValue);
  } else if (type === "radio") {
    control.checked = String(stateValue) === String(control.value || "");
  } else if (tagName === "SELECT" || tagName === "TEXTAREA" || tagName === "INPUT") {
    const formattedValue = formStore.formatValue(name, stateValue, control);
    setControlValue(control, formattedValue);
  }

  const withBinding = control as FormControl & { [controlBindingKey]?: ControlBinding };
  const existingBinding = withBinding[controlBindingKey];

  if (!existingBinding) {
    const onInputHandler = (event: Event) => {
      const target = event.target as FormControl;
      const currentBinding = withBinding[controlBindingKey];
      if (!currentBinding) {
        return;
      }

      if (currentBinding.type !== "checkbox" && currentBinding.type !== "radio") {
        currentBinding.formStore.setField(currentBinding.name, target.value, target, event);
        const formattedValue = currentBinding.formStore.formatValue(
          currentBinding.name,
          currentBinding.formStore.state[currentBinding.name],
          target
        );
        setControlValue(target, formattedValue);
      }
    };

    const onChangeHandler = (event: Event) => {
      const currentBinding = withBinding[controlBindingKey];
      if (!currentBinding) {
        return;
      }

      const target = event.target as FormControl;
      if (currentBinding.type === "checkbox") {
        currentBinding.formStore.setField(currentBinding.name, Boolean(target.checked), target, event);
      } else if (currentBinding.type === "radio") {
        currentBinding.formStore.setField(currentBinding.name, target.value, target, event);
      }
    };

    const binding: ControlBinding = {
      formStore,
      name,
      type,
      onInputHandler,
      onChangeHandler
    };

    withBinding[controlBindingKey] = binding;
  } else {
    withBinding[controlBindingKey]!.formStore = formStore;
    withBinding[controlBindingKey]!.name = name;
    withBinding[controlBindingKey]!.type = type;
  }

  const binding = withBinding[controlBindingKey] as ControlBinding;
  setAttribute("oninput", binding.onInputHandler, vnode);
  setAttribute("onchange", binding.onChangeHandler, vnode);
}

function syncSubmitButtons(formDom: FormNode, formStore: FormStore<FormState>) {
  const submitters = getSubmitters(formDom);
  for (const submitter of submitters) {
    submitter.disabled = formStore.isInflight;
  }
}

directive("form", (formStore: FormStore<FormState>, vnode: VnodeWithDom) => {
  const formDom = vnode.dom as unknown as FormNode;
  if (!formDom || getTagName(formDom) !== "FORM") {
    return;
  }

  const withBinding = formDom as FormNode & { [formBindingKey]?: FormBinding };
  const existingBinding = withBinding[formBindingKey];

  if (!existingBinding) {
    const onSubmitHandler = async (event: Event) => {
      const currentBinding = withBinding[formBindingKey];
      if (!currentBinding) {
        return;
      }

      const success = await currentBinding.formStore.submit(event);
      if (!success) {
        event.preventDefault();
      }
    };

    const binding: FormBinding = {
      formStore,
      onSubmitHandler
    };

    withBinding[formBindingKey] = binding;
  } else {
    withBinding[formBindingKey]!.formStore = formStore;
  }

  const binding = withBinding[formBindingKey] as FormBinding;
  setAttribute("onsubmit", binding.onSubmitHandler, vnode);

  const controls = getControls(formDom);
  for (const control of controls) {
    const controlVnode = (control as any).vnode as VnodeWithDom | undefined;
    if (controlVnode) {
      bindControl(formStore, control, controlVnode);
    }
  }

  syncSubmitButtons(formDom, formStore);
});

directive("field", (formStore: FormStore<FormState>, vnode: VnodeWithDom) => {
  const control = vnode.dom as unknown as FormControl;
  bindControl(formStore, control, vnode);
});
