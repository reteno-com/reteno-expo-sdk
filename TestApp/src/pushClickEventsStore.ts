export type PushClickEvent = unknown;

let pushClickEvents: PushClickEvent[] = [];
const listeners = new Set<() => void>();
const eventKeys = new Set<string>();

const getComparableEvent = (event: PushClickEvent) => {
  if (
    event &&
    typeof event === "object" &&
    "data" in event &&
    typeof event.data === "object"
  ) {
    return event.data;
  }

  return event;
};

const getEventKey = (event: PushClickEvent) => {
  try {
    return JSON.stringify(getComparableEvent(event));
  } catch {
    return String(event);
  }
};

export const addPushClickEvent = (event: PushClickEvent) => {
  const eventKey = getEventKey(event);

  if (eventKeys.has(eventKey)) {
    return;
  }

  eventKeys.add(eventKey);
  pushClickEvents = [...pushClickEvents, event ?? null];
  listeners.forEach((listener) => listener());
};

export const getPushClickEventsSnapshot = () => pushClickEvents;

export const subscribeToPushClickEvents = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};
