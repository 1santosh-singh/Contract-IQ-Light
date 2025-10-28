/**
 * Animated counter component for statistics
 */
import React, { useState, useEffect, useRef } from 'react'

interface AnimatedCounterProps {
  target: number
  duration?: number
  className?: string
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ 
  target, 
  duration = 2000, 
  className 
}) => {
  const [count, setCount] = useState(0)
  const startTimeRef = useRef<number>()

  useEffect(() => {
    const startTime = Date.now()
    startTimeRef.current = startTime
    let animationFrame: number

    const animate = () => {
      if (!startTimeRef.current) return

      const elapsed = Date.now() - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const currentCount = Math.floor(target * progress)

      setCount(currentCount)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [target, duration])

  return (
    <span className={className}>
      {count.toLocaleString()}
    </span>
  )
}
