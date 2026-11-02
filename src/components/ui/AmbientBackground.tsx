import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/providers/ThemeProvider';

/** Decorative only: never intercepts workspace gestures or keyboard interaction. */
export function AmbientBackground({ subtle = false }: { subtle?: boolean }) {
  const { scheme } = useTheme();
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden', opacity: subtle ? 0.45 : 1 }]}>
    <LinearGradient colors={scheme === 'dark' ? ['#6b0d13', '#250b10', '#10090c'] : ['#ffd0c8', '#fff8f6']} start={{x:0,y:0}} end={{x:1,y:1}} style={{position:'absolute',width:720,height:600,borderRadius:500,left:-310,top:-430,borderWidth:1,borderColor:'rgba(255,40,30,0.2)'}} />
    <LinearGradient colors={scheme === 'dark' ? ['#11090c', '#570e16'] : ['#fff8f6', '#ffddd5']} start={{x:0,y:0}} end={{x:1,y:1}} style={{position:'absolute',width:840,height:740,borderRadius:500,right:-490,bottom:-510,borderWidth:1,borderColor:'rgba(255,40,30,0.2)'}} />
  </View>;
}
