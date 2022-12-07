import type { SelectedPosition } from "../../editor";

export function createChangeSignatureWebviewTemplate(
  params: SelectedPosition[]
): string {
  const paramsTrValues = params.map((param) => {
    const name = param.label;
    return `
      <tr class="param">
        <td colspan="4" class="params-name">${name}</td>
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
