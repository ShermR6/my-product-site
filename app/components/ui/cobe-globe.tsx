"use client"

import { useEffect, useRef, useCallback } from "react"
import createGlobe from "cobe"

interface Marker {
  id?: string
  location: [number, number]
  label?: string
  color?: [number, number, number]
}

interface Arc {
  id?: string
  from: [number, number]
  to: [number, number]
  label?: string
  color?: [number, number, number]
}

interface GlobeProps {
  markers?: Marker[]
  arcs?: Arc[]
  className?: string
  markerColor?: [number, number, number]
  baseColor?: [number, number, number]
  arcColor?: [number, number, number]
  glowColor?: [number, number, number]
  dark?: number
  mapBrightness?: number
  markerSize?: number
  markerElevation?: number
  arcWidth?: number
  arcHeight?: number
  speed?: number
  theta?: number
  diffuse?: number
  mapSamples?: number
}

export function Globe({
  markers = [],
  arcs = [],
  className = "",
  markerColor = [0.06, 0.65, 0.91],
  baseColor = [1, 1, 1],
  arcColor = [0.06, 0.65, 0.91],
  glowColor = [0.85, 0.93, 1.0],
  dark = 0,
  mapBrightness = 10,
  markerSize = 0.04,
  markerElevation = 0.01,
  arcWidth = 0.5,
  arcHeight = 0.3,
  speed = 0.003,
  theta = 0.2,
  diffuse = 1.5,
  mapSamples = 16000,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null)
  const lastPointer = useRef<{ x: number; y: number; t: number } | null>(null)
  const dragOffset = useRef({ phi: 0, theta: 0 })
  const velocity = useRef({ phi: 0, theta: 0 })
  const phiOffsetRef = useRef(0)
  const thetaOffsetRef = useRef(0)
  const isPausedRef = useRef(false)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY }
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing"
    isPausedRef.current = true
  }, [])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!pointerInteracting.current) return
    const deltaX = e.clientX - pointerInteracting.current.x
    const deltaY = e.clientY - pointerInteracting.current.y
    dragOffset.current = { phi: deltaX / 300, theta: deltaY / 1000 }
    const now = Date.now()
    if (lastPointer.current) {
      const dt = Math.max(now - lastPointer.current.t, 1)
      const max = 0.15
      velocity.current = {
        phi:   Math.max(-max, Math.min(max, ((e.clientX - lastPointer.current.x) / dt) * 0.3)),
        theta: Math.max(-max, Math.min(max, ((e.clientY - lastPointer.current.y) / dt) * 0.08)),
      }
    }
    lastPointer.current = { x: e.clientX, y: e.clientY, t: now }
  }, [])

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current) {
      phiOffsetRef.current += dragOffset.current.phi
      thetaOffsetRef.current += dragOffset.current.theta
      dragOffset.current = { phi: 0, theta: 0 }
      lastPointer.current = null
    }
    pointerInteracting.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = "grab"
    isPausedRef.current = false
  }, [])

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    window.addEventListener("pointerup", handlePointerUp, { passive: true })
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [handlePointerMove, handlePointerUp])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let globe: ReturnType<typeof createGlobe> | null = null
    let animId: number
    let phi = 0

    function init() {
      const w = canvas!.offsetWidth
      if (w === 0 || globe) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      globe = createGlobe(canvas!, {
        devicePixelRatio: dpr,
        width: w,
        height: w,
        phi: 0,
        theta,
        dark,
        diffuse,
        mapSamples,
        mapBrightness,
        baseColor,
        markerColor,
        glowColor,
        markerElevation,
        markers: markers.map((m) => ({ location: m.location, size: markerSize, ...(m.id ? { id: m.id } : {}), ...(m.color ? { color: m.color } : {}) })),
        arcs: arcs.map((a) => ({ from: a.from, to: a.to, ...(a.id ? { id: a.id } : {}), ...(a.color ? { color: a.color } : {}) })),
        arcColor,
        arcWidth,
        arcHeight,
      })

      function tick() {
        if (!isPausedRef.current) {
          phi += speed
          if (Math.abs(velocity.current.phi) > 0.0001 || Math.abs(velocity.current.theta) > 0.0001) {
            phiOffsetRef.current += velocity.current.phi
            thetaOffsetRef.current += velocity.current.theta
            velocity.current.phi *= 0.95
            velocity.current.theta *= 0.95
          }
          const tMin = -0.4, tMax = 0.4
          if (thetaOffsetRef.current < tMin) thetaOffsetRef.current += (tMin - thetaOffsetRef.current) * 0.1
          else if (thetaOffsetRef.current > tMax) thetaOffsetRef.current += (tMax - thetaOffsetRef.current) * 0.1
        }
        globe!.update({
          phi:   phi + phiOffsetRef.current + dragOffset.current.phi,
          theta: theta + thetaOffsetRef.current + dragOffset.current.theta,
        })
        animId = requestAnimationFrame(tick)
      }
      tick()
      setTimeout(() => { if (canvas) canvas.style.opacity = "1" })
    }

    if (canvas.offsetWidth > 0) {
      init()
    } else {
      const ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) { ro.disconnect(); init() }
      })
      ro.observe(canvas)
      return () => ro.disconnect()
    }

    return () => {
      cancelAnimationFrame(animId)
      globe?.destroy()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`relative aspect-square select-none ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        style={{ width: "100%", height: "100%", cursor: "grab", opacity: 0, transition: "opacity 1.2s ease", touchAction: "none" }}
      />
      {markers.filter(m => m.id && m.label).map((m) => (
        <div
          key={m.id}
          style={{
            position: "absolute",
            positionAnchor: `--cobe-${m.id}`,
            bottom: "anchor(top)",
            left: "anchor(center)",
            translate: "-50% 0",
            marginBottom: 8,
            padding: "3px 8px",
            background: "#0F172A",
            color: "#fff",
            fontFamily: "monospace",
            fontSize: "0.6rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
            whiteSpace: "nowrap" as const,
            pointerEvents: "none" as const,
            borderRadius: 4,
            opacity: `var(--cobe-visible-${m.id}, 0)`,
            filter: `blur(calc((1 - var(--cobe-visible-${m.id}, 0)) * 6px))`,
            transition: "opacity 0.6s, filter 0.6s",
          }}
        >
          {m.label}
        </div>
      ))}
    </div>
  )
}
