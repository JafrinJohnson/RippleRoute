"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { buildPath, pointAtDistance } from "@/lib/routeAnimator";

/**
 * RippleRoute — Shared Road Movement Engine Hook
 * 
 * Advances along real road geometry frame-by-frame using requestAnimationFrame.
 * Never cuts corners or travels in straight lines.
 * Respects prefers-reduced-motion by slowing animations.
 * Pauses animations when browser tab is hidden.
 *
 * @param {[number, number][]} coords Array of [lat, lng] road points
 * @param {object} options
 * @param {number} [options.speedKmh=40] Base vehicle speed in km/h
 * @param {number} [options.demoSpeedFactor=10] Acceleration multiplier for demo
 * @param {boolean} [options.loop=false] Whether to loop back to start upon completion
 * @param {boolean} [options.autoStart=false] Whether to start moving immediately
 * @param {number} [options.startOffsetM=0] Initial distance offset along path in meters
 * @param {number} [options.initialProgress=0] Initial progress (0 to 1) along path
 * @param {function} [options.onEnd] Callback when route completes (if loop=false)
 */
export function useRouteMover(coords, options = {}) {
  const {
    speedKmh = 40,
    demoSpeedFactor = 10,
    loop = false,
    autoStart = false,
    startOffsetM = 0,
    initialProgress = 0,
    onEnd = null,
  } = options;

  const [speedFactor, setSpeedFactor] = useState(demoSpeedFactor);
  const [running, setRunning] = useState(autoStart);
  const [isDelivered, setIsDelivered] = useState(false);

  useEffect(() => {
    setSpeedFactor(demoSpeedFactor);
  }, [demoSpeedFactor]);

  // Precompute cumulative distance polyline path
  const path = useMemo(() => {
    return buildPath(coords);
  }, [coords]);

  // Initial distance calculation
  const getInitialDist = useCallback(() => {
    if (!path || path.totalDistance <= 0) return 0;
    if (startOffsetM > 0) return Math.min(startOffsetM, path.totalDistance);
    if (initialProgress > 0) return Math.min(initialProgress * path.totalDistance, path.totalDistance);
    return 0;
  }, [path, startOffsetM, initialProgress]);

  const distRef = useRef(getInitialDist());
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const isTabHiddenRef = useRef(false);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  // Initialize position and progress state
  const initialPoint = useMemo(() => {
    return pointAtDistance(path, distRef.current);
  }, [path]);

  const [position, setPosition] = useState(initialPoint);
  const [progress, setProgress] = useState(
    path.totalDistance > 0 ? distRef.current / path.totalDistance : 0
  );

  // Motion preference detection
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    try {
      const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mql.matches);
      const handler = (e) => setReducedMotion(e.matches);
      if (mql.addEventListener) {
        mql.addEventListener("change", handler);
        return () => mql.removeEventListener("change", handler);
      } else if (mql.addListener) {
        mql.addListener(handler);
        return () => mql.removeListener(handler);
      }
    } catch (_) {}
  }, []);

  // Browser tab visibility handling
  useEffect(() => {
    if (typeof document === "undefined") return;
    const handleVisibility = () => {
      if (document.hidden) {
        isTabHiddenRef.current = true;
      } else {
        isTabHiddenRef.current = false;
        lastTimeRef.current = performance.now();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // When coords change, reset or adjust distance
  useEffect(() => {
    const initD = getInitialDist();
    distRef.current = initD;
    const pt = pointAtDistance(path, initD);
    setPosition(pt);
    setProgress(path.totalDistance > 0 ? initD / path.totalDistance : 0);
    setIsDelivered(false);
    lastTimeRef.current = null;
  }, [path, getInitialDist]);

  // Animation frame loop
  useEffect(() => {
    if (!running || !path || path.totalDistance <= 0) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const tick = (now) => {
      if (!running) return;

      if (isTabHiddenRef.current) {
        lastTimeRef.current = now;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (lastTimeRef.current === null) {
        lastTimeRef.current = now;
      }

      const deltaMs = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Cap delta time to 100ms to avoid huge frame jumps
      const deltaSeconds = Math.min(deltaMs / 1000, 0.1);

      // Effective multiplier: reduce by 75% if prefers-reduced-motion is active
      const effectiveMultiplier = reducedMotion
        ? Math.max(1, speedFactor * 0.25)
        : speedFactor;

      const speedMps = (speedKmh * 1000) / 3600;
      const stepM = speedMps * effectiveMultiplier * deltaSeconds;

      let newDist = distRef.current + stepM;
      let reachedEnd = false;

      if (newDist >= path.totalDistance) {
        if (loop) {
          newDist = path.totalDistance > 0 ? newDist % path.totalDistance : 0;
        } else {
          newDist = path.totalDistance;
          reachedEnd = true;
        }
      }

      distRef.current = newDist;
      const pt = pointAtDistance(path, newDist);
      setPosition(pt);

      const prog = path.totalDistance > 0 ? Math.min(newDist / path.totalDistance, 1) : 1;
      setProgress(prog);

      if (reachedEnd) {
        setRunning(false);
        setIsDelivered(true);
        if (onEndRef.current) {
          onEndRef.current();
        }
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [running, path, speedKmh, speedFactor, loop, reducedMotion]);

  const start = useCallback(() => {
    if (distRef.current >= (path?.totalDistance || 0) && !loop) {
      distRef.current = 0;
      setIsDelivered(false);
    }
    setRunning(true);
  }, [path, loop]);

  const pause = useCallback(() => {
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    setRunning(false);
    setIsDelivered(false);
    const initD = getInitialDist();
    distRef.current = initD;
    const pt = pointAtDistance(path, initD);
    setPosition(pt);
    setProgress(path.totalDistance > 0 ? initD / path.totalDistance : 0);
  }, [path, getInitialDist]);

  // Compute completed & remaining coordinates for route styling
  const { completedCoords, remainingCoords } = useMemo(() => {
    if (!path || !path.coords || path.coords.length < 2) {
      return { completedCoords: [], remainingCoords: path?.coords || [] };
    }

    const d = distRef.current;
    const cum = path.cumDistances;
    const coordsList = path.coords;

    if (d <= 0) {
      return {
        completedCoords: [coordsList[0]],
        remainingCoords: coordsList,
      };
    }

    if (d >= path.totalDistance) {
      return {
        completedCoords: coordsList,
        remainingCoords: [coordsList[coordsList.length - 1]],
      };
    }

    // Binary search for current segment
    let low = 0;
    let high = cum.length - 1;
    let segmentIdx = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (cum[mid] <= d) {
        segmentIdx = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const i = Math.min(segmentIdx, coordsList.length - 2);
    const currentCoord = [position.lat, position.lng];

    const completed = [...coordsList.slice(0, i + 1), currentCoord];
    const remaining = [currentCoord, ...coordsList.slice(i + 1)];

    return { completedCoords: completed, remainingCoords: remaining };
  }, [path, position]);

  const distanceCoveredM = distRef.current;
  const totalDistanceM = path?.totalDistance || 0;
  const remainingM = Math.max(0, totalDistanceM - distanceCoveredM);

  return {
    position,
    progress,
    distanceCoveredM,
    totalDistanceM,
    remainingM,
    completedCoords,
    remainingCoords,
    running,
    isDelivered,
    speedFactor,
    setSpeedFactor,
    start,
    pause,
    reset,
  };
}

export default useRouteMover;
