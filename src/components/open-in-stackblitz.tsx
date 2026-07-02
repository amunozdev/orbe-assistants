'use client';

import sdk from '@stackblitz/sdk';
import type { OrbState } from '@/registry/lib/orb-state';
import type { FileWithCode } from '@/registry/prompt';

export interface StackblitzConfig {
  state: OrbState;
  size: number;
  speed: number;
  colorFrom: string;
  colorTo: string;
}

interface OpenInStackblitzProps {
  id: string;
  name: string;
  dependencies: string[];
  files: FileWithCode[];
  shared: FileWithCode[];
  config: StackblitzConfig;
}

const DEP_VERSIONS: Record<string, string> = {
  three: '^0.185.0',
  '@react-three/fiber': '^9.6.1',
  '@paper-design/shaders-react': '0.0.76',
};

const NEXT_DYNAMIC_SHIM = `import { createElement, lazy, Suspense } from 'react';
import type { ComponentType } from 'react';

const dynamic = <P extends object>(loader: () => Promise<ComponentType<P>>, _options?: { ssr?: boolean }) => {
  const Lazy = lazy(async () => ({ default: await loader() }));
  const Dynamic = (props: P) => createElement(Suspense, { fallback: null }, createElement(Lazy, props));
  return Dynamic;
};

export default dynamic;
`;

const VITE_CONFIG = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { 'next/dynamic': '/src/shims/next-dynamic.ts' } },
});
`;

const TSCONFIG = `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src"]
}
`;

const buildIndexHtml = (name: string): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${name} - VoiceOrbs</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

const MAIN_TSX = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const root = document.getElementById('root');
if (root) createRoot(root).render(<StrictMode><App /></StrictMode>);
`;

const buildAppTsx = (
  componentName: string,
  importPath: string,
  { state, size, speed, colorFrom, colorTo }: StackblitzConfig,
): string => `import { ${componentName} } from '${importPath}';

export const App = () => (
  <main
    style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: 'radial-gradient(circle at 50% 30%, #12162a, #05060a)',
    }}
  >
    <${componentName}
      state="${state}"
      size={${size}}
      speed={${speed}}
      colorFrom="${colorFrom}"
      colorTo="${colorTo}"
    />
  </main>
);
`;

const buildPackageJson = (id: string, dependencies: string[]): string => {
  const deps: Record<string, string> = {
    clsx: '^2.1.1',
    react: '^19.2.0',
    'react-dom': '^19.2.0',
  };
  for (const dep of dependencies) deps[dep] = DEP_VERSIONS[dep] ?? 'latest';
  return `${JSON.stringify(
    {
      name: `voiceorbs-${id}`,
      private: true,
      type: 'module',
      scripts: { dev: 'vite', build: 'vite build' },
      dependencies: deps,
      devDependencies: {
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
        '@vitejs/plugin-react': '^5.0.0',
        typescript: '^5.9.0',
        vite: '^7.0.0',
      },
    },
    null,
    2,
  )}\n`;
};

export const OpenInStackblitz = ({
  id,
  name,
  dependencies,
  files,
  shared,
  config,
}: OpenInStackblitzProps) => {
  const open = () => {
    const componentName = name.replace(/\s+/g, '');
    const importPath = files[0]
      ? `./${files[0].path.replace(/^src\//, '').replace(/\.tsx?$/, '')}`
      : './registry/orbe';
    const projectFiles: Record<string, string> = {
      'index.html': buildIndexHtml(name),
      'package.json': buildPackageJson(id, dependencies),
      'tsconfig.json': TSCONFIG,
      'vite.config.ts': VITE_CONFIG,
      'src/main.tsx': MAIN_TSX,
      'src/App.tsx': buildAppTsx(componentName, importPath, config),
      'src/shims/next-dynamic.ts': NEXT_DYNAMIC_SHIM,
    };
    for (const file of [...shared, ...files]) projectFiles[file.path] = file.code;
    sdk.openProject(
      {
        title: `${name} - VoiceOrbs`,
        description: `${name} animated AI-assistant orb in a Vite + React sandbox`,
        template: 'node',
        files: projectFiles,
      },
      { newWindow: true, openFile: 'src/App.tsx' },
    );
  };

  return (
    <button
      type="button"
      onClick={open}
      title="Open a Vite + React sandbox on StackBlitz with this orb and the current configuration"
      className="rounded-md border border-border bg-panel px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent-foreground"
    >
      Open in StackBlitz
    </button>
  );
};
