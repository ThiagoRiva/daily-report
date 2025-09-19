import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  MapPin, 
  Users, 
  Download,
  Upload,
  Settings,
  Save,
  X
} from 'lucide-react';
import { useData } from '../context/DataContext';

const MasterDataScreen = ({ onBack }) => {
  const { 
    data, 
    addCluster, 
    updateCluster, 
    addUsina, 
    updateUsina, 
    addTecnico, 
    updateTecnico 
  } = useData();
  
  const [activeTab, setActiveTab] = useState('clusters');
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);

  // Resetar formulários
  const resetForms = () => {
    setEditingItem(null);
    setNewItem({});
    setShowAddForm(false);
  };

  // Iniciar edição
  const startEdit = (item) => {
    setEditingItem({ ...item });
    setShowAddForm(false);
  };

  // Salvar edição
  const saveEdit = () => {
    if (!editingItem.nome?.trim()) {
      alert('Nome é obrigatório');
      return;
    }

    switch (activeTab) {
      case 'clusters':
        updateCluster(editingItem);
        break;
      case 'usinas':
        if (!editingItem.clusterId) {
          alert('Cluster é obrigatório para usinas');
          return;
        }
        updateUsina(editingItem);
        break;
      case 'tecnicos':
        if (!editingItem.funcao?.trim()) {
          alert('Função é obrigatória para técnicos');
          return;
        }
        updateTecnico(editingItem);
        break;
      default:
        break;
    }
    
    resetForms();
  };

  // Cancelar edição
  const cancelEdit = () => {
    resetForms();
  };

  // Adicionar novo item
  const addNewItem = () => {
    if (!newItem.nome?.trim()) {
      alert('Nome é obrigatório');
      return;
    }

    const itemToAdd = {
      ...newItem,
      ativo: true
    };

    switch (activeTab) {
      case 'clusters':
        addCluster(itemToAdd);
        break;
      case 'usinas':
        if (!itemToAdd.clusterId) {
          alert('Cluster é obrigatório para usinas');
          return;
        }
        addUsina(itemToAdd);
        break;
      case 'tecnicos':
        if (!itemToAdd.funcao?.trim()) {
          alert('Função é obrigatória para técnicos');
          return;
        }
        addTecnico(itemToAdd);
        break;
      default:
        break;
    }
    
    resetForms();
  };

  // Exportar dados
  const exportData = () => {
    const dataToExport = {
      clusters: data.clusters,
      usinas: data.usinas,
      tecnicos: data.tecnicos,
      funcoes: data.funcoes
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { 
      type: 'application/json' 
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `dados_sistema_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Importar dados
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // Validar estrutura básica
        if (!importedData.clusters || !importedData.usinas || !importedData.tecnicos) {
          alert('Arquivo inválido. Estrutura de dados não reconhecida.');
          return;
        }

        // Aqui você poderia implementar a importação
        // Por enquanto, só mostra um alerta
        alert('Funcionalidade de importação será implementada em versão futura');
        
      } catch (error) {
        alert('Erro ao ler arquivo. Verifique se é um arquivo JSON válido.');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  // Renderizar lista de clusters
  const renderClusters = () => (
    <div className="space-y-3">
      {data.clusters.map(cluster => (
        <div key={cluster.id} className="card">
          {editingItem?.id === cluster.id ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editingItem.nome}
                onChange={(e) => setEditingItem({...editingItem, nome: e.target.value})}
                className="input-field"
                placeholder="Nome do cluster"
              />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`ativo_${cluster.id}`}
                  checked={editingItem.ativo}
                  onChange={(e) => setEditingItem({...editingItem, ativo: e.target.checked})}
                />
                <label htmlFor={`ativo_${cluster.id}`} className="text-sm">Ativo</label>
              </div>
              <div className="flex space-x-2">
                <button onClick={saveEdit} className="btn-primary text-sm py-1 px-3">
                  <Save className="w-4 h-4 mr-1" />
                  Salvar
                </button>
                <button onClick={cancelEdit} className="btn-secondary text-sm py-1 px-3">
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-primary-600 mr-3" />
                <div>
                  <h4 className="font-semibold text-gray-900">{cluster.nome}</h4>
                  <p className="text-sm text-gray-500">
                    {data.usinas.filter(u => u.clusterId === cluster.id).length} usina(s)
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`px-2 py-1 rounded-full text-xs ${
                  cluster.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {cluster.ativo ? 'Ativo' : 'Inativo'}
                </div>
                <button
                  onClick={() => startEdit(cluster)}
                  className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // Renderizar lista de usinas
  const renderUsinas = () => (
    <div className="space-y-3">
      {data.usinas.map(usina => {
        const cluster = data.clusters.find(c => c.id === usina.clusterId);
        return (
          <div key={usina.id} className="card">
            {editingItem?.id === usina.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editingItem.nome}
                  onChange={(e) => setEditingItem({...editingItem, nome: e.target.value})}
                  className="input-field"
                  placeholder="Nome da usina"
                />
                <select
                  value={editingItem.clusterId}
                  onChange={(e) => setEditingItem({...editingItem, clusterId: e.target.value})}
                  className="select-field"
                >
                  <option value="">Selecione um cluster</option>
                  {data.clusters.filter(c => c.ativo).map(cluster => (
                    <option key={cluster.id} value={cluster.id}>
                      {cluster.nome}
                    </option>
                  ))}
                </select>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`ativo_${usina.id}`}
                    checked={editingItem.ativo}
                    onChange={(e) => setEditingItem({...editingItem, ativo: e.target.checked})}
                  />
                  <label htmlFor={`ativo_${usina.id}`} className="text-sm">Ativo</label>
                </div>
                <div className="flex space-x-2">
                  <button onClick={saveEdit} className="btn-primary text-sm py-1 px-3">
                    <Save className="w-4 h-4 mr-1" />
                    Salvar
                  </button>
                  <button onClick={cancelEdit} className="btn-secondary text-sm py-1 px-3">
                    <X className="w-4 h-4 mr-1" />
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">{usina.nome}</h4>
                    <p className="text-sm text-gray-500">
                      Cluster: {cluster?.nome || 'Não definido'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`px-2 py-1 rounded-full text-xs ${
                    usina.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {usina.ativo ? 'Ativo' : 'Inativo'}
                  </div>
                  <button
                    onClick={() => startEdit(usina)}
                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Renderizar lista de técnicos
  const renderTecnicos = () => (
    <div className="space-y-3">
      {data.tecnicos.map(tecnico => {
        const cluster = data.clusters.find(c => c.id === tecnico.clusterId);
        return (
          <div key={tecnico.id} className="card">
            {editingItem?.id === tecnico.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editingItem.nome}
                  onChange={(e) => setEditingItem({...editingItem, nome: e.target.value})}
                  className="input-field"
                  placeholder="Nome do técnico"
                />
                <input
                  type="text"
                  value={editingItem.funcao}
                  onChange={(e) => setEditingItem({...editingItem, funcao: e.target.value})}
                  className="input-field"
                  placeholder="Função"
                />
                <select
                  value={editingItem.clusterId || ''}
                  onChange={(e) => setEditingItem({...editingItem, clusterId: e.target.value})}
                  className="select-field"
                >
                  <option value="">Selecione um cluster</option>
                  {data.clusters.filter(c => c.ativo).map(cluster => (
                    <option key={cluster.id} value={cluster.id}>
                      {cluster.nome}
                    </option>
                  ))}
                </select>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`ativo_${tecnico.id}`}
                    checked={editingItem.ativo}
                    onChange={(e) => setEditingItem({...editingItem, ativo: e.target.checked})}
                  />
                  <label htmlFor={`ativo_${tecnico.id}`} className="text-sm">Ativo</label>
                </div>
                <div className="flex space-x-2">
                  <button onClick={saveEdit} className="btn-primary text-sm py-1 px-3">
                    <Save className="w-4 h-4 mr-1" />
                    Salvar
                  </button>
                  <button onClick={cancelEdit} className="btn-secondary text-sm py-1 px-3">
                    <X className="w-4 h-4 mr-1" />
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">{tecnico.nome}</h4>
                    <p className="text-sm text-gray-500">
                      {tecnico.funcao} • {cluster?.nome || 'Sem cluster'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`px-2 py-1 rounded-full text-xs ${
                    tecnico.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {tecnico.ativo ? 'Ativo' : 'Inativo'}
                  </div>
                  <button
                    onClick={() => startEdit(tecnico)}
                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Renderizar formulário de adição
  const renderAddForm = () => {
    if (!showAddForm) return null;

    return (
      <div className="card mb-4 border-2 border-primary-200">
        <h4 className="font-semibold text-gray-900 mb-3">
          Adicionar {activeTab === 'clusters' ? 'Cluster' : activeTab === 'usinas' ? 'Usina' : 'Técnico'}
        </h4>
        
        <div className="space-y-3">
          <input
            type="text"
            value={newItem.nome || ''}
            onChange={(e) => setNewItem({...newItem, nome: e.target.value})}
            className="input-field"
            placeholder={`Nome do ${activeTab === 'clusters' ? 'cluster' : activeTab === 'usinas' ? 'usina' : 'técnico'}`}
          />
          
          {activeTab === 'usinas' && (
            <select
              value={newItem.clusterId || ''}
              onChange={(e) => setNewItem({...newItem, clusterId: e.target.value})}
              className="select-field"
            >
              <option value="">Selecione um cluster</option>
              {data.clusters.filter(c => c.ativo).map(cluster => (
                <option key={cluster.id} value={cluster.id}>
                  {cluster.nome}
                </option>
              ))}
            </select>
          )}
          
          {activeTab === 'tecnicos' && (
            <>
              <input
                type="text"
                value={newItem.funcao || ''}
                onChange={(e) => setNewItem({...newItem, funcao: e.target.value})}
                className="input-field"
                placeholder="Função"
              />
              <select
                value={newItem.clusterId || ''}
                onChange={(e) => setNewItem({...newItem, clusterId: e.target.value})}
                className="select-field"
              >
                <option value="">Selecione um cluster (opcional)</option>
                {data.clusters.filter(c => c.ativo).map(cluster => (
                  <option key={cluster.id} value={cluster.id}>
                    {cluster.nome}
                  </option>
                ))}
              </select>
            </>
          )}
          
          <div className="flex space-x-2">
            <button onClick={addNewItem} className="btn-primary text-sm py-1 px-3">
              <Save className="w-4 h-4 mr-1" />
              Adicionar
            </button>
            <button onClick={cancelEdit} className="btn-secondary text-sm py-1 px-3">
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mobile-container">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Cadastro Padrão
            </h1>
            <p className="text-sm text-gray-600">Gerenciar dados mestres do sistema</p>
          </div>
        </div>

        {/* Ações de Import/Export */}
        <div className="card mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-primary-600" />
            Backup e Restauração
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={exportData}
              className="btn-secondary flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </button>
            
            <label className="btn-secondary flex items-center justify-center cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              Importar
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </label>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            Exporte seus dados para backup ou importe dados de outro sistema
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
          <button
            onClick={() => {
              setActiveTab('clusters');
              resetForms();
            }}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'clusters'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapPin className="w-4 h-4 inline mr-1" />
            Clusters
          </button>
          <button
            onClick={() => {
              setActiveTab('usinas');
              resetForms();
            }}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'usinas'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapPin className="w-4 h-4 inline mr-1" />
            Usinas
          </button>
          <button
            onClick={() => {
              setActiveTab('tecnicos');
              resetForms();
            }}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'tecnicos'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4 inline mr-1" />
            Técnicos
          </button>
        </div>

        {/* Botão Adicionar */}
        {!showAddForm && !editingItem && (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary w-full flex items-center justify-center mb-4"
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar {activeTab === 'clusters' ? 'Cluster' : activeTab === 'usinas' ? 'Usina' : 'Técnico'}
          </button>
        )}

        {/* Formulário de Adição */}
        {renderAddForm()}

        {/* Conteúdo das Tabs */}
        {activeTab === 'clusters' && renderClusters()}
        {activeTab === 'usinas' && renderUsinas()}
        {activeTab === 'tecnicos' && renderTecnicos()}

        {/* Estatísticas */}
        <div className="card mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Resumo</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-600">
                {data.clusters.filter(c => c.ativo).length}
              </div>
              <div className="text-sm text-gray-500">Clusters Ativos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {data.usinas.filter(u => u.ativo).length}
              </div>
              <div className="text-sm text-gray-500">Usinas Ativas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {data.tecnicos.filter(t => t.ativo).length}
              </div>
              <div className="text-sm text-gray-500">Técnicos Ativos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterDataScreen;
