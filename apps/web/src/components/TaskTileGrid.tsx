import { useState, type CSSProperties } from 'react';
import { useT } from '../i18n';
import { SITE_PATHS } from '../lib/siteConfig';
import { TASK_CATEGORIES, TASK_TILES, type TaskCategory, type TaskTile } from '../lib/taskTiles';
import { LocalizedLink } from './LocalizedLink';
import { TaskIcon } from './TaskIcons';

type Filter = 'all' | TaskCategory;

function tileStyle(category: TaskCategory): CSSProperties {
  return { '--tile-color': `var(--tile-${category})` } as CSSProperties;
}

function TileBody({ tile }: { tile: TaskTile }) {
  const t = useT();
  return (
    <>
      <span className="task-tile-icon">
        <TaskIcon id={tile.icon} />
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-[0.9375rem] leading-snug font-semibold text-[var(--text-primary)]">
          {t(`common.tasks.items.${tile.id}.title`)}
        </span>
        <span className="line-clamp-2 text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
          {t(`common.tasks.items.${tile.id}.desc`)}
        </span>
      </span>
    </>
  );
}

export function TaskTileGrid() {
  const t = useT();
  const [filter, setFilter] = useState<Filter>('all');
  const filters: Filter[] = ['all', ...TASK_CATEGORIES];
  const tiles = filter === 'all' ? TASK_TILES : TASK_TILES.filter((tile) => tile.category === filter);

  return (
    <section aria-labelledby="tasks-heading" className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2
            id="tasks-heading"
            className="text-xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-2xl"
          >
            {t('common.tasks.heading')}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">{t('common.tasks.subheading')}</p>
        </div>

        <div
          role="group"
          aria-label={t('common.tasks.filterAria')}
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0"
        >
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              className="task-chip"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {t(`common.tasks.categories.${f}`)}
            </button>
          ))}
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.id} className="flex">
            {tile.status === 'available' ? (
              <LocalizedLink to={tile.path} className="task-tile" style={tileStyle(tile.category)}>
                <TileBody tile={tile} />
              </LocalizedLink>
            ) : (
              <div
                className="task-tile"
                data-coming-soon="true"
                aria-disabled="true"
                style={tileStyle(tile.category)}
              >
                <span className="task-tile-badge">{t('common.tasks.comingSoon')}</span>
                <TileBody tile={tile} />
                <LocalizedLink
                  to={tile.path}
                  className="mt-auto text-xs font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                >
                  {t('common.tasks.learnMore')}
                  <span className="sr-only">{`: ${t(`common.tasks.items.${tile.id}.title`)}`}</span>
                </LocalizedLink>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
        <LocalizedLink
          to={SITE_PATHS.pdfTools}
          className="inline-flex items-center gap-2 font-medium text-[var(--accent)] underline-offset-2 hover:underline"
        >
          <TaskIcon id="allTools" size={16} />
          {t('common.tasks.allPdfToolsLink')}
        </LocalizedLink>
        <a
          href="#workspace"
          className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
        >
          {t('common.tasks.workspaceLink')}
        </a>
      </div>
    </section>
  );
}
