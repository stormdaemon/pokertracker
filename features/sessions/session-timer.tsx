"use client";

import { useEffect, useRef, useState } from "react";

interface SessionTimerProps {
  startedAt: string;
}

export function SessionTimer({ startedAt }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    const start = new Date(startedAt).getTime();

    function update() {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }

    update();
    intervalRef.current = setInterval(update, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [startedAt]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="text-3xl font-bold font-mono tabular-nums">
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </div>
  );
}
