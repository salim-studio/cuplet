import React, { createContext, useContext, useMemo, useRef, useState, useCallback } from 'react';
import type { Project } from './types';
import { DEFAULT_PROJECT } from './types';

interface Store {
  project: Project;
  currentTime: number;
  playing: boolean;
  selectedId: string | null;
  setTime: (t: number) => void;
  setPlaying: (p: boolean) => void;
  setProject: (p: Project | ((prev: Project) => Project), commit?: boolean) => void;
  select: (id: string | null) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const Ctx = createContext<Store | null>(null);

export function CupletProvider({ children, initial }: { children: React.ReactNode; initial?: Project }) {
  const [project, setProjectState] = useState<Project>(initial ?? DEFAULT_PROJECT);
  const [currentTime, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selectedId, select] = useState<string | null>(null);
  const past = useRef<Project[]>([]);
  const future = useRef<Project[]>([]);
  const [, force] = useState(0);

  const setProject: Store['setProject'] = useCallback(
    (p, commit = true) => {
      setProjectState((prev) => {
        const next = typeof p === 'function' ? (p as (x: Project) => Project)(prev) : p;
        if (next === prev) return prev;
        if (commit) {
          past.current.push(prev);
          if (past.current.length > 50) past.current.shift();
          future.current = [];
          queueMicrotask(() => force((x) => x + 1));
        }
        return next;
      });
    },
    []
  );

  const undo = useCallback(() => {
    const p = past.current.pop();
    if (!p) return;
    setProjectState((cur) => {
      future.current.push(cur);
      return p;
    });
  }, []);

  const redo = useCallback(() => {
    const n = future.current.pop();
    if (!n) return;
    setProjectState((cur) => {
      past.current.push(cur);
      return n;
    });
  }, []);

  const value = useMemo<Store>(
    () => ({
      project, currentTime, playing, selectedId,
      setTime, setPlaying, setProject, select, undo, redo,
      canUndo: past.current.length > 0, canRedo: future.current.length > 0,
    }),
    [project, currentTime, playing, selectedId, setProject, undo, redo]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCuplet(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useCuplet must be used inside CupletProvider');
  return s;
}
