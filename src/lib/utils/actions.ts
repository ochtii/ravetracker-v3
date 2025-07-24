/**
 * Click outside action for Svelte components
 * Usage: use:clickOutside on:click_outside={handler}
 */
export function clickOutside(node: HTMLElement) {
  const handleClick = (event: MouseEvent) => {
    if (!node.contains(event.target as Node)) {
      node.dispatchEvent(new CustomEvent('click_outside'))
    }
  }

  document.addEventListener('click', handleClick, true)

  return {
    destroy() {
      document.removeEventListener('click', handleClick, true)
    }
  }
}

/**
 * Focus trap action to keep focus within an element
 * Usage: use:focusTrap
 */
export function focusTrap(node: HTMLElement) {
  const focusableElements = node.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>
  
  const firstFocusable = focusableElements[0]
  const lastFocusable = focusableElements[focusableElements.length - 1]

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          event.preventDefault()
          lastFocusable?.focus()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          event.preventDefault()
          firstFocusable?.focus()
        }
      }
    }
  }

  node.addEventListener('keydown', handleKeyDown)
  firstFocusable?.focus()

  return {
    destroy() {
      node.removeEventListener('keydown', handleKeyDown)
    }
  }
}

/**
 * Auto-resize textarea action
 * Usage: use:autoResize
 */
export function autoResize(node: HTMLTextAreaElement) {
  const resize = () => {
    node.style.height = 'auto'
    node.style.height = `${node.scrollHeight}px`
  }

  node.addEventListener('input', resize)
  resize() // Initial resize

  return {
    destroy() {
      node.removeEventListener('input', resize)
    }
  }
}

/**
 * Long press action
 * Usage: use:longPress on:longpress={handler}
 */
export function longPress(node: HTMLElement, duration = 500) {
  let timer: NodeJS.Timeout

  const handleMouseDown = () => {
    timer = setTimeout(() => {
      node.dispatchEvent(new CustomEvent('longpress'))
    }, duration)
  }

  const handleMouseUp = () => {
    clearTimeout(timer)
  }

  node.addEventListener('mousedown', handleMouseDown)
  node.addEventListener('mouseup', handleMouseUp)
  node.addEventListener('mouseleave', handleMouseUp)

  return {
    update(newDuration: number) {
      duration = newDuration
    },
    destroy() {
      clearTimeout(timer)
      node.removeEventListener('mousedown', handleMouseDown)
      node.removeEventListener('mouseup', handleMouseUp)
      node.removeEventListener('mouseleave', handleMouseUp)
    }
  }
}

/**
 * Portal action - render element at different location in DOM
 * Usage: use:portal={target}
 */
export function portal(node: HTMLElement, target: string | HTMLElement = 'body') {
  let targetEl: HTMLElement | null = null

  function update(newTarget: string | HTMLElement) {
    target = newTarget
    if (targetEl) {
      targetEl.removeChild(node)
    }
    targetEl = typeof target === 'string' ? document.querySelector(target) : target
    if (targetEl) {
      targetEl.appendChild(node)
    }
  }

  update(target)

  return {
    update,
    destroy() {
      if (targetEl && node.parentNode === targetEl) {
        targetEl.removeChild(node)
      }
    }
  }
}
