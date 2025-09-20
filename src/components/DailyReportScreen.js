import React, { useState } from 'react';
import { ArrowLeft, Plus, Copy, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { useData } from '../context/DataContext';
import SharedFilters from './SharedFilters';
import { generateDailyReportWhatsApp, generateConsolidatedDailyReportWhatsApp } from '../utils/whatsappGenerator';

const DailyReportScreen = ({ onBack, quickMode = false }) => {
  const { data, addAtividade } = useData();
  
  const [filters, setFilters] = useState({
    data: new Date().toISOString().split('T')[0],
    clusterId: '',
    tecnicoIds: [] // Múltiplos técnicos
  });

  const [atividadesPorUsina, setAtividadesPorUsina] = useState({}); // Objeto: { usinaId: [atividades] }
  const [tcuComFalha, setTcuComFalha] = useState({ 
    tem: false, 
    falhas: [] // Array de objetos { usinaId: '', skid: '', tracker: '', tipoFalha: '', previsaoInspecao: '' }
  });
  const [observacoesGerais, setObservacoesGerais] = useState('');
  const [usinaSelecionada, setUsinaSelecionada] = useState('');
  const [tcuPorCluster, setTcuPorCluster] = useState({}); // Armazenar dados de TCU por cluster

  // Validações
  const [errors, setErrors] = useState({});
  const [overlaps, setOverlaps] = useState([]);

  // Verificar se os filtros básicos estão completos (não precisa mais de usina específica)
  const filtersComplete = filters.data && filters.clusterId && filters.tecnicoIds && filters.tecnicoIds.length > 0;

  // Funções para visão geral por cluster
  const getClustersComRelatorios = () => {
    if (!filters.data) return [];
    
    const relatoriosPorCluster = new Map();
    
    data.atividades.forEach(atividade => {
      if (atividade.data === filters.data) {
        const cluster = data.clusters.find(c => c.id === atividade.clusterId);
        if (cluster) {
          if (!relatoriosPorCluster.has(cluster.id)) {
            relatoriosPorCluster.set(cluster.id, {
              cluster: cluster,
              atividades: [],
              tecnicos: new Set()
            });
          }
          
          relatoriosPorCluster.get(cluster.id).atividades.push(atividade);
          relatoriosPorCluster.get(cluster.id).tecnicos.add(atividade.tecnicoId);
        }
      }
    });
    
    return Array.from(relatoriosPorCluster.values());
  };

  // Verificar se todos os clusters têm relatórios
  const todosClustersPreenchidos = () => {
    const clustersAtivos = data.clusters.filter(c => c.ativo);
    const clustersComRelatorios = getClustersComRelatorios();
    return clustersAtivos.length > 0 && clustersAtivos.length === clustersComRelatorios.length;
  };

  const getAtividadesDoCluster = (clusterId) => {
    return data.atividades.filter(atividade => 
      atividade.data === filters.data && atividade.clusterId === clusterId
    );
  };

  // Buscar registros de TCU por cluster (simulação - dados de TCU serão salvos junto com atividades)
  const getTcuDoCluster = (clusterId) => {
    // Por enquanto, vamos simular que os dados de TCU são salvos separadamente
    // Em uma implementação real, você poderia ter uma tabela específica para TCU
    return []; // Placeholder - implementar conforme necessário
  };

  // Adicionar nova usina para atividades
  const addNovaUsina = () => {
    if (!usinaSelecionada) {
      alert('Selecione uma usina primeiro');
      return;
    }
    
    if (atividadesPorUsina[usinaSelecionada]) {
      alert('Esta usina já foi adicionada. Use a seção existente.');
      return;
    }
    
    setAtividadesPorUsina(prev => ({
      ...prev,
      [usinaSelecionada]: [{
        tarefa: '',
        inicio: '',
        fim: '',
        observacoes: ''
      }]
    }));
    
    setUsinaSelecionada('');
  };

  // Adicionar nova atividade em uma usina específica
  const addNewAtividadeNaUsina = (usinaId) => {
    const newAtividade = {
      tarefa: '',
      inicio: '',
      fim: '',
      observacoes: ''
    };
    
    setAtividadesPorUsina(prev => ({
      ...prev,
      [usinaId]: [...(prev[usinaId] || []), newAtividade]
    }));
  };

  // Atualizar atividade em uma usina específica
  const updateAtividadeNaUsina = (usinaId, index, field, value) => {
    setAtividadesPorUsina(prev => {
      const updated = [...(prev[usinaId] || [])];
      updated[index] = { ...updated[index], [field]: value };
      
      return {
        ...prev,
        [usinaId]: updated
      };
    });
    
    // Validar sobreposições na usina
    validateOverlapsNaUsina(usinaId);
  };

  // Remover atividade de uma usina
  const removeAtividadeDaUsina = (usinaId, index) => {
    setAtividadesPorUsina(prev => {
      const updated = (prev[usinaId] || []).filter((_, i) => i !== index);
      
      if (updated.length === 0) {
        // Se não há mais atividades, remove a usina
        const newState = { ...prev };
        delete newState[usinaId];
        return newState;
      }
      
      return {
        ...prev,
        [usinaId]: updated
      };
    });
    
    validateOverlapsNaUsina(usinaId);
  };

  // Duplicar atividade em uma usina
  const duplicateAtividadeNaUsina = (usinaId, index) => {
    setAtividadesPorUsina(prev => {
      const atividades = prev[usinaId] || [];
      const atividade = atividades[index];
      const duplicated = {
        ...atividade,
        tarefa: `${atividade.tarefa} (cópia)`
      };
      const updated = [...atividades];
      updated.splice(index + 1, 0, duplicated);
      
      return {
        ...prev,
        [usinaId]: updated
      };
    });
    
    validateOverlapsNaUsina(usinaId);
  };

  // Remover usina completa
  const removeUsina = (usinaId) => {
    setAtividadesPorUsina(prev => {
      const newState = { ...prev };
      delete newState[usinaId];
      return newState;
    });
  };

  // Validar sobreposições de horários em uma usina específica
  const validateOverlapsNaUsina = (usinaId) => {
    const atividadesUsina = atividadesPorUsina[usinaId] || [];
    const overlaps = [];
    const sortedActivities = atividadesUsina
      .filter(a => a.inicio && a.fim)
      .sort((a, b) => a.inicio.localeCompare(b.inicio));

    for (let i = 0; i < sortedActivities.length - 1; i++) {
      const current = sortedActivities[i];
      const next = sortedActivities[i + 1];
      
      if (current.fim > next.inicio) {
        overlaps.push({ usinaId, index1: i, index2: i + 1 });
      }
    }

    // Atualizar overlaps globais
    setOverlaps(prev => {
      const filtered = prev.filter(o => o.usinaId !== usinaId);
      return [...filtered, ...overlaps];
    });
  };

  // Validar todas as sobreposições
  const validateAllOverlaps = () => {
    setOverlaps([]);
    Object.keys(atividadesPorUsina).forEach(usinaId => {
      validateOverlapsNaUsina(usinaId);
    });
  };

  // Validar campos obrigatórios
  const validateForm = () => {
    const newErrors = {};
    
    if (!filtersComplete) {
      newErrors.filters = 'Preencha todos os filtros obrigatórios';
    }

    if (Object.keys(atividadesPorUsina).length === 0) {
      newErrors.atividades = 'Adicione pelo menos uma usina com atividades';
    }

    // Validar atividades de cada usina
    Object.keys(atividadesPorUsina).forEach(usinaId => {
      const atividades = atividadesPorUsina[usinaId] || [];
      atividades.forEach((atividade, index) => {
        const key = `${usinaId}_${index}`;
        
        if (!atividade.tarefa.trim()) {
          newErrors[`tarefa_${key}`] = 'Tarefa é obrigatória';
        }
        if (!atividade.inicio) {
          newErrors[`inicio_${key}`] = 'Horário de início é obrigatório';
        }
        if (!atividade.fim) {
          newErrors[`fim_${key}`] = 'Horário de fim é obrigatório';
        }
        if (atividade.inicio && atividade.fim && atividade.inicio >= atividade.fim) {
          newErrors[`horario_${key}`] = 'Fim deve ser posterior ao início';
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Salvar relatório
  const saveReport = async () => {
    if (!validateForm()) return;

    try {
      // Salvar atividades de todas as usinas
      for (const usinaId of Object.keys(atividadesPorUsina)) {
        const atividades = atividadesPorUsina[usinaId].filter(a => a.tarefa.trim());
        
        for (const atividade of atividades) {
          for (const tecnicoId of filters.tecnicoIds) {
            await addAtividade({
              ...atividade,
              data: filters.data,
              clusterId: filters.clusterId,
              usinaId: usinaId,
              tecnicoId: tecnicoId
            });
          }
        }
      }

      // Salvar dados de TCU para o cluster
      if (tcuComFalha.tem && tcuComFalha.falhas.length > 0) {
        setTcuPorCluster(prev => ({
          ...prev,
          [filters.clusterId]: {
            data: filters.data,
            clusterId: filters.clusterId,
            tcuComFalha: tcuComFalha
          }
        }));
      }

      alert('Relatório salvo com sucesso!');
      
      // Não volta para tela inicial - limpa apenas os dados para próximo preenchimento
      setAtividadesPorUsina({});
      setTcuComFalha({ tem: false, falhas: [] });
      setObservacoesGerais('');
      setOverlaps([]);
      
    } catch (error) {
      alert('Erro ao salvar relatório. Tente novamente.');
      console.error('Erro ao salvar:', error);
    }
  };

  // Gerar WhatsApp do cluster atual
  const generateWhatsApp = () => {
    if (!validateForm()) return;

    const cluster = data.clusters.find(c => c.id === filters.clusterId);
    
    // Buscar nomes dos técnicos selecionados
    const tecnicosNomes = filters.tecnicoIds
      .map(id => data.tecnicos.find(t => t.id === id)?.nome)
      .filter(nome => nome)
      .join(', ');

    // Consolidar todas as atividades de todas as usinas
    const todasAtividades = [];
    Object.keys(atividadesPorUsina).forEach(usinaId => {
      const usina = data.usinas.find(u => u.id === usinaId);
      const atividades = atividadesPorUsina[usinaId].filter(a => a.tarefa.trim());
      
      atividades.forEach(atividade => {
        todasAtividades.push({
          ...atividade,
          usinaName: usina?.nome
        });
      });
    });

    // Ordenar por horário de início
    todasAtividades.sort((a, b) => a.inicio.localeCompare(b.inicio));

    const message = generateDailyReportWhatsApp({
      cluster: cluster?.nome,
      data: filters.data,
      tecnico: tecnicosNomes,
      usina: Object.keys(atividadesPorUsina).length > 1 ? 'Múltiplas Usinas' : data.usinas.find(u => u.id === Object.keys(atividadesPorUsina)[0])?.nome,
      atividades: todasAtividades,
      tcuComFalha,
      observacoesGerais
    });

    copyToClipboard(message);
  };

  // Gerar WhatsApp consolidado de todos os clusters
  const generateConsolidatedWhatsApp = () => {
    if (!filters.data) {
      alert('Selecione uma data para gerar o relatório consolidado');
      return;
    }

    if (!todosClustersPreenchidos()) {
      const clustersAtivos = data.clusters.filter(c => c.ativo);
      const clustersComRelatorios = getClustersComRelatorios();
      const faltantes = clustersAtivos.length - clustersComRelatorios.length;
      
      alert(`Não é possível gerar o relatório consolidado. Faltam ${faltantes} cluster(s) para serem preenchidos.`);
      return;
    }

    const message = generateConsolidatedDailyReportWhatsApp(filters.data, getClustersComRelatorios(), data, tcuPorCluster);
    copyToClipboard(message);
  };

  // Função auxiliar para copiar para área de transferência
  const copyToClipboard = (message) => {
    navigator.clipboard.writeText(message).then(() => {
      alert('Mensagem copiada para a área de transferência!');
    }).catch(() => {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = message;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Mensagem copiada para a área de transferência!');
    });
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
            <h1 className="text-xl xl:text-2xl font-bold text-gray-900">
              Relatório Diário de Atividades
            </h1>
            {quickMode && (
              <p className="text-sm text-blue-600">Modo Rápido Ativado</p>
            )}
          </div>
        </div>

        {/* Layout Responsivo */}
        <div className="responsive-grid">
          {/* Coluna Principal */}
          <div className="xl:order-1">
            {/* 1. Filtros */}
            <SharedFilters
              filters={filters}
              onFiltersChange={setFilters}
              clusters={data.clusters}
              usinas={data.usinas}
              tecnicos={data.tecnicos}
              funcoes={data.funcoes}
              showFuncao={false}
              showUsina={false}
              allowMultipleTecnicos={true}
            />

            {/* Erro de filtros */}
            {errors.filters && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-700 text-sm">{errors.filters}</p>
              </div>
            )}
          </div>

          {/* Coluna Lateral */}
          <div className="xl:order-2">
            {/* 2. Visão Geral por Cluster */}
            {filters.data && (
              <div className="card mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Visão Geral por Cluster</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Visualize quais clusters já têm relatórios na data selecionada.
                </p>
                
                <div className="space-y-2">
                  {data.clusters.filter(c => c.ativo).map(cluster => {
                    const atividadesCluster = getAtividadesDoCluster(cluster.id);
                    const hasRelatorios = atividadesCluster.length > 0;
                    const tecnicosUnicos = new Set(atividadesCluster.map(a => a.tecnicoId)).size;
                    const totalAtividades = atividadesCluster.length;
                    
                    return (
                      <div 
                        key={cluster.id} 
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
                          filters.clusterId === cluster.id ? 'bg-primary-50 border-2 border-primary-200' : 'bg-gray-50'
                        }`}
                        onClick={() => {
                          setFilters(prev => ({ ...prev, clusterId: cluster.id, tecnicoIds: [] }));
                        }}
                      >
                        <div className="flex items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                            hasRelatorios ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            {hasRelatorios ? '✅' : '⭕'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm xl:text-base">{cluster.nome}</p>
                            {hasRelatorios && (
                              <p className="text-xs text-gray-500">
                                {totalAtividades} atividade(s) • {tecnicosUnicos} técnico(s)
                              </p>
                            )}
                          </div>
                        </div>
                        <div className={`text-xs xl:text-sm px-2 py-1 rounded ${
                          hasRelatorios ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {hasRelatorios ? 'Preenchido' : 'Pendente'}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Resumo do progresso */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900">
                        Clusters: {getClustersComRelatorios().length} de {data.clusters.filter(c => c.ativo).length}
                      </span>
                      <div className="w-24 xl:w-32 bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${data.clusters.filter(c => c.ativo).length > 0 ? (getClustersComRelatorios().length / data.clusters.filter(c => c.ativo).length) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Aviso de sobreposições - Largura Completa */}
        {overlaps.length > 0 && (
          <div className="xl:col-span-12">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
                <div>
                  <p className="text-yellow-800 font-medium text-sm">Atenção: Sobreposição de horários</p>
                  <p className="text-yellow-700 text-xs mt-1">
                    Algumas atividades têm horários sobrepostos. Verifique os horários.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo Principal - Largura Completa */}
        <div className="xl:col-span-12">

        {/* 3. Atividades Programadas */}
        <div id="atividades-section" className="card mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-primary-600" />
            Atividades Programadas
          </h3>
          
          <div className="flex gap-3 mb-4">
            <select
              value={usinaSelecionada}
              onChange={(e) => setUsinaSelecionada(e.target.value)}
              className="select-field flex-1"
              disabled={!filters.clusterId}
            >
              <option value="">
                {filters.clusterId ? 'Selecione uma usina para adicionar' : 'Primeiro selecione um cluster'}
              </option>
              {data.usinas
                .filter(u => u.clusterId === filters.clusterId && u.ativo && !atividadesPorUsina[u.id])
                .map(usina => (
                  <option key={usina.id} value={usina.id}>
                    {usina.nome}
                  </option>
                ))}
            </select>
            <button
              onClick={addNovaUsina}
              disabled={!usinaSelecionada}
              className="btn-primary flex items-center text-sm py-2 px-4"
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Usina
            </button>
          </div>

          {/* Erro de atividades */}
          {errors.atividades && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">{errors.atividades}</p>
            </div>
          )}

          {/* Seções por Usina */}
          {Object.keys(atividadesPorUsina).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma usina adicionada</p>
              <p className="text-sm">Selecione uma usina e clique "Adicionar Usina"</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(atividadesPorUsina).map(usinaId => {
                const usina = data.usinas.find(u => u.id === usinaId);
                const atividades = atividadesPorUsina[usinaId] || [];
                
                return (
                  <div key={usinaId} className="border-2 border-primary-200 rounded-lg p-4 bg-primary-50">
                    {/* Header da Usina */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-bold">
                            {Object.keys(atividadesPorUsina).indexOf(usinaId) + 1}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{usina?.nome}</h4>
                          <p className="text-sm text-gray-600">{atividades.length} atividade(s)</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => addNewAtividadeNaUsina(usinaId)}
                          className="btn-primary text-xs py-1 px-3"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Atividade
                        </button>
                        <button
                          onClick={() => removeUsina(usinaId)}
                          className="btn-danger text-xs py-1 px-3"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Usina
                        </button>
                      </div>
                    </div>

                    {/* Atividades da Usina */}
                    <div className="space-y-3">
                      {atividades.map((atividade, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="grid grid-cols-1 gap-3">
                            {/* Tarefa */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tarefa *
                              </label>
                              <input
                                type="text"
                                value={atividade.tarefa}
                                onChange={(e) => updateAtividadeNaUsina(usinaId, index, 'tarefa', e.target.value)}
                                placeholder="Ex: Inspeção Inversor 3"
                                className={`input-field ${errors[`tarefa_${usinaId}_${index}`] ? 'border-red-500' : ''}`}
                              />
                              {errors[`tarefa_${usinaId}_${index}`] && (
                                <p className="text-red-500 text-xs mt-1">{errors[`tarefa_${usinaId}_${index}`]}</p>
                              )}
                            </div>

                            {/* Horários */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Início *
                                </label>
                                <input
                                  type="time"
                                  value={atividade.inicio}
                                  onChange={(e) => updateAtividadeNaUsina(usinaId, index, 'inicio', e.target.value)}
                                  className={`input-field ${errors[`inicio_${usinaId}_${index}`] || errors[`horario_${usinaId}_${index}`] ? 'border-red-500' : ''}`}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Fim *
                                </label>
                                <input
                                  type="time"
                                  value={atividade.fim}
                                  onChange={(e) => updateAtividadeNaUsina(usinaId, index, 'fim', e.target.value)}
                                  className={`input-field ${errors[`fim_${usinaId}_${index}`] || errors[`horario_${usinaId}_${index}`] ? 'border-red-500' : ''}`}
                                />
                              </div>
                            </div>

                            {/* Observações */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Observações
                              </label>
                              <input
                                type="text"
                                value={atividade.observacoes}
                                onChange={(e) => updateAtividadeNaUsina(usinaId, index, 'observacoes', e.target.value)}
                                placeholder="Observações adicionais (opcional)"
                                className="input-field"
                              />
                            </div>

                            {/* Ações */}
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => duplicateAtividadeNaUsina(usinaId, index)}
                                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="Duplicar atividade"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeAtividadeDaUsina(usinaId, index)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remover atividade"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>


        {/* Grid para Observações e TCU */}
        <div className="responsive-grid mb-4">
          {/* 5. Observações Gerais */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Observações Gerais</h3>
            <textarea
              value={observacoesGerais}
              onChange={(e) => setObservacoesGerais(e.target.value)}
              placeholder="Observações gerais do dia..."
              className="input-field h-20 xl:h-32 resize-none"
            />
          </div>

          {/* TCU com falha movido para grid */}
          <div id="tcu-section" className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">TCU com falha</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Há TCU com falha?
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tcuFalha"
                      checked={!tcuComFalha.tem}
                      onChange={() => setTcuComFalha({ tem: false, falhas: [] })}
                      className="mr-2"
                    />
                    <span className="text-sm">Não</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tcuFalha"
                      checked={tcuComFalha.tem}
                      onChange={() => setTcuComFalha({ tem: true, falhas: tcuComFalha.falhas.length > 0 ? tcuComFalha.falhas : [{ usinaId: '', skid: '', tracker: '', tipoFalha: '', previsaoInspecao: '' }] })}
                      className="mr-2"
                    />
                    <span className="text-sm">Sim</span>
                  </label>
                </div>
              </div>

              {tcuComFalha.tem && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Falhas identificadas
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setTcuComFalha({
                          ...tcuComFalha,
                          falhas: [...tcuComFalha.falhas, { usinaId: '', skid: '', tracker: '', tipoFalha: '', previsaoInspecao: '' }]
                        });
                      }}
                      className="btn-primary text-xs py-1 px-3"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Adicionar
                    </button>
                  </div>

                  {tcuComFalha.falhas.map((falha, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="grid grid-cols-1 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Usina *
                          </label>
                          <select
                            value={falha.usinaId}
                            onChange={(e) => {
                              const newFalhas = [...tcuComFalha.falhas];
                              newFalhas[index].usinaId = e.target.value;
                              setTcuComFalha({ ...tcuComFalha, falhas: newFalhas });
                            }}
                            className="input-field text-sm"
                            disabled={!filters.clusterId}
                          >
                            <option value="">
                              {filters.clusterId ? 'Selecione a usina' : 'Primeiro selecione um cluster'}
                            </option>
                            {data.usinas
                              .filter(u => u.clusterId === filters.clusterId && u.ativo)
                              .map(usina => (
                                <option key={usina.id} value={usina.id}>
                                  {usina.nome}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Skid
                          </label>
                          <input
                            type="text"
                            value={falha.skid}
                            onChange={(e) => {
                              const newFalhas = [...tcuComFalha.falhas];
                              newFalhas[index].skid = e.target.value;
                              setTcuComFalha({ ...tcuComFalha, falhas: newFalhas });
                            }}
                            placeholder="Ex: Skid 01"
                            className="input-field text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Tracker
                          </label>
                          <input
                            type="text"
                            value={falha.tracker}
                            onChange={(e) => {
                              const newFalhas = [...tcuComFalha.falhas];
                              newFalhas[index].tracker = e.target.value;
                              setTcuComFalha({ ...tcuComFalha, falhas: newFalhas });
                            }}
                            placeholder="Ex: Tracker 15"
                            className="input-field text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Tipo de falha
                          </label>
                          <input
                            type="text"
                            value={falha.tipoFalha || ''}
                            onChange={(e) => {
                              const newFalhas = [...tcuComFalha.falhas];
                              newFalhas[index].tipoFalha = e.target.value;
                              setTcuComFalha({ ...tcuComFalha, falhas: newFalhas });
                            }}
                            placeholder="Ex: Falha no motor..."
                            className="input-field text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Previsão de inspeção
                          </label>
                          <input
                            type="date"
                            value={falha.previsaoInspecao || ''}
                            onChange={(e) => {
                              const newFalhas = [...tcuComFalha.falhas];
                              newFalhas[index].previsaoInspecao = e.target.value;
                              setTcuComFalha({ ...tcuComFalha, falhas: newFalhas });
                            }}
                            className="input-field text-sm"
                          />
                        </div>
                      </div>
                      
                      {tcuComFalha.falhas.length > 1 && (
                        <div className="flex justify-end mt-3">
                          <button
                            type="button"
                            onClick={() => {
                              const newFalhas = tcuComFalha.falhas.filter((_, i) => i !== index);
                              setTcuComFalha({ ...tcuComFalha, falhas: newFalhas });
                            }}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Remover
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 6. Resumo das Atividades no Cluster */}
        {filters.clusterId && filters.data && (
          <div className="xl:col-span-12">
            <div className="card mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Resumo das Atividades no Cluster
              </h3>
            
            {(() => {
              const atividadesCluster = getAtividadesDoCluster(filters.clusterId);
              const tcuCluster = tcuPorCluster[filters.clusterId];
              
              if (atividadesCluster.length === 0 && !tcuCluster) {
                return (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhuma atividade ou registro de TCU para este cluster na data selecionada
                  </p>
                );
              }

              // Agrupar por usina
              const atividadesPorUsina = {};
              atividadesCluster.forEach(atividade => {
                const usina = data.usinas.find(u => u.id === atividade.usinaId);
                const usinaName = usina?.nome || 'Usina Desconhecida';
                
                if (!atividadesPorUsina[usinaName]) {
                  atividadesPorUsina[usinaName] = [];
                }
                atividadesPorUsina[usinaName].push(atividade);
              });

              return (
                <div className="space-y-3">
                  {Object.keys(atividadesPorUsina).map(usinaName => {
                    // Consolidar atividades únicas (sem duplicatas por técnico)
                    const atividadesUnicas = [];
                    const atividadesVistas = new Set();
                    
                    atividadesPorUsina[usinaName].forEach(atividade => {
                      const chave = `${atividade.tarefa}-${atividade.inicio}-${atividade.fim}`;
                      if (!atividadesVistas.has(chave)) {
                        atividadesVistas.add(chave);
                        atividadesUnicas.push(atividade);
                      }
                    });
                    
                    return (
                      <div key={usinaName} className="border border-gray-200 rounded-lg p-3">
                        <h4 className="font-medium text-gray-800 mb-3">{usinaName}</h4>
                        <div className="space-y-1">
                          {atividadesUnicas
                            .sort((a, b) => a.inicio.localeCompare(b.inicio))
                            .map((atividade, index) => (
                              <div key={atividade.id || index} className="flex items-center justify-between bg-gray-50 rounded p-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-900 text-sm truncate flex-1">
                                      {atividade.tarefa}
                                    </span>
                                    <span className="text-xs text-red-600 whitespace-nowrap">
                                      ⏰ {atividade.inicio} - {atividade.fim}
                                    </span>
                                  </div>
                                  {atividade.observacoes && (
                                    <p className="text-xs text-gray-600 mt-1 truncate">
                                      💬 {atividade.observacoes}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => {
                                    // Carregar atividade para edição
                                    setFilters(prev => ({ 
                                      ...prev, 
                                      clusterId: atividade.clusterId,
                                      tecnicoIds: [atividade.tecnicoId]
                                    }));
                                    
                                    // Carregar atividade específica no formulário
                                    setAtividadesPorUsina({
                                      [atividade.usinaId]: [{
                                        id: atividade.id,
                                        tarefa: atividade.tarefa,
                                        inicio: atividade.inicio,
                                        fim: atividade.fim,
                                        observacoes: atividade.observacoes || ''
                                      }]
                                    });
                                    
                                    // Scroll para seção de atividades
                                    setTimeout(() => {
                                      const atividadesSection = document.getElementById('atividades-section');
                                      if (atividadesSection) {
                                        atividadesSection.scrollIntoView({ 
                                          behavior: 'smooth', 
                                          block: 'start' 
                                        });
                                      }
                                    }, 100);
                                  }}
                                  className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium py-1 px-3 rounded-lg ml-2 whitespace-nowrap transition-colors"
                                >
                                  Editar
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Seção de TCU com falha - Agrupada por usina */}
                  {tcuCluster && tcuCluster.tcuComFalha.tem && tcuCluster.tcuComFalha.falhas.length > 0 && (
                    <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                      <h4 className="font-medium text-red-800 mb-3 flex items-center">
                        ⚡ TCU com falha registradas
                      </h4>
                      <div className="space-y-3">
                        {/* Agrupar falhas por usina */}
                        {(() => {
                          const falhasPorUsina = {};
                          tcuCluster.tcuComFalha.falhas.forEach(falha => {
                            if (falha.usinaId) {
                              const usina = data.usinas.find(u => u.id === falha.usinaId);
                              const usinaName = usina?.nome || 'Usina Desconhecida';
                              if (!falhasPorUsina[usinaName]) {
                                falhasPorUsina[usinaName] = [];
                              }
                              falhasPorUsina[usinaName].push(falha);
                            }
                          });

                          return Object.keys(falhasPorUsina).map(usinaName => (
                            <div key={usinaName} className="bg-white rounded p-3 border border-red-200">
                              <h5 className="font-medium text-gray-900 mb-2">📍 {usinaName}</h5>
                              <div className="space-y-2">
                                {falhasPorUsina[usinaName].map((falha, index) => (
                                  <div key={index} className="bg-gray-50 rounded p-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                          <span className="text-sm font-medium text-gray-900">
                                            {falha.skid && `Skid: ${falha.skid}`}
                                            {falha.skid && falha.tracker && ' - '}
                                            {falha.tracker && `Tracker: ${falha.tracker}`}
                                          </span>
                                        </div>
                                        {falha.tipoFalha && (
                                          <p className="text-xs text-red-700 mt-1">
                                            🔧 {falha.tipoFalha}
                                          </p>
                                        )}
                                        {falha.previsaoInspecao && (
                                          <p className="text-xs text-blue-700 mt-1">
                                            📅 {falha.previsaoInspecao.split('-').reverse().join('/')}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ));
                        })()}
                        
                        {/* Botão de edição */}
                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              // Carregar dados de TCU para edição
                              setTcuComFalha(tcuCluster.tcuComFalha);
                              
                              // Scroll para seção de TCU
                              setTimeout(() => {
                                const tcuSection = document.getElementById('tcu-section');
                                if (tcuSection) {
                                  tcuSection.scrollIntoView({ 
                                    behavior: 'smooth', 
                                    block: 'start' 
                                  });
                                }
                              }, 100);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-1 px-3 rounded-lg transition-colors"
                          >
                            Editar TCUs
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            </div>
          </div>
        )}

        {/* Ações - Largura Completa */}
        <div className="xl:col-span-12">
          <div className="space-y-3">
            {/* Botão WhatsApp Cluster Atual */}
            <button
              onClick={generateWhatsApp}
              disabled={!filtersComplete || Object.keys(atividadesPorUsina).length === 0}
              className="btn-primary w-full flex items-center justify-center"
            >
              <Copy className="w-5 h-5 mr-2" />
              Gerar WhatsApp (Cluster Atual)
            </button>
            
            {/* Botão WhatsApp Consolidado - só aparece quando todos clusters preenchidos */}
            {filters.data && todosClustersPreenchidos() && (
              <button
                onClick={generateConsolidatedWhatsApp}
                className="w-full flex items-center justify-center py-3 px-6 rounded-lg font-medium transition-colors duration-200 bg-green-600 hover:bg-green-700 text-white"
              >
                <Copy className="w-5 h-5 mr-2" />
                🎉 Gerar WhatsApp Consolidado (Todos os Clusters)
              </button>
            )}
            
            {/* Indicador de progresso para consolidado */}
            {filters.data && !todosClustersPreenchidos() && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                  <div>
                    <p className="text-yellow-800 font-medium text-sm">
                      Relatório Consolidado Disponível em Breve
                    </p>
                    <p className="text-yellow-700 text-xs mt-1">
                      Preencha todos os clusters para gerar relatório consolidado
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={saveReport}
              disabled={!filtersComplete || Object.keys(atividadesPorUsina).length === 0}
              className="btn-secondary w-full"
            >
              Salvar Relatório
            </button>
            
            <div className="text-center text-xs text-gray-500 mt-4">
              Após salvar, o formulário será limpo para preenchimento de mais relatórios
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default DailyReportScreen;
