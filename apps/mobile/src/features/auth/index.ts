// Mod auth — API pública.
export { useAuth } from './store/auth-store';
export { useQuota, GUEST_DAILY_LIMIT } from './store/quota-store';
export { useGate, type GateAction } from './hooks/use-gate';
