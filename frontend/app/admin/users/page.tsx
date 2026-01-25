/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo } from 'react';
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

const CARDS_PER_PAGE = 3;

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'ADMIN' | 'ARCHIVE_MANAGER'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'ADMIN' as 'ADMIN' | 'ARCHIVE_MANAGER',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err: any) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive);
      
      const matchesRole = 
        roleFilter === 'all' || 
        user.role === roleFilter;
      
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchTerm, statusFilter, roleFilter]);

  const totalPages = Math.ceil(filteredUsers.length / CARDS_PER_PAGE);
  const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + CARDS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
      setSuccess('Utilisateur créé avec succès !');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'ADMIN' | 'ARCHIVE_MANAGER') => {
    try {
      setError('');
      setSuccess('');
      await api.patch(`/users/${userId}`, { role: newRole });
      setSuccess(`Rôle modifié avec succès !`);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la modification du rôle');
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver cet utilisateur ?')) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      await api.delete(`/users/${id}`);
      setSuccess('Utilisateur désactivé avec succès !');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la désactivation');
    }
  };

  const handleActivate = async (id: string) => {
    try {
      setError('');
      setSuccess('');
      await api.patch(`/users/${id}/activate`);
      setSuccess('Utilisateur réactivé avec succès !');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la réactivation');
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

  const activeUsers = users.filter(u => u.isActive);
  const inactiveUsers = users.filter(u => !u.isActive);

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
        {/* Messages de succès/erreur */}
        {success && (
          <div className="mb-6 p-4 text-sm text-green-700 dark:text-green-400 bg-green-50/80 dark:bg-green-950/40 border border-green-200/50 dark:border-green-900/50 rounded-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 text-sm text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-950/40 border border-red-200/50 dark:border-red-900/50 rounded-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {/* Header avec stats et bouton créer */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              Utilisateurs
            </h2>
            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {activeUsers.length} actif{activeUsers.length > 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                {inactiveUsers.length} inactif{inactiveUsers.length > 1 ? 's' : ''}
              </span>
              <span className="text-slate-400 dark:text-slate-500">•</span>
              <span>{filteredUsers.length} résultat{filteredUsers.length > 1 ? 's' : ''}</span>
            </div>
          </div>
          <Button 
            onClick={() => {
              setShowForm(!showForm);
              setFormData({
                email: '',
                password: '',
                firstName: '',
                lastName: '',
                role: 'ADMIN',
              });
            }}
            variant={showForm ? "outline" : "default"}
            className="h-10 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            {showForm ? 'Annuler' : '+ Créer un utilisateur'}
          </Button>
        </div>

        {/* Formulaire de création */}
        {showForm && (
          <Card className="mb-8 border border-white/20 dark:border-white/10 shadow-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl">
            <CardHeader>
              <CardTitle>Créer un nouvel utilisateur</CardTitle>
              <CardDescription>
                Créez un nouvel administrateur ou responsable d&apos;archives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-5">
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
                  Créer l&apos;utilisateur
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Barre de recherche et filtres */}
        <Card className="mb-6 border border-white/20 dark:border-white/10 shadow-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-1">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <Input
                    placeholder="Rechercher par nom, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-11 pl-10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                  />
                </div>
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className="flex h-11 w-full rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actifs uniquement</option>
                  <option value="inactive">Inactifs uniquement</option>
                </select>
              </div>
              <div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as 'all' | 'ADMIN' | 'ARCHIVE_MANAGER')}
                  className="flex h-11 w-full rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <option value="all">Tous les rôles</option>
                  <option value="ADMIN">Administrateurs</option>
                  <option value="ARCHIVE_MANAGER">Responsables</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des utilisateurs avec pagination */}
        {filteredUsers.length === 0 ? (
          <Card className="border border-white/20 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
            <CardContent className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-slate-600 dark:text-slate-400 mb-4">Aucun utilisateur trouvé</p>
              {searchTerm || statusFilter !== 'all' || roleFilter !== 'all' ? (
                <Button onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setRoleFilter('all');
                }} variant="outline">
                  Réinitialiser les filtres
                </Button>
              ) : (
                <Button onClick={() => setShowForm(true)} variant="outline">
                  Créer le premier utilisateur
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
              {paginatedUsers.map((user) => (
                <Card 
                  key={user._id} 
                  className={`group border shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ${
                    user.isActive 
                      ? 'border-white/20 dark:border-white/10' 
                      : 'border-red-200/50 dark:border-red-900/50 opacity-75'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform ${
                          user.isActive 
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-500' 
                            : 'bg-gradient-to-br from-red-500 to-red-600'
                        }`}>
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-50 text-base mb-1">
                            {user.firstName} {user.lastName}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Rôle</span>
                        {user.isActive ? (
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateRole(user._id, e.target.value as 'ADMIN' | 'ARCHIVE_MANAGER')}
                            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          >
                            <option value="ADMIN">Administrateur</option>
                            <option value="ARCHIVE_MANAGER">Responsable</option>
                          </select>
                        ) : (
                          <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            user.role === 'ADMIN' 
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            {user.role === 'ADMIN' ? 'Admin' : 'Responsable'}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          user.isActive 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {user.isActive ? 'Actif' : 'Inactif'}
                        </span>
                        {user.isActive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeactivate(user._id)}
                            className="h-8 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 backdrop-blur-sm bg-white/50 dark:bg-slate-800/50"
                          >
                            Désactiver
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleActivate(user._id)}
                            className="h-8 text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 backdrop-blur-sm bg-white/50 dark:bg-slate-800/50"
                          >
                            Réactiver
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Card className="border border-white/20 dark:border-white/10 shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Page {currentPage} sur {totalPages} • {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="h-9 backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Précédent
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={`h-9 min-w-[36px] backdrop-blur-sm ${
                              currentPage === page 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white/50 dark:bg-slate-800/50'
                            }`}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="h-9 backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Suivant
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
