import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'bordered' | 'elevated';
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', variant = 'default', hover = false, onClick }: CardProps) {
  const baseClasses = 'bg-white rounded-xl transition-all duration-200';

  const variantClasses = {
    default: 'shadow-sm',
    bordered: 'border-2 border-[#CBD5E1]',
    elevated: 'shadow-lg',
  };

  const hoverClasses = hover ? 'hover:shadow-xl hover:scale-[1.01] cursor-pointer' : '';

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`px-6 py-4 border-b border-[#CBD5E1] ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`px-6 py-4 border-t border-[#CBD5E1] ${className}`}>
      {children}
    </div>
  );
}
