/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/logo';
import api from '@/lib/api';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'ADMIN' as 'ADMIN' | 'ARCHIVE_MANAGER',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err: any) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/users', formData);
      setShowForm(false);
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'ADMIN',
      });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver cet utilisateur ?')) {
      return;
    }

    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err: any) {
      console.error('Erreur lors de la désactivation:', err);
    }
  };

  if (loading) {
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

      <header className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-white/20 dark:border-white/10 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/admin/dashboard')} size="sm" className="h-9 backdrop-blur-sm bg-white/50 dark:bg-slate-800/50">
              ← Retour
            </Button>
            <Logo size="md" />
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Gestion des Utilisateurs
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 relative z-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              Utilisateurs
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {users.length} utilisateur{users.length > 1 ? 's' : ''}
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            variant={showForm ? "outline" : "default"}
            className="h-10 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            {showForm ? 'Annuler' : '+ Créer un Admin'}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 border border-white/20 dark:border-white/10 shadow-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl">
            <CardHeader>
              <CardTitle>Créer un nouvel administrateur</CardTitle>
              <CardDescription>
                Les administrateurs doivent être créés manuellement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-5">
                {error && (
                  <div className="p-4 text-sm text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-950/40 border border-red-200/50 dark:border-red-900/50 rounded-xl backdrop-blur-sm">
                    {error}
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Prénom</label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      placeholder="Jean"
                      className="h-12 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nom</label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      placeholder="Dupont"
                      className="h-12 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="admin@digiarch.com"
                    className="h-12 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Mot de passe</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="h-12 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Rôle</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'ARCHIVE_MANAGER' })}
                    className="flex h-12 w-full rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    <option value="ADMIN">Administrateur</option>
                    <option value="ARCHIVE_MANAGER">Responsable d&apos;Archives</option>
                  </select>
                </div>
                <Button type="submit" className="w-full h-12 font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
                  Créer l&apos;administrateur
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {users.length === 0 ? (
            <Card className="border border-white/20 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
              <CardContent className="p-12 text-center">
                <p className="text-slate-600 dark:text-slate-400">Aucun utilisateur trouvé</p>
              </CardContent>
            </Card>
          ) : (
            users.map((user) => (
              <Card key={user._id} className="group border border-white/20 dark:border-white/10 shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl hover:shadow-xl hover:scale-[1.01] transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-base shadow-lg group-hover:scale-110 transition-transform">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-50 text-lg mb-1">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right space-y-2">
                        <div className={`inline-block px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${
                          user.role === 'ADMIN' 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {user.role === 'ADMIN' ? 'Admin' : 'Responsable'}
                        </div>
                        {user.isActive ? (
                          <div className="block mt-2 px-4 py-1.5 rounded-lg text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 shadow-sm">
                            Actif
                          </div>
                        ) : (
                          <div className="block mt-2 px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 shadow-sm">
                            Inactif
                          </div>
                        )}
                      </div>
                      {user.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeactivate(user._id)}
                          className="h-9 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 backdrop-blur-sm bg-white/50 dark:bg-slate-800/50"
                        >
                          Désactiver
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
