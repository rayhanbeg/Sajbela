import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Locks body scroll while an overlay is open.
 *
 * Compensates for the disappearing scrollbar with padding so the page doesn't
 * visibly jump on desktop, and pins `position: fixed` on iOS where
 * `overflow: hidden` alone doesn't stop the body scrolling behind a modal.
 */
export function useScrollLock(locked) {
  useEffect(() => {
    if (!locked) return

    const { body, documentElement } = document
    const scrollY = window.scrollY
    const scrollBarWidth = window.innerWidth - documentElement.clientWidth

    const previous = {
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    }

    const isTouch = typeof window !== "undefined" && "ontouchstart" in window

    body.style.overflow = "hidden"
    if (scrollBarWidth > 0) body.style.paddingRight = `${scrollBarWidth}px`

    if (isTouch) {
      body.style.position = "fixed"
      body.style.top = `-${scrollY}px`
      body.style.width = "100%"
    }

    return () => {
      body.style.overflow = previous.overflow
      body.style.paddingRight = previous.paddingRight
      body.style.position = previous.position
      body.style.top = previous.top
      body.style.width = previous.width

      if (isTouch) window.scrollTo(0, scrollY)
    }
  }, [locked])
}

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",")

/**
 * Traps Tab focus inside an open overlay and restores focus to whatever was
 * focused before it opened. Required for modals/drawers to be keyboard-usable.
 *
 * @returns ref to attach to the overlay container.
 */
export function useFocusTrap(active) {
  const containerRef = useRef(null)
  const previouslyFocused = useRef(null)

  useEffect(() => {
    if (!active) return

    previouslyFocused.current = document.activeElement

    const container = containerRef.current
    if (!container) return

    // Move focus in on open — first focusable element, else the container.
    const focusables = container.querySelectorAll(FOCUSABLE)
    const first = focusables[0]
    if (first) {
      first.focus()
    } else {
      container.setAttribute("tabindex", "-1")
      container.focus()
    }

    const handleKeyDown = (event) => {
      if (event.key !== "Tab") return

      const items = Array.from(container.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      )
      if (items.length === 0) {
        event.preventDefault()
        return
      }

      const firstItem = items[0]
      const lastItem = items[items.length - 1]

      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault()
        lastItem.focus()
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault()
        firstItem.focus()
      }
    }

    container.addEventListener("keydown", handleKeyDown)

    return () => {
      container.removeEventListener("keydown", handleKeyDown)
      const toRestore = previouslyFocused.current
      if (toRestore && typeof toRestore.focus === "function") toRestore.focus()
    }
  }, [active])

  return containerRef
}

/** Calls `handler` when Escape is pressed, while `active`. */
export function useEscapeKey(active, handler) {
  useEffect(() => {
    if (!active) return

    const onKeyDown = (event) => {
      if (event.key === "Escape") handler(event)
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [active, handler])
}

/**
 * Subscribes to a media query.
 *   const isDesktop = useMediaQuery("(min-width: 1024px)")
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (event) => setMatches(event.matches)

    setMatches(mql.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [query])

  return matches
}

/** Debounces a rapidly-changing value (search inputs, price sliders). */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

/**
 * Closes a popover/dropdown when the user clicks or taps outside it.
 * @returns ref to attach to the element that should stay open.
 */
export function useClickOutside(active, handler) {
  const ref = useRef(null)
  const savedHandler = useRef(handler)

  useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  useEffect(() => {
    if (!active) return

    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return
      savedHandler.current(event)
    }

    document.addEventListener("mousedown", listener)
    document.addEventListener("touchstart", listener)
    return () => {
      document.removeEventListener("mousedown", listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [active])

  return ref
}

/**
 * `true` once the element scrolls into view. Used to fade sections in and to
 * trigger lazy loads. Unobserves after the first hit so it never re-runs.
 */
export function useInView(options = {}) {
  const { rootMargin = "120px", threshold = 0, once = true } = options
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Fail open: if IntersectionObserver is missing, show the content.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) observer.unobserve(element)
        } else if (!once) {
          setInView(false)
        }
      },
      { rootMargin, threshold },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [rootMargin, threshold, once])

  return [ref, inView]
}

/** State synced to localStorage — used by the guest cart. */
export function useLocalStorage(key, initialValue) {
  const [stored, setStored] = useState(() => {
    if (typeof window === "undefined") return initialValue
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value) => {
      setStored((prev) => {
        const next = value instanceof Function ? value(prev) : value
        try {
          window.localStorage.setItem(key, JSON.stringify(next))
        } catch {
          /* quota exceeded / private mode — keep the in-memory value */
        }
        return next
      })
    },
    [key],
  )

  return [stored, setValue]
}
