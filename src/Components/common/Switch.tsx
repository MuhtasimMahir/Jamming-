interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border-strong transition-colors"
      style={{ backgroundColor: checked ? 'var(--accent-solid)' : 'var(--surface-hover)' }}
    >
      <span
        className="inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? 'translateX(22px)' : 'translateX(3px)', height: 18, width: 18 }}
      />
    </button>
  );
}
