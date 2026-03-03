import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogOut, Plus } from 'lucide-react';
import { ItemFormModal } from '../components/admin/ItemFormModal';
import { ShowreelManager } from '../components/admin/ShowreelManager';

export const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'gamedev' | 'devops'>('gamedev');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        setLoading(false);
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <nav className="bg-gray-800 border-b border-gray-700 px-4 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Portfolio Management</h1>
          <div className="flex items-center space-x-4">
            <a href="/" className="text-gray-400 hover:text-white text-sm">View Site</a>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 text-red-400 hover:text-red-300"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <ShowreelManager />

        <div className="flex space-x-4 mb-8 border-b border-gray-700">
          <button
            className={`pb-4 px-2 font-medium ${activeTab === 'gamedev' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
            onClick={() => setActiveTab('gamedev')}
          >
            Game Dev Projects
          </button>
          <button
            className={`pb-4 px-2 font-medium ${activeTab === 'devops' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
            onClick={() => setActiveTab('devops')}
          >
            DevOps Projects
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {activeTab === 'gamedev' ? 'Game Dev Gallery' : 'DevOps Projects'}
            </h2>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New</span>
            </button>
          </div>

          {/* Placeholder for list of items */}
          <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
            <p>No items found. Click "Add New" to create one.</p>
            <p className="text-sm mt-2">
              (You'll need to set up Supabase tables for 'gamedev_items' and 'devops_projects' first)
            </p>
          </div>
        </div>

        <ItemFormModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          type={activeTab}
          onSuccess={() => console.log('Item added! (Will trigger refresh soon)')}
        />
      </main>
    </div>
  );
};
