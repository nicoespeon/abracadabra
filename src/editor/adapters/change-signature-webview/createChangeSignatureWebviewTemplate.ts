import type { SelectedPosition } from "../../editor";

export function createChangeSignatureWebviewTemplate(
  params: SelectedPosition[]
): string {
  const paramsTrValues = params.map((param) => {
    const name = param.label;
    return `
      <tr>
          <td class="params-name">${name}</td>
          <td>
            <span class="up"></span>
            <span class="down"></span>
          </td>
        </tr>
    `;
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const changeSignatureTemplate = require("./change-signature.html");

  return changeSignatureTemplate.replace(
    "{{tableContent}}",
    paramsTrValues.join("")
  );
}
