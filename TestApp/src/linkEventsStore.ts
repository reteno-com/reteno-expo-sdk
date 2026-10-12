import type { InAppCustomData } from "expo-reteno-sdk";

export type LinkEventRecord = {
  data: InAppCustomData;
  receivedAt: string;
};

let linkEvents: LinkEventRecord[] = [];
const listeners = new Set<() => void>();

export const addLinkEvent = (data: InAppCustomData) => {
  linkEvents = [
    ...linkEvents,
    {
      data,
      receivedAt: new Date().toISOString(),
    },
  ];
  listeners.forEach((listener) => listener());
};

export const clearLinkEvents = () => {
  linkEvents = [];
  listeners.forEach((listener) => listener());
};

export const getLinkEventsSnapshot = () => linkEvents;

export const subscribeToLinkEvents = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};
