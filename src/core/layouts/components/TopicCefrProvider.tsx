import * as React from "react";
import { TopicCefrBridgeContext } from "./topicCefrBridge";

export default function TopicCefrProvider({
  identityGeneration,
  children,
}: {
  identityGeneration: number;
  children: React.ReactNode;
}) {
  const [current, setCurrent] = React.useState({ identityGeneration, level: null as string | null });
  const level = current.identityGeneration === identityGeneration ? current.level : null;
  const setLevel = React.useCallback((nextLevel: string | null) => {
    setCurrent({ identityGeneration, level: nextLevel });
  }, [identityGeneration]);
  const value = React.useMemo(() => ({ level, setLevel }), [level, setLevel]);

  return (
    <TopicCefrBridgeContext.Provider value={value}>
      {children}
    </TopicCefrBridgeContext.Provider>
  );
}
