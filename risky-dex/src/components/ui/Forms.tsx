import { cn } from '@utils/helpers';
import { forwardRef, InputHTMLAttributes, LabelHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';

interface BadgeProps {
  className?: string;
  variant?: 'default' | 'running' | 'paused' | 'stopped' | 'buying' | 'selling' | 'error' | 'manual' | 'risk-locked' | 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
  dot?: boolean;
  pulsing?: boolean;
}

export const Badge = ({ className, variant = 'default', children, dot = false, pulsing = false }: BadgeProps) => {
  const variantStyles = {
    default: 'bg-background-tertiary text-text-secondary border border-border-secondary',
    running: 'bg-status-success/20 text-status-success border border-status-success/30',
    paused: 'bg-status-warning/20 text-status-warning border border-status-warning/30',
    stopped: 'bg-text-muted/20 text-text-muted border border-text-muted/30',
    buying: 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30',
    selling: 'bg-status-danger/20 text-status-danger border border-status-danger/30',
    error: 'bg-status-danger/20 text-status-danger border border-status-danger/30',
    manual: 'bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/30',
    'risk-locked': 'bg-status-warning/20 text-status-warning border border-status-warning/30',
    success: 'bg-status-success/20 text-status-success border border-status-success/30',
    warning: 'bg-status-warning/20 text-status-warning border border-status-warning/30',
    danger: 'bg-status-danger/20 text-status-danger border border-status-danger/30',
    info: 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30',
  };

  const pulseClass = pulsing || variant === 'buying' || variant === 'selling' ? 'animate-pulse' : '';

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium', variantStyles[variant], pulseClass, className)}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', pulseClass && 'animate-live-indicator', variant === 'running' && 'bg-status-success', variant === 'paused' && 'bg-status-warning', variant === 'stopped' && 'bg-text-muted', variant === 'buying' && 'bg-accent-primary', variant === 'selling' && 'bg-status-danger', variant === 'error' && 'bg-status-danger', variant === 'manual' && 'bg-accent-secondary', variant === 'risk-locked' && 'bg-status-warning')} />}
      {children}
    </span>
  );
};

interface StatusIndicatorProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusIndicator = ({ status, size = 'md', className }: StatusIndicatorProps) => {
  const sizeStyles = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const statusColors: Record<string, string> = {
    RUNNING: 'bg-status-success',
    PAUSED: 'bg-status-warning',
    STOPPED: 'bg-text-muted',
    WAITING: 'bg-status-warning',
    BUYING: 'bg-accent-primary',
    SELLING: 'bg-status-danger',
    ERROR: 'bg-status-danger',
    RISK_LOCKED: 'bg-status-warning',
    MANUAL_CONTROL: 'bg-accent-secondary',
  };

  const pulseStatuses = ['RUNNING', 'BUYING', 'SELLING', 'WAITING'];

  return (
    <span
      className={cn(
        'relative inline-flex rounded-full',
        sizeStyles[size],
        statusColors[status] || 'bg-text-muted',
        pulseStatuses.includes(status) && 'animate-live-indicator',
        className
      )}
    />
  );
};

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full px-3 py-2 bg-background-tertiary border border-border-secondary rounded-md text-text-primary placeholder-text-muted',
        'focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary',
        'transition-all duration-150 font-mono text-sm',
        error && 'border-status-danger focus:border-status-danger focus:ring-status-danger',
        className
      )}
      {...props}
    />
  )
);

Input.displayName = 'Input';

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider', className)}
      {...props}
    >
      {children}
    </label>
  )
);

Label.displayName = 'Label';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full px-3 py-2 bg-background-tertiary border border-border-secondary rounded-md text-text-primary placeholder-text-muted',
        'focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary',
        'transition-all duration-150 font-mono text-sm resize-y min-h-[80px]',
        error && 'border-status-danger focus:border-status-danger focus:ring-status-danger',
        className
      )}
      {...props}
    />
  )
);

Textarea.displayName = 'Textarea';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full px-3 py-2 bg-background-tertiary border border-border-secondary rounded-md text-text-primary',
        'focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary',
        'transition-all duration-150 font-mono text-sm appearance-none',
        'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%2364748b\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")] bg-[length:16px_16px] bg-[right_8px_center] bg-no-repeat pr-10',
        error && 'border-status-danger focus:border-status-danger focus:ring-status-danger',
        className
      )}
      {...props}
    />
  )
);

Select.displayName = 'Select';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        ref={ref}
        type="checkbox"
        id={id}
        className={cn(
          'w-4 h-4 rounded border-border-secondary bg-background-tertiary',
          'text-accent-primary focus:ring-accent-primary focus:ring-2',
          'hover:border-accent-primary transition-colors',
          className
        )}
        {...props}
      />
      {label && <span className="text-sm text-text-secondary">{label}</span>}
    </label>
  )
);

Checkbox.displayName = 'Checkbox';

interface SwitchProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, id, ...props }, ref) => (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        ref={ref}
        type="checkbox"
        id={id}
        role="switch"
        className={cn(
          'w-10 h-6 rounded-full relative appearance-none',
          'bg-border-secondary border border-border-secondary',
            'checked:bg-accent-primary checked:border-accent-primary',
            'focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-background-primary',
            'after:content-[\"\"] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:shadow-md',
            'after:transition-transform checked:after:translate-x-5',
            className
        )}
        {...props}
      />
      {label && <span className="text-sm text-text-secondary">{label}</span>}
    </label>
  )
);

Switch.displayName = 'Switch';