import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

const REORDER_INDEX_ATTRIBUTE = "data-reorder-index";

const EDGE_SCROLL_ZONE = 72;

const EDGE_SCROLL_SPEED = 14;

export interface DragReorderItemProps {
  "data-reorder-index": number;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
  onLostPointerCapture: () => void;
}

export interface DragReorderHandleProps {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
}

export interface UseDragReorderResult {
  draggingIndex: number | null;
  getItemProps: (index: number) => DragReorderItemProps;
  getHandleProps: (index: number) => DragReorderHandleProps;
}

interface DragState {
  index: number;
  pointerId: number;
}

const findIndexAtPoint = (x: number, y: number): number | null => {
  const element = document
    .elementFromPoint(x, y)
    ?.closest(`[${REORDER_INDEX_ATTRIBUTE}]`);

  if (!element) return null;

  const index = Number(element.getAttribute(REORDER_INDEX_ATTRIBUTE));

  return Number.isInteger(index) ? index : null;
};

export const useDragReorder = (
  onReorder: (from: number, to: number) => void,
): UseDragReorderResult => {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const dragStateRef = useRef<DragState | null>(null);
  const pointerXRef = useRef(0);
  const pointerYRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  const onReorderRef = useRef(onReorder);

  useEffect(() => {
    onReorderRef.current = onReorder;
  });

  const stopAutoScroll = useCallback(() => {
    if (frameRef.current === null) return;

    cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }, []);

  const reorderToPointer = useCallback((x: number, y: number) => {
    const state = dragStateRef.current;

    if (!state) return;

    const target = findIndexAtPoint(x, y);

    if (target === null || target === state.index) return;

    onReorderRef.current(state.index, target);

    state.index = target;
    setDraggingIndex(target);
  }, []);

  const startAutoScroll = useCallback(() => {
    if (frameRef.current !== null) return;

    const tick = () => {
      if (!dragStateRef.current) {
        frameRef.current = null;
        return;
      }

      const y = pointerYRef.current;
      const fromBottom = window.innerHeight - y;

      let delta = 0;

      if (y < EDGE_SCROLL_ZONE) {
        delta = -EDGE_SCROLL_SPEED * (1 - y / EDGE_SCROLL_ZONE);
      } else if (fromBottom < EDGE_SCROLL_ZONE) {
        delta = EDGE_SCROLL_SPEED * (1 - fromBottom / EDGE_SCROLL_ZONE);
      }

      if (delta !== 0) {
        window.scrollBy(0, delta);

        reorderToPointer(pointerXRef.current, y);
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
  }, [reorderToPointer]);

  const startDrag = useCallback(
    (index: number, event: ReactPointerEvent<HTMLElement>) => {
      event.preventDefault();

      event.currentTarget.setPointerCapture(event.pointerId);

      dragStateRef.current = { index, pointerId: event.pointerId };
      pointerXRef.current = event.clientX;
      pointerYRef.current = event.clientY;

      setDraggingIndex(index);
      startAutoScroll();
    },
    [startAutoScroll],
  );

  const endDrag = useCallback(() => {
    dragStateRef.current = null;

    stopAutoScroll();
    setDraggingIndex(null);
  }, [stopAutoScroll]);

  const handlePointerDown = useCallback(
    (index: number, event: ReactPointerEvent<HTMLElement>) => {
      event.stopPropagation();

      startDrag(index, event);
    },
    [startDrag],
  );

  const itemPointerDown = useCallback(
    (index: number, event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType === "touch" || event.button !== 0) return;

      if ((event.target as HTMLElement).closest("button")) return;

      startDrag(index, event);
    },
    [startDrag],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const state = dragStateRef.current;

      if (!state || state.pointerId !== event.pointerId) return;

      event.preventDefault();

      pointerXRef.current = event.clientX;
      pointerYRef.current = event.clientY;

      reorderToPointer(event.clientX, event.clientY);
    },
    [reorderToPointer],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (dragStateRef.current?.pointerId !== event.pointerId) return;

      endDrag();
    },
    [endDrag],
  );

  useEffect(() => stopAutoScroll, [stopAutoScroll]);

  const getItemProps = useCallback(
    (index: number): DragReorderItemProps => ({
      [REORDER_INDEX_ATTRIBUTE]: index,
      onPointerDown: (event) => itemPointerDown(index, event),
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      onLostPointerCapture: endDrag,
    }),
    [endDrag, handlePointerMove, handlePointerUp, itemPointerDown],
  );

  const getHandleProps = useCallback(
    (index: number): DragReorderHandleProps => ({
      onPointerDown: (event) => handlePointerDown(index, event),
    }),
    [handlePointerDown],
  );

  return { draggingIndex, getItemProps, getHandleProps };
};
