import { SelectedPosition } from "../../editor/editor";

export function swapBothArguments() {
  return [selectedPosition(0, 1), selectedPosition(1, 0)];
}

export function selectedPosition(
  startAt: number,
  endAt: number,
  label = "irrelevant",
  value?: string
): SelectedPosition {
  const result: SelectedPosition = {
    label,
    value: {
      startAt,
      endAt
    }
  };

  if (value) result.value.val = value;

  return result;
}
