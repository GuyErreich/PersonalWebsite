import { Play } from 'lucide-react';

interface ShowreelVideoProps {
  url: string | null;
}

export const ShowreelVideo = ({ url }: ShowreelVideoProps) => {
  return (
    <div className="mb-20">
      <div className="flex items-center space-x-2 mb-6">
        <Play className="w-6 h-6 text-blue-400" />
        <h3 className="text-2xl font-bold text-white">Showreel</h3>
      </div>
      <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden border border-gray-700 shadow-2xl group flex items-center justify-center">
        {url ? (
            <video 
              src={url} 
              controls 
              className="w-full h-full object-cover"
            />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>
            <div className="text-center z-10">
              <Play className="w-16 h-16 text-white/50 mx-auto mb-4 group-hover:text-white transition-colors cursor-pointer" />
              <p className="text-gray-400">Showreel not set</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};