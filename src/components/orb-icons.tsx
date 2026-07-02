const SIZE = 14;

export const PlayIcon = () => (
  <svg viewBox="0 0 24 24" width={SIZE} height={SIZE} fill="currentColor" aria-hidden="true">
    <path d="M8 5v14l11-7z" />
  </svg>
);

export const PauseIcon = () => (
  <svg viewBox="0 0 24 24" width={SIZE} height={SIZE} fill="currentColor" aria-hidden="true">
    <path d="M6.5 5h3v14h-3zM14.5 5h3v14h-3z" />
  </svg>
);

export const MicIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width={SIZE}
    height={SIZE}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </svg>
);

export const MicOffIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width={SIZE}
    height={SIZE}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
    <line x1="3" y1="3" x2="21" y2="21" />
  </svg>
);

export const SoundIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width={SIZE}
    height={SIZE}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

export const SoundOffIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width={SIZE}
    height={SIZE}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="22" x2="16" y1="9" y2="15" />
    <line x1="16" x2="22" y1="9" y2="15" />
  </svg>
);
