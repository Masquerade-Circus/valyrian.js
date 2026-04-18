import "valyrian.js/node";

import { describe, expect, test as it } from "bun:test";
import { mount, preventUpdate, update, v } from "valyrian.js";
import { FormStore, formSchemaShield } from "../lib/forms";
import { Money, formatMoney, parseMoneyInput } from "valyrian.js/money";
import { wait } from "./utils/helpers";

describe("Forms", () => {
  it("should validate JSON schema and submit cleaned values", async () => {
    const submissions: Array<Record<string, unknown>> = [];

    const form = new FormStore({
      state: {
        email: "",
        age: 0
      },
      schema: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          age: { type: "number" }
        },
        required: ["email"]
      },
      clean: {
        email: (value) => String(value).trim().toLowerCase()
      },
      onSubmit: async (values) => {
        submissions.push({ ...values });
      }
    });

    form.setField("email", "bad-email");
    expect(form.validate()).toBeFalse();

    form.setField("email", "  USER@example.com  ");
    form.setField("age", 31);

    const ok = await form.submit();
    expect(ok).toBeTrue();
    expect(submissions).toEqual([
      {
        email: "user@example.com",
        age: 31
      }
    ]);

    expect(() => {
      (form.state as Record<string, unknown>).email = "forced-change";
    }).toThrow();
  });

  it("should apply clean input->state and format state->input for money", async () => {
    const form = new FormStore({
      state: {
        amountInCents: 123456
      },
      schema: {
        type: "object",
        properties: {
          amountInCents: { type: "number", minimum: 0 }
        },
        required: ["amountInCents"]
      },
      clean: {
        amountInCents: (value) => parseMoneyInput(String(value), { locale: "en-US", decimalPlaces: 2 }).toCents()
      },
      format: {
        amountInCents: (value) =>
          formatMoney(Money.fromCents(Number(value) || 0), {
            currency: "USD",
            locale: "en-US",
            digits: 2
          })
      }
    });

    const dom = document.createElement("div");

    const component = () => (
      <form v-form={form}>
        <input name="amountInCents" v-field={form} />
        <button type="submit">Send</button>
      </form>
    );

    mount(dom, component);

    const formDom = dom.childNodes[0] as any;
    const input = formDom.childNodes[0] as any;
    expect(input.value).toEqual("$1,234.56");

    input.value = "$2,000.00";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    expect(form.state.amountInCents).toEqual(200000);
    expect(input.value).toEqual("$2,000.00");

    form.setField("amountInCents", "$2,500.00");
    await wait(0);
    expect(form.state.amountInCents).toEqual(250000);
    expect(input.value).toEqual("$2,500.00");
  });

  it("should preserve radio values and sync checked state with v-field", async () => {
    const form = new FormStore({
      state: {
        choice: "b"
      },
      schema: {
        type: "object",
        properties: {
          choice: { type: "string" }
        },
        required: ["choice"]
      }
    });

    const dom = document.createElement("div");

    mount(dom, () => (
      <form v-form={form}>
        <input type="radio" name="choice" value="a" v-field={form} />
        <input type="radio" name="choice" value="b" v-field={form} />
      </form>
    ));

    const formDom = dom.childNodes[0] as any;
    const radioA = formDom.childNodes[0] as any;
    const radioB = formDom.childNodes[1] as any;

    expect(radioA.value).toBe("a");
    expect(radioB.value).toBe("b");
    expect(radioA.checked).toBeFalse();
    expect(radioB.checked).toBeTrue();
    expect(radioA.value).not.toBe("true");
    expect(radioA.value).not.toBe("false");
    expect(radioB.value).not.toBe("true");
    expect(radioB.value).not.toBe("false");

    radioA.checked = true;
    radioA.dispatchEvent(new Event("change", { bubbles: true }));

    expect(form.state.choice).toBe("a");

    await wait(0);

    expect(radioA.value).toBe("a");
    expect(radioB.value).toBe("b");
    expect(radioA.checked).toBeTrue();
    expect(radioB.checked).toBeFalse();
  });

  it("should keep radios with falsy values checked when state matches", async () => {
    const form = new FormStore({
      state: {
        choice: 0
      },
      schema: {
        type: "object",
        properties: {
          choice: { type: "number" }
        },
        required: ["choice"]
      }
    });

    const dom = document.createElement("div");

    mount(dom, () => (
      <form v-form={form}>
        <input type="radio" name="choice" value={0} v-field={form} />
        <input type="radio" name="choice" value={1} v-field={form} />
      </form>
    ));

    const formDom = dom.childNodes[0] as any;
    const radioZero = formDom.childNodes[0] as any;
    const radioOne = formDom.childNodes[1] as any;

    expect(radioZero.value).toBe("0");
    expect(radioOne.value).toBe("1");
    expect(radioZero.checked).toBeTrue();
    expect(radioOne.checked).toBeFalse();

    radioOne.checked = true;
    radioOne.dispatchEvent(new Event("change", { bubbles: true }));

    expect(String(form.state.choice)).toBe("1");

    await wait(0);

    expect(radioZero.checked).toBeFalse();
    expect(radioOne.checked).toBeTrue();
  });

  it("should bind and submit when inputs and button are rendered through components", async () => {
    const submissions: Array<Record<string, unknown>> = [];

    const form = new FormStore({
      state: {
        email: "",
        password: ""
      },
      schema: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 }
        },
        required: ["email", "password"]
      },
      onSubmit: async (values) => {
        submissions.push({ ...values });
      }
    });

    const Input = (props: { name: string; type?: string }) => (
      <input name={props.name} type={props.type || "text"} v-field={form} />
    );

    const Button = () => <button type="submit">Send</button>;

    const component = () => (
      <form v-form={form}>
        <Input name="email" />
        <Input name="password" type="password" />
        <Button />
      </form>
    );

    const dom = document.createElement("div");
    mount(dom, component);

    const formDom = dom.childNodes[0] as any;
    const emailInput = formDom.childNodes[0] as any;
    const passwordInput = formDom.childNodes[1] as any;

    emailInput.value = "nested@example.com";
    emailInput.dispatchEvent(new Event("input", { bubbles: true }));

    passwordInput.value = "superpass";
    passwordInput.dispatchEvent(new Event("input", { bubbles: true }));

    expect(form.state.email).toEqual("nested@example.com");
    expect(form.state.password).toEqual("superpass");

    const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
    let preventDefaultCalled = false;
    submitEvent.preventDefault = () => {
      preventDefaultCalled = true;
    };
    formDom.dispatchEvent(submitEvent);

    expect(preventDefaultCalled).toBeTrue();
    expect(submissions).toEqual([
      {
        email: "nested@example.com",
        password: "superpass"
      }
    ]);
  });

  it("should prevent concurrent submissions", async () => {
    let submitCalls = 0;

    const form = new FormStore({
      state: { email: "ok@example.com" },
      schema: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" }
        },
        required: ["email"]
      },
      onSubmit: async () => {
        submitCalls += 1;
        await wait(20);
      }
    });

    const first = form.submit();
    const second = form.submit();

    const results = await Promise.all([first, second]);
    expect(results).toEqual([true, false]);
    expect(submitCalls).toEqual(1);
  });

  it("should auto-rerender inflight and success states on async submit even when submit preventDefault is used", async () => {
    let resolveSubmit!: () => void;
    const submitDone = new Promise<void>((resolve) => {
      resolveSubmit = resolve;
    });

    const form = new FormStore({
      state: { email: "ok@example.com" },
      schema: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" }
        },
        required: ["email"]
      },
      onSubmit: async () => {
        await submitDone;
      }
    });

    const dom = document.createElement("div");
    mount(dom, () => (
      <form v-form={form}>
        <button type="submit">{form.isInflight ? "sending" : form.success ? "sent" : "idle"}</button>
      </form>
    ));

    const formDom = dom.childNodes[0] as any;
    const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
    const originalPreventDefault = submitEvent.preventDefault.bind(submitEvent);
    let preventDefaultCalls = 0;
    submitEvent.preventDefault = () => {
      preventDefaultCalls += 1;
      originalPreventDefault();
    };

    formDom.dispatchEvent(submitEvent);
    expect(submitEvent.defaultPrevented).toBeTrue();
    expect(preventDefaultCalls).toEqual(1);

    await wait(10);
    expect(dom.innerHTML).toEqual("<form><button type=\"submit\">sending</button></form>");

    resolveSubmit();
    await wait(10);
    expect(preventDefaultCalls).toEqual(1);
    expect(dom.innerHTML).toEqual("<form><button type=\"submit\">sent</button></form>");
  });

  it("should let async submit opt out of automatic rerenders with preventUpdate", async () => {
    let resolveSubmit!: () => void;
    const submitDone = new Promise<void>((resolve) => {
      resolveSubmit = resolve;
    });

    const form = new FormStore({
      state: { email: "ok@example.com" },
      schema: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" }
        },
        required: ["email"]
      },
      onSubmit: async () => {
        preventUpdate();
        await submitDone;
      }
    });

    const dom = document.createElement("div");
    mount(dom, () => (
      <form v-form={form}>
        <button type="submit">{form.isInflight ? "sending" : form.success ? "sent" : "idle"}</button>
      </form>
    ));

    const formDom = dom.childNodes[0] as any;
    formDom.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(dom.innerHTML).toEqual("<form><button type=\"submit\">idle</button></form>");

    await wait(0);
    expect(dom.innerHTML).toEqual("<form><button type=\"submit\">idle</button></form>");

    resolveSubmit();
    await wait(10);
    expect(dom.innerHTML).toEqual("<form><button type=\"submit\">idle</button></form>");
    expect(update()).toEqual("<form><button type=\"submit\">sent</button></form>");
  });

  it("should validate url format from JSON schema", () => {
    formSchemaShield.addFormat(
      "url",
      (value: unknown) => {
        if (typeof value !== "string") return false;
        try {
          const parsedUrl = new URL(value);
          return parsedUrl.protocol.length > 0;
        } catch {
          return false;
        }
      },
      true
    );

    const form = new FormStore({
      state: {
        website: ""
      },
      schema: {
        type: "object",
        properties: {
          website: { type: "string", format: "url" }
        },
        required: ["website"]
      }
    });

    form.setField("website", "not-a-url");
    expect(form.validate()).toBeFalse();
    expect(form.validationErrors.website).toBeTruthy();

    form.setField("website", "https://example.com");
    expect(form.validate()).toBeTrue();
  });

  it("should use shared schema shield formats across form instances", () => {
    const formatName = `starts-with-a-${Math.random().toString(36).slice(2)}`;

    formSchemaShield.addFormat(
      formatName,
      (value: unknown) => {
        return typeof value === "string" && value.startsWith("A");
      },
      true
    );

    const schema = {
      type: "object",
      properties: {
        code: { type: "string", format: formatName }
      },
      required: ["code"]
    };

    const formA = new FormStore({
      state: { code: "" },
      schema
    });

    const formB = new FormStore({
      state: { code: "" },
      schema
    });

    formA.setField("code", "B-001");
    expect(formA.validate()).toBeFalse();
    expect(formA.validationErrors.code).toBeTruthy();

    formB.setField("code", "A-001");
    expect(formB.validate()).toBeTrue();
  });

  it("should capture submit error when onSubmit throws", async () => {
    const form = new FormStore({
      state: { email: "test@example.com" },
      schema: {
        type: "object",
        properties: { email: { type: "string" } }
      },
      onSubmit: async () => {
        throw new Error("Server error");
      }
    });

    await form.submit();
    expect(form.submitError).toBeInstanceOf(Error);
    expect(form.hasSubmitError).toBeTrue();
  });

  it("should clear submitError on reset", async () => {
    const form = new FormStore({
      state: { email: "test@example.com" },
      schema: {
        type: "object",
        properties: { email: { type: "string" } }
      },
      onSubmit: async () => {
        throw new Error("Error");
      }
    });

    await form.submit();
    expect(form.hasSubmitError).toBeTrue();

    form.reset();
    expect(form.submitError).toBeNull();
  });

  it("should clear submitError before each submit", async () => {
    let shouldThrow = true;
    const form = new FormStore({
      state: { email: "test@example.com" },
      schema: {
        type: "object",
        properties: { email: { type: "string" } }
      },
      onSubmit: async () => {
        if (shouldThrow) throw new Error("First error");
      }
    });

    await form.submit();
    expect(form.hasSubmitError).toBeTrue();

    shouldThrow = false;
    await form.submit();
    expect(form.hasSubmitError).toBeFalse();
  });

  it("should set isInflight during submit", async () => {
    const form = new FormStore({
      state: { email: "test@example.com" },
      schema: {
        type: "object",
        properties: { email: { type: "string" } }
      },
      onSubmit: async () => {
        await wait(50);
      }
    });

    expect(form.isInflight).toBeFalse();
    form.submit();
    expect(form.isInflight).toBeTrue();
    await wait(100);
    expect(form.isInflight).toBeFalse();
  });
});
