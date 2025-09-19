import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Save, X, Users, Shield, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import ConfirmationModal from './ConfirmationModal';

const UserManagementScreen = ({ onBack }) => {
  const { user } = useAuth();
  const { data } = useData();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    nome: '',
    email: '',
    senha: '',
    role: 'tecnico',
    clustersPermitidos: []
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    user: null
  });

  // Carregar usuários
  useEffect(() => {
    const carregarUsuarios = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/usuarios', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUsuarios(data);
        }
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarUsuarios();
  }, []);

  const getRoleDisplayName = (role) => {
    const roles = {
      'admin': 'Administrador',
      'coordenador': 'Coordenador', 
      'tecnico': 'Técnico'
    };
    return roles[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      'admin': 'bg-red-100 text-red-800',
      'coordenador': 'bg-blue-100 text-blue-800',
      'tecnico': 'bg-green-100 text-green-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const handleClusterToggle = (clusterId, isEditing = false) => {
    const target = isEditing ? editingUser : newUser;
    const setter = isEditing ? setEditingUser : setNewUser;
    
    const clusters = target.clustersPermitidos || [];
    const newClusters = clusters.includes(clusterId)
      ? clusters.filter(id => id !== clusterId)
      : [...clusters, clusterId];
    
    setter(prev => ({ ...prev, clustersPermitidos: newClusters }));
  };

  const handleSaveUser = async () => {
    const userData = editingUser || newUser;
    
    if (!userData.nome || !userData.email || (!editingUser && !userData.senha) || !userData.role) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingUser 
        ? `http://localhost:3001/api/usuarios/${editingUser.id}`
        : 'http://localhost:3001/api/usuarios';
      
      const method = editingUser ? 'PUT' : 'POST';
      
      const body = {
        nome: userData.nome,
        email: userData.email,
        role: userData.role,
        clustersPermitidos: userData.clustersPermitidos || [],
        ativo: userData.ativo !== false
      };
      
      if (!editingUser) {
        body.senha = userData.senha;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (response.ok) {
        alert(editingUser ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
        
        // Recarregar lista de usuários
        const usersResponse = await fetch('http://localhost:3001/api/usuarios', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (usersResponse.ok) {
          const updatedUsers = await usersResponse.json();
          setUsuarios(updatedUsers);
        }
        
        // Limpar formulário
        setShowAddForm(false);
        setEditingUser(null);
        setNewUser({ nome: '', email: '', senha: '', role: 'tecnico', clustersPermitidos: [] });
      } else {
        alert(`Erro: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert('Erro ao salvar usuário. Tente novamente.');
    }
  };

  const handleDeleteUser = async () => {
    if (!confirmModal.user) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/usuarios/${confirmModal.user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (response.ok) {
        alert('Usuário excluído com sucesso!');
        
        // Recarregar lista
        const usersResponse = await fetch('http://localhost:3001/api/usuarios', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (usersResponse.ok) {
          const updatedUsers = await usersResponse.json();
          setUsuarios(updatedUsers);
        }
      } else {
        alert(`Erro: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert('Erro ao excluir usuário. Tente novamente.');
    }
    
    setConfirmModal({ isOpen: false, user: null });
  };

  // Verificar se usuário é admin
  if (user?.role !== 'admin') {
    return (
      <div className="mobile-container">
        <div className="p-6">
          <div className="text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600 mb-6">Apenas administradores podem gerenciar usuários.</p>
            <button onClick={onBack} className="btn-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl xl:text-2xl font-bold text-gray-900">
                Gestão de Usuários
              </h1>
              <p className="text-sm text-gray-600">
                Gerencie usuários e suas permissões
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando usuários...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {usuarios.map(usuario => {
              const clustersPermitidos = usuario.clusters_permitidos ? 
                JSON.parse(usuario.clusters_permitidos) : [];
              
              return (
                <div key={usuario.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{usuario.nome}</h3>
                        <p className="text-sm text-gray-500">{usuario.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(usuario.role)}`}>
                            {getRoleDisplayName(usuario.role)}
                          </span>
                          {clustersPermitidos.length > 0 && (
                            <span className="text-xs text-gray-500">
                              {clustersPermitidos.length} cluster(s)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingUser({
                          ...usuario,
                          clustersPermitidos: usuario.clusters_permitidos ? JSON.parse(usuario.clusters_permitidos) : []
                        })}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Editar usuário"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {/* Não permitir exclusão do próprio usuário */}
                      {usuario.id !== user.id && (
                        <button
                          onClick={() => setConfirmModal({ isOpen: true, user: usuario })}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir usuário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Clusters Permitidos */}
                  {clustersPermitidos.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-2">Clusters Permitidos:</p>
                      <div className="flex flex-wrap gap-1">
                        {clustersPermitidos.map(clusterId => {
                          const cluster = data.clusters.find(c => c.id === clusterId.toString());
                          return cluster ? (
                            <span key={clusterId} className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-xs">
                              {cluster.nome}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Adição/Edição */}
        {(showAddForm || editingUser) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingUser(null);
                      setNewUser({ nome: '', email: '', senha: '', role: 'tecnico', clustersPermitidos: [] });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Nome */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                    <input
                      type="text"
                      value={editingUser ? editingUser.nome : newUser.nome}
                      onChange={(e) => {
                        if (editingUser) {
                          setEditingUser(prev => ({ ...prev, nome: e.target.value }));
                        } else {
                          setNewUser(prev => ({ ...prev, nome: e.target.value }));
                        }
                      }}
                      className="input-field"
                      placeholder="Nome completo"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={editingUser ? editingUser.email : newUser.email}
                      onChange={(e) => {
                        if (editingUser) {
                          setEditingUser(prev => ({ ...prev, email: e.target.value }));
                        } else {
                          setNewUser(prev => ({ ...prev, email: e.target.value }));
                        }
                      }}
                      className="input-field"
                      placeholder="email@empresa.com"
                    />
                  </div>

                  {/* Senha */}
                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                      <input
                        type="password"
                        value={newUser.senha}
                        onChange={(e) => setNewUser(prev => ({ ...prev, senha: e.target.value }))}
                        className="input-field"
                        placeholder="Senha segura"
                      />
                    </div>
                  )}

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Perfil</label>
                    <select
                      value={editingUser ? editingUser.role : newUser.role}
                      onChange={(e) => {
                        if (editingUser) {
                          setEditingUser(prev => ({ ...prev, role: e.target.value }));
                        } else {
                          setNewUser(prev => ({ ...prev, role: e.target.value }));
                        }
                      }}
                      className="select-field"
                    >
                      <option value="tecnico">Técnico</option>
                      <option value="coordenador">Coordenador</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>

                  {/* Clusters Permitidos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Clusters Permitidos
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Selecione os clusters que o usuário pode acessar
                    </p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {data.clusters.filter(c => c.ativo).map(cluster => {
                        const isSelected = editingUser 
                          ? (editingUser.clustersPermitidos || []).includes(parseInt(cluster.id))
                          : newUser.clustersPermitidos.includes(parseInt(cluster.id));
                        
                        return (
                          <label key={cluster.id} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleClusterToggle(parseInt(cluster.id), !!editingUser)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">{cluster.nome}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleSaveUser}
                      className="btn-primary flex-1 flex items-center justify-center"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {editingUser ? 'Atualizar' : 'Criar'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingUser(null);
                        setNewUser({ nome: '', email: '', senha: '', role: 'tecnico', clustersPermitidos: [] });
                      }}
                      className="btn-secondary flex-1"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação para Exclusão */}
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, user: null })}
          onConfirm={handleDeleteUser}
          title="Excluir Usuário"
          message={`Tem certeza que deseja excluir o usuário "${confirmModal.user?.nome}"? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          type="danger"
        />
      </div>
    </div>
  );
};

export default UserManagementScreen;
