import fs from "fs";
import path from "path";
import { JSDOM } from "jsdom";
import { SelectedPosition } from "../../editor";
import { getParamsPositionWebViewContent } from "./getParamsPositionWebViewContent";

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
        values:
          '[{"label":"paramA","startAt":0,"endAt":0},{"label":"paramB","startAt":1,"endAt":1}]'
      });
    });

    it("Should be able to move paramB as a first parameter", async () => {
      const upButtons = document.querySelectorAll<HTMLElement>(".up");
      upButtons[1].click();
      document.getElementById("confirm")?.click();

      expect(postMessage).toHaveBeenCalledWith({
        values:
          '[{"label":"paramA","startAt":0,"endAt":1},{"label":"paramB","startAt":1,"endAt":0}]'
      });
    });

    it("Should be able to move paramA as last parameter", async () => {
      const downButtons = document.querySelectorAll<HTMLElement>(".down");
      downButtons[0].click();
      document.getElementById("confirm")?.click();

      expect(postMessage).toHaveBeenCalledWith({
        values:
          '[{"label":"paramA","startAt":0,"endAt":1},{"label":"paramB","startAt":1,"endAt":0}]'
      });
    });

    it("Should not change order if I move the last parameter down", async () => {
      const downButtons = document.querySelectorAll<HTMLElement>(".down");
      downButtons[1].click();
      document.getElementById("confirm")?.click();

      expect(postMessage).toHaveBeenCalledWith({
        values:
          '[{"label":"paramA","startAt":0,"endAt":0},{"label":"paramB","startAt":1,"endAt":1}]'
      });
    });

    it("Should not change order if I move the first parameter up", async () => {
      const upButtons = document.querySelectorAll<HTMLElement>(".up");
      upButtons[0].click();
      document.getElementById("confirm")?.click();

      expect(postMessage).toHaveBeenCalledWith({
        values:
          '[{"label":"paramA","startAt":0,"endAt":0},{"label":"paramB","startAt":1,"endAt":1}]'
      });
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
  const changeSignatureTemplate = fs.readFileSync(
    path.resolve(__dirname, "change-signature.html"),
    "utf8"
  );

  return getParamsPositionWebViewContent(changeSignatureTemplate, params);
}

function acquireVsCodeApi(postMessage: AcquireVsCodeAPIPostMessage = () => {}) {
  return () => {
    return {
      postMessage
    };
  };
}
