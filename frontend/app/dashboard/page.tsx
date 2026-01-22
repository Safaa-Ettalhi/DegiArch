/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { documentsApi, Document } from '@/lib/documents';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getRecentDocumentsCount = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return documents.filter((doc) => new Date(doc.createdAt) >= sevenDaysAgo).length;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
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

      {/* Header - Glassmorphism */}
      <header className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-white/20 dark:border-white/10 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                DigiArch
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Responsable d&apos;Archives</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="h-9 backdrop-blur-sm bg-white/50 dark:bg-slate-800/50">
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 relative z-10">
        <div className="mb-12">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-3">
            Tableau de bord
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Bienvenue, <span className="font-semibold text-slate-900 dark:text-slate-50">{user.firstName} {user.lastName}</span>
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="group border border-white/20 dark:border-white/10 shadow-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Documents archivés
                </CardTitle>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <CardDescription className="text-xs">
                Nombre total de documents dans les archives
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ...
                </div>
              ) : (
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {documents.length}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="group border border-white/20 dark:border-white/10 shadow-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Documents récents
                </CardTitle>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <CardDescription className="text-xs">
                Documents ajoutés ces 7 derniers jours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  ...
                </div>
              ) : (
                <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {getRecentDocumentsCount()}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="group border border-white/20 dark:border-white/10 shadow-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 md:col-span-2 lg:col-span-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                Actions rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button 
                onClick={() => router.push('/upload')}
                className="w-full h-11 font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
              >
                Uploader un document
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/documents')}
                className="w-full h-11 font-semibold backdrop-blur-sm bg-white/50 dark:bg-slate-800/50"
              >
                Voir mes documents
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
