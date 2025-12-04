/**
 * Page de gestion des logisticiens - Portail Industry
 * Invitation et gestion des accès logisticiens aux commandes
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated, getUser } from '../lib/auth';
import { LogisticianService } from '@rt/utils';
import type {
  Logistician,
  LogisticianInvitation,
  LogisticianStatus,
  OrderAccessLevel,
  InviteLogisticianRequest,
} from '@rt/contracts';

const STATUS_LABELS: Record<LogisticianStatus, { label: string; color: string }> = {
  invited: { label: 'Invit\u00e9', color: '#f59e0b' },
  pending: { label: 'En attente', color: '#3b82f6' },
  active: { label: 'Actif', color: '#22c55e' },
  suspended: { label: 'Suspendu', color: '#ef4444' },
};

const ACCESS_LABELS: Record<OrderAccessLevel, { label: string; description: string }> = {
  view: { label: 'Lecture', description: 'Peut consulter les commandes' },
  edit: { label: '\u00c9dition', description: 'Peut modifier les commandes' },
  sign: { label: 'Signature', description: 'Peut signer les documents' },
  full: { label: 'Complet', description: 'Acc\u00e8s complet aux commandes' },
};

export default function LogisticiansPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Logisticiens
  const [logisticians, setLogisticians] = useState<Logistician[]>([]);
  const [invitations, setInvitations] = useState<LogisticianInvitation[]>([]);
  const [selectedLogistician, setSelectedLogistician] = useState<Logistician | null>(null);

  // Modal d'invitation
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteLogisticianRequest>({
    email: '',
    companyName: '',
    accessLevel: 'view',
    message: '',
  });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LogisticianStatus | 'all'>('all');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    setUser(getUser());
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logisticiansRes, invitationsRes] = await Promise.all([
        LogisticianService.getLogisticians(),
        LogisticianService.getPendingInvitations(),
      ]);
      setLogisticians(logisticiansRes.data || []);
      setInvitations(invitationsRes || []);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteForm.email) {
      setInviteError('L\'email est requis');
      return;
    }

    setInviting(true);
    setInviteError(null);

    try {
      await LogisticianService.inviteLogistician(inviteForm);
      setInviteSuccess(true);
      setInviteForm({ email: '', companyName: '', accessLevel: 'view', message: '' });
      await loadData();
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteSuccess(false);
      }, 2000);
    } catch (error: any) {
      setInviteError(error.message || 'Erreur lors de l\'invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await LogisticianService.resendInvitation(invitationId);
      await loadData();
    } catch (error) {
      console.error('Erreur renvoi invitation:', error);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('\u00cates-vous s\u00fbr de vouloir annuler cette invitation ?')) return;
    try {
      await LogisticianService.cancelInvitation(invitationId);
      await loadData();
    } catch (error) {
      console.error('Erreur annulation invitation:', error);
    }
  };

  const handleSuspend = async (logisticianId: string) => {
    if (!confirm('\u00cates-vous s\u00fbr de vouloir suspendre ce logisticien ?')) return;
    try {
      await LogisticianService.suspendLogistician(logisticianId);
      await loadData();
    } catch (error) {
      console.error('Erreur suspension:', error);
    }
  };

  const handleReactivate = async (logisticianId: string) => {
    try {
      await LogisticianService.reactivateLogistician(logisticianId);
      await loadData();
    } catch (error) {
      console.error('Erreur r\u00e9activation:', error);
    }
  };

  const filteredLogisticians = logisticians.filter(log => {
    const matchSearch = !searchTerm ||
      log.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Gestion des Logisticiens | SYMPHONI.A Industry</title>
      </Head>

      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
              Gestion des Logisticiens
            </h1>
            <p style={{ color: '#64748b', marginTop: '8px' }}>
              Invitez et g\u00e9rez les logisticiens qui acc\u00e8dent \u00e0 vos commandes
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            + Inviter un logisticien
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ color: '#64748b', fontSize: '14px' }}>Total logisticiens</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b' }}>{logisticians.length}</div>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ color: '#64748b', fontSize: '14px' }}>Actifs</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#22c55e' }}>
              {logisticians.filter(l => l.status === 'active').length}
            </div>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ color: '#64748b', fontSize: '14px' }}>Invitations en attente</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b' }}>{invitations.length}</div>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ color: '#64748b', fontSize: '14px' }}>Suspendus</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#ef4444' }}>
              {logisticians.filter(l => l.status === 'suspended').length}
            </div>
          </div>
        </div>

        {/* Invitations en attente */}
        {invitations.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>
              Invitations en attente ({invitations.length})
            </h2>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px' }}>
              {invitations.map((inv) => (
                <div key={inv.invitationId} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #fde68a',
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{inv.email}</div>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                      {inv.companyName || 'Entreprise non renseign\u00e9e'} \u2022 Expire le {new Date(inv.expiresAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleResendInvitation(inv.invitationId)}
                      style={{
                        padding: '8px 16px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      Renvoyer
                    </button>
                    <button
                      onClick={() => handleCancelInvitation(inv.invitationId)}
                      style={{
                        padding: '8px 16px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtres */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '16px',
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LogisticianStatus | 'all')}
            style={{
              padding: '12px 16px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '16px',
              minWidth: '150px',
            }}
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="invited">Invit\u00e9s</option>
            <option value="pending">En attente</option>
            <option value="suspended">Suspendus</option>
          </select>
        </div>

        {/* Liste des logisticiens */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#64748b' }}>Logisticien</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#64748b' }}>Email</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#64748b' }}>Niveau d'acc\u00e8s</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#64748b' }}>Statut</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#64748b' }}>Derni\u00e8re connexion</th>
                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#64748b' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogisticians.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#128100;</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Aucun logisticien</div>
                    <div>Invitez votre premier logisticien pour commencer</div>
                  </td>
                </tr>
              ) : (
                filteredLogisticians.map((log) => (
                  <tr key={log.logisticianId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{log.companyName}</div>
                      <div style={{ fontSize: '14px', color: '#64748b' }}>{log.contacts?.[0]?.name || '-'}</div>
                    </td>
                    <td style={{ padding: '16px', color: '#475569' }}>{log.email}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 12px',
                        background: '#dbeafe',
                        color: '#1d4ed8',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '500',
                      }}>
                        {ACCESS_LABELS[log.accessLevel]?.label || log.accessLevel}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 12px',
                        background: STATUS_LABELS[log.status]?.color + '20',
                        color: STATUS_LABELS[log.status]?.color,
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '500',
                      }}>
                        {STATUS_LABELS[log.status]?.label || log.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: '#64748b', fontSize: '14px' }}>
                      {log.lastLoginAt ? new Date(log.lastLoginAt).toLocaleDateString('fr-FR') : 'Jamais'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => setSelectedLogistician(log)}
                          style={{
                            padding: '6px 12px',
                            background: '#f1f5f9',
                            color: '#475569',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          D\u00e9tails
                        </button>
                        {log.status === 'active' ? (
                          <button
                            onClick={() => handleSuspend(log.logisticianId)}
                            style={{
                              padding: '6px 12px',
                              background: '#fef2f2',
                              color: '#ef4444',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '13px',
                              cursor: 'pointer',
                            }}
                          >
                            Suspendre
                          </button>
                        ) : log.status === 'suspended' ? (
                          <button
                            onClick={() => handleReactivate(log.logisticianId)}
                            style={{
                              padding: '6px 12px',
                              background: '#dcfce7',
                              color: '#22c55e',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '13px',
                              cursor: 'pointer',
                            }}
                          >
                            R\u00e9activer
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'invitation */}
      {showInviteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', color: '#1e293b' }}>
              Inviter un logisticien
            </h2>

            {inviteSuccess ? (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#9989;</div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#22c55e' }}>
                  Invitation envoy\u00e9e avec succ\u00e8s !
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="logisticien@entreprise.com"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '16px',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>
                    Nom de l'entreprise
                  </label>
                  <input
                    type="text"
                    value={inviteForm.companyName}
                    onChange={(e) => setInviteForm({ ...inviteForm, companyName: e.target.value })}
                    placeholder="Entreprise de logistique"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '16px',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>
                    Niveau d'acc\u00e8s aux commandes
                  </label>
                  <select
                    value={inviteForm.accessLevel}
                    onChange={(e) => setInviteForm({ ...inviteForm, accessLevel: e.target.value as OrderAccessLevel })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '16px',
                    }}
                  >
                    {Object.entries(ACCESS_LABELS).map(([key, val]) => (
                      <option key={key} value={key}>{val.label} - {val.description}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#475569' }}>
                    Message personnalis\u00e9 (optionnel)
                  </label>
                  <textarea
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                    placeholder="Ajoutez un message pour le logisticien..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      resize: 'vertical',
                    }}
                  />
                </div>

                {inviteError && (
                  <div style={{
                    padding: '12px 16px',
                    background: '#fef2f2',
                    color: '#ef4444',
                    borderRadius: '8px',
                    marginBottom: '16px',
                  }}>
                    {inviteError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    style={{
                      padding: '12px 24px',
                      background: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      cursor: 'pointer',
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleInvite}
                    disabled={inviting}
                    style={{
                      padding: '12px 24px',
                      background: inviting ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: inviting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {inviting ? 'Envoi...' : 'Envoyer l\'invitation'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de d\u00e9tails */}
      {selectedLogistician && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                  {selectedLogistician.companyName}
                </h2>
                <p style={{ color: '#64748b', marginTop: '4px' }}>{selectedLogistician.email}</p>
              </div>
              <span style={{
                padding: '4px 12px',
                background: STATUS_LABELS[selectedLogistician.status]?.color + '20',
                color: STATUS_LABELS[selectedLogistician.status]?.color,
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '500',
              }}>
                {STATUS_LABELS[selectedLogistician.status]?.label}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '14px' }}>Niveau d'acc\u00e8s</div>
                <div style={{ fontWeight: '600', color: '#1e293b', marginTop: '4px' }}>
                  {ACCESS_LABELS[selectedLogistician.accessLevel]?.label}
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '14px' }}>Invit\u00e9 le</div>
                <div style={{ fontWeight: '600', color: '#1e293b', marginTop: '4px' }}>
                  {new Date(selectedLogistician.invitedAt).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '14px' }}>Activ\u00e9 le</div>
                <div style={{ fontWeight: '600', color: '#1e293b', marginTop: '4px' }}>
                  {selectedLogistician.activatedAt
                    ? new Date(selectedLogistician.activatedAt).toLocaleDateString('fr-FR')
                    : 'Non activ\u00e9'}
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '14px' }}>Derni\u00e8re connexion</div>
                <div style={{ fontWeight: '600', color: '#1e293b', marginTop: '4px' }}>
                  {selectedLogistician.lastLoginAt
                    ? new Date(selectedLogistician.lastLoginAt).toLocaleDateString('fr-FR')
                    : 'Jamais'}
                </div>
              </div>
            </div>

            {selectedLogistician.contacts && selectedLogistician.contacts.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>
                  Contacts
                </h3>
                {selectedLogistician.contacts.map((contact, idx) => (
                  <div key={idx} style={{
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    marginBottom: '8px',
                  }}>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{contact.name}</div>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                      {contact.email} \u2022 {contact.phone}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedLogistician(null)}
                style={{
                  padding: '12px 24px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
              >
                Fermer
              </button>
              <button
                onClick={() => router.push(`/orders?logistician=${selectedLogistician.logisticianId}`)}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Voir ses commandes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
