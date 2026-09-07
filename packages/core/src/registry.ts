import type { CommandDefinition, CommandName, Permission } from './commands.js';
import { ErrorCategory } from './errors.js';
import { permissionError } from './errors.js';
import { err, ok, type Result } from './result.js';

export interface CommandRegistry {
  register<TInput, TOutput>(command: CommandDefinition<TInput, TOutput>): void;
  get(name: CommandName): CommandDefinition<unknown, unknown> | undefined;
  has(name: CommandName): boolean;
  list(): readonly CommandDefinition<unknown, unknown>[];
  validatePermissions(
    name: CommandName,
    checker: (permission: Permission) => boolean,
  ): Result<void>;
}

export function createCommandRegistry(initial: CommandDefinition<unknown, unknown>[] = []): CommandRegistry {
  const commands = new Map<CommandName, CommandDefinition<unknown, unknown>>();

  for (const command of initial) {
    commands.set(command.name, command);
  }

  return {
    register<TInput, TOutput>(command: CommandDefinition<TInput, TOutput>): void {
      if (commands.has(command.name)) {
        throw new Error(`Command already registered: ${command.name}`);
      }
      commands.set(command.name, command as CommandDefinition<unknown, unknown>);
    },

    get(name: CommandName): CommandDefinition<unknown, unknown> | undefined {
      return commands.get(name);
    },

    has(name: CommandName): boolean {
      return commands.has(name);
    },

    list(): readonly CommandDefinition<unknown, unknown>[] {
      return [...commands.values()];
    },

    validatePermissions(
      name: CommandName,
      checker: (permission: Permission) => boolean,
    ): Result<void> {
      const command = commands.get(name);
      if (!command) {
        return err({
          message: `Unknown command: ${name}`,
          category: ErrorCategory.UNSUPPORTED,
          recovery: 'Choose a supported operation.',
        });
      }

      const missing = command.requiredPermissions.filter((p) => !checker(p));
      if (missing.length > 0) {
        return err(
          permissionError(
            `Missing permissions for ${name}: ${missing.join(', ')}`,
            'Grant the required access when prompted.',
          ),
        );
      }

      return ok(undefined);
    },
  };
}
