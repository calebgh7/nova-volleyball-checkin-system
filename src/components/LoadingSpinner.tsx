import { cn } from '../lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'white' | 'nova-cyan' | 'nova-purple';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'white', 
  text,
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colorClasses = {
    white: 'border-white/30 border-t-white',
    'nova-cyan': 'border-nova-cyan/30 border-t-nova-cyan',
    'nova-purple': 'border-nova-purple/30 border-t-nova-purple'
  };

  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      <div className="relative">
        <div className={cn(
          'animate-spin rounded-full border-4',
          sizeClasses[size],
          colorClasses[color]
        )}></div>
        <div className={cn(
          'animate-spin rounded-full border-4 absolute top-0 left-0',
          sizeClasses[size],
          colorClasses[color]
        )}></div>
      </div>
      {text && (
        <p className="text-white font-medium text-center">{text}</p>
      )}
    </div>
  );
}
