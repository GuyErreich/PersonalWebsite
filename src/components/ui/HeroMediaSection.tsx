import type { ReactNode } from 'react';
import { SectionHeader } from './SectionHeader';

interface HeroMediaSectionProps {
  id: string;
  title: string;
  description?: string;
  /** Extra classes applied to the outer <section> — use to override bg-gray-900 from .section-hero */
  sectionClassName?: string;
  children: ReactNode;
}

export const HeroMediaSection = ({ id, title, description, sectionClassName = '', children }: HeroMediaSectionProps) => {
  return (
    <section id={id} className={`section-hero w-full relative z-10 ${sectionClassName}`}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-0 flex flex-col items-center justify-center h-full">
        <SectionHeader title={title} description={description} />
        {children}
      </div>
    </section>
  );
};
