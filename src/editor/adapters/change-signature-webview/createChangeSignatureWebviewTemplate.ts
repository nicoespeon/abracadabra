import type { SelectedPosition } from "../../editor";
import changeSignatureTemplate from "./change-signature.html";

export function createChangeSignatureWebviewTemplate(
  params: SelectedPosition[]
): string {
  const paramsTrValues = params.map((param) => {
    const name = param.label;
    return `
      <tr class="param">
        <td colspan="3" class="params-name">${name}</td>
        <td colspan="1" class="params-value"><input disabled/></td>
      </tr>
    `;
  });

  return changeSignatureTemplate.replace(
    "{{tableContent}}",
    paramsTrValues.join("")
  );
}
