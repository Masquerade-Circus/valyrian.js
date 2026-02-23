import "valyrian.js/node";

import { describe, expect, test as it } from "bun:test";
import { mount, v } from "valyrian.js";
import { FormStore } from "valyrian.js/forms";
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
    input.oninput({ target: input } as Event);

    expect(form.state.amountInCents).toEqual(200000);
    expect(input.value).toEqual("$2,000.00");

    form.setField("amountInCents", "$2,500.00");
    await wait(0);
    expect(form.state.amountInCents).toEqual(250000);
    expect(input.value).toEqual("$2,500.00");
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
    emailInput.oninput({ target: emailInput } as Event);

    passwordInput.value = "superpass";
    passwordInput.oninput({ target: passwordInput } as Event);

    expect(form.state.email).toEqual("nested@example.com");
    expect(form.state.password).toEqual("superpass");

    let preventDefaultCalled = false;
    const submitEvent = {
      preventDefault: () => {
        preventDefaultCalled = true;
      },
      target: formDom
    } as unknown as Event;

    await formDom.onsubmit(submitEvent);

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

  it("should validate url format from JSON schema", () => {
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
    expect(form.errors.website).toBeTruthy();

    form.setField("website", "https://example.com");
    expect(form.validate()).toBeTrue();
  });
});
