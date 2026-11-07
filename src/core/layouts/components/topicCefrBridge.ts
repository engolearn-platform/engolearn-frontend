import * as React from "react";

export interface TopicCefrBridgeValue {
  level: string | null;
  setLevel: (level: string | null) => void;
}

export const NOOP_TOPIC_CEFR_BRIDGE: TopicCefrBridgeValue = {
  level: null,
  setLevel: () => undefined,
};

export const TopicCefrBridgeContext = React.createContext<TopicCefrBridgeValue>(NOOP_TOPIC_CEFR_BRIDGE);

export function useTopicCefrBridge(): TopicCefrBridgeValue {
  return React.useContext(TopicCefrBridgeContext);
}
