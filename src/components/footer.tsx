import { GitHubStars } from '@/components/github-stars';

const REPO_URL = 'https://github.com/amunozdev/voiceorbs';
const CONTRIBUTE_URL = 'https://github.com/amunozdev/voiceorbs/blob/main/CONTRIBUTING.md';
const GOOD_FIRST_ISSUE_URL =
  'https://github.com/amunozdev/voiceorbs/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22';
const X_URL = 'https://x.com/alexmunoz1_';

const LINK_CLASS = 'text-muted transition-colors hover:text-foreground';

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.92 1.23 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.82 1.1.82 2.22v3.29c0 .32.22.7.83.58C20.57 22.29 24 17.79 24 12.5 24 5.87 18.63.5 12 .5z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
    <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93zm-1.29 19.5h2.04L6.48 3.24H4.29l13.32 17.41z" />
  </svg>
);

export const Footer = () => (
  <footer className="mt-auto border-t border-border">
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-10">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-accent-foreground"
          >
            <GitHubIcon />
            amunozdev/voiceorbs
          </a>
          <GitHubStars />
        </div>
        <p className="text-xs text-muted">
          Open source under the{' '}
          <a
            href={`${REPO_URL}/blob/main/LICENSE`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-foreground hover:underline"
          >
            MIT License
          </a>
          . Built by{' '}
          <a
            href={X_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-foreground hover:underline"
          >
            @alexmunoz1_
          </a>
          .
        </p>
      </div>

      <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <a href={CONTRIBUTE_URL} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          Contribute
        </a>
        <a
          href={GOOD_FIRST_ISSUE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={LINK_CLASS}
        >
          Good first issues
        </a>
        <a href="/llms.txt" className={LINK_CLASS}>
          llms.txt
        </a>
        <a
          href={X_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow the creator on X"
          className={`inline-flex items-center ${LINK_CLASS}`}
        >
          <XIcon />
          <span className="sr-only">X (Twitter)</span>
        </a>
      </nav>
    </div>
  </footer>
);
