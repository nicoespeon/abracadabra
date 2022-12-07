import type { SelectedPosition } from "../../editor";

export function getParamsPositionWebViewContent(
  html: string,
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

  return html.replace("{{tableContent}}", paramsTrValues.join(""));
}
