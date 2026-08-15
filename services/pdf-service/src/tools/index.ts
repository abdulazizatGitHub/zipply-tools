/**
 * Barrel for all tools shipped by pdf-service.
 *
 * Adding a tool is: scaffold under src/tools/<id>/, then export here.
 * server.ts registers everything this module exports.
 */

import { tool as pdfInspect } from './pdf-inspect/index.js';
import { tool as pdfMerge } from './pdf-merge/index.js';
import { tool as pdfSplit } from './pdf-split/index.js';

import type { DefinedTool } from '@toolforge/tool-contract';

export const allTools: DefinedTool[] = [pdfMerge, pdfSplit, pdfInspect];
