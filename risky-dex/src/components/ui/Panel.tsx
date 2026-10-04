import { cn } from '../../utils/helpers';
import { forwardRef, HTMLAttributes } from 'react';

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  className?: string;
}

export const Panel = forwardRef<HTMLDivElement, PanelProps>(
  ({ className, variant = 'default', padding = 'md', hover = false, children, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-background-panel border border-border-primary shadow-panel',
      elevated: 'bg-background-tertiary border border-border-primary shadow-panel-hover',
      glass: 'bg-background-panel/80 backdrop-blur-sm border border-border-primary/50',
    };

    const paddingStyles = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg transition-all duration-200',
          variantStyles[variant],
          paddingStyles[padding],
          hover && 'hover:shadow-panel-hover',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Panel.displayName = 'Panel';

interface PanelHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const PanelHeader = ({ title, subtitle, action, className, children, ...props }: PanelHeaderProps) => (
  <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
    <div>
      <h3 className="text-lg font-semibold font-display text-text-primary">{title}</h3>
      {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
    </div>
    <div className="flex items-center gap-2">
      {action}
      {children}
    </div>
  </div>
);

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
  className?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-background-panel border border-border-primary shadow-panel',
      bordered: 'bg-background-panel border border-border-secondary',
      elevated: 'bg-background-tertiary border border-border-primary shadow-panel-hover',
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-lg transition-all duration-200 hover:shadow-panel-hover', variantStyles[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-5 py-4 border-b border-border-primary/50', className)} {...props}>
    {children}
  </div>
);

export const CardContent = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-5', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-5 py-4 border-t border-border-primary/50 bg-background-tertiary/50 rounded-b-lg', className)} {...props}>
    {children}
  </div>
);

interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  vertical?: boolean;
  className?: string;
}

export const Divider = ({ vertical = false, className, ...props }: DividerProps) => (
  <hr
    className={cn(
      vertical ? 'w-px h-full bg-border-primary mx-4' : 'h-px bg-border-primary my-4',
      className
    )}
    {...props}
  />
);

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip = ({ content, children, position = 'top', className }: TooltipProps) => {
  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-accent-primary/20',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-accent-primary/20',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-accent-primary/20',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-accent-primary/20',
  };

  return (
    <div className="relative inline-block" tabIndex={0}>
      {children}
      <div
        className={cn(
          'absolute z-50 px-3 py-2 bg-background-tertiary border border-border-secondary rounded-md text-xs text-text-secondary shadow-panel pointer-events-none opacity-0 invisible transition-all duration-150 whitespace-nowrap',
          positionStyles[position],
          className
        )}
        role="tooltip"
      >
        {content}
        <div className={cn('absolute w-0 h-0 border-4 border-transparent', arrowStyles[position])} />
      </div>
    </div>
  );
};