export type Phase = 'dawn' | 'day' | 'dusk' | 'night'

export type Look = 'autumn' | 'observatory' | 'rain'

export type Limit = { kind: string; percentUsed: number; resetsAt?: string }

export type Meter = {
  limits: Limit[]
  contextPercent: number | null
  costUsd: number | null
  contextTokens?: number | null
  contextWindow?: number | null
}

declare module 'claude-code' {
  interface PluginState {
    'autumn-hollow': { meter: Meter | null; phase: Phase; look: Look }
  }
}
