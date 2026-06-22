"use client";

import { useState, type Dispatch, type SetStateAction } from "react";

// Local editable state that RE-SEEDS whenever `source` changes identity — e.g. an SWR
// revalidate brings fresh server data. Optimistic local edits (via the returned setter) are
// kept until `source` changes, then discarded in favour of the new authoritative value.
//
// Why this shape, not the obvious alternatives:
// - Render-phase reset (not useEffect) → no extra paint, no flash of stale state.
// - The prev-source guard makes the reset run once per identity change, never looping.
// - Not a `key`-remount: these components hold focus / useTransition / error state that a
//   remount would throw away.
//
// Returns the exact `useState` tuple, so callers (incl. functional updaters like
// `setX(prev => ...)` for optimistic edits) work unchanged.
export function useSyncedState<T>(source: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState(source);
  const [prevSource, setPrevSource] = useState(source);
  if (prevSource !== source) {
    setPrevSource(source);
    setValue(source);
  }
  return [value, setValue];
}
