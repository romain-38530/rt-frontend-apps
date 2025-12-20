import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Target, LogOut, Calendar, Clock,
  ChevronLeft, ChevronRight, Plus, X, Check, Video, Phone,
  Building2, User, Mail, Settings, Trash2
} from 'lucide-react';

const COMMERCIAL_API_URL = process.env.NEXT_PUBLIC_ADMIN_GATEWAY_URL || 'https://ddaywxps9n701.cloudfront.net';

interface Meeting {
  _id: string;
  title: string;
  prospectInfo: {
    companyName: string;
    contactName: string;
    email: string;
    phone?: string;
  };
  scheduledAt: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  type: 'presentation' | 'demo' | 'follow_up' | 'closing';
  meetingLink?: string;
  notes?: string;
  outcome?: string;
}

interface Availability {
  _id: string;
  weeklySchedule: {
    dayOfWeek: number;
    slots: { startTime: string; endTime: string }[];
    isActive: boolean;
  }[];
  meetingDuration: number;
  bufferTime: number;
  isActive: boolean;
}

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function CommercialCalendar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('commercial_token');
    const userData = localStorage.getItem('commercial_user');

    if (!token || !userData) {
      router.push('/commercial/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.mustChangePassword) {
      router.push('/commercial/change-password');
      return;
    }

    setUser(parsedUser);
    loadCalendarData(token);
  }, [router, currentDate, view]);

  const loadCalendarData = async (token: string) => {
    try {
      const [meetingsRes, availabilityRes] = await Promise.all([
        fetch(`${COMMERCIAL_API_URL}/api/v1/commercial/meetings/calendar?view=${view}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${COMMERCIAL_API_URL}/api/v1/commercial/availability`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (meetingsRes.status === 401) {
        localStorage.removeItem('commercial_token');
        localStorage.removeItem('commercial_user');
        router.push('/commercial/login');
        return;
      }

      const meetingsData = await meetingsRes.json();
      const availabilityData = await availabilityRes.json();

      setMeetings(meetingsData.meetings || []);
      setAvailability(availabilityData);
    } catch (error) {
      console.error('Erreur chargement calendrier:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('commercial_token');
    localStorage.removeItem('commercial_user');
    router.push('/commercial/login');
  };

  const getWeekDates = () => {
    const dates = [];
    const start = new Date(currentDate);
    const day = start.getDay();
    start.setDate(start.getDate() - day + (day === 0 ? -6 : 1));

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const getMeetingsForDate = (date: Date) => {
    return meetings.filter(m => {
      const meetingDate = new Date(m.scheduledAt);
      return meetingDate.toDateString() === date.toDateString();
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'no_show': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const updateMeetingStatus = async (meetingId: string, status: string, notes?: string) => {
    const token = localStorage.getItem('commercial_token');
    try {
      await fetch(`${COMMERCIAL_API_URL}/api/v1/commercial/meetings/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, notes })
      });
      loadCalendarData(token!);
      setSelectedMeeting(null);
    } catch (error) {
      console.error('Erreur mise a jour RDV:', error);
    }
  };

  const prevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const weekDates = getWeekDates();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Portail Commercial</h1>
                <p className="text-sm text-gray-500">Bienvenue, {user?.firstName} {user?.lastName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {user?.accessCode}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Deconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            <Link href="/commercial/dashboard" className="py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
              Dashboard
            </Link>
            <Link href="/commercial/pool" className="py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
              Bourse de Leads
            </Link>
            <Link href="/commercial/my-leads" className="py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
              Mes Leads
            </Link>
            <Link href="/commercial/calendar" className="py-4 border-b-2 border-blue-600 text-blue-600 font-medium">
              Calendrier
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Calendar Header */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="p-4 flex items-center justify-between border-b">
            <div className="flex items-center gap-4">
              <button onClick={prevWeek} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold">
                {weekDates[0].toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </h2>
              <button onClick={nextWeek} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Settings className="w-5 h-5" />
                <span className="hidden sm:inline">Disponibilites</span>
              </button>
              <button
                onClick={() => setShowNewMeeting(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Nouveau RDV</span>
              </button>
            </div>
          </div>

          {/* Week View */}
          <div className="grid grid-cols-7 border-b">
            {weekDates.map((date, idx) => (
              <div
                key={idx}
                className={`p-4 text-center border-r last:border-r-0 ${isToday(date) ? 'bg-blue-50' : ''}`}
              >
                <p className="text-sm text-gray-500">{DAYS_SHORT[date.getDay()]}</p>
                <p className={`text-2xl font-bold ${isToday(date) ? 'text-blue-600' : 'text-gray-900'}`}>
                  {date.getDate()}
                </p>
              </div>
            ))}
          </div>

          {/* Meetings Grid */}
          <div className="grid grid-cols-7 min-h-[400px]">
            {weekDates.map((date, idx) => {
              const dayMeetings = getMeetingsForDate(date);
              return (
                <div
                  key={idx}
                  className={`p-2 border-r last:border-r-0 ${isToday(date) ? 'bg-blue-50/50' : ''}`}
                >
                  {dayMeetings.map((meeting) => (
                    <button
                      key={meeting._id}
                      onClick={() => setSelectedMeeting(meeting)}
                      className={`w-full p-2 mb-2 rounded-lg text-left text-sm ${getStatusColor(meeting.status)}`}
                    >
                      <p className="font-medium truncate">{formatTime(meeting.scheduledAt)}</p>
                      <p className="truncate text-xs">{meeting.prospectInfo.companyName}</p>
                    </button>
                  ))}
                  {dayMeetings.length === 0 && (
                    <p className="text-xs text-gray-400 text-center mt-4">Aucun RDV</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Meetings List */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Prochains rendez-vous</h3>
          </div>
          <div className="divide-y">
            {meetings
              .filter(m => m.status !== 'cancelled' && new Date(m.scheduledAt) >= new Date())
              .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
              .slice(0, 5)
              .map((meeting) => (
                <div
                  key={meeting._id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedMeeting(meeting)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{meeting.prospectInfo.companyName}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(meeting.scheduledAt).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })} a {formatTime(meeting.scheduledAt)}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                    {meeting.status === 'scheduled' ? 'Planifie' :
                     meeting.status === 'confirmed' ? 'Confirme' :
                     meeting.status === 'completed' ? 'Termine' : meeting.status}
                  </span>
                </div>
              ))}
            {meetings.filter(m => m.status !== 'cancelled').length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Aucun rendez-vous a venir</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Meeting Detail Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-lg">Detail du rendez-vous</h3>
              <button onClick={() => setSelectedMeeting(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium">{selectedMeeting.prospectInfo.companyName}</p>
                  <p className="text-sm text-gray-500">{selectedMeeting.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <p>{selectedMeeting.prospectInfo.contactName}</p>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <a href={`mailto:${selectedMeeting.prospectInfo.email}`} className="text-blue-600 hover:underline">
                  {selectedMeeting.prospectInfo.email}
                </a>
              </div>
              {selectedMeeting.prospectInfo.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <a href={`tel:${selectedMeeting.prospectInfo.phone}`} className="text-blue-600 hover:underline">
                    {selectedMeeting.prospectInfo.phone}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <p>
                  {new Date(selectedMeeting.scheduledAt).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <p>{formatTime(selectedMeeting.scheduledAt)} ({selectedMeeting.duration} min)</p>
              </div>
              {selectedMeeting.meetingLink && (
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-gray-400" />
                  <a href={selectedMeeting.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Rejoindre la reunion
                  </a>
                </div>
              )}
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">Statut</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedMeeting.status)}`}>
                  {selectedMeeting.status === 'scheduled' ? 'Planifie' :
                   selectedMeeting.status === 'confirmed' ? 'Confirme' :
                   selectedMeeting.status === 'completed' ? 'Termine' :
                   selectedMeeting.status === 'cancelled' ? 'Annule' : selectedMeeting.status}
                </span>
              </div>
              {selectedMeeting.status === 'scheduled' && (
                <div className="pt-4 flex gap-2">
                  <button
                    onClick={() => updateMeetingStatus(selectedMeeting._id, 'completed')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Check className="w-4 h-4" />
                    Marquer termine
                  </button>
                  <button
                    onClick={() => updateMeetingStatus(selectedMeeting._id, 'no_show')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    No-show
                  </button>
                  <button
                    onClick={() => updateMeetingStatus(selectedMeeting._id, 'cancelled')}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Availability Settings Modal */}
      {showSettings && availability && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-lg">Configurer mes disponibilites</h3>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700">
                  Les prospects peuvent reserver des creneaux de <strong>{availability.meetingDuration} minutes</strong> sur votre calendrier.
                  Un intervalle de <strong>{availability.bufferTime} minutes</strong> est prevu entre chaque RDV.
                </p>
              </div>
              <div className="space-y-3">
                {DAYS.map((day, idx) => {
                  const schedule = availability.weeklySchedule.find(s => s.dayOfWeek === idx);
                  return (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-24 font-medium text-gray-700">{day}</div>
                      {schedule?.isActive ? (
                        <div className="flex-1 flex flex-wrap gap-2">
                          {schedule.slots.map((slot, sIdx) => (
                            <span key={sIdx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Non disponible</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-gray-500 text-center">
                Pour modifier vos disponibilites, contactez votre manager.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
