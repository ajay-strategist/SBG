import { roundWeight, roundPurity } from './mathUtils';

/**
 * Calculates Pure Gold Weight:
 * Pure WT = Net WT * (Touch % / 100)
 * 
 * Example:
 * Net WT: -17.570 g, Touch: 76%
 * Pure WT = -17.570 * 0.76 = -13.3532 -> -13.353 g
 */
export function calculatePureWT(netWT: number, touchPercent: number): number {
  const net = Number(netWT) || 0;
  const touch = Number(touchPercent) || 0;
  const purityFraction = touch / 100;
  return roundWeight(net * purityFraction);
}

/**
 * Calculates Touch / Purity percentage from Net WT and Pure WT:
 * Touch = (Pure WT / Net WT) * 100
 */
export function calculateTouch(pureWT: number, netWT: number): number {
  const pure = Math.abs(Number(pureWT) || 0);
  const net = Math.abs(Number(netWT) || 0);
  if (net === 0) return 0;
  return roundPurity((pure / net) * 100);
}
