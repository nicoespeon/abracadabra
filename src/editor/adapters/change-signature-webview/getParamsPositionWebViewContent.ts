import type { SelectedPosition } from "../../editor";
import changeSignatureTemplate from "./change-signature.html";

export function getParamsPositionWebViewContent(
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

  return changeSignatureTemplate.replace(
    "{{tableContent}}",
    paramsTrValues.join("")
  );
}
