// src/lib/dataEvents.ts
export const DATA_CHANGED_EVENT = "fx_data_changed";

export function emitDataChanged() {
  window.dispatchEvent(new Event(DATA_CHANGED_EVENT));
}