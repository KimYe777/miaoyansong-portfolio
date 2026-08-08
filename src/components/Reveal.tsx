import type { ReactNode } from 'react';

type RevealProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

export function Reveal({ children, className = '', id }: RevealProps) {
  return (
    <div id={id} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
