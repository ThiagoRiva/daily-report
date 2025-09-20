import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Zap, Database, Settings, Copy, Printer } from 'lucide-react';
import { useData } from '../context/DataContext';
import SharedFilters from './SharedFilters';
import SubsystemCard from './SubsystemCard';
// import { format } from 'date-fns'; // Removido para evitar problemas de fuso horário
import { 
  generateTechnicalStatusWhatsApp, 
  generateConsolidatedTechnicalStatusWhatsApp 
} from '../utils/whatsappGenerator';

const TechnicalStatusScreen = ({ onBack, quickMode = false }) => {
  const { data, addStatusTecnico, updateStatusTecnico } = useData();
  
  const [filters, setFilters] = useState({
    data: new Date().toISOString().split('T')[0],
    clusterId: '',
    usinaId: '',
    tecnicoIds: [] // Múltiplos técnicos
  });

  const [statusData, setStatusData] = useState({
    inversores: { ok100: true, motivo: '', acaoPrevista: '' },
    strings: { ok100: true, motivo: '', acaoPrevista: '' },
    trackers: { ok100: true, motivo: '', acaoPrevista: '' },
    observacoesGerais: ''
  });

  const [errors, setErrors] = useState({});

  // Verificar se os filtros estão completos
  const filtersComplete = filters.data && filters.clusterId && filters.usinaId && filters.tecnicoIds && filters.tecnicoIds.length > 0;

  // Verificar se todas as usinas do cluster foram preenchidas
  const getUsinasDoCluster = () => {
    if (!filters.clusterId) return [];
    return data.usinas.filter(u => u.clusterId === filters.clusterId && u.ativo);
  };

  const getStatusPreenchidos = () => {
    if (!filters.clusterId || !filters.data) return [];
    const usinasCluster = getUsinasDoCluster();
    
    // Agrupar por usina para evitar duplicatas (múltiplos técnicos na mesma usina)
    const statusPorUsina = new Map();
    
    data.statusTecnico.forEach(status => {
      if (status.data === filters.data && usinasCluster.some(u => u.id === status.usinaId)) {
        statusPorUsina.set(status.usinaId, status);
      }
    });
    
    return Array.from(statusPorUsina.values());
  };

  const todasUsinasPreenchidas = () => {
    const usinasCluster = getUsinasDoCluster();
    const statusPreenchidos = getStatusPreenchidos();
    return usinasCluster.length > 0 && usinasCluster.length === statusPreenchidos.length;
  };

  // Verificar se já existe status para a usina na data selecionada
  const jaExisteStatusParaUsina = () => {
    if (!filters.usinaId || !filters.data) return false;
    return data.statusTecnico.some(status => 
      status.data === filters.data && status.usinaId === filters.usinaId
    );
  };

  // Buscar status existente para edição
  const statusExistente = data.statusTecnico.find(status => 
    status.data === filters.data && status.usinaId === filters.usinaId
  );

  // Carregar dados existentes quando usina for selecionada
  useEffect(() => {
    if (statusExistente) {
      setStatusData({
        inversores: statusExistente.inversores || { ok100: true, motivo: '', acaoPrevista: '' },
        strings: statusExistente.strings || { ok100: true, motivo: '', acaoPrevista: '' },
        trackers: statusExistente.trackers || { ok100: true, motivo: '', acaoPrevista: '' },
        observacoesGerais: statusExistente.observacoesGerais || ''
      });
    } else {
      // Limpar dados se não houver status existente
      setStatusData({
        inversores: { ok100: true, motivo: '', acaoPrevista: '' },
        strings: { ok100: true, motivo: '', acaoPrevista: '' },
        trackers: { ok100: true, motivo: '', acaoPrevista: '' },
        observacoesGerais: ''
      });
    }
  }, [filters.usinaId, filters.data, statusExistente]);

  // Atualizar status de um subsistema (usando useCallback para evitar re-renderização)
  const updateSubsystemStatus = useCallback((subsystem, field, value) => {
    setStatusData(prev => {
      const newData = {
        ...prev,
        [subsystem]: {
          ...prev[subsystem],
          [field]: value
        }
      };
      return newData;
    });
  }, []);

  // Validar formulário
  const validateForm = () => {
    const newErrors = {};
    
    if (!filtersComplete) {
      newErrors.filters = 'Preencha todos os filtros obrigatórios';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Salvar status técnico
  const saveStatus = async () => {
    if (!validateForm()) return;

    try {
      // Se já existe status para esta usina na data, atualizar
      if (statusExistente) {
        const statusAtualizado = {
          ...statusExistente,
          inversores: statusData.inversores,
          strings: statusData.strings,
          trackers: statusData.trackers,
          observacoesGerais: statusData.observacoesGerais
        };
        
        await updateStatusTecnico(statusAtualizado);
        alert('Status de equipamentos atualizado com sucesso!');
      } else {
        // Salvar apenas um status por usina com todos os técnicos separados por vírgula
        const tecnicosNomes = filters.tecnicoIds
          .map(id => data.tecnicos.find(t => t.id === id)?.nome)
          .filter(nome => nome)
          .join(', ');
        
        const statusToSave = {
          data: filters.data,
          clusterId: filters.clusterId,
          usinaId: filters.usinaId,
          tecnicoId: filters.tecnicoIds[0], // ID do primeiro técnico para compatibilidade
          tecnicosNomes: tecnicosNomes, // Nomes de todos os técnicos separados por vírgula
          ...statusData
        };

        await addStatusTecnico(statusToSave);
        alert('Status de equipamentos salvo com sucesso!');
      }
      
      // Limpar dados do formulário e campo usina para próximo preenchimento
      setStatusData({
        inversores: { ok100: true, motivo: '', acaoPrevista: '' },
        strings: { ok100: true, motivo: '', acaoPrevista: '' },
        trackers: { ok100: true, motivo: '', acaoPrevista: '' },
        observacoesGerais: ''
      });
      
      // Limpar seleção da usina para agilizar próximo preenchimento
      setFilters(prev => ({ ...prev, usinaId: '' }));
      
    } catch (error) {
      alert('Erro ao salvar status de equipamentos. Tente novamente.');
      console.error('Erro ao salvar:', error);
    }
  };

  // Gerar PDF do relatório
  const generatePDF = () => {
    if (!filters.clusterId || !filters.data) {
      alert('Selecione um cluster e uma data para gerar o PDF');
      return;
    }

    if (!todasUsinasPreenchidas()) {
      const usinasCluster = getUsinasDoCluster();
      const statusPreenchidos = getStatusPreenchidos();
      const faltantes = usinasCluster.length - statusPreenchidos.length;
      
      alert(`Não é possível gerar o PDF. Você precisa concluir o preenchimento de todas as usinas do cluster.\n\nFaltam ${faltantes} usina(s) para serem preenchidas.`);
      return;
    }

    const cluster = data.clusters.find(c => c.id === filters.clusterId);
    const statusDoCluster = getStatusPreenchidos();

    const printWindow = window.open('', '_blank');
    
    const pdfContent = generatePDFContentCompleto(cluster?.nome, statusDoCluster);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório Status de Equipamentos - ${cluster?.nome}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
              line-height: 1.4;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
            }
            .header h1 {
              font-size: 18px;
              margin: 5px 0;
            }
            .usina-section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .usina-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 15px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 5px;
            }
            .equipment-item {
              margin-bottom: 15px;
              padding-left: 20px;
            }
            .equipment-name {
              font-weight: bold;
              margin-bottom: 5px;
            }
            .equipment-detail {
              margin-left: 10px;
              font-size: 14px;
            }
            .status-ok {
              color: #059669;
            }
            .status-problem {
              color: #dc2626;
            }
            @media print {
              body { margin: 15px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${pdfContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Gerar conteúdo do PDF completo com todas as usinas
  const generatePDFContentCompleto = (clusterName, statusDoCluster) => {
    const dataFormatada = filters.data.split('-').reverse().join('/');
    
    let content = `
      <div class="header">
        <h1>Relatório Diário - CLUSTER ${clusterName?.toUpperCase()} - ${dataFormatada}</h1>
      </div>
    `;
    
    // Agrupar por usina (usar Map para evitar duplicatas)
    const statusPorUsina = new Map();
    statusDoCluster.forEach(status => {
      const usina = data.usinas.find(u => u.id === status.usinaId);
      if (usina && !statusPorUsina.has(status.usinaId)) {
        statusPorUsina.set(status.usinaId, { ...status, usinaName: usina.nome });
      }
    });
    
    // Gerar seção para cada usina (ordenar por nome)
    Array.from(statusPorUsina.values())
      .sort((a, b) => a.usinaName.localeCompare(b.usinaName))
      .forEach(status => {
        content += `
          <div class="usina-section">
            <div class="usina-title">UFV ${status.usinaName}</div>
            
            <div class="equipment-item">
              <div class="equipment-name">• Inversores:</div>
              <div class="equipment-detail ${status.inversores.ok100 ? 'status-ok' : 'status-problem'}">
                ${status.inversores.ok100 
                  ? 'Todos os inversores estão operando normalmente, sem alarmes, e performaram 100% de sua capacidade e 100% de disponibilidade.'
                  : `${status.inversores.motivo}${status.inversores.acaoPrevista ? '. ' + status.inversores.acaoPrevista : ''}`
                }
              </div>
            </div>
            
            <div class="equipment-item">
              <div class="equipment-name">• Strings:</div>
              <div class="equipment-detail ${status.strings.ok100 ? 'status-ok' : 'status-problem'}">
                ${status.strings.ok100 
                  ? 'Todas as strings estão 100% e sem inconformidades.'
                  : `${status.strings.motivo}${status.strings.acaoPrevista ? '. ' + status.strings.acaoPrevista : ''}`
                }
              </div>
            </div>
            
            <div class="equipment-item">
              <div class="equipment-name">• Trackers:</div>
              <div class="equipment-detail ${status.trackers.ok100 ? 'status-ok' : 'status-problem'}">
                ${status.trackers.ok100 
                  ? 'Todos os trackers estão com 100% de disponibilidade.'
                  : `${status.trackers.motivo}${status.trackers.acaoPrevista ? '. ' + status.trackers.acaoPrevista : ''}`
                }
              </div>
            </div>
            
            ${status.observacoesGerais ? `
              <div class="equipment-item">
                <div class="equipment-name">• Observações:</div>
                <div class="equipment-detail">${status.observacoesGerais}</div>
              </div>
            ` : ''}
          </div>
        `;
      });
    
    return content;
  };

  // Copiar para área de transferência
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
            <h1 className="text-xl font-bold text-gray-900">
              Relatório de Status de Equipamentos
            </h1>
            {quickMode && (
              <p className="text-sm text-blue-600">Modo Rápido Ativado</p>
            )}
          </div>
        </div>

        {/* Filtros */}
        <SharedFilters
          filters={filters}
          onFiltersChange={setFilters}
          clusters={data.clusters}
          usinas={data.usinas}
          tecnicos={data.tecnicos}
          funcoes={data.funcoes}
          showFuncao={false}
          allowMultipleTecnicos={true}
        />

        {/* Erro de filtros */}
        {errors.filters && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{errors.filters}</p>
          </div>
        )}

        {/* Cards de Subsistemas */}
        <div className="responsive-grid-3 mb-6">
          <SubsystemCard
            title="Inversores"
            icon={<Zap className="w-4 h-4" />}
            subsystem="inversores"
            data={statusData.inversores}
            onUpdate={updateSubsystemStatus}
          />
          
          <SubsystemCard
            title="Strings"
            icon={<Database className="w-4 h-4" />}
            subsystem="strings"
            data={statusData.strings}
            onUpdate={updateSubsystemStatus}
          />
          
          <SubsystemCard
            title="Trackers"
            icon={<Settings className="w-4 h-4" />}
            subsystem="trackers"
            data={statusData.trackers}
            onUpdate={updateSubsystemStatus}
          />
        </div>

        {/* Observações Gerais */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Observações Gerais</h3>
          <textarea
            value={statusData.observacoesGerais}
            onChange={(e) => setStatusData(prev => ({ ...prev, observacoesGerais: e.target.value }))}
            placeholder="Observações gerais do status técnico..."
            className="input-field h-20 resize-none"
          />
        </div>

        {/* Visão Consolidada */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Visão por Cluster</h3>
          <p className="text-sm text-gray-600 mb-4">
            Visualize o status de todas as usinas do cluster selecionado na data escolhida.
          </p>
          
          {filters.clusterId && filters.data ? (
            <div className="space-y-2">
              {getUsinasDoCluster().map(usina => {
                const statusUsina = data.statusTecnico.find(s => 
                  s.usinaId === usina.id && s.data === filters.data
                );
                
                const hasStatus = !!statusUsina;
                const allOk = statusUsina ? 
                  statusUsina.inversores.ok100 && 
                  statusUsina.strings.ok100 && 
                  statusUsina.trackers.ok100 : false;
                
                return (
                  <div 
                    key={usina.id} 
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
                      filters.usinaId === usina.id ? 'bg-primary-50 border-2 border-primary-200' : 'bg-gray-50'
                    }`}
                    onClick={() => {
                      setFilters(prev => ({ ...prev, usinaId: usina.id }));
                    }}
                  >
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                        hasStatus ? (allOk ? 'bg-green-100' : 'bg-yellow-100') : 'bg-gray-100'
                      }`}>
                        {hasStatus ? (allOk ? '✅' : '⚠️') : '⭕'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{usina.nome}</p>
                        {hasStatus && (
                          <p className="text-xs text-gray-500">
                            {allOk ? 'Todos os sistemas OK' : 'Alguns sistemas com problemas'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`text-sm px-2 py-1 rounded ${
                      hasStatus ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {hasStatus ? 'Preenchido' : 'Pendente'}
                    </div>
                  </div>
                );
              })}
              
              {/* Resumo do progresso */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    Progresso: {getStatusPreenchidos().length} de {getUsinasDoCluster().length} usinas
                  </span>
                  <div className="w-32 bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${getUsinasDoCluster().length > 0 ? (getStatusPreenchidos().length / getUsinasDoCluster().length) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Selecione um cluster e data para visualizar o status consolidado
            </p>
          )}
        </div>

        {/* Ações */}
        <div className="space-y-3">
          <button
            onClick={generatePDF}
            disabled={!filters.clusterId || !filters.data || !todasUsinasPreenchidas()}
            className={`w-full flex items-center justify-center py-3 px-6 rounded-lg font-medium transition-colors duration-200 ${
              filters.clusterId && filters.data && todasUsinasPreenchidas()
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Printer className="w-5 h-5 mr-2" />
            Gerar PDF
            {filters.clusterId && filters.data && !todasUsinasPreenchidas() && (
              <span className="ml-2 text-xs">
                ({getUsinasDoCluster().length - getStatusPreenchidos().length} pendentes)
              </span>
            )}
          </button>
          
          <button
            onClick={saveStatus}
            disabled={!filtersComplete}
            className="btn-secondary w-full"
          >
            {statusExistente ? 'Atualizar' : 'Salvar'} Status de Equipamentos
          </button>
          
          <div className="text-center text-xs text-gray-500 mt-4">
            {statusExistente 
              ? 'Você está editando um registro existente'
              : 'Após salvar, o formulário será limpo para preenchimento de mais relatórios'
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicalStatusScreen;
