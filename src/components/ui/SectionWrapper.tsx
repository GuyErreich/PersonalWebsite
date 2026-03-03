import type { ReactNode } from 'react';

interface SectionWrapperProps {
  id: string;
  className?: string;
  children: ReactNode;
  background?: ReactNode;
}

export const SectionWrapper = ({ 
  id, 
  className = "py-24 bg-gray-900", 
  children, 
  background 
}: SectionWrapperProps) => {
  return (
    <section id={id} className={`overflow-hidden relative ${className}`}>
      {background && (
        <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
          {background}
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {children}
      </div>
    </section>
  );
};