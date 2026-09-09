import type { ThemePreference } from '../hooks/useTheme';
import { useT } from '../i18n';

interface ThemeToggleProps {
  preference: ThemePreference;
  onChange: (value: ThemePreference) => void;
}

export function ThemeToggle({ preference, onChange }: ThemeToggleProps) {
  const t = useT();
  const options: { value: ThemePreference; label: string; description: string }[] = [
    { value: 'light', label: t('common.theme.light'), description: t('common.theme.useLight') },
    { value: 'dark', label: t('common.theme.dark'), description: t('common.theme.useDark') },
    {
      value: 'system',
      label: t('common.theme.system'),
      description: t('common.theme.matchSystem'),
    },
  ];

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] p-0.5"
      role="radiogroup"
      aria-label={t('common.theme.ariaColorTheme')}
    >
      {options.map((option) => {
        const selected = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.description}
            title={option.description}
            onClick={() => onChange(option.value)}
            className={`rounded-[6px] px-2.5 py-1.5 text-xs font-medium transition-colors duration-[var(--duration-fast)] ${
              selected
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
