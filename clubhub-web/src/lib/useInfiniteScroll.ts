import { useEffect, useRef } from "react";

// Calls onLoadMore whenever the returned sentinel element comes within
// rootMargin of the viewport. The observer is recreated each time `enabled`
// flips back to true (i.e. after every load), so if the sentinel is still
// visible because the content doesn't fill the screen yet, it keeps loading.
export function useInfiniteScroll<T extends Element = HTMLDivElement>(
  onLoadMore: () => void,
  enabled: boolean,
  rootMargin = "400px"
) {
  const sentinelRef = useRef<T>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  // Always call the latest callback so it sees current filters/offset
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!enabled || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMoreRef.current();
        }
      },
      { rootMargin }
    );
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [enabled, rootMargin]);

  return sentinelRef;
}
