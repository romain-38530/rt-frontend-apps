import { useEffect, useState } from 'react';
import { useSafeRouter } from '../lib/useSafeRouter';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';

interface TrainingLesson {
  lessonId: string;
  title: string;
  description?: string;
  contentType: 'video' | 'document' | 'quiz' | 'interactive';
  contentUrl?: string;
  content?: string;
  duration: number;
  order: number;
}

interface TrainingModule {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  category: string;
  icon?: string;
  duration: number;
  lessonsCount: number;
  lessons?: TrainingLesson[];
  portals: string[];
  tags?: string[];
  prerequisites?: string[];
  completed?: number;
  status?: 'completed' | 'in_progress' | 'not_started';
}

interface ApiResponse {
  modules: TrainingModule[];
  byCategory: Record<string, TrainingModule[]>;
  total: number;
}

const PORTAL = 'industry';
const API_BASE = process.env.NEXT_PUBLIC_ORDERS_API_URL || 'https://rt-orders-api-prod-v2.eba-4tprbbqu.eu-central-1.elasticbeanstalk.com';

export default function TrainingPage() {
  const router = useSafeRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<TrainingLesson | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchModules = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(API_BASE + '/api/v1/training/modules?portal=' + PORTAL);
      if (!response.ok) throw new Error('Erreur ' + response.status);
      const data: ApiResponse = await response.json();
      const modulesWithState = data.modules.map((m, i) => ({
        ...m,
        completed: i === 0 ? 100 : i === 1 ? 60 : 0,
        status: i === 0 ? 'completed' as const : i === 1 ? 'in_progress' as const : 'not_started' as const
      }));
      setModules(modulesWithState);
      setCategories([...new Set(data.modules.map(m => m.category))]);
    } catch (err: any) {
      console.error('Error fetching training modules:', err);
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const seedModules = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_BASE + '/api/v1/training/seed', { method: 'POST' });
      if (!response.ok) throw new Error('Erreur ' + response.status);
      await fetchModules();
    } catch (err: any) {
      console.error('Error seeding modules:', err);
      setError(err.message);
    }
  };

  const loadModuleDetail = async (moduleId: string) => {
    try {
      const response = await fetch(API_BASE + '/api/v1/training/modules/' + moduleId);
      if (!response.ok) throw new Error('Erreur ' + response.status);
      const moduleData = await response.json();
      const currentModule = modules.find(m => m.moduleId === moduleId);
      setSelectedModule({ ...moduleData, completed: currentModule?.completed || 0, status: currentModule?.status || 'not_started' });
    } catch (err: any) {
      console.error('Error loading module detail:', err);
    }
  };

  const filteredModules = modules.filter(m => {
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch = searchQuery === '' || m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const stats = {
    total: modules.length,
    completed: modules.filter(m => m.status === 'completed').length,
    inProgress: modules.filter(m => m.status === 'in_progress').length,
    totalDuration: modules.reduce((acc, m) => acc + (m.duration || 0), 0)
  };

  const getStatusLabel = (status?: string) => status === 'completed' ? 'Termine' : status === 'in_progress' ? 'En cours' : 'A commencer';
  const getStatusColor = (status?: string) => status === 'completed' ? { bg: '#00D08422', text: '#00D084' } : status === 'in_progress' ? { bg: '#667eea22', text: '#667eea' } : { bg: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.7)' };
  const getLessonIcon = (type: string) => type === 'video' ? '🎬' : type === 'quiz' ? '❓' : type === 'interactive' ? '💻' : type === 'document' ? '📖' : '📝';
  const getLessonTypeLabel = (type: string) => type === 'video' ? 'Video' : type === 'quiz' ? 'Quiz' : type === 'interactive' ? 'Interactif' : type === 'document' ? 'Document' : type;

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (!mounted) return; if (!isAuthenticated()) { router.push('/login'); return; } fetchModules(); }, [mounted, router]);

  if (!mounted) return null;

  return (
    <>
      <Head><title>Formation - Industry | SYMPHONI.A</title></Head>
      <div style={{ minHeight: '100vh', background: 'url(https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&q=80) center/cover', position: 'relative', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.6)', zIndex: 0 }} />
        <div style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', position: 'relative', zIndex: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button onClick={() => selectedLesson ? setSelectedLesson(null) : selectedModule ? setSelectedModule(null) : router.push('/')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>← Retour</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><span style={{ fontSize: '32px' }}>📚</span><h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>{selectedLesson ? selectedLesson.title : selectedModule ? selectedModule.title : 'Centre de Formation'}</h1></div>
          </div>
          <div style={{ padding: '8px 20px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', fontSize: '13px', fontWeight: '700', border: '1px solid rgba(255,255,255,0.3)' }}>🏭 Industry</div>
        </div>
        <div style={{ padding: '30px 40px', position: 'relative', zIndex: 1, maxWidth: '1600px', margin: '0 auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px' }}><div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div><p style={{ fontSize: '18px', opacity: 0.8 }}>Chargement des modules de formation...</p></div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '100px' }}><div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div><p style={{ fontSize: '18px', marginBottom: '20px' }}>{error}</p><div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}><button onClick={() => fetchModules()} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Reessayer</button><button onClick={() => seedModules()} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Initialiser</button></div></div>
          ) : modules.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px' }}><div style={{ fontSize: '48px', marginBottom: '20px' }}>📚</div><p style={{ fontSize: '18px', marginBottom: '20px' }}>Aucun module disponible</p><button onClick={() => seedModules()} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Initialiser les modules</button></div>
          ) : selectedLesson ? (
            <div>
              <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '30px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '40px' }}>{getLessonIcon(selectedLesson.contentType)}</span>
                  <div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ padding: '4px 12px', background: 'rgba(102, 126, 234, 0.3)', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{getLessonTypeLabel(selectedLesson.contentType)}</span>
                      <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '12px' }}>⏱️ {selectedLesson.duration} min</span>
                    </div>
                    {selectedLesson.description && <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>{selectedLesson.description}</p>}
                  </div>
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '30px', border: '1px solid rgba(255,255,255,0.2)' }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '700', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '16px' }}>📋 Mode Opératoire</h3>
                {selectedLesson.content ? (
                  <div style={{ lineHeight: '1.8', fontSize: '15px' }} dangerouslySetInnerHTML={{ __html: selectedLesson.content
                    .replace(/^### (.*$)/gim, '<h4 style="margin: 24px 0 12px 0; font-size: 16px; font-weight: 700; color: #667eea;">$1</h4>')
                    .replace(/^## (.*$)/gim, '<h3 style="margin: 28px 0 16px 0; font-size: 18px; font-weight: 700; color: #00D084;">$1</h3>')
                    .replace(/^\*\*(.+?)\*\*/gim, '<strong style="color: #fff;">$1</strong>')
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/^\d+\. (.*)$/gim, '<div style="display: flex; gap: 12px; margin: 8px 0; padding: 12px 16px; background: rgba(255,255,255,0.05); border-radius: 8px; border-left: 3px solid #667eea;"><span style="color: #667eea; font-weight: 700;">•</span><span>$1</span></div>')
                    .replace(/^- (.*)$/gim, '<div style="display: flex; gap: 8px; margin: 4px 0 4px 20px;"><span style="color: #00D084;">→</span><span>$1</span></div>')
                    .replace(/\| ([^|]+) \| ([^|]+) \|/g, '<div style="display: grid; grid-template-columns: 1fr 2fr; gap: 8px; padding: 8px 12px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.1);"><span style="font-weight: 600;">$1</span><span>$2</span></div>')
                    .replace(/\n\n/g, '<br/><br/>')
                  }} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                    <p>Le contenu de cette leçon sera bientôt disponible.</p>
                  </div>
                )}
              </div>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setSelectedLesson(null)} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>← Retour aux leçons</button>
                <button style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #00D084 0%, #00B871 100%)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>✓ Marquer comme terminé</button>
              </div>
            </div>
          ) : selectedModule ? (
            <div>
              <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '30px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
                  <div style={{ fontSize: '64px' }}>{selectedModule.icon || '📖'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span style={{ padding: '4px 12px', background: 'rgba(102, 126, 234, 0.3)', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{selectedModule.category}</span>
                      <span style={{ padding: '4px 12px', background: getStatusColor(selectedModule.status).bg, color: getStatusColor(selectedModule.status).text, borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{getStatusLabel(selectedModule.status)}</span>
                    </div>
                    <p style={{ fontSize: '16px', opacity: 0.8, margin: '0 0 16px 0' }}>{selectedModule.description}</p>
                    <div style={{ display: 'flex', gap: '24px', fontSize: '14px', opacity: 0.7 }}><span>⏱️ {selectedModule.duration} min</span><span>📖 {selectedModule.lessons?.length || selectedModule.lessonsCount} lecons</span><span>📊 {selectedModule.completed || 0}% complete</span></div>
                  </div>
                  <button onClick={() => selectedModule.lessons && selectedModule.lessons.length > 0 && setSelectedLesson(selectedModule.lessons[0])} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>{selectedModule.status === 'completed' ? 'Revoir' : selectedModule.status === 'in_progress' ? 'Continuer' : 'Commencer'}</button>
                </div>
                <div style={{ marginTop: '24px' }}><div style={{ background: 'rgba(255,255,255,0.2)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}><div style={{ background: selectedModule.completed === 100 ? '#00D084' : '#667eea', width: (selectedModule.completed || 0) + '%', height: '100%' }} /></div></div>
              </div>
              {selectedModule.tags && selectedModule.tags.length > 0 && (<div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '20px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.2)' }}><div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>{selectedModule.tags.map((tag, i) => (<span key={i} style={{ padding: '4px 12px', background: 'rgba(102, 126, 234, 0.2)', borderRadius: '20px', fontSize: '12px' }}>#{tag}</span>))}</div></div>)}
              <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.2)' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700' }}>📖 Plan de formation</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(selectedModule.lessons || []).map((lesson, i) => {
                    const completedLessons = Math.floor((selectedModule.lessons?.length || 0) * (selectedModule.completed || 0) / 100);
                    return (<div key={lesson.lessonId} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', cursor: 'pointer' }} onClick={() => setSelectedLesson(lesson)}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: i < completedLessons ? '#00D084' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' }}>{i < completedLessons ? '✓' : i + 1}</div>
                      <div style={{ flex: 1 }}><div style={{ fontWeight: '600', marginBottom: '2px' }}>{lesson.title}</div><div style={{ fontSize: '13px', opacity: 0.6 }}>{getLessonIcon(lesson.contentType)} {getLessonTypeLabel(lesson.contentType)} • {lesson.duration} min</div></div>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedLesson(lesson); }} style={{ padding: '8px 16px', background: 'rgba(102, 126, 234, 0.3)', border: 'none', borderRadius: '6px', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>{i < completedLessons ? 'Revoir' : 'Demarrer'}</button>
                    </div>);
                  })}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '30px' }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.2)' }}><div style={{ fontSize: '32px', marginBottom: '8px' }}>📚</div><div style={{ fontSize: '28px', fontWeight: '800' }}>{stats.total}</div><div style={{ fontSize: '14px', opacity: 0.7 }}>Modules disponibles</div></div>
                <div style={{ background: 'rgba(0, 208, 132, 0.2)', backdropFilter: 'blur(10px)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(0, 208, 132, 0.3)' }}><div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div><div style={{ fontSize: '28px', fontWeight: '800', color: '#00D084' }}>{stats.completed}</div><div style={{ fontSize: '14px', opacity: 0.7 }}>Modules termines</div></div>
                <div style={{ background: 'rgba(102, 126, 234, 0.2)', backdropFilter: 'blur(10px)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(102, 126, 234, 0.3)' }}><div style={{ fontSize: '32px', marginBottom: '8px' }}>📖</div><div style={{ fontSize: '28px', fontWeight: '800', color: '#667eea' }}>{stats.inProgress}</div><div style={{ fontSize: '14px', opacity: 0.7 }}>En cours</div></div>
                <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.2)' }}><div style={{ fontSize: '32px', marginBottom: '8px' }}>⏱️</div><div style={{ fontSize: '28px', fontWeight: '800' }}>{Math.round(stats.totalDuration / 60)}h</div><div style={{ fontSize: '14px', opacity: 0.7 }}>Duree totale</div></div>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}><input type="text" placeholder="🔍 Rechercher un module..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: '1', minWidth: '300px', padding: '12px 20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: 'white', fontSize: '14px' }} /></div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}><button onClick={() => setSelectedCategory('all')} style={{ padding: '8px 16px', background: selectedCategory === 'all' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>📚 Tous</button>{categories.map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: '8px 16px', background: selectedCategory === cat ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>{cat}</button>))}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                {filteredModules.map(mod => (<div key={mod.moduleId} onClick={() => loadModuleDetail(mod.moduleId)} style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}><div style={{ fontSize: '40px' }}>{mod.icon || '📖'}</div><div style={{ flex: 1 }}><div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>{mod.title}</div><div style={{ fontSize: '13px', opacity: 0.6, marginBottom: '8px' }}>{mod.description}</div><div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}><span style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }}>⏱️ {mod.duration} min</span><span style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }}>📖 {mod.lessonsCount} lecons</span></div></div></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}><span style={{ padding: '4px 12px', background: getStatusColor(mod.status).bg, color: getStatusColor(mod.status).text, borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{getStatusLabel(mod.status)}</span><span style={{ fontSize: '14px', fontWeight: '700' }}>{mod.completed || 0}%</span></div>
                  <div style={{ background: 'rgba(255,255,255,0.2)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}><div style={{ background: mod.completed === 100 ? '#00D084' : '#667eea', width: (mod.completed || 0) + '%', height: '100%' }} /></div>
                </div>))}
              </div>
              {filteredModules.length === 0 && (<div style={{ textAlign: 'center', padding: '60px' }}><div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div><p>Aucun module trouve</p></div>)}
            </>
          )}
        </div>
      </div>
    </>
  );
}
