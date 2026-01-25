'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/logo';
import { documentsApi, Document } from '@/lib/documents';

export default function DocumentsPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterType, setFilterType] = useState('');
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
      setDocuments(data);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      await documentsApi.delete(id);
      fetchDocuments();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const url = await documentsApi.getFileUrl(document._id);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement');
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

  const handleSaveEdit = async () => {
    if (!editingDocument) return;

    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await documentsApi.update(editingDocument._id, editForm);
      setSuccessMessage('Métadonnées mises à jour avec succès !');
      setTimeout(() => {
        setEditingDocument(null);
        setSuccessMessage('');
        fetchDocuments();
      }, 1500);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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

  const filteredDocuments = documents.filter((doc) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      doc.fileName.toLowerCase().includes(searchLower) ||
      doc.department.toLowerCase().includes(searchLower) ||
      doc.documentType.toLowerCase().includes(searchLower) ||
      (doc.firstName && doc.firstName.toLowerCase().includes(searchLower)) ||
      (doc.lastName && doc.lastName.toLowerCase().includes(searchLower)) ||
      (doc.cin && doc.cin.toLowerCase().includes(searchLower)) ||
      (doc.firstName && doc.lastName && `${doc.firstName} ${doc.lastName}`.toLowerCase().includes(searchLower));
    const matchesDepartment = !filterDepartment || doc.department === filterDepartment;
    const matchesType = !filterType || doc.documentType === filterType;
    return matchesSearch && matchesDepartment && matchesType;
  });

  const departments = Array.from(new Set(documents.map((d) => d.department)));
  const documentTypes = Array.from(new Set(documents.map((d) => d.documentType)));

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950/20">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Header */}
      <header className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-white/20 dark:border-white/10 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push(user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard')} size="sm" className="h-9 backdrop-blur-sm bg-white/50 dark:bg-slate-800/50">
              ← Retour
            </Button>
            <Logo size="md" />
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {user?.role === 'ADMIN' ? 'Tous les Documents' : 'Mes Documents'}
            </h1>
          </div>
          <Button
            onClick={() => router.push('/upload')}
            className="h-9 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            + Uploader
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 relative z-10">
        {/* Filters */}
        <Card className="mb-6 border border-white/20 dark:border-white/10 shadow-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Rechercher par nom, prénom, CIN, département, type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-11 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                />
              </div>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <option value="">Tous les départements</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <option value="">Tous les types</option>
                {documentTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Chargement des documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <Card className="border border-white/20 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
            <CardContent className="p-12 text-center">
              <p className="text-slate-600 dark:text-slate-400 mb-4">Aucun document trouvé</p>
              <Button onClick={() => router.push('/upload')} variant="outline">
                Uploader un document
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredDocuments.map((document) => (
              <Card
                key={document._id}
                className="group border border-white/20 dark:border-white/10 shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl hover:shadow-xl hover:scale-[1.01] transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5 flex-1">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-50 text-lg mb-1">
                          {document.fileName}
                        </h3>
                        {/* Informations extraites par LLM */}
                        {(document.firstName || document.lastName || document.cin) && (
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            {(document.firstName || document.lastName) && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {document.firstName} {document.lastName}
                              </span>
                            )}
                            {document.cin && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                </svg>
                                CIN: {document.cin}
                              </span>
                            )}
                            {document.signatureDetected && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Signature détectée
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {document.department}
                          </span>
                          <span>•</span>
                          <span>{document.documentType}</span>
                          <span>•</span>
                          <span>{formatFileSize(document.fileSize)}</span>
                          <span>•</span>
                          <span>{formatDate(document.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getStatusColor(document.documentStatus)}`}>
                            {getStatusLabel(document.documentStatus)}
                          </span>
                          {document.humanVerificationRequired && (
                            <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                              ⚠ Vérification requise
                            </span>
                          )}
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {document.logicalPath}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDocument(document)}
                        className="h-9 backdrop-blur-sm bg-white/50 dark:bg-slate-800/50"
                      >
                        Détails
                      </Button>
                      {(user?.role === 'ADMIN' || document.uploadedBy?._id === user?._id || document.uploadedBy?._id === user?.id) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(document)}
                          className="h-9 backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          Modifier
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(document)}
                        className="h-9 backdrop-blur-sm bg-white/50 dark:bg-slate-800/50"
                      >
                        Télécharger
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(document._id)}
                        className="h-9 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 backdrop-blur-sm bg-white/50 dark:bg-slate-800/50"
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          {filteredDocuments.length} document{filteredDocuments.length > 1 ? 's' : ''} sur {documents.length} total
        </div>
      </main>

      {/* Modal Détails Document */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedDocument(null)}>
          <Card 
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/20 dark:border-white/10 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="border-b border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Détails du Document
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDocument(null)}
                  className="h-8 w-8 p-0"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Informations extraites par LLM */}
              {(selectedDocument.firstName || selectedDocument.lastName || selectedDocument.cin) && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/50">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Informations Extraites par IA
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(selectedDocument.firstName || selectedDocument.lastName) && (
                      <div>
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Nom complet:</span>
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                          {selectedDocument.firstName} {selectedDocument.lastName}
                        </p>
                      </div>
                    )}
                    {selectedDocument.cin && (
                      <div>
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">CIN:</span>
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">{selectedDocument.cin}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Informations générales */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Fichier:</span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedDocument.fileName}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Taille:</span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatFileSize(selectedDocument.fileSize)}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Département:</span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedDocument.department}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Type:</span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedDocument.documentType}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Statut:</span>
                    <span className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold ${getStatusColor(selectedDocument.documentStatus)}`}>
                      {getStatusLabel(selectedDocument.documentStatus)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Signature:</span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {selectedDocument.signatureDetected ? (
                        <span className="text-green-600 dark:text-green-400">✓ Détectée</span>
                      ) : (
                        <span className="text-slate-400">Non détectée</span>
                      )}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Chemin logique:</span>
                  <p className="text-sm font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 p-2 rounded mt-1">
                    {selectedDocument.logicalPath}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Date d&apos;upload:</span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(selectedDocument.createdAt)}</p>
                </div>
                {selectedDocument.uploadedBy && (
                  <div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Uploadé par:</span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {selectedDocument.uploadedBy.firstName} {selectedDocument.uploadedBy.lastName}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                <Button
                  onClick={() => handleDownload(selectedDocument)}
                  className="flex-1"
                >
                  Télécharger le PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedDocument(null);
                    handleDelete(selectedDocument._id);
                  }}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Modification Métadonnées */}
      {editingDocument && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditingDocument(null)}>
          <Card 
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/20 dark:border-white/10 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="border-b border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Modifier les Métadonnées
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingDocument(null)}
                  className="h-8 w-8 p-0"
                >
                  ✕
                </Button>
              </div>
              <CardDescription className="mt-2">
                Document: {editingDocument.fileName}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Messages de succès/erreur */}
              {successMessage && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm">
                  {successMessage}
                </div>
              )}
              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
                  {errorMessage}
                </div>
              )}

              {/* Formulaire de modification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Prénom
                  </label>
                  <Input
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    placeholder="Prénom"
                    className="bg-white/50 dark:bg-slate-800/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nom
                  </label>
                  <Input
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    placeholder="Nom"
                    className="bg-white/50 dark:bg-slate-800/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    CIN
                  </label>
                  <Input
                    value={editForm.cin}
                    onChange={(e) => setEditForm({ ...editForm, cin: e.target.value })}
                    placeholder="CIN (ex: AB123456)"
                    className="bg-white/50 dark:bg-slate-800/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Département
                  </label>
                  <Input
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    placeholder="Département"
                    className="bg-white/50 dark:bg-slate-800/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Type de document
                  </label>
                  <Input
                    value={editForm.documentType}
                    onChange={(e) => setEditForm({ ...editForm, documentType: e.target.value })}
                    placeholder="Type de document"
                    className="bg-white/50 dark:bg-slate-800/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Statut
                  </label>
                  <select
                    value={editForm.documentStatus}
                    onChange={(e) => setEditForm({ ...editForm, documentStatus: e.target.value as 'pending' | 'valid' | 'incomplete' })}
                    className="flex h-10 w-full rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <option value="pending">En attente</option>
                    <option value="valid">Valide</option>
                    <option value="incomplete">Incomplet</option>
                  </select>
                </div>
              </div>

              {/* Info sur le chemin logique */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">
                  <strong>Note:</strong> Le chemin logique sera automatiquement recalculé après la sauvegarde.
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                  Chemin actuel: {editingDocument.logicalPath}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                <Button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingDocument(null)}
                  disabled={saving}
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
