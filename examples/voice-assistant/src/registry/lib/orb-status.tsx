import type { OrbState } from './orb-state';

const STATUS_TEXT: Record<OrbState, string> = {
  idle: 'Idle',
  connecting: 'Connecting',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
  error: 'Error',
  disabled: 'Muted',
};

export interface OrbStatusProps {
  state: OrbState;
  className?: string;
}

export const OrbStatus = ({ state, className }: OrbStatusProps) => (
  <span role="status" aria-live="polite" aria-atomic="true" className={className}>
    {STATUS_TEXT[state]}
  </span>
);
