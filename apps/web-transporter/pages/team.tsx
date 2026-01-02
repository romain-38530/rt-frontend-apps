import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useLanguage } from '../hooks/useLanguage';

interface SubUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  accessLevel: 'admin' | 'editor' | 'reader';
  status: 'active' | 'inactive' | 'pending';
  invitedAt: string;
}

interface LimitInfo {
  current: number;
  max: number;
  remaining: number;
  plan: string;
  canAdd: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://d2swp5s4jfg8ri.cloudfront.net';
const PRIMARY_COLOR = '#22c1c3';

export default function Team() {
  const router = useRouter();
  const { t } = useLanguage();
  const [subUsers, setSubUsers] = useState<SubUser[]>([]);
  const [limit, setLimit] = useState<LimitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SubUser | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    accessLevel: 'reader' as 'admin' | 'editor' | 'reader'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  };

  const fetchSubUsers = async () => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/subusers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setSubUsers(data.data.subUsers || []);
        setLimit(data.data.limit || null);
      }
    } catch (err) {
      console.error('Error fetching subusers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const token = getAuthToken();
    if (!token) return;

    try {
      const url = editingUser
        ? `${API_URL}/api/subusers/${editingUser.id}`
        : `${API_URL}/api/subusers`;

      const response = await fetch(url, {
        method: editingUser ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur');
      }

      setSuccess(editingUser ? 'Membre mis a jour' : t.invitationSent);
      setShowModal(false);
      setEditingUser(null);
      setFormData({ email: '', firstName: '', lastName: '', accessLevel: 'reader' });
      fetchSubUsers();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm(t.confirmDelete)) return;

    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/subusers/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchSubUsers();
      }
    } catch (err) {
      console.error('Error deleting subuser:', err);
    }
  };

  const handleResendInvite = async (userId: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      await fetch(`${API_URL}/api/subusers/${userId}/resend-invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setSuccess(t.invitationSent);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error resending invite:', err);
    }
  };

  const openEditModal = (user: SubUser) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      accessLevel: user.accessLevel
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ email: '', firstName: '', lastName: '', accessLevel: 'reader' });
    setShowModal(true);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: '#10b981',
      inactive: '#6b7280',
      pending: '#f59e0b'
    };
    const labels: Record<string, string> = {
      active: t.active,
      inactive: t.inactive,
      pending: t.pending
    };
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        background: `${colors[status]}20`,
        color: colors[status]
      }}>
        {labels[status]}
      </span>
    );
  };

  const getAccessLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      admin: '#8b5cf6',
      editor: '#3b82f6',
      reader: '#6b7280'
    };
    const labels: Record<string, string> = {
      admin: t.admin,
      editor: t.editor,
      reader: t.reader
    };
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        background: `${colors[level]}20`,
        color: colors[level]
      }}>
        {labels[level]}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: `3px solid ${PRIMARY_COLOR}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <p style={{ marginTop: '16px', color: '#64748b' }}>Chargement...</p>
        </div>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{t.teamMembers} - SYMPHONI.A Transporter</title>
      </Head>

      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', margin: 0 }}>{t.teamMembers}</h1>
              {limit && (
                <p style={{ color: '#64748b', marginTop: '8px' }}>
                  {limit.max === -1
                    ? t.unlimited
                    : `${limit.current}/${limit.max} ${t.membersUsed}`
                  }
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => router.push('/')}
                style={{
                  padding: '12px 24px',
                  background: 'white',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Retour
              </button>
              <button
                onClick={openAddModal}
                disabled={!!(limit && !limit.canAdd)}
                style={{
                  padding: '12px 24px',
                  background: limit && !limit.canAdd ? '#94a3b8' : PRIMARY_COLOR,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: limit && !limit.canAdd ? 'not-allowed' : 'pointer'
                }}
              >
                + {t.addMember}
              </button>
            </div>
          </div>

          {/* Success/Error messages */}
          {success && (
            <div style={{ padding: '16px', background: '#d1fae5', color: '#065f46', borderRadius: '8px', marginBottom: '24px' }}>
              {success}
            </div>
          )}

          {/* Limit warning */}
          {limit && !limit.canAdd && (
            <div style={{ padding: '16px', background: '#fef3c7', color: '#92400e', borderRadius: '8px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t.limitReached} - {limit.current}/{limit.max} {t.membersUsed}</span>
              <button style={{ padding: '8px 16px', background: PRIMARY_COLOR, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                {t.upgradePlan}
              </button>
            </div>
          )}

          {/* Members table */}
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            {subUsers.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                <h3 style={{ color: '#1e293b', margin: '0 0 8px' }}>{t.noMembers}</h3>
                <p style={{ color: '#64748b', margin: 0 }}>{t.addFirstMember}</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>{t.firstName} / {t.lastName}</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>{t.email}</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>{t.accessLevel}</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>{t.status}</th>
                    <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#475569' }}>{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {subUsers.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{user.firstName} {user.lastName}</div>
                      </td>
                      <td style={{ padding: '16px', color: '#64748b' }}>{user.email}</td>
                      <td style={{ padding: '16px' }}>{getAccessLevelBadge(user.accessLevel)}</td>
                      <td style={{ padding: '16px' }}>{getStatusBadge(user.status)}</td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {user.status === 'pending' && (
                            <button
                              onClick={() => handleResendInvite(user.id)}
                              style={{ padding: '6px 12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                            >
                              {t.resendInvitation}
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(user)}
                            style={{ padding: '6px 12px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                          >
                            {t.editMember}
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            style={{ padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                          >
                            {t.deleteMember}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ margin: '0 0 24px', color: '#1e293b', fontSize: '24px' }}>
              {editingUser ? t.editMember : t.addMember}
            </h2>

            {error && (
              <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#475569', fontWeight: '500' }}>{t.email}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!!editingUser}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: editingUser ? '#f1f5f9' : 'white'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#475569', fontWeight: '500' }}>{t.firstName}</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#475569', fontWeight: '500' }}>{t.lastName}</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#475569', fontWeight: '500' }}>{t.accessLevel}</label>
                <select
                  value={formData.accessLevel}
                  onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value as 'admin' | 'editor' | 'reader' })}
                  style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                >
                  <option value="admin">{t.admin} - {t.adminDesc}</option>
                  <option value="editor">{t.editor} - {t.editorDesc}</option>
                  <option value="reader">{t.reader} - {t.readerDesc}</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setError(''); }}
                  style={{ padding: '12px 24px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '12px 24px',
                    background: submitting ? '#94a3b8' : PRIMARY_COLOR,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? '...' : (editingUser ? t.save : t.addMember)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
