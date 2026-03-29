
import { Code, Gamepad2, Terminal, Shield, Rocket, Globe, Server, Database, Cpu, Wrench, Smartphone, Monitor } from 'lucide-react';
import { useEffect, useState, memo } from 'react';
import { supabase } from '../lib/supabase';
import { GamingIconsBackground } from './backgrounds/tsparticles/GamingIconsBackground';
import { SectionHeader } from './ui/SectionHeader';
import { ShowreelVideo } from './ui/ShowreelVideo';
import { GameDevGallery } from './ui/GameDevGallery';

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
      // Fetch Showreel
      const { data: showreelData } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'showreel_url')
        .single();
      
      if (showreelData) setShowreelUrl(showreelData.value);

      // Fetch Gallery Items
      const { data: items } = await supabase
        .from('gamedev_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (items) setGalleryItems(items);
    };

    fetchData();
  }, []);

  return (
    <div className="relative w-full bg-gray-800/50">
      <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
        <MemoizedGamingIconsBackground id="gamedev-particles" />
      </div>

      <section id="gamedev" className="section-hero relative z-10 !bg-transparent py-12 md:py-16">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-0 flex flex-col items-center justify-center h-full">
          <SectionHeader 
            title="Game Development & Design" 
            description="Showcasing my journey in game development, from mechanics design to full-fledged prototypes." 
          />
          <ShowreelVideo url={showreelUrl} />
        </div>
      </section>

      <section id="gamedev-gallery" className="relative z-10 py-12 md:py-16 lg:py-24">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <GameDevGallery items={galleryItems} iconMap={iconMap} />
        </div>
      </section>
    </div>
  );
};
