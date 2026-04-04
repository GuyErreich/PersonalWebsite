import { Code, Gamepad2, Terminal, Shield, Rocket, Globe, Server, Database, Cpu, Wrench, Smartphone, Monitor } from 'lucide-react';
import { useEffect, useState, memo } from 'react';
import { supabase } from '../lib/supabase';
import { GamingIconsBackground } from './backgrounds/tsparticles/GamingIconsBackground';
import { ShowreelVideo } from './ui/ShowreelVideo';
import { GameDevGallery } from './ui/GameDevGallery';
import { HeroMediaSection } from './ui/HeroMediaSection';
import { SectionHeader } from './ui/SectionHeader';
import { SectionEntranceOverlay } from './ui/SectionEntranceOverlay';

const MemoizedGamingIconsBackground = memo(GamingIconsBackground);

const iconMap: Record<string, React.ElementType> = {
  'gamepad': Gamepad2,
  'code': Code,
  'server': Server,
  'globe': Globe,
  'cpu': Cpu,
  'database': Database,
  'rocket': Rocket,
  'shield': Shield,
  'terminal': Terminal,
  'wrench': Wrench,
  'smartphone': Smartphone,
  'monitor': Monitor,
};

export interface GameDevItem {
  id: string;
  title: string;
  description: string;
  media_url: string;
  thumbnail_url?: string;
  icon_name?: string;
  github_url?: string;
  live_url?: string;
}

export const GameDevSection = () => {
  const [showreelUrl, setShowreelUrl] = useState<string | null>(null);
  const [galleryItems, setGalleryItems] = useState<GameDevItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: showreelData } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'showreel_url')
        .single();
      
      if (showreelData) setShowreelUrl(showreelData.value);

      const { data: items } = await supabase
        .from('gamedev_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (items) setGalleryItems(items);
    };

    fetchData();
  }, []);

  return (
    <div className="relative w-full">
      {/* Shared ambient background — spans the full height of both sub-sections */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <MemoizedGamingIconsBackground id="gamedev-particles" />
      </div>

      {/* ── Section 1: Full-screen hero with title + showreel ── */}
        <SectionEntranceOverlay theme="gamedev">
          <HeroMediaSection
            id="gamedev"
            title="Game Development & Design"
            description="Showcasing my journey in game development, from mechanics design to full-fledged prototypes."
            sectionClassName="bg-gray-900/80"
          >
            <ShowreelVideo url={showreelUrl} />
          </HeroMediaSection>
        </SectionEntranceOverlay>
      {/* ── Section 2: Full-screen gallery ── */}
      <section
        id="gamedev-gallery"
        className="min-h-[100svh] flex flex-col items-center justify-center relative z-10 py-20 bg-gray-900/80"
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-12">
          <SectionHeader
            title="Projects & Prototypes"
            description="A curated look at the games and interactive experiences I've built."
          />
          <GameDevGallery items={galleryItems} iconMap={iconMap} />
        </div>
      </section>
    </div>
  );
};
