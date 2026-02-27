import { create } from "zustand";
import type { Session } from "@/types/database";

interface SessionStore {
  activeSession: Session | null;
  setActiveSession: (session: Session | null) => void;
  elapsedSeconds: number;
  setElapsedSeconds: (seconds: number) => void;
  incrementElapsed: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  activeSession: null,
  setActiveSession: (session) => set({ activeSession: session }),
  elapsedSeconds: 0,
  setElapsedSeconds: (seconds) => set({ elapsedSeconds: seconds }),
  incrementElapsed: () => set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),
}));
