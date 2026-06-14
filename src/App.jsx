import './index.css';
import { AppProvider, useApp } from './lib/store';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import XiVoices from './pages/XiVoices';
import XiAgents from './pages/XiAgents';
import XiKnowledgeBase from './pages/XiKnowledgeBase';
import LiveAvatars from './pages/LiveAvatars';
import N8nWorkflows from './pages/N8nWorkflows';
import PreviewDemo from './pages/PreviewDemo';
import EmbedWidget from './pages/EmbedWidget';
import Settings from './pages/Settings';

const PAGES = {
  dashboard: Dashboard,
  'xi-voices': XiVoices,
  'xi-agents': XiAgents,
  'xi-knowledge': XiKnowledgeBase,
  'live-avatars': LiveAvatars,
  n8n: N8nWorkflows,
  'preview-demo': PreviewDemo,
  'embed-widget': EmbedWidget,
  settings: Settings,
};

function Layout() {
  const { activePage } = useApp();
  const Page = PAGES[activePage] || Dashboard;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#080b14' }}>
      <Sidebar />
      <main
        className="flex-1 overflow-y-auto main-content"
        style={{ background: 'radial-gradient(ellipse at 20% 0%, rgba(0,198,255,0.04) 0%, transparent 60%), #080b14' }}
      >
        <Page />
      </main>
      <MobileNav />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
}
