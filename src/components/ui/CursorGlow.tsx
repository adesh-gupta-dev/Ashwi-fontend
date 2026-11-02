import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';

/** A quiet pointer-following accent for desktop web; touch layouts stay clear. */
export function CursorGlow() {
  const position = useRef(new Animated.ValueXY({ x: -32, y: -32 })).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let targetX = -32;
    let targetY = -32;
    let currentX = -32;
    let currentY = -32;
    let hasPointer = false;
    let isVisible = false;
    let frame: number | null = null;

    const follow = () => {
      frame = null;
      currentX += (targetX - currentX) * 0.78;
      currentY += (targetY - currentY) * 0.78;
      position.setValue({ x: currentX, y: currentY });
      if (Math.abs(targetX - currentX) > 0.2 || Math.abs(targetY - currentY) > 0.2) {
        frame = window.requestAnimationFrame(follow);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      targetX = event.clientX - 10;
      targetY = event.clientY - 10;
      if (!hasPointer) {
        hasPointer = true;
        currentX = targetX;
        currentY = targetY;
        position.setValue({ x: currentX, y: currentY });
      }
      if (frame === null) frame = window.requestAnimationFrame(follow);
      if (!isVisible) {
        isVisible = true;
        Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }).start();
      }
    };
    const onPointerLeave = () => {
      isVisible = false;
      Animated.timing(opacity, { toValue: 0, duration: 120, useNativeDriver: true }).start();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeave);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [opacity, position]);

  if (Platform.OS !== 'web') return null;
  return (
    <Animated.View pointerEvents="none" style={[styles.orb, { opacity, transform: position.getTranslateTransform() }]}>
      <Animated.View style={styles.core} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    zIndex: 9999,
    left: 0,
    top: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 43, 35, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 88, 0.34)',
    shadowColor: '#ff3028',
    shadowOpacity: 0.72,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  core: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 82, 70, 0.62)',
  },
});
