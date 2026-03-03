"use client";

import React, { createContext, useContext, useState } from "react";

const CallContext = createContext<{
  callActive: boolean;
  setCallActive: (v: boolean) => void;
}>({ callActive: false, setCallActive: () => {} });

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [callActive, setCallActive] = useState(false);
  return (
    <CallContext.Provider value={{ callActive, setCallActive }}>{children}</CallContext.Provider>
  );
}

export const useCall = () => useContext(CallContext);
