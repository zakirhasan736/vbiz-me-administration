import { useEffect, useRef } from 'react'

class Point {
  x: number
  y: number
  timestamp: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.timestamp = Date.now()
  }
}

export const CursorTrail = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let points: Point[] = []
    let animationFrameId: number

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    resize()

    const mouse = { x: -100, y: -100 }
    let isMouseActive = false

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      isMouseActive = true
      points.push(new Point(e.clientX, e.clientY))
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX
        mouse.y = e.touches[0].clientY
        isMouseActive = true
        points.push(new Point(e.touches[0].clientX, e.touches[0].clientY))
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })

    const handleMouseLeave = () => {
      isMouseActive = false
    }
    window.addEventListener('mouseout', handleMouseLeave)

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const now = Date.now()

      const MAX_AGE = 450
      points = points.filter((p) => now - p.timestamp < MAX_AGE)

      if (points.length > 0) {
        ctx.beginPath()
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'

        for (let i = 0; i < points.length; i++) {
          const p = points[i]

          if (i === 0) {
            ctx.moveTo(p.x, p.y)
          } else {
            const prev = points[i - 1]
            const xc = (prev.x + p.x) / 2
            const yc = (prev.y + p.y) / 2
            ctx.quadraticCurveTo(prev.x, prev.y, xc, yc)
          }
        }

        if (isMouseActive) {
          ctx.lineTo(mouse.x, mouse.y)
        }

        ctx.lineWidth = 4

        // Add a beautiful gradient to the stroke
        if (points.length > 1) {
          const gradient = ctx.createLinearGradient(points[0].x, points[0].y, mouse.x, mouse.y)
          gradient.addColorStop(0, 'rgba(244, 244, 245, 0)')
          gradient.addColorStop(0.5, 'rgba(244, 244, 245, 0.4)')
          gradient.addColorStop(1, 'rgba(244, 244, 245, 0.8)')
          ctx.strokeStyle = gradient
        } else {
          ctx.strokeStyle = 'rgba(244, 244, 245, 0.6)'
        }

        ctx.shadowBlur = 0
        ctx.shadowColor = 'transparent'
        ctx.stroke()
      }

      if (isMouseActive && mouse.x > 0 && mouse.y > 0) {
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(244, 244, 245, 0.9)'
        ctx.shadowBlur = 0
        ctx.shadowColor = 'transparent'
        ctx.fill()

        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = '#09090b'
        ctx.fill()
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('mouseout', handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[99999]" />
}
