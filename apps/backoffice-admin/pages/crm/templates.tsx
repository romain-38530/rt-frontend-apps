import { useState, useEffect } from 'react';
import { FileText, Plus, Edit2, Trash2, Eye, RefreshCw, Copy, CheckCircle, XCircle } from 'lucide-react';
import { crmApi } from '../../lib/api';

interface Template {
  _id: string;
  code: string;
  nom: string;
  typeEmail: string;
  langue: string;
  sujetTemplate: string;
  corpsHtmlTemplate: string;
  variablesDisponibles: string[];
  actif: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

const EMAIL_TYPES: Record<string, string> = {
  PRESENTATION: 'Presentation',
  COMMERCIAL_INTRO: 'Introduction commerciale',
  RELANCE_1: 'Relance 1',
  RELANCE_2: 'Relance 2',
  RELANCE_3: 'Relance 3',
  MEETING_REQUEST: 'Demande de RDV',
  FOLLOW_UP: 'Suivi'
};

const LANGUES: Record<string, string> = {
  fr: 'Francais',
  en: 'English',
  es: 'Espanol',
  de: 'Deutsch'
};

const DEFAULT_VARIABLES = [
  'prenom', 'nom', 'poste', 'entreprise', 'secteur', 'siteWeb'
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    typeEmail: 'PRESENTATION',
    langue: 'fr',
    sujetTemplate: '',
    corpsHtmlTemplate: '',
    variablesDisponibles: DEFAULT_VARIABLES,
    actif: true
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const result = await crmApi.getTemplates({});
      if (result.success) {
        setTemplates(result.templates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (template?: Template) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        code: template.code,
        nom: template.nom,
        typeEmail: template.typeEmail,
        langue: template.langue,
        sujetTemplate: template.sujetTemplate,
        corpsHtmlTemplate: template.corpsHtmlTemplate,
        variablesDisponibles: template.variablesDisponibles || DEFAULT_VARIABLES,
        actif: template.actif
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        code: '',
        nom: '',
        typeEmail: 'PRESENTATION',
        langue: 'fr',
        sujetTemplate: '',
        corpsHtmlTemplate: getDefaultTemplate(),
        variablesDisponibles: DEFAULT_VARIABLES,
        actif: true
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingTemplate) {
        await crmApi.updateTemplate(editingTemplate._id, formData);
      } else {
        await crmApi.createTemplate(formData);
      }
      setShowModal(false);
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleDuplicate = (template: Template) => {
    setEditingTemplate(null);
    setFormData({
      code: template.code + '_copy',
      nom: template.nom + ' (copie)',
      typeEmail: template.typeEmail,
      langue: template.langue,
      sujetTemplate: template.sujetTemplate,
      corpsHtmlTemplate: template.corpsHtmlTemplate,
      variablesDisponibles: template.variablesDisponibles || DEFAULT_VARIABLES,
      actif: false
    });
    setShowModal(true);
  };

  const getDefaultTemplate = () => {
    return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p>Bonjour {{prenom}},</p>

  <p>Je me permets de vous contacter suite a mon interet pour {{entreprise}}.</p>

  <p>[Votre message ici]</p>

  <br>
  <p style="color: #666;">
    Cordialement,<br>
    <strong>L'equipe commerciale SYMPHONI.A</strong><br>
    <a href="https://symphoni-a.com">symphoni-a.com</a>
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="font-size: 11px; color: #999;">
    Si vous ne souhaitez plus recevoir nos communications,
    <a href="mailto:commerce@symphonia-controltower.com?subject=Desinscription">cliquez ici</a>.
  </p>
</div>`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="text-purple-500" />
            Templates Email
          </h1>
          <p className="text-gray-600 mt-1">Modeles d'emails pour les campagnes commerciales</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg flex items-center gap-2 hover:bg-purple-600 transition-colors"
        >
          <Plus size={18} />
          Nouveau template
        </button>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw size={24} className="animate-spin text-purple-500" />
          <span className="ml-2 text-gray-600">Chargement...</span>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-12">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun template</h3>
          <p className="text-gray-600 mb-4">Creez votre premier template email</p>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Creer un template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template._id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{template.nom}</h3>
                  <p className="text-sm text-gray-500">{template.code}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  template.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {template.actif ? 'Actif' : 'Inactif'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Type:</span>
                  <span className="text-gray-700">{EMAIL_TYPES[template.typeEmail] || template.typeEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Langue:</span>
                  <span className="text-gray-700">{LANGUES[template.langue] || template.langue}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Sujet:</span>
                  <p className="text-gray-700 truncate">{template.sujetTemplate}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setPreviewTemplate(template)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Apercu"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => handleOpenModal(template)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Modifier"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDuplicate(template)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Dupliquer"
                >
                  <Copy size={16} />
                </button>
                <span className="ml-auto text-xs text-gray-400">v{template.version}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Apercu: {previewTemplate.nom}</h2>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Sujet:</p>
                <p className="font-medium">{previewTemplate.sujetTemplate}</p>
              </div>
              <div className="border rounded-lg p-4">
                <div dangerouslySetInnerHTML={{ __html: previewTemplate.corpsHtmlTemplate }} />
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 font-medium mb-2">Variables disponibles:</p>
                <div className="flex flex-wrap gap-2">
                  {(previewTemplate.variablesDisponibles || DEFAULT_VARIABLES).map(v => (
                    <code key={v} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {`{{${v}}}`}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingTemplate ? 'Modifier le template' : 'Nouveau template'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code (unique)</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="PRESENTATION_FR"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Presentation initiale"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type d'email</label>
                  <select
                    value={formData.typeEmail}
                    onChange={(e) => setFormData({ ...formData, typeEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    {Object.entries(EMAIL_TYPES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Langue</label>
                  <select
                    value={formData.langue}
                    onChange={(e) => setFormData({ ...formData, langue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    {Object.entries(LANGUES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Sujet de l'email</label>
                <input
                  type="text"
                  value={formData.sujetTemplate}
                  onChange={(e) => setFormData({ ...formData, sujetTemplate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="{{prenom}}, decouvrez notre solution pour {{entreprise}}"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Corps HTML</label>
                <textarea
                  value={formData.corpsHtmlTemplate}
                  onChange={(e) => setFormData({ ...formData, corpsHtmlTemplate: e.target.value })}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  placeholder="<div>...</div>"
                />
              </div>

              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 font-medium mb-2">Variables disponibles:</p>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_VARIABLES.map(v => (
                    <code key={v} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm cursor-pointer hover:bg-blue-200"
                      onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const pos = textarea.selectionStart;
                          const val = formData.corpsHtmlTemplate;
                          setFormData({
                            ...formData,
                            corpsHtmlTemplate: val.substring(0, pos) + `{{${v}}}` + val.substring(pos)
                          });
                        }
                      }}
                    >
                      {`{{${v}}}`}
                    </code>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="actif"
                  checked={formData.actif}
                  onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="actif" className="text-sm text-gray-700">Template actif</label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                {editingTemplate ? 'Enregistrer' : 'Creer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
