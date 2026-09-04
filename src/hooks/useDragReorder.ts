import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { flushSync } from "react-dom";

const REORDER_INDEX_ATTRIBUTE = "data-reorder-index";

const REORDER_LIST_ATTRIBUTE = "data-reorder-list";

const TOUCH_HOLD_DELAY = 220;

const TOUCH_HOLD_TOLERANCE = 8;

const POINTER_ACTIVATION_DISTANCE = 4;

const EDGE_SCROLL_ZONE = 88;

const EDGE_SCROLL_SPEED = 16;

const DROP_DURATION = 200;

const EASING = "cubic-bezier(0.2, 0, 0, 1)";

export interface DragReorderItemProps {
  "data-reorder-index": number;
  "data-dragging": boolean;
  style: CSSProperties;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
  onLostPointerCapture: (event: ReactPointerEvent<HTMLElement>) => void;
  onContextMenu: (event: ReactMouseEvent<HTMLElement>) => void;
}

export interface DragReorderHandleProps {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
}

export interface DragReorderPlaceholder {
  top: number;
  height: number;
}

export interface UseDragReorderResult {
  isDragging: boolean;
  draggingIndex: number | null;
  overIndex: number | null;
  placeholder: DragReorderPlaceholder | null;
  listProps: { [REORDER_LIST_ATTRIBUTE]: string };
  getItemProps: (index: number) => DragReorderItemProps;
  getHandleProps: () => DragReorderHandleProps;
}

interface ItemRect {
  top: number;
  height: number;
}

/** Row geometry captured once per drag, in page coordinates. */
interface DragMeasurements {
  rects: ItemRect[];
  span: number;
  containerTop: number;
  activeTop: number;
  activeHeight: number;
}

interface PointerOrigin {
  pointerId: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
}

interface DragTarget {
  index: number;
  overIndex: number;
}

interface DragView extends DragTarget {
  dx: number;
  dy: number;
  isDropping: boolean;
  span: number;
  placeholderTop: number;
  placeholderHeight: number;
}

/**
 * A press that is not a drag yet: a mouse press activates once it travels far
 * enough, a touch press once it is held long enough.
 */
interface PendingDrag {
  pointerId: number;
  pointerType: string;
  element: HTMLElement;
  clientX: number;
  clientY: number;
  timer: number | null;
}

const blockTouchScroll = (event: TouchEvent) => {
  if (event.cancelable) event.preventDefault();
};

const findItemElement = (element: HTMLElement): HTMLElement | null =>
  element.closest<HTMLElement>(`[${REORDER_INDEX_ATTRIBUTE}]`);

const readItemIndex = (element: HTMLElement): number | null => {
  const index = Number(element.getAttribute(REORDER_INDEX_ATTRIBUTE));

  return Number.isInteger(index) ? index : null;
};

/** Snapshots every row so transforms applied later never feed back into hit-testing. */
const measureItems = (
  element: HTMLElement,
  index: number,
): DragMeasurements | null => {
  const container =
    element.closest<HTMLElement>(`[${REORDER_LIST_ATTRIBUTE}]`) ??
    element.parentElement;

  if (!container) return null;

  const rects = Array.from(
    container.querySelectorAll<HTMLElement>(`[${REORDER_INDEX_ATTRIBUTE}]`),
  ).map((item) => {
    const rect = item.getBoundingClientRect();

    return { top: rect.top + window.scrollY, height: rect.height };
  });

  const active = rects[index];

  if (!active) return null;

  const gap =
    rects.length > 1
      ? Math.max(0, rects[1].top - (rects[0].top + rects[0].height))
      : 0;

  return {
    rects,
    span: active.height + gap,
    containerTop: container.getBoundingClientRect().top + window.scrollY,
    activeTop: active.top,
    activeHeight: active.height,
  };
};

/** The slot whose centre sits closest to the lifted card's centre. */
const resolveOverIndex = (
  measurements: DragMeasurements,
  index: number,
  dy: number,
): number => {
  const draggedCenter =
    measurements.activeTop + dy + measurements.activeHeight / 2;

  let best = index;
  let bestDistance = Number.POSITIVE_INFINITY;

  measurements.rects.forEach((rect, candidate) => {
    const distance = Math.abs(rect.top + rect.height / 2 - draggedCenter);

    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  });

  return best;
};

