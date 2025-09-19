import React, { useState } from 'react';
import { Plus, Copy, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { generateDailyReportWhatsApp } from '../utils/whatsappGenerator';

const QuickModeAtividades = ({ filters }) => {
  const { data, addAtividade } = useData();
  
  const [atividadesPorUsina, setAtividadesPorUsina] = useState({});
  const [tcuComFalha, setTcuComFalha] = useState({ 
    tem: false, 
    falhas: []
  });
  const [observacoesGerais, setObservacoesGerais] = useState('');
  const [usinaSelecionada, setUsinaSelecionada] = useState('');
  const [errors, setErrors] = useState({});
  const [overlaps, setOverlaps] = useState([]);

  // Verificar se os filtros estão completos
  const filtersComplete = filters.data && filters.clusterId && filters.tecnicoIds && filters.tecnicoIds.length > 0;

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
  };

  // Remover atividade de uma usina
  const removeAtividadeDaUsina = (usinaId, index) => {
    setAtividadesPorUsina(prev => {
      const updated = (prev[usinaId] || []).filter((_, i) => i !== index);
      
      if (updated.length === 0) {
        const newState = { ...prev };
        delete newState[usinaId];
        return newState;
      }
      
      return {
        ...prev,
        [usinaId]: updated
      };
    });
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
  };

  // Remover usina completa
  const removeUsina = (usinaId) => {
    setAtividadesPorUsina(prev => {
      const newState = { ...prev };
      delete newState[usinaId];
      return newState;
    });
  };

  // Validar formulário
  const validateForm = () => {
    const newErrors = {};
    
    if (!filtersComplete) {
      newErrors.filters = 'Preencha todos os filtros obrigatórios';
    }

    if (Object.keys(atividadesPorUsina).length === 0) {
      newErrors.atividades = 'Adicione pelo menos uma usina com atividades';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Salvar relatório
  const saveReport = async () => {
    if (!validateForm()) return;

    try {
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

      alert('Relatório de atividades salvo com sucesso!');
      
      // Limpar dados para próximo preenchimento
      setAtividadesPorUsina({});
      setTcuComFalha({ tem: false, falhas: [] });
      setObservacoesGerais('');
      
    } catch (error) {
      alert('Erro ao salvar relatório. Tente novamente.');
      console.error('Erro ao salvar:', error);
    }
  };

  // Gerar WhatsApp
  const generateWhatsApp = () => {
    if (!validateForm()) return;

    const cluster = data.clusters.find(c => c.id === filters.clusterId);
    const tecnicosNomes = filters.tecnicoIds
      .map(id => data.tecnicos.find(t => t.id === id)?.nome)
      .filter(nome => nome)
      .join(', ');

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

    navigator.clipboard.writeText(message).then(() => {
      alert('Mensagem copiada para a área de transferência!');
    }).catch(() => {
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
    <div className="space-y-4">
      {/* Erro de filtros */}
      {errors.filters && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{errors.filters}</p>
        </div>
      )}

      {/* Aviso de sobreposições */}
      {overlaps.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
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
      )}

      {/* Atividades Programadas */}
      <div className="card">
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
                              className="input-field"
                            />
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
                                className="input-field"
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
                                className="input-field"
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

      {/* TCU com falha */}
      <div className="card">
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
                  onChange={() => setTcuComFalha({ tem: true, falhas: tcuComFalha.falhas.length > 0 ? tcuComFalha.falhas : [{ skid: '', tracker: '', tipoFalha: '', previsaoInspecao: '' }] })}
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
                      falhas: [...tcuComFalha.falhas, { skid: '', tracker: '', tipoFalha: '', previsaoInspecao: '' }]
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
                        placeholder="Ex: Falha no motor, problema elétrico..."
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

      {/* Observações Gerais */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Observações Gerais</h3>
        <textarea
          value={observacoesGerais}
          onChange={(e) => setObservacoesGerais(e.target.value)}
          placeholder="Observações gerais do dia..."
          className="input-field h-20 resize-none"
        />
      </div>

      {/* Ações */}
      <div className="space-y-3">
        <button
          onClick={generateWhatsApp}
          disabled={!filtersComplete || Object.keys(atividadesPorUsina).length === 0}
          className="btn-primary w-full flex items-center justify-center"
        >
          <Copy className="w-5 h-5 mr-2" />
          Gerar WhatsApp - Relatório Diário
        </button>
        
        <button
          onClick={saveReport}
          disabled={!filtersComplete || Object.keys(atividadesPorUsina).length === 0}
          className="btn-secondary w-full"
        >
          Salvar Relatório de Atividades
        </button>
      </div>
    </div>
  );
};

export default QuickModeAtividades;
