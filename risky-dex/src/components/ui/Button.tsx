import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/helpers';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, leftIcon, rightIcon, fullWidth, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-mono font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantStyles = {
      primary: 'bg-accent-primary text-background-primary hover:bg-accent-tertiary focus:ring-accent-primary shadow-glow-cyan',
      secondary: 'bg-background-tertiary border border-border-secondary text-text-primary hover:bg-background-panel hover:border-border-accent focus:ring-border-accent',
      success: 'bg-status-success text-white hover:bg-emerald-600 focus:ring-status-success shadow-glow-green',
      danger: 'bg-status-danger text-white hover:bg-red-600 focus:ring-status-danger shadow-glow-red',
      warning: 'bg-status-warning text-background-primary hover:bg-amber-500 focus:ring-status-warning shadow-glow-amber',
      ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-background-tertiary focus:ring-border-secondary',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs rounded',
      md: 'px-4 py-2 text-sm rounded-md',
      lg: 'px-6 py-3 text-base rounded-lg',
      icon: 'p-2 rounded-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], fullWidth && 'w-full', className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {!loading && leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';