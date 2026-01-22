'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { documentsApi, UploadDocumentDto } from '@/lib/documents';

export default function UploadPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState<UploadDocumentDto>({
    department: '',
    documentType: '',
  });
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, [router]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError('');
    } else {
      setError('Seuls les fichiers PDF sont acceptés');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Seuls les fichiers PDF sont acceptés');
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !uploadData.department || !uploadData.documentType) {
      setError('Veuillez remplir tous les champs et sélectionner un fichier');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError('');
    setSuccess(false);

    try {
      await documentsApi.upload(file, uploadData, (prog) => {
        setProgress(prog);
      });

      setSuccess(true);
      setFile(null);
      setUploadData({ department: '', documentType: '' });
      
      setTimeout(() => {
        router.push('/documents');
      }, 2000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
            <Button variant="ghost" onClick={() => router.push('/dashboard')} size="sm" className="h-9 backdrop-blur-sm bg-white/50 dark:bg-slate-800/50">
              ← Retour
            </Button>
            <Logo size="md" />
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Upload de Document
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 relative z-10 max-w-4xl">
        <Card className="border border-white/20 dark:border-white/10 shadow-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Uploader un document PDF</CardTitle>
            <CardDescription>
              Sélectionnez un fichier PDF et remplissez les informations nécessaires
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[1.02]'
                  : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600'
              }`}
            >
              {file ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-50">{file.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{formatFileSize(file.size)}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFile(null)}
                    className="backdrop-blur-sm bg-white/50 dark:bg-slate-800/50"
                  >
                    Changer de fichier
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                      Glissez-déposez votre fichier PDF ici
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">ou</p>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <span className="inline-flex items-center justify-center h-10 px-5 text-sm font-semibold rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-slate-800/70 text-slate-900 dark:text-slate-100 transition-all duration-200">
                        Sélectionner un fichier
                      </span>
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Format accepté : PDF uniquement</p>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Département *
                </label>
                <select
                  value={uploadData.department}
                  onChange={(e) => setUploadData({ ...uploadData, department: e.target.value })}
                  required
                  className="flex h-12 w-full rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <option value="">Sélectionner un département</option>
                  <option value="RH">RH (Ressources Humaines)</option>
                  <option value="Finance">Finance</option>
                  <option value="Comptabilite">Comptabilité</option>
                  <option value="IT">IT (Informatique)</option>
                  <option value="Juridique">Juridique</option>
                  <option value="Administration">Administration</option>
                  <option value="Direction">Direction</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Production">Production</option>
                  <option value="Logistique">Logistique</option>
                  <option value="Qualite">Qualité</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Type de document *
                </label>
                <select
                  value={uploadData.documentType}
                  onChange={(e) => setUploadData({ ...uploadData, documentType: e.target.value })}
                  required
                  className="flex h-12 w-full rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <option value="">Sélectionner un type</option>
                  <option value="Contrat">Contrat</option>
                  <option value="Facture">Facture</option>
                  <option value="Rapport">Rapport</option>
                  <option value="Attestation">Attestation</option>
                  <option value="Fiche_de_paie">Fiche de paie</option>
                  <option value="Avis_imposition">Avis d&apos;imposition</option>
                  <option value="Certificat">Certificat</option>
                  <option value="Convention">Convention</option>
                  <option value="Devis">Devis</option>
                  <option value="Bon_de_commande">Bon de commande</option>
                  <option value="Releve">Relevé</option>
                  <option value="Proces_verbal">Procès-verbal</option>
                  <option value="Courrier">Courrier</option>
                  <option value="Note_interne">Note interne</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>

            {/* Progress Bar */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Upload en cours...</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-50">{progress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/50 rounded-xl">
                <p className="text-green-700 dark:text-green-400 font-semibold">
                  ✅ Document uploadé avec succès ! Redirection...
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl">
                <p className="text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!file || !uploadData.department || !uploadData.documentType || uploading}
              className="w-full h-12 font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              {uploading ? `Upload en cours... ${progress}%` : 'Uploader le document'}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
