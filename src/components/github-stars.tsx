const REPO_URL = 'https://github.com/amunozdev/voiceorbs';
const API_URL = 'https://api.github.com/repos/amunozdev/voiceorbs';

const StarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="15"
    height="15"
    fill="currentColor"
    aria-hidden="true"
    className="shrink-0 text-star"
  >
    <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.783 1.401 8.168L12 18.896l-7.335 3.855 1.401-8.168L.132 9.21l8.2-1.192z" />
  </svg>
);

const getStars = async (): Promise<number | null> => {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const res = await fetch(API_URL, {
      headers,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data: { stargazers_count?: number } = await res.json();
    return typeof data.stargazers_count === 'number' ? data.stargazers_count : null;
  } catch {
    return null;
  }
};

export const GitHubStars = async () => {
  const stars = await getStars();

  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-panel px-3 text-xs text-foreground transition-colors hover:border-accent hover:text-accent-foreground"
    >
      <StarIcon />
      {stars === null ? (
        <span>Star</span>
      ) : (
        <span className="tabular-nums">{stars.toLocaleString('en-US')}</span>
      )}
      <span className="sr-only">stars on GitHub</span>
    </a>
  );
};
