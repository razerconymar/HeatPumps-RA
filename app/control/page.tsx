"use client";

// Direct link to the control condition, kept so links already shared with the
// team still work. The single entry point at / assigns conditions at random;
// this URL forces the control arm, which is useful for pilot testing.

import { useRef } from "react";
import ControlFlow from "@/components/ControlFlow";
import { createSession, SessionLog } from "@/lib/instrumentation";

export default function ControlPage() {
  const sessionRef = useRef<SessionLog>();
  if (!sessionRef.current) sessionRef.current = createSession();
  return <ControlFlow session={sessionRef.current} />;
}
