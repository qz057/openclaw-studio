import { describe, it, expect } from 'vitest';
import {
  buildModelOption,
  collectHermesModelCatalogEntries,
  dedupeModelOptions,
  filterModelLines,
  parseHermesSelectedModelId,
  parseModelIdentity
} from '../../electron/runtime/probes/model-config-utils';
import type { StudioModelOption } from '@openclaw/shared';

describe('model-config-utils', () => {
  describe('parseModelIdentity', () => {
    it('parses provider/model format', () => {
      expect(parseModelIdentity('relay/gpt-5.4')).toEqual({
        provider: 'relay',
        model: 'gpt-5.4'
      });

      expect(parseModelIdentity('babycookbook/claude-sonnet-4-6')).toEqual({
        provider: 'babycookbook',
        model: 'claude-sonnet-4-6'
      });
    });

    it('handles model without provider', () => {
      expect(parseModelIdentity('gpt-4')).toEqual({
        provider: null,
        model: 'gpt-4'
      });
    });

    it('trims whitespace', () => {
      expect(parseModelIdentity('  relay/gpt-5.4  ')).toEqual({
        provider: 'relay',
        model: 'gpt-5.4'
      });
    });
  });

  describe('buildModelOption', () => {
    it('builds option with label from map', () => {
      const labelMap = new Map([['relay/gpt-5.4', 'GPT 5.4']]);
      const option = buildModelOption('relay/gpt-5.4', labelMap, 'runtime');

      expect(option).toEqual({
        id: 'relay/gpt-5.4',
        label: 'GPT 5.4 (relay/gpt-5.4)',
        provider: 'relay',
        model: 'gpt-5.4',
        source: 'runtime'
      });
    });

    it('uses model ID as label if not in map', () => {
      const labelMap = new Map();
      const option = buildModelOption('relay/gpt-5.4', labelMap, 'config');

      expect(option.label).toBe('relay/gpt-5.4');
    });

    it('uses model ID as label if label equals ID', () => {
      const labelMap = new Map([['relay/gpt-5.4', 'relay/gpt-5.4']]);
      const option = buildModelOption('relay/gpt-5.4', labelMap, 'runtime');

      expect(option.label).toBe('relay/gpt-5.4');
    });
  });

  describe('dedupeModelOptions', () => {
    it('removes duplicate options by id', () => {
      const options: StudioModelOption[] = [
        { id: 'relay/gpt-5.4', label: 'GPT 5.4', provider: 'relay', model: 'gpt-5.4', source: 'runtime' },
        { id: 'babycookbook/claude', label: 'Claude', provider: 'babycookbook', model: 'claude', source: 'config' },
        { id: 'relay/gpt-5.4', label: 'GPT 5.4 Duplicate', provider: 'relay', model: 'gpt-5.4', source: 'config' },
      ];

      const result = dedupeModelOptions(options);
      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('relay/gpt-5.4');
      expect(result[1]?.id).toBe('babycookbook/claude');
    });

    it('filters out options without id', () => {
      const options: StudioModelOption[] = [
        { id: '', label: 'Empty', provider: null, model: '', source: 'runtime' },
        { id: 'valid/model', label: 'Valid', provider: 'valid', model: 'model', source: 'runtime' },
      ];

      const result = dedupeModelOptions(options);
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('valid/model');
    });
  });

  describe('filterModelLines', () => {
    it('filters ANSI color codes', () => {
      const lines = [
        'relay/gpt-5.4',
        '\x1B[35mrelay/gpt-5.3\x1B[39m',
        'babycookbook/claude'
      ];

      const result = filterModelLines(lines);
      expect(result).toEqual(['relay/gpt-5.4', 'babycookbook/claude']);
    });

    it('filters plugin logs', () => {
      const lines = [
        '[plugins] [lcm] Plugin loaded',
        'relay/gpt-5.4',
        '[plugins] Some other log',
        'babycookbook/claude'
      ];

      const result = filterModelLines(lines);
      expect(result).toEqual(['relay/gpt-5.4', 'babycookbook/claude']);
    });

    it('filters common log prefixes', () => {
      const lines = [
        'Loading: models...',
        'relay/gpt-5.4',
        'Error: something failed',
        'babycookbook/claude',
        'Warning: deprecated model'
      ];

      const result = filterModelLines(lines);
      expect(result).toEqual(['relay/gpt-5.4', 'babycookbook/claude']);
    });

    it('validates model ID format', () => {
      const lines = [
        'relay/gpt-5.4',
        'invalid-format',
        'babycookbook/claude-sonnet-4-6',
        'no-slash',
        'self_gateway/chat_default'
      ];

      const result = filterModelLines(lines);
      expect(result).toEqual(['relay/gpt-5.4', 'babycookbook/claude-sonnet-4-6', 'self_gateway/chat_default']);
    });

    it('trims whitespace and filters empty lines', () => {
      const lines = [
        '  relay/gpt-5.4  ',
        '',
        '   ',
        'babycookbook/claude'
      ];

      const result = filterModelLines(lines);
      expect(result).toEqual(['relay/gpt-5.4', 'babycookbook/claude']);
    });
  });

  describe('collectHermesModelCatalogEntries', () => {
    it('uses only Hermes config models and aliases', () => {
      const rawConfig = [
        'model:',
        '  default: gpt-5.5',
        '  provider: openai-codex',
        'model_aliases:',
        '  codex55:',
        '    model: gpt-5.5',
        '    provider: openai-codex',
        'custom_providers: []'
      ].join('\n');

      expect(parseHermesSelectedModelId(rawConfig)).toBe('openai-codex/gpt-5.5');

      const result = collectHermesModelCatalogEntries(rawConfig);
      expect(result.selectedModelId).toBe('openai-codex/gpt-5.5');
      expect(result.modelIds).toEqual(['openai-codex/gpt-5.5']);
      expect(result.labelMap.get('openai-codex/gpt-5.5')).toBe('codex55');
    });

    it('does not invent OpenClaw relay options for Hermes', () => {
      const result = collectHermesModelCatalogEntries([
        'model:',
        '  default: gpt-5.5',
        '  provider: openai-codex',
        'model_aliases: {}'
      ].join('\n'));

      expect(result.modelIds).toEqual(['openai-codex/gpt-5.5']);
      expect(result.modelIds).not.toContain('relay/gpt-5.5');
      expect(result.modelIds).not.toContain('relay/gpt-5.4');
    });
  });
});
