import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildCommand } from '../../electron/runtime/probes/openclaw-chat';

describe('openclaw-chat', () => {
  describe('buildCommand', () => {
    const originalPlatform = process.platform;

    beforeEach(() => {
      // Reset platform before each test
      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        writable: true,
        configurable: true
      });
    });

    describe('Windows (win32)', () => {
      beforeEach(() => {
        Object.defineProperty(process, 'platform', {
          value: 'win32',
          writable: true,
          configurable: true
        });
      });

      it('builds WSL command with base64 encoding', () => {
        const result = buildCommand('Hello world', null);

        expect(result.command).toBe('wsl.exe');
        expect(result.args[0]).toBe('-e');
        expect(result.args[1]).toBe('bash');
        expect(result.args[2]).toBe('-lc');
        expect(result.args[3]).toContain('base64 -d');
        expect(result.args[4]).toBe('--');

        // Verify base64 encoding
        const encodedPrompt = result.args[5];
        expect(encodedPrompt).toBeDefined();
        const decoded = Buffer.from(encodedPrompt!, 'base64').toString('utf8');
        expect(decoded).toBe('Hello world');
      });

      it('includes session ID when provided', () => {
        const result = buildCommand('Test message', 'session-123');

        expect(result.args[6]).toBe('session-123');
        expect(result.args[3]).toContain('--session-id "$2"');
      });

      it('omits session ID when null', () => {
        const result = buildCommand('Test message', null);

        expect(result.args[6]).toBe('');
        expect(result.args[3]).toContain('if [ -n "$2" ]');
      });

      it('handles special characters in prompt', () => {
        const prompt = 'Test with "quotes" and $variables';
        const result = buildCommand(prompt, null);

        const encodedPrompt = result.args[5];
        expect(encodedPrompt).toBeDefined();
        const decoded = Buffer.from(encodedPrompt!, 'base64').toString('utf8');
        expect(decoded).toBe(prompt);
      });
    });

    describe('Linux/Unix', () => {
      beforeEach(() => {
        Object.defineProperty(process, 'platform', {
          value: 'linux',
          writable: true,
          configurable: true
        });
      });

      it('builds direct openclaw command', () => {
        const result = buildCommand('Hello world', null);

        expect(result.command).toBe('openclaw');
        expect(result.args).toContain('agent');
        expect(result.args).toContain('--agent');
        expect(result.args).toContain('main');
        expect(result.args).toContain('--json');
        expect(result.args).toContain('--message');
        expect(result.args).toContain('Hello world');
      });

      it('includes session ID when provided', () => {
        const result = buildCommand('Test message', 'session-456');

        expect(result.args).toContain('--session-id');
        expect(result.args).toContain('session-456');
      });

      it('omits session ID when null', () => {
        const result = buildCommand('Test message', null);

        expect(result.args).not.toContain('--session-id');
      });

      it('preserves prompt as-is (no base64)', () => {
        const prompt = 'Direct message';
        const result = buildCommand(prompt, null);

        expect(result.args).toContain(prompt);
      });
    });

    describe('Cross-platform', () => {
      it('includes env and label in result', () => {
        const result = buildCommand('Test', null);

        expect(result.env).toBeDefined();
        expect(result.label).toBe('openclaw agent --agent main --json --message <prompt>');
      });
    });
  });
});
