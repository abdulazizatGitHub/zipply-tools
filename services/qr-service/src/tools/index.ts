import { tool as qrGenerate } from './qr-generate/index.js';
import type { DefinedTool } from '@toolforge/tool-contract';

export const allTools: DefinedTool[] = [qrGenerate];
