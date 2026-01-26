/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/logo';
import { documentsApi, Document } from '@/lib/documents';

export default function VerificationPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    cin: '',
    department: '',
    documentType: '',
    documentStatus: 'pending' as 'pending' | 'valid' | 'incomplete',
  });
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    fetchDocuments();
  }, [router]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentsApi.getAll();
      // Filtrer uniquement les documents nécessitant vérification
      const verificationRequired = data.filter((doc) => doc.humanVerificationRequired === true);
      setDocuments(verificationRequired);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (document: Document) => {
    setEditingDocument(document);
    setEditForm({
      firstName: document.firstName || '',
      lastName: document.lastName || '',
      cin: document.cin || '',
      department: document.department || '',
      documentType: document.documentType || '',
      documentStatus: document.documentStatus || 'pending',
    });
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleSave = async () => {
    if (!editingDocument) return;

    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await documentsApi.update(editingDocument._id, editForm);
      setSuccessMessage('Document mis à jour avec succès !');
      setEditingDocument(null);
      fetchDocuments();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'incomplete':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'valid':
        return 'Valide';
      case 'incomplete':
        return 'Incomplet';
      default:
        return 'En attente';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/20 to-amber-50/30 dark:from-slate-950 dark:via-orange-950/30 dark:to-amber-950/20">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Header */}
      <header className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-white/20 dark:border-white/10 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push(user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard')} size="sm" className="h-9 backdrop-blur-sm bg-white/50 dark:bg-slate-800/50">
              ← Retour
            </Button>
            <Logo size="md" />
            <h1 className="text-lg font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Documents nécessitant vérification
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/documents')}
              className="h-9 backdrop-blur-sm bg-white/50 dark:bg-slate-800/50"
            >
              Voir tous les documents
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 relative z-10">
        {/* Alerte */}
        <Card className="mb-6 border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-orange-900 dark:text-orange-100">
                  {documents.length} document{documents.length > 1 ? 's' : ''} nécessitant une vérification humaine
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Ces documents nécessitent une vérification manuelle car certaines informations clés sont manquantes (CIN, nom, prénom).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-orange-600 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Chargement des documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <Card className="border border-white/20 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-4 text-lg font-semibold">Aucun document nécessitant vérification</p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mb-6">Tous les documents ont été vérifiés avec succès.</p>
              <Button onClick={() => router.push('/documents')} variant="outline">
                Voir tous les documents
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {documents.map((document) => (
              <Card
                key={document._id}
                className="border border-orange-200 dark:border-orange-900/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl hover:shadow-xl transition-all"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-1 truncate">
                            {document.fileName}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                            {document.logicalPath}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Prénom</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                            {document.firstName || <span className="text-orange-600 dark:text-orange-400 font-semibold">Manquant</span>}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Nom</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                            {document.lastName || <span className="text-orange-600 dark:text-orange-400 font-semibold">Manquant</span>}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">CIN</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                            {document.cin || <span className="text-orange-600 dark:text-orange-400 font-semibold">Manquant</span>}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Département</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{document.department}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getStatusColor(document.documentStatus)}`}>
                          {getStatusLabel(document.documentStatus)}
                        </span>
                        {document.signatureDetected && (
                          <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            ✓ Signature
                          </span>
                        )}
                        <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                          ⚠ Vérification requise
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Créé le {formatDate(document.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(document)}
                        className="h-9 backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 text-orange-600 hover:text-orange-700 dark:text-orange-400"
                      >
                        Vérifier et modifier
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal d'édition */}
        {editingDocument && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl border border-white/20 dark:border-white/10 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-xl">Vérifier et modifier le document</CardTitle>
                <CardDescription>
                  Complétez les informations manquantes pour finaliser la vérification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {successMessage && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/50 rounded-lg">
                    <p className="text-green-700 dark:text-green-400 text-sm">{successMessage}</p>
                  </div>
                )}
                {errorMessage && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg">
                    <p className="text-red-700 dark:text-red-400 text-sm">{errorMessage}</p>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Prénom *
                    </label>
                    <Input
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                      placeholder="Prénom"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Nom *
                    </label>
                    <Input
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                      placeholder="Nom"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      CIN
                    </label>
                    <Input
                      value={editForm.cin}
                      onChange={(e) => setEditForm({ ...editForm, cin: e.target.value })}
                      className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                      placeholder="CIN"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Statut
                    </label>
                    <select
                      value={editForm.documentStatus}
                      onChange={(e) => setEditForm({ ...editForm, documentStatus: e.target.value as 'pending' | 'valid' | 'incomplete' })}
                      className="flex h-10 w-full rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-4 py-2 text-sm text-slate-900 dark:text-slate-100"
                    >
                      <option value="pending">En attente</option>
                      <option value="valid">Valide</option>
                      <option value="incomplete">Incomplet</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={saving || !editForm.firstName || !editForm.lastName}
                    className="flex-1"
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingDocument(null);
                      setSuccessMessage('');
                      setErrorMessage('');
                    }}
                    className="backdrop-blur-sm bg-white/50 dark:bg-slate-800/50"
                  >
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
