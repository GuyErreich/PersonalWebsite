import { Image as ImageIcon, Github, ExternalLink, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Cookies from 'js-cookie';
import { MarkdownRenderer } from '../MarkdownRenderer';
import type { GameDevItem } from '../GameDevSection';

interface GameDevGalleryProps {
  items: GameDevItem[];
  iconMap: Record<string, React.ElementType>;
}

export const GameDevGallery = ({ items, iconMap }: GameDevGalleryProps) => {
  const hasCookie = !!Cookies.get('hero_visited');

  // Helper to check if a URL is a video based on extension
  const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|ogg)$/i) != null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Gallery Section */}
      <div>
        <motion.div 
          className="flex items-center space-x-2 mb-6"
          initial={hasCookie ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: hasCookie ? 0 : 0.5 }}
        >
          <ImageIcon className="w-6 h-6 text-emerald-400" />
          <h3 className="text-2xl font-bold text-white">Gallery</h3>
        </motion.div>
        
        {items.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {items.map((item, index) => (
              <motion.div 
                key={item.id} 
                initial={hasCookie ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: hasCookie ? 0 : 0.5, delay: hasCookie ? 0 : index * 0.1 }}
                className="aspect-square bg-gray-700 rounded-lg overflow-hidden relative group"
              >
                {isVideo(item.media_url) ? (
                    <video 
                      src={item.media_url} 
                      poster={item.thumbnail_url}
                      muted 
                      loop 
                      autoPlay 
                      playsInline
                      className="object-cover w-full h-full opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                    />
                ) : (
                    <img 
                      src={item.media_url} 
                      alt={item.title}
                      className="object-cover w-full h-full opacity-70 group-hover:opacity-100 transition-opacity duration-300" 
                    />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-900 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white font-medium text-sm truncate">{item.title}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 border border-dashed border-gray-700 rounded-lg p-8 flex items-center justify-center h-full">
            No items added yet.
          </div>
        )}
      </div>

      {/* Details & Markdown Code Block */}
      {items.length > 0 && (
        <div className="flex flex-col items-start w-full">
          {items.map((item, index) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ProjectIcon = (item.icon_name && (iconMap as Record<string, React.FC<any>>)[item.icon_name]) ? (iconMap as Record<string, React.FC<any>>)[item.icon_name] : Gamepad2;
            return (
              <motion.div 
                key={item.id} 
                initial={hasCookie ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: hasCookie ? 0 : 0.5, delay: hasCookie ? 0 : index * 0.2 }}
                className="mb-12 w-full bg-gray-800/30 p-6 rounded-lg border border-gray-700"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <ProjectIcon className="w-8 h-8 text-blue-400" />
                  <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                  <div className="flex space-x-2 ml-auto">
                    {item.github_url && (
                      <a href={item.github_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors" title="GitHub">
                        <Github className="w-5 h-5" />
                      </a>
                    )}
                    {item.live_url && (
                      <a href={item.live_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors" title="Live Preview">
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
                <MarkdownRenderer content={item.description} />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};