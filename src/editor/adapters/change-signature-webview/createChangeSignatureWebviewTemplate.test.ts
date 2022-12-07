import { JSDOM } from "jsdom";
import { SelectedPosition } from "../../editor";
import { createChangeSignatureWebviewTemplate } from "./createChangeSignatureWebviewTemplate";

type AcquireVsCodeAPIPostMessage = Function | jest.Mock<void>;

describe("Change signature Webview Content", () => {
  it("Should render params labels", async () => {
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

    it("Should be able to confirm signature without any changes", async () => {
      document.getElementById("confirm")?.click();

      expect(postMessage).toHaveBeenCalledWith({
        values: [
          { label: "paramA", startAt: 0, endAt: 0 },
          { label: "paramB", startAt: 1, endAt: 1 }
        ]
      });
    });

    it("Should be able to move paramB as a first parameter", async () => {
      const paramsTr = document.querySelectorAll<HTMLTableRowElement>(".param");
      paramsTr[1].click();
      const upButton = document.getElementById("up") as HTMLSpanElement;
      upButton.click();
      document.getElementById("confirm")?.click();

      expect(postMessage).toHaveBeenCalledWith({
        values: [
          { label: "paramA", startAt: 0, endAt: 1 },
          { label: "paramB", startAt: 1, endAt: 0 }
        ]
      });
    });

    it("Should be able to move paramA as last parameter", async () => {
      const paramsTr = document.querySelectorAll<HTMLTableRowElement>(".param");
      paramsTr[0].click();
      const downButton = document.getElementById("down") as HTMLSpanElement;
      downButton.click();
      document.getElementById("confirm")?.click();

      expect(postMessage).toHaveBeenCalledWith({
        values: [
          { label: "paramA", startAt: 0, endAt: 1 },
          { label: "paramB", startAt: 1, endAt: 0 }
        ]
      });
    });

    it("Should down button be disabled when I select the last parameter", async () => {
      const paramsTr = document.querySelectorAll<HTMLTableRowElement>(".param");
      paramsTr[1].click();
      const downButton = document.getElementById("down") as HTMLSpanElement;

      expect(downButton.classList.contains("disabled")).toBeTruthy();
    });

    it("Should up button be disabled when I select the first parameter", async () => {
      const paramsTr = document.querySelectorAll<HTMLTableRowElement>(".param");
      paramsTr[0].click();
      const upButton = document.getElementById("up") as HTMLSpanElement;

      expect(upButton.classList.contains("disabled")).toBeTruthy();
    });

    it("Should up button be disabled when I move paramB as a first paramater", async () => {
      const paramsTr = document.querySelectorAll<HTMLTableRowElement>(".param");
      paramsTr[1].click();
      const up = document.getElementById("up") as HTMLSpanElement;
      up.click();

      expect(up.classList.contains("disabled")).toBeTruthy();
    });

    it("Should down button be disabled when I move paramA as a last paramater", async () => {
      const paramsTr = document.querySelectorAll<HTMLTableRowElement>(".param");
      paramsTr[1].click();
      const down = document.getElementById("down") as HTMLSpanElement;
      down.click();

      expect(down.classList.contains("disabled")).toBeTruthy();
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
