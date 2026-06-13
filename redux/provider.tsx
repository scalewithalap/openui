"use client";
import React, { ReactNode, useRef } from "react";
import { makeStore } from "./store";
import { Provider } from "react-redux";

// Safely patch setPointerCapture and releasePointerCapture to prevent crashes from invalid pointer IDs (e.g. untrusted/synthetic events)
if (typeof window !== "undefined") {
  const originalSetPointerCapture = Element.prototype.setPointerCapture;
  Element.prototype.setPointerCapture = function (pointerId: number) {
    try {
      originalSetPointerCapture.call(this, pointerId);
    } catch (err) {
      console.warn("setPointerCapture failed:", err);
    }
  };

  const originalReleasePointerCapture = Element.prototype.releasePointerCapture;
  Element.prototype.releasePointerCapture = function (pointerId: number) {
    try {
      originalReleasePointerCapture.call(this, pointerId);
    } catch (err) {
      console.warn("releasePointerCapture failed:", err);
    }
  };
}

const ReduxProvider = ({ children }: { children: ReactNode }) => {
  const storeRef = useRef(makeStore());
  return <Provider store={storeRef.current}>{children}</Provider>;
};

export default ReduxProvider;
