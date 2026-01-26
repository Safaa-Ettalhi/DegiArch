/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import api from '@/lib/api';
import { documentsApi } from '@/lib/documents';

interface Statistics {
  total: number;
  byDepartment: Array<{ department: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  byType: Array<{ type: string; count: number }>;
  verificationRequired: number;
  withSignature: number;
  last7Months: Array<{ month: string; count: number }>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [documentsCount, setDocumentsCount] = useState<number>(0);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const usersResponse = await api.get('/users');
      setUsersCount(Array.isArray(usersResponse.data) ? usersResponse.data.length : 0);
      const documentsResponse = await documentsApi.getAll();
      setDocumentsCount(Array.isArray(documentsResponse) ? documentsResponse.length : 0);
      
      // Charger les statistiques avancées
      try {
        const stats = await documentsApi.getAdvancedStatistics();
        setStatistics(stats);
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques avancées:', error);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    setUser(userData);
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

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

      {/* Header */}
      <header className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-white/20 dark:border-white/10 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                DigiArch Admin
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Administrateur</p>
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
            Tableau de bord Admin
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
                  Utilisateurs
                </CardTitle>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <CardDescription className="text-xs">
                Nombre total d&apos;utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ...
                </div>
              ) : (
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {usersCount}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="group border border-white/20 dark:border-white/10 shadow-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Documents archivés
                </CardTitle>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <CardDescription className="text-xs">
                Nombre total de documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  ...
                </div>
              ) : (
                <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {documentsCount}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="group border border-white/20 dark:border-white/10 shadow-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 md:col-span-2 lg:col-span-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button 
                onClick={() => router.push('/admin/users')}
                className="w-full h-11 font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
              >
                Gérer les utilisateurs
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/documents')}
                className="w-full h-11 font-semibold backdrop-blur-sm bg-white/50 dark:bg-slate-800/50"
              >
                Voir tous les documents
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/upload')}
                className="w-full h-11 font-semibold backdrop-blur-sm bg-white/50 dark:bg-slate-800/50"
              >
                Uploader un document
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques avancées */}
        {statistics && (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Documents par département */}
            <Card className="border border-white/20 dark:border-white/10 shadow-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Documents par département
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statistics.byDepartment.slice(0, 5).map((item) => {
                    const percentage = statistics.total > 0 ? (item.count / statistics.total) * 100 : 0;
                    return (
                      <div key={item.department} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-700 dark:text-slate-300">{item.department}</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-50">{item.count}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Documents par statut */}
            <Card className="border border-white/20 dark:border-white/10 shadow-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Documents par statut
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statistics.byStatus.map((item) => {
                    const percentage = statistics.total > 0 ? (item.count / statistics.total) * 100 : 0;
                    const statusLabel = item.status === 'valid' ? 'Valide' : item.status === 'incomplete' ? 'Incomplet' : 'En attente';
                    const statusColor = item.status === 'valid' ? 'from-green-500 to-emerald-500' : 
                                       item.status === 'incomplete' ? 'from-yellow-500 to-amber-500' : 
                                       'from-blue-500 to-indigo-500';
                    return (
                      <div key={item.status} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-700 dark:text-slate-300">{statusLabel}</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-50">{item.count}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className={`h-2 bg-gradient-to-r ${statusColor} rounded-full transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Documents par type */}
            <Card className="border border-white/20 dark:border-white/10 shadow-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Documents par type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statistics.byType.slice(0, 5).map((item) => {
                    const percentage = statistics.total > 0 ? (item.count / statistics.total) * 100 : 0;
                    return (
                      <div key={item.type} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-700 dark:text-slate-300 truncate">{item.type}</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-50 ml-2">{item.count}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Indicateurs supplémentaires */}
            <Card className="border border-white/20 dark:border-white/10 shadow-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Indicateurs clés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-xl border border-orange-200 dark:border-orange-900/50">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Vérification requise</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{statistics.verificationRequired}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-200 dark:border-green-900/50">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Avec signature</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{statistics.withSignature}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200 dark:border-blue-900/50">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Taux de signature</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {statistics.total > 0 ? Math.round((statistics.withSignature / statistics.total) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Évolution sur 7 mois */}
            <Card className="border border-white/20 dark:border-white/10 shadow-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Évolution des uploads (7 derniers mois)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3 h-64 pb-8">
                  {statistics.last7Months.map((item, index) => {
                    const maxCount = Math.max(...statistics.last7Months.map(m => m.count), 1);
                    const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full">
                        <div className="w-full flex items-end justify-center flex-1 relative">
                          <div
                            className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                            style={{ height: `${height}%`, minHeight: item.count > 0 ? '8px' : '0' }}
                            title={`${item.month}: ${item.count} document(s)`}
                          />
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 text-center font-medium mt-2">
                          {item.month.split(' ')[0]}
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{item.count}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
