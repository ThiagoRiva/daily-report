import React from 'react';
import { Calendar, MapPin, User, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SharedFilters = ({ 
  filters, 
  onFiltersChange, 
  clusters, 
  usinas, 
  tecnicos, 
  funcoes,
  showFuncao = false,
  showUsina = true,
  allowMultipleTecnicos = false
}) => {
  const { user } = useAuth();
  const { data, clusterId, usinaId, tecnicoId, tecnicoIds } = filters;

  // Filtrar clusters baseado nas permissões do usuário
  const allowedClusters = user?.clustersPermitidos || [];
  const filteredClusters = user?.role === 'admin' || user?.role === 'coordenador' 
    ? clusters 
    : clusters.filter(cluster => allowedClusters.includes(parseInt(cluster.id)));

  // Filtrar usinas por cluster selecionado
  const filteredUsinas = clusterId 
    ? usinas.filter(usina => usina.clusterId === clusterId)
    : usinas;

  // Filtrar técnicos por cluster selecionado
  const filteredTecnicos = clusterId 
    ? tecnicos.filter(tecnico => tecnico.clusterId === clusterId)
    : tecnicos;

  const handleInputChange = (field, value) => {
    onFiltersChange({
      ...filters,
      [field]: value,
      // Reset dependentes quando cluster muda
      ...(field === 'clusterId' && { usinaId: '', tecnicoId: '' }),
      // Reset tecnico quando usina muda
      ...(field === 'usinaId' && { tecnicoId: '' })
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Calendar className="w-5 h-5 mr-2 text-primary-600" />
        Filtros
      </h3>
      
      <div className="grid grid-cols-1 gap-4">
        {/* Data */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Data
          </label>
          <input
            type="date"
            value={data}
            onChange={(e) => handleInputChange('data', e.target.value)}
            className="input-field"
            required
          />
        </div>

        {/* Cluster */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Cluster
          </label>
            <select
              value={clusterId}
              onChange={(e) => handleInputChange('clusterId', e.target.value)}
              className="select-field"
              required
            >
              <option value="">Selecione um cluster</option>
              {filteredClusters.filter(c => c.ativo).map(cluster => (
                <option key={cluster.id} value={cluster.id}>
                  {cluster.nome}
                </option>
              ))}
            </select>
        </div>

        {/* Usina (opcional) */}
        {showUsina && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Usina
            </label>
            <select
              value={usinaId}
              onChange={(e) => handleInputChange('usinaId', e.target.value)}
              className="select-field"
              required
              disabled={!clusterId}
            >
              <option value="">
                {clusterId ? 'Selecione uma usina' : 'Primeiro selecione um cluster'}
              </option>
              {filteredUsinas.filter(u => u.ativo).map(usina => (
                <option key={usina.id} value={usina.id}>
                  {usina.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Técnico(s) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-1" />
            {allowMultipleTecnicos ? 'Técnicos (Equipe)' : 'Técnico'}
          </label>
          
          {allowMultipleTecnicos ? (
            <div className="space-y-2">
              {/* Lista de técnicos selecionados */}
              {(tecnicoIds || []).map((selectedId) => {
                const tecnico = filteredTecnicos.find(t => t.id === selectedId);
                return (
                  <div key={selectedId} className="flex items-center justify-between bg-primary-50 p-2 rounded">
                    <span className="text-sm">{tecnico?.nome} - {tecnico?.funcao}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newIds = (tecnicoIds || []).filter(id => id !== selectedId);
                        handleInputChange('tecnicoIds', newIds);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              
              {/* Dropdown para adicionar técnico */}
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    const currentIds = tecnicoIds || [];
                    if (!currentIds.includes(e.target.value)) {
                      handleInputChange('tecnicoIds', [...currentIds, e.target.value]);
                    }
                  }
                }}
                className="select-field"
                disabled={!clusterId}
              >
                <option value="">
                  {clusterId ? 'Adicionar técnico à equipe' : 'Primeiro selecione um cluster'}
                </option>
                {filteredTecnicos.filter(t => t.ativo && !(tecnicoIds || []).includes(t.id)).map(tecnico => (
                  <option key={tecnico.id} value={tecnico.id}>
                    {tecnico.nome} - {tecnico.funcao}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <select
              value={tecnicoId}
              onChange={(e) => handleInputChange('tecnicoId', e.target.value)}
              className="select-field"
              required
              disabled={!clusterId}
            >
              <option value="">
                {clusterId ? 'Selecione um técnico' : 'Primeiro selecione um cluster'}
              </option>
              {filteredTecnicos.filter(t => t.ativo).map(tecnico => (
                <option key={tecnico.id} value={tecnico.id}>
                  {tecnico.nome} - {tecnico.funcao}
                </option>
              ))}
            </select>
          )}
        </div>

      </div>

      {/* Informações dos filtros selecionados */}
      {(clusterId || usinaId || tecnicoId) && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Resumo:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            {data && (
              <p><span className="font-medium">Data:</span> {new Date(data).toLocaleDateString('pt-BR')}</p>
            )}
            {clusterId && (
              <p><span className="font-medium">Cluster:</span> {filteredClusters.find(c => c.id === clusterId)?.nome}</p>
            )}
            {showUsina && usinaId && (
              <p><span className="font-medium">Usina:</span> {usinas.find(u => u.id === usinaId)?.nome}</p>
            )}
            {(allowMultipleTecnicos ? (tecnicoIds && tecnicoIds.length > 0) : tecnicoId) && (
              <p>
                <span className="font-medium">{allowMultipleTecnicos ? 'Equipe:' : 'Técnico:'}</span>{' '}
                {allowMultipleTecnicos 
                  ? tecnicoIds?.map(id => filteredTecnicos.find(t => t.id === id)?.nome).join(', ')
                  : filteredTecnicos.find(t => t.id === tecnicoId)?.nome
                }
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedFilters;
