interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
}

export default function SectionHeader({
  title,
  subtitle,
  action,
}: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        <h2 className="text-xl font-serif font-bold text-[#111111] dark:text-white leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[13px] text-gray-400 dark:text-gray-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <a
          href={action.href}
          className="text-xs font-semibold text-accent hover:text-red-700 dark:hover:text-red-400 transition-colors flex items-center gap-1"
        >
          {action.label}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>
      )}
    </div>
  );
}
