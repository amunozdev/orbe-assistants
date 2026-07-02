import { promises as fs } from 'fs';
import path from 'path';
import { ADAPTER_FILES, SHARED_FILES } from './registry';
import type { AdapterProvider, OrbFile, OrbMeta } from './registry';
import type { AdapterFilesWithCode, FileWithCode } from './prompt';

const readFile = async (file: OrbFile): Promise<FileWithCode> => ({
  ...file,
  code: await fs.readFile(path.join(process.cwd(), file.path), 'utf8'),
});

export const readFiles = (files: OrbFile[]): Promise<FileWithCode[]> =>
  Promise.all(files.map(readFile));

export const readSharedFiles = (): Promise<FileWithCode[]> => readFiles(SHARED_FILES);

export const readOrbFiles = (orb: OrbMeta): Promise<FileWithCode[]> => readFiles(orb.files);

export const readAdapterFiles = async (): Promise<AdapterFilesWithCode> => {
  const entries = await Promise.all(
    (Object.entries(ADAPTER_FILES) as [AdapterProvider, OrbFile][]).map(
      async ([provider, file]) => [provider, await readFile(file)] as const,
    ),
  );
  return Object.fromEntries(entries) as AdapterFilesWithCode;
};
