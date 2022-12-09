import { JSDOM } from "jsdom";
import { SelectedPosition } from "../../editor";
import { createChangeSignatureWebviewTemplate } from "./createChangeSignatureWebviewTemplate";

type AcquireVsCodeAPIPostMessage = Function | jest.Mock<void>;

describe("Change signature Webview Content", () => {
  it("Should render params labels", () => {
    const selections = [
      createSelectedPosition("paramA", 0),
      createSelectedPosition("paramB", 1)
    ];

    const document = render(loadHTML(selections), acquireVsCodeApi());

    const params = document.querySelectorAll(".params-name");
    expect(params).toHaveLength(2);
    expect(params[0].textContent).toBe("paramA");
    expect(params[1].textContent).toBe("paramB");
  });

  it("Should render disabled inputs", () => {
    const selections = [
      createSelectedPosition("paramA", 0),
      createSelectedPosition("paramB", 1)
    ];

    const document = render(loadHTML(selections), acquireVsCodeApi());

    const inputs = document.querySelectorAll<HTMLInputElement>("td input");
    expect(inputs).toHaveLength(2);
    expect(inputs[0].disabled).toBeTruthy();
    expect(inputs[1].disabled).toBeTruthy();
  });

  it("Should render arrow up", () => {
    const selections = [createSelectedPosition("paramA", 0)];

    const document = render(loadHTML(selections), acquireVsCodeApi());

    const up = document.getElementById("up");
    expect(up).not.toBeNull();
  });

  it("Should render arrow down", () => {
    const selections = [createSelectedPosition("paramA", 0)];

    const document = render(loadHTML(selections), acquireVsCodeApi());

    const down = document.getElementById("down");
    expect(down).not.toBeNull();
  });

  describe("Params orders", () => {
    const postMessage = jest.fn();
    let document: Document;

    beforeEach(() => {
      const selections = [
        createSelectedPosition("paramA", 0),
        createSelectedPosition("paramB", 1)
      ];
      document = render(loadHTML(selections), acquireVsCodeApi(postMessage));
    });

    it("Should be able to confirm signature without any changes", () => {
      document.getElementById("confirm")?.click();

      expect(postMessage).toHaveBeenCalledWith({
        values: [
          { label: "paramA", startAt: 0, endAt: 0 },
          { label: "paramB", startAt: 1, endAt: 1 }
        ]
      });
    });

    it("Should be able to move paramB as a first parameter", () => {
      const paramsTr = document.querySelectorAll<HTMLTableRowElement>(".param");
      paramsTr[1].click();
      const upButton = document.getElementById("up") as HTMLSpanElement;
      upButton.click();
      document.getElementById("confirm")?.click();

      expect(postMessage).toHaveBeenCalledWith({
        values: [
          { label: "paramB", startAt: 1, endAt: 0 },
          { label: "paramA", startAt: 0, endAt: 1 }
        ]
      });
    });

    it("Should be able to move paramA as last parameter", () => {
      const paramsTr = document.querySelectorAll<HTMLTableRowElement>(".param");
      paramsTr[0].click();
      const downButton = document.getElementById("down") as HTMLSpanElement;
      downButton.click();
      document.getElementById("confirm")?.click();

      expect(postMessage).toHaveBeenCalledWith({
        values: [
          { label: "paramB", startAt: 1, endAt: 0 },
          { label: "paramA", startAt: 0, endAt: 1 }
        ]
      });
    });

    it("Should down button be disabled when I select the last parameter", () => {
      const paramsTr = document.querySelectorAll<HTMLTableRowElement>(".param");
      paramsTr[1].click();
      const downButton = document.getElementById("down") as HTMLSpanElement;

      expect(downButton.classList.contains("disabled")).toBeTruthy();
    });

    it("Should up button be disabled when I select the first parameter", () => {
      const paramsTr = document.querySelectorAll<HTMLTableRowElement>(".param");
      paramsTr[0].click();
      const upButton = document.getElementById("up") as HTMLSpanElement;

      expect(upButton.classList.contains("disabled")).toBeTruthy();
    });

    it("Should up button be disabled when I move paramB as a first parameter", () => {
      const paramsTr = document.querySelectorAll<HTMLTableRowElement>(".param");
      paramsTr[1].click();
      const up = document.getElementById("up") as HTMLSpanElement;
      up.click();

      expect(up.classList.contains("disabled")).toBeTruthy();
    });

    it("Should down button be disabled when I move paramA as a last parameter", () => {
      const paramsTr = document.querySelectorAll<HTMLTableRowElement>(".param");
      paramsTr[1].click();
      const down = document.getElementById("down") as HTMLSpanElement;
      down.click();

      expect(down.classList.contains("disabled")).toBeTruthy();
    });

    it("Should Confirm button be disabled after submit", () => {
      const confirmBtn = document.getElementById(
        "confirm"
      ) as HTMLButtonElement;
      confirmBtn.click();

      expect(confirmBtn.disabled).toBeTruthy();
    });
  });

  describe("Adding params", () => {
    let postMessage: AcquireVsCodeAPIPostMessage;
    let document: Document;

    beforeEach(() => {
      postMessage = jest.fn();
      const selections = [
        createSelectedPosition("paramA", 0),
        createSelectedPosition("paramB", 1)
      ];
      document = render(loadHTML(selections), acquireVsCodeApi(postMessage));
      const addBtn = document.getElementById("add") as HTMLElement;
      addBtn.click();
    });

    it("Should be able to add new parameter", async () => {
      const inputLabel = document.querySelector(
        ".input-param-name"
      ) as HTMLInputElement;
      inputLabel.value = "newParam";
      const inputValue = document.querySelector(
        ".input-param-value"
      ) as HTMLInputElement;
      inputValue.value = true.toString();
      document.getElementById("confirm")?.click();

      expect(postMessage).toHaveBeenCalledWith({
        values: [
          { label: "paramA", startAt: 0, endAt: 0 },
          { label: "paramB", startAt: 1, endAt: 1 },
          { label: "newParam", startAt: -1, endAt: 2, value: "true" }
        ]
      });
    });

    it("Should param name input be focused when has empty value on submit", async () => {
      document.getElementById("confirm")?.click();

      const inputLabel = document.querySelector(
        ".input-param-name"
      ) as HTMLInputElement;
      const focusedElement = document.activeElement;
      expect(inputLabel).toEqual(focusedElement);
      expect(postMessage).not.toHaveBeenCalled();
    });

    it("Should param value input be focused when has empty value on submit", async () => {
      const inputLabel = document.querySelector(
        ".input-param-name"
      ) as HTMLInputElement;
      inputLabel.value = "newParam";
      document.getElementById("confirm")?.click();

      const inputValue = document.querySelector(
        ".input-param-value"
      ) as HTMLInputElement;
      const focusedElement = document.activeElement;
      expect(inputValue).toEqual(focusedElement);
      expect(postMessage).not.toHaveBeenCalled();
    });

    it("Should be able to move Up new parameter", async () => {
      const up = document.getElementById("up") as HTMLSpanElement;
      up.click();

      const trs = document.querySelectorAll("tbody tr");
      const newParamTr = trs[1];
      expect(newParamTr.classList.contains("param--selected")).toBeTruthy();
    });

    it("Should be able to move Up then Down the new parameter", async () => {
      const up = document.getElementById("up") as HTMLSpanElement;
      up.click();
      const down = document.getElementById("down") as HTMLSpanElement;
      down.click();

      const trs = document.querySelectorAll("tbody tr");
      const newParamTr = trs[2];
      expect(newParamTr.classList.contains("param--selected")).toBeTruthy();
    });

    it("Should down button be disabled when user add new parameter because is the last param", () => {
      const down = document.getElementById("down") as HTMLSpanElement;

      expect(down.classList.contains("disabled")).toBeTruthy();
    });

    it("Should up button be enabled when user add new parameter because is the last param", () => {
      const up = document.getElementById("up") as HTMLSpanElement;

      expect(up.classList.contains("disabled")).toBeFalsy();
    });
  });
});

function createSelectedPosition(
  paramLabel: string,
  startAt: number,
  endAt: number = startAt
): SelectedPosition {
  return {
    value: {
      startAt,
      endAt
    },
    label: paramLabel
  };
}
function render(
  html: string,
  vsCodeApi: () => { postMessage: AcquireVsCodeAPIPostMessage }
) {
  const { window } = new JSDOM(html, {
    runScripts: "dangerously",
    beforeParse(window) {
      window.acquireVsCodeApi = vsCodeApi;
    }
  });

  return window.document;
}

function loadHTML(params: SelectedPosition[]) {
  return createChangeSignatureWebviewTemplate(params);
}

function acquireVsCodeApi(postMessage: AcquireVsCodeAPIPostMessage = () => {}) {
  return () => {
    return {
      postMessage
    };
  };
}
