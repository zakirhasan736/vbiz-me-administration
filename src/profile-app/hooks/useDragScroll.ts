import { useEffect, useRef } from 'react'

export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const ele = ref.current
    if (!ele) return

    let isDown = false
    let startX: number
    let scrollLeft: number

    const onMouseDown = (e: MouseEvent) => {
      isDown = true
      ele.style.cursor = 'grabbing'
      ele.style.userSelect = 'none'
      startX = e.pageX
      scrollLeft = ele.scrollLeft
    }

    const onMouseLeave = () => {
      isDown = false
      ele.style.cursor = 'grab'
      ele.style.removeProperty('user-select')
    }

    const onMouseUp = () => {
      isDown = false
      ele.style.cursor = 'grab'
      ele.style.removeProperty('user-select')
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return
      e.preventDefault()
      const walk = (e.pageX - startX) * 1.5
      ele.scrollLeft = scrollLeft - walk
    }

    ele.addEventListener('mousedown', onMouseDown)
    ele.addEventListener('mouseleave', onMouseLeave)
    ele.addEventListener('mouseup', onMouseUp)
    ele.addEventListener('mousemove', onMouseMove)

    return () => {
      ele.removeEventListener('mousedown', onMouseDown)
      ele.removeEventListener('mouseleave', onMouseLeave)
      ele.removeEventListener('mouseup', onMouseUp)
      ele.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return ref
}
