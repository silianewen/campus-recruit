// Legacy compatibility shim — re-exports from the new positionRegistry module.
// All page imports `from '../lib/positions'` still work without changes.
//
// New code should import from `positionRegistry` directly.

export {
  POSITIONS,
  POSITION_MAP,
  isPositionId,
  positionColor,
  positionHexColor,
} from './positionRegistry'
