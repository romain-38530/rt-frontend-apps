'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Configuration API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://d2i50a1vlg138w.cloudfront.net';

export default function InviteCarrierPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    companyName: '',
    siret: '',
    vatNumber: '',
    phone: '',
    address: '',
    invitedBy: 'admin',
    referenceMode: 'direct' as 'direct' | 'automatic' | 'premium'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch(`${API_URL}/api/carriers/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/admin/carriers/details?id=${data.carrierId}`);
        }, 2000);
      } else {
        setError(data.error?.message || 'Erreur lors de l\'invitation');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/carriers" className="text-blue-600 hover:text-blue-800 font-semibold mb-4 inline-block">
            ← Retour à la liste
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Inviter un Transporteur
          </h1>
          <p className="text-lg text-gray-600">
            Créer une nouvelle invitation de niveau 2 (Guest)
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-3xl">✅</span>
              <div>
                <p className="text-green-900 font-bold text-lg mb-1">Invitation envoyée !</p>
                <p className="text-green-800">Le transporteur a été invité avec succès. Redirection en cours...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 mb-6">
            <p className="text-red-800 font-semibold">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
          {/* Company Name */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Nom de l'entreprise <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              placeholder="Ex: Transport Express SARL"
            />
          </div>

          {/* Email */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              placeholder="contact@transport-express.fr"
            />
          </div>

          {/* SIRET & VAT Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                SIRET <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="siret"
                value={formData.siret}
                onChange={handleChange}
                required
                maxLength={14}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                placeholder="12345678901234"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Numéro de TVA <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="vatNumber"
                value={formData.vatNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                placeholder="FR12345678901"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Téléphone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              placeholder="+33612345678"
            />
          </div>

          {/* Address */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Adresse <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
              placeholder="25 Avenue du Transport, 69100 Lyon"
            />
          </div>

          {/* Reference Mode */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Mode de référencement
            </label>
            <select
              name="referenceMode"
              value={formData.referenceMode}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            >
              <option value="direct">Direct - Invitation par un industriel</option>
              <option value="automatic">Automatique - Via Affret.IA</option>
              <option value="premium">Premium - Réseau Premium</option>
            </select>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Statut initial</p>
                <p>Le transporteur sera créé avec le statut <strong>Niveau 2 (Guest)</strong> et sera bloqué tant qu'il n'aura pas fourni tous les documents obligatoires :</p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>Kbis</li>
                  <li>Attestation URSSAF</li>
                  <li>Assurance transport</li>
                  <li>Licence de transport</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Envoi en cours...' : 'Inviter le transporteur'}
            </button>

            <Link
              href="/admin/carriers"
              className="px-8 py-4 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all duration-200 text-center"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
