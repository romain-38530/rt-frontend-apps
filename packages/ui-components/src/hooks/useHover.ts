/**
 * useHover Hook
 * Returns hover state and event handlers for hover effects without direct DOM manipulation
 *
 * Usage:
 * const { isHovered, hoverProps } = useHover();
 * <button {...hoverProps} style={{ background: isHovered ? 'blue' : 'gray' }}>
 *   Hover me
 * </button>
 */

import { useState, useCallback, useMemo } from 'react';

interface HoverState {
  isHovered: boolean;
  hoverProps: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
}

/**
 * Hook for managing hover state
 * @returns Object with isHovered boolean and hoverProps to spread on element
 */
export function useHover(): HoverState {
  const [isHovered, setIsHovered] = useState(false);

  const onMouseEnter = useCallback(() => setIsHovered(true), []);
  const onMouseLeave = useCallback(() => setIsHovered(false), []);

  const hoverProps = useMemo(
    () => ({ onMouseEnter, onMouseLeave }),
    [onMouseEnter, onMouseLeave]
  );

  return { isHovered, hoverProps };
}

/**
 * Hook for managing multiple hover states
 * Useful for lists or multiple interactive elements
 * @returns Function to get hover state for a specific key
 *
 * Usage:
 * const { getHoverProps, isHovered } = useHoverMap<string>();
 * {items.map(item => (
 *   <div
 *     key={item.id}
 *     {...getHoverProps(item.id)}
 *     style={{ opacity: isHovered(item.id) ? 1 : 0.8 }}
 *   >
 *     {item.name}
 *   </div>
 * ))}
 */
export function useHoverMap<T extends string | number>() {
  const [hoveredKey, setHoveredKey] = useState<T | null>(null);

  const getHoverProps = useCallback((key: T) => ({
    onMouseEnter: () => setHoveredKey(key),
    onMouseLeave: () => setHoveredKey(null),
  }), []);

  const isHovered = useCallback(
    (key: T) => hoveredKey === key,
    [hoveredKey]
  );

  return { getHoverProps, isHovered, hoveredKey };
}

export default useHover;
