import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { Home, Search, Download, Library } from 'lucide-react';

const items = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/search', label: 'Search', icon: Search, end: false },
  { to: '/library', label: 'Library', icon: Library, end: false },
  { to: '/downloads', label: 'Downloads', icon: Download, end: false },
];

export function MobileNav() {
  return (
    <nav className="flex shrink-0 items-stretch border-t border-border bg-canvas-raised pb-[env(safe-area-inset-bottom)]">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            clsx(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
              isActive ? 'text-accent-text' : 'text-text-tertiary',
            )
          }
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
