import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabase';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectView from './components/ProjectView';
import FileHistory from './components/FileHistory';
import Settings from './components/Settings';
import NewProjectModal from './components/NewProjectModal';
import { useToast } from './hooks/useToast';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('darkMode') === 'true'
  );

  const [readability, setReadability] = useState({
    fontSize: '16px',
    lineHeight: 1.7,
    letterSpacing: '0em',
  });

  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activeView, setActiveView] = useState('home');
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // Dark mode
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      darkMode ? 'dark' : 'light'
    );
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Load user data (RLS handles filtering automatically)
  useEffect(() => {
    // 🚫 Do nothing until auth fully resolved
    if (authLoading || !user) return;

    setDataLoading(true);

    Promise.all([
      supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false }),

      supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false }),
    ]).then(([{ data: proj }, { data: docs }]) => {
      if (proj) setProjects(proj);
      if (docs) setDocuments(docs);
      setDataLoading(false);
    });
  }, [user, authLoading]);

  function handleNavigate(view, projectId = null) {
    setActiveView(view);
    if (projectId) setActiveProjectId(projectId);
    setSidebarOpen(false);
  }

  function handleProjectCreated(project) {
    setProjects((prev) => [project, ...prev]);
    setShowNewProject(false);
    setActiveProjectId(project.id);
    setActiveView('project');
    toast(`Navigated to "${project.name}"`, 'info');
  }

  function handleNewProject() {
    setShowNewProject(true);
  }

  const activeProject = projects.find((p) => p.id === activeProjectId);

  // 🔐 Wait until Supabase fully restores session
  if (authLoading) {
    return (
      <div className="loading-page">
        <span className="spinner" />
        <p>Restoring session…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthPage
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((d) => !d)}
      />
    );
  }

  return (
    <div className="app-layout">
      <Sidebar
        user={user}
        projects={projects}
        activeView={activeView}
        activeProjectId={activeProjectId}
        onNavigate={handleNavigate}
        onNewProject={handleNewProject}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            {/* App title or logo here */}
          </div>

          <div className="topbar-actions">
            <button
              className="icon-btn"
              onClick={() => setDarkMode((d) => !d)}
              title="Toggle dark mode"
            >
              {darkMode ? '☀' : '⏾'}
            </button>

            <button
              className="btn btn-primary btn-sm"
              onClick={handleNewProject}
              style={{ width: 'auto' }}

            >
              + New Project
            </button>
          </div>
        </header>

        <main className="page-body">
          {dataLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <span className="spinner" />
              <p style={{ marginTop: 16 }}>
                Loading your workspace…
              </p>
            </div>
          ) : (
            <>
              {activeView === 'home' && (
                <Dashboard
                  user={user}
                  projects={projects}
                  documents={documents}
                  onNavigate={handleNavigate}
                  onNewProject={handleNewProject}
                />
              )}

              {activeView === 'project' && activeProject && (
                <ProjectView
                  project={activeProject}
                  readability={readability}
                />
              )}

              {activeView === 'history' && (
                <FileHistory
                  documents={documents}
                  projects={projects}
                  onNavigate={handleNavigate}
                />
              )}

              {activeView === 'settings' && (
                <Settings
                  darkMode={darkMode}
                  onToggleDark={() => setDarkMode((d) => !d)}
                  readability={readability}
                  onReadabilityChange={setReadability}
                />
              )}
            </>
          )}
        </main>
      </div>

      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onCreated={handleProjectCreated}
        />
      )}
    </div>
  );
}