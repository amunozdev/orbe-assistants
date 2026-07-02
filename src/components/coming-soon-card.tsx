const REPO_URL = 'https://github.com/amunozdev/voiceorbs';

const PlusIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const ComingSoonCard = () => (
  <a
    href={REPO_URL}
    target="_blank"
    rel="noopener noreferrer"
    className="group flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-panel/30 p-5 text-center transition-colors hover:border-accent focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
  >
    <span
      aria-hidden="true"
      className="grid h-16 w-16 place-items-center rounded-full border border-dashed border-border text-muted transition-colors group-hover:border-accent group-hover:text-accent-foreground group-focus-visible:border-accent group-focus-visible:text-accent-foreground"
    >
      <PlusIcon />
    </span>
    <span className="flex flex-col gap-1">
      <span className="text-lg font-semibold text-foreground">Coming soon</span>
      <span className="text-sm text-muted">New orb designs are on the way.</span>
    </span>
    <span className="text-xs font-medium text-muted transition-colors group-hover:text-accent-foreground group-focus-visible:text-accent-foreground">
      Contribute on GitHub →
    </span>
  </a>
);