const resolveDropOffset = (
  measurements: DragMeasurements,
  { index, overIndex }: DragTarget,
): number => {
  if (overIndex === index) return 0;

  const target = measurements.rects[overIndex];

  const finalTop =
    overIndex > index
      ? target.top + target.height - measurements.activeHeight
      : target.top;

  return finalTop - measurements.activeTop;
};

/** Where the lifted card will land, relative to the list container. */
const resolvePlaceholderTop = (
  measurements: DragMeasurements,
  target: DragTarget,
): number =>
  measurements.activeTop -
  measurements.containerTop +
  resolveDropOffset(measurements, target);

/** How far a passive row steps aside to open the gap at `overIndex`. */
const getShift = (
  { index, overIndex }: DragTarget,
  span: number,
  item: number,
): number => {
  if (index < overIndex && item > index && item <= overIndex) return -span;

  if (index > overIndex && item >= overIndex && item < index) return span;

  return 0;
};

export const useDragReorder = (
  onReorder: (from: number, to: number) => void,
): UseDragReorderResult => {
  const [view, setView] = useState<DragView | null>(null);

  const dragRef = useRef<DragTarget | null>(null);
  const measurementsRef = useRef<DragMeasurements | null>(null);
  const originRef = useRef<PointerOrigin | null>(null);
  const captureRef = useRef<HTMLElement | null>(null);
  const pendingRef = useRef<PendingDrag | null>(null);
  const frameRef = useRef<number | null>(null);
  const dropTimerRef = useRef<number | null>(null);
  const touchBlockedRef = useRef(false);

  const onReorderRef = useRef(onReorder);

  useEffect(() => {
    onReorderRef.current = onReorder;
  });

  const clearPending = useCallback(() => {
    const pending = pendingRef.current;

    if (!pending) return null;

    if (pending.timer !== null) window.clearTimeout(pending.timer);

    pendingRef.current = null;

    return pending;
  }, []);

  const cancelPending = useCallback(() => {
    const pending = clearPending();

    if (pending?.element.hasPointerCapture(pending.pointerId)) {
      pending.element.releasePointerCapture(pending.pointerId);
    }
  }, [clearPending]);

  const stopAutoScroll = useCallback(() => {
    if (frameRef.current === null) return;

    cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }, []);

  const releasePointer = useCallback(() => {
    const origin = originRef.current;
    const element = captureRef.current;

    if (element && origin && element.hasPointerCapture(origin.pointerId)) {
      element.releasePointerCapture(origin.pointerId);
    }

    if (touchBlockedRef.current) {
      document.removeEventListener("touchmove", blockTouchScroll);
      touchBlockedRef.current = false;
    }

    captureRef.current = null;
    originRef.current = null;
  }, []);

  /**
   * Commits a drop that is still animating. Flushed synchronously so the rows
   * carry their new indices before a following gesture measures them.
   */
  const flushDrop = useCallback(() => {
    if (dropTimerRef.current === null) return;

    window.clearTimeout(dropTimerRef.current);
    dropTimerRef.current = null;

    const target = dragRef.current;

    dragRef.current = null;
    measurementsRef.current = null;

    flushSync(() => {
      setView(null);

      if (target && target.overIndex !== target.index) {
        onReorderRef.current(target.index, target.overIndex);
      }
    });
  }, []);

  const syncPointer = useCallback(() => {
    const origin = originRef.current;
    const measurements = measurementsRef.current;
    const drag = dragRef.current;

    if (!origin || !measurements || !drag) return;

    const dx = origin.clientX + window.scrollX - origin.pageX;
    const dy = origin.clientY + window.scrollY - origin.pageY;

    drag.overIndex = resolveOverIndex(measurements, drag.index, dy);

    const { overIndex } = drag;
    const placeholderTop = resolvePlaceholderTop(measurements, drag);

    setView((current) =>
      current && !current.isDropping
        ? { ...current, dx, dy, overIndex, placeholderTop }
        : current,
    );
  }, []);

  const startAutoScroll = useCallback(() => {
    if (frameRef.current !== null) return;

    const tick = () => {
      const origin = originRef.current;

      if (!origin) {
        frameRef.current = null;
        return;
      }

      const y = origin.clientY;
      const fromBottom = window.innerHeight - y;

      let delta = 0;

      if (y < EDGE_SCROLL_ZONE) {
        delta = -EDGE_SCROLL_SPEED * (1 - y / EDGE_SCROLL_ZONE);
      } else if (fromBottom < EDGE_SCROLL_ZONE) {
        delta = EDGE_SCROLL_SPEED * (1 - fromBottom / EDGE_SCROLL_ZONE);
      }

      if (delta !== 0) {
        window.scrollBy(0, delta);

        syncPointer();
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
  }, [syncPointer]);

  const startDrag = useCallback(
    (
      element: HTMLElement,
      pointerId: number,
      clientX: number,
      clientY: number,
      pointerType: string,
    ) => {
      clearPending();
      flushDrop();

      const index = readItemIndex(element);

      if (index === null) return;

      const measurements = measureItems(element, index);

      if (!measurements) return;

      measurementsRef.current = measurements;
      dragRef.current = { index, overIndex: index };
      originRef.current = {
        pointerId,
        clientX,
        clientY,
        pageX: clientX + window.scrollX,
        pageY: clientY + window.scrollY,
      };
      captureRef.current = element;

      element.setPointerCapture(pointerId);

      if (pointerType === "touch") {
        document.addEventListener("touchmove", blockTouchScroll, {
          passive: false,
        });
        touchBlockedRef.current = true;
      }

      setView({
        index,
        overIndex: index,
        dx: 0,
        dy: 0,
        isDropping: false,
        span: measurements.span,
        placeholderTop: measurements.activeTop - measurements.containerTop,
        placeholderHeight: measurements.activeHeight,
      });
      startAutoScroll();
    },
    [clearPending, flushDrop, startAutoScroll],
  );

  /** Animates the lifted card into its slot, then commits the reorder. */
  const endDrag = useCallback(() => {
    const drag = dragRef.current;
    const measurements = measurementsRef.current;

    releasePointer();
    stopAutoScroll();
    cancelPending();

    if (!drag || !measurements) {
      setView(null);
      return;
    }

    setView((current) =>
      current
        ? {
            ...current,
            ...drag,
            dx: 0,
            dy: resolveDropOffset(measurements, drag),
            isDropping: true,
          }
        : current,
    );

    dropTimerRef.current = window.setTimeout(() => {
      dropTimerRef.current = null;
      dragRef.current = null;
      measurementsRef.current = null;

      setView(null);

      if (drag.overIndex !== drag.index) {
        onReorderRef.current(drag.index, drag.overIndex);
      }
    }, DROP_DURATION);
  }, [cancelPending, releasePointer, stopAutoScroll]);

  const handleItemPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      if ((event.target as HTMLElement).closest("button")) return;

      const element = findItemElement(event.currentTarget);

      if (!element) return;

      cancelPending();

      const isTouch = event.pointerType === "touch";
      const { pointerId, pointerType, clientX, clientY } = event;

      if (isTouch) {
        pendingRef.current = {
          pointerId,
          pointerType,
          element,
          clientX,
          clientY,
          timer: window.setTimeout(() => {
            const pending = pendingRef.current;

            if (!pending) return;

            startDrag(
              pending.element,
              pending.pointerId,
              pending.clientX,
              pending.clientY,
              pending.pointerType,
            );
          }, TOUCH_HOLD_DELAY),
        };

        return;
      }

      event.preventDefault();

      // Captured up front so the press still becomes a drag if the pointer
      // leaves the card before clearing the activation distance.
      element.setPointerCapture(pointerId);

      pendingRef.current = {
        pointerId,
        pointerType,
        element,
        clientX,
        clientY,
        timer: null,
      };
    },
    [cancelPending, startDrag],
  );

  const handleHandlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      const element = findItemElement(event.currentTarget);

      if (!element) return;

      event.preventDefault();
      event.stopPropagation();

      startDrag(
        element,
        event.pointerId,
        event.clientX,
        event.clientY,
        event.pointerType,
      );
    },
    [startDrag],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const pending = pendingRef.current;

      if (pending && pending.pointerId === event.pointerId) {
        const travelled = Math.max(
          Math.abs(event.clientX - pending.clientX),
          Math.abs(event.clientY - pending.clientY),
        );

        if (pending.timer !== null) {
          if (travelled > TOUCH_HOLD_TOLERANCE) cancelPending();

          return;
        }

        if (travelled <= POINTER_ACTIVATION_DISTANCE) return;

        startDrag(
          pending.element,
          pending.pointerId,
          pending.clientX,
          pending.clientY,
          pending.pointerType,
        );
      }

      const origin = originRef.current;

      if (!origin || origin.pointerId !== event.pointerId) return;

      event.preventDefault();

      origin.clientX = event.clientX;
      origin.clientY = event.clientY;

      syncPointer();
    },
    [cancelPending, startDrag, syncPointer],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (pendingRef.current?.pointerId === event.pointerId) cancelPending();

      if (originRef.current?.pointerId !== event.pointerId) return;

      endDrag();
    },
    [cancelPending, endDrag],
  );

  const handleLostPointerCapture = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (originRef.current?.pointerId !== event.pointerId) return;

      endDrag();
    },
    [endDrag],
  );

  useEffect(
    () => () => {
      if (pendingRef.current?.timer != null) {
        window.clearTimeout(pendingRef.current.timer);
      }

      if (dropTimerRef.current !== null) {
        window.clearTimeout(dropTimerRef.current);
      }

      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);

      if (touchBlockedRef.current) {
        document.removeEventListener("touchmove", blockTouchScroll);
      }
    },
    [],
  );

  const getItemStyle = useCallback(
    (index: number): CSSProperties => {
      if (!view) return {};

      if (index === view.index) {
        return {
          transform: view.isDropping
            ? `translate3d(${view.dx}px, ${view.dy}px, 0)`
            : `translate3d(${view.dx}px, ${view.dy}px, 0) scale(1.02) rotate(0.4deg)`,
          transition: view.isDropping
            ? `transform ${DROP_DURATION}ms ${EASING}`
            : "none",
          zIndex: 30,
          willChange: "transform",
          touchAction: "none",
          // The row indices only catch up once the drop commits, so keep the
          // card's own buttons inert until then.
          pointerEvents: view.isDropping ? "none" : undefined,
        };
      }

      return {
        transform: `translate3d(0, ${getShift(view, view.span, index)}px, 0)`,
        transition: `transform ${DROP_DURATION}ms ${EASING}`,
        willChange: "transform",
        pointerEvents: "none",
      };
    },
    [view],
  );

  const getItemProps = useCallback(
    (index: number): DragReorderItemProps => ({
      [REORDER_INDEX_ATTRIBUTE]: index,
      "data-dragging": view?.index === index,
      style: getItemStyle(index),
      onPointerDown: handleItemPointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      onLostPointerCapture: handleLostPointerCapture,
      onContextMenu: (event) => {
        if (view) event.preventDefault();
      },
    }),
    [
      getItemStyle,
      handleItemPointerDown,
      handleLostPointerCapture,
      handlePointerMove,
      handlePointerUp,
      view,
    ],
  );

  const getHandleProps = useCallback(
    (): DragReorderHandleProps => ({
      onPointerDown: handleHandlePointerDown,
    }),
    [handleHandlePointerDown],
  );

  return {
    isDragging: view !== null && !view.isDropping,
    draggingIndex: view?.index ?? null,
    overIndex: view?.overIndex ?? null,
    placeholder:
      view && !view.isDropping
        ? { top: view.placeholderTop, height: view.placeholderHeight }
        : null,
    listProps: { [REORDER_LIST_ATTRIBUTE]: "" },
    getItemProps,
    getHandleProps,
  };
};
