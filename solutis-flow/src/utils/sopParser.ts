/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StandardProcedure } from '../types';

/**
 * Parses raw text or JSON file content to extract Standard Operating Procedure components (flowsteps, text document, and video url).
 */
export function parseSopFileContent(fileName: string, text: string): StandardProcedure {
  // Try parsing as JSON first
  try {
    const data = JSON.parse(text);
    if (data && (Array.isArray(data.flowsteps) || typeof data.procedureDocument === 'string')) {
      return {
        flowsteps: Array.isArray(data.flowsteps) 
          ? data.flowsteps.map(String).filter(s => s.trim().length > 0) 
          : ['Solicitado', 'Em Execução', 'Finalizado'],
        procedureDocument: typeof data.procedureDocument === 'string' 
          ? data.procedureDocument 
          : 'Procedimento operacional importado via arquivo JSON.',
        videoUrl: typeof data.videoUrl === 'string' && data.videoUrl.trim() 
          ? data.videoUrl 
          : 'https://www.w3schools.com/html/mov_bbb.mp4'
      };
    }
  } catch (e) {
    // Treat as raw text format
  }

  // Raw text or markdown parsing
  const lines = text.split('\n');
  const possibleSteps: string[] = [];
  const textLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Check for distinct step line formats (e.g. "Etapa: Configuração" or "- Passo 1" or "[Procedimento]")
    if (trimmed.toLowerCase().startsWith('etapa:') || trimmed.toLowerCase().startsWith('passo:') || trimmed.toLowerCase().startsWith('step:')) {
      const stepVal = trimmed.substring(trimmed.indexOf(':') + 1).trim();
      if (stepVal) possibleSteps.push(stepVal);
    } else if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
      // Under 40 chars can likely be a stage name
      const clean = trimmed.substring(1).trim();
      if (clean && clean.length > 1 && clean.length < 40 && !clean.includes(' ')) {
        possibleSteps.push(clean);
      } else if (clean && clean.length > 1 && clean.length < 30) {
        possibleSteps.push(clean);
      }
    }
    textLines.push(line);
  }

  // If no clear stages extracted, draft standard ones
  const flowsteps = possibleSteps.length >= 2 
    ? possibleSteps 
    : ['Abertura', 'Análise de Conformidade', 'Execução Técnica', 'Homologação e Conclusão'];

  const procedureDocument = textLines.join('\n').trim() || `### Procedimento Operacional Padrão: ${fileName}\n\nManual anexado com sucesso de forma integrada no sistema.`;

  return {
    flowsteps,
    procedureDocument,
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
  };
}

/**
 * Returns a JSON template string that managers can download or copy to build valid SOP json imports.
 */
export function getSopJsonTemplate(): string {
  return JSON.stringify({
    flowsteps: ["Planejamento", "Execução do Gestor", "Revisão Final", "Entrega"],
    procedureDocument: "### Procedimento Operacional Corporativo\n\n1. Passo um importante\n2. Passo dois importante\n3. Passo final.",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
  }, null, 2);
}
