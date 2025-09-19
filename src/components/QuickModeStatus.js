import React, { useState, useCallback } from 'react';
import { Zap, Database, Settings, Printer } from 'lucide-react';
import { useData } from '../context/DataContext';
import SubsystemCard from './SubsystemCard';
import { format } from 'date-fns';

const QuickModeStatus = ({ filters }) => {
  const { data, addStatusTecnico } = useData();
  
  const [statusData, setStatusData] = useState({
    inversores: { ok100: true, motivo: '', acaoPrevista: '' },
    strings: { ok100: true, motivo: '', acaoPrevista: '' },
    trackers: { ok100: true, motivo: '', acaoPrevista: '' },
    observacoesGerais: ''
  });

  const [errors, setErrors] = useState({});
  const [usinaSelecionada, setUsinaSelecionada] = useState('');

  // Verificar se os filtros estão completos
  const filtersComplete = filters.data && filters.clusterId && filters.tecnicoIds && filters.tecnicoIds.length > 0 && usinaSelecionada;

  // Atualizar status de um subsistema
  const updateSubsystemStatus = useCallback((subsystem, field, value) => {
    setStatusData(prev => ({
      ...prev,
      [subsystem]: {
        ...prev[subsystem],
        [field]: value
      }
    }));
  }, []);

  // Validar formulário
  const validateForm = () => {
    const newErrors = {};
    
    if (!filters.data || !filters.clusterId || !filters.tecnicoIds || filters.tecnicoIds.length === 0) {
      newErrors.filters = 'Preencha todos os filtros obrigatórios';
    }

    if (!usinaSelecionada) {
      newErrors.usina = 'Selecione uma usina';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Salvar status técnico
  const saveStatus = async () => {
    if (!validateForm()) return;

    try {
      // Salvar para cada técnico selecionado
      for (const tecnicoId of filters.tecnicoIds) {
        const statusToSave = {
          data: filters.data,
          clusterId: filters.clusterId,
          usinaId: usinaSelecionada,
          tecnicoId: tecnicoId,
          ...statusData
        };

        await addStatusTecnico(statusToSave);
      }

      alert('Status de equipamentos salvo com sucesso!');
      
      // Limpar dados do formulário
      setStatusData({
        inversores: { ok100: true, motivo: '', acaoPrevista: '' },
        strings: { ok100: true, motivo: '', acaoPrevista: '' },
        trackers: { ok100: true, motivo: '', acaoPrevista: '' },
        observacoesGerais: ''
      });
      
      // Limpar seleção da usina
      setUsinaSelecionada('');
      
    } catch (error) {
      alert('Erro ao salvar status de equipamentos. Tente novamente.');
      console.error('Erro ao salvar:', error);
    }
  };

  // Gerar PDF
  const generatePDF = () => {
    if (!validateForm()) return;

    const cluster = data.clusters.find(c => c.id === filters.clusterId);
    const usina = data.usinas.find(u => u.id === usinaSelecionada);

    const printWindow = window.open('', '_blank');
    
    const pdfContent = `
      <div style="font-family: Arial, sans-serif; margin: 20px; color: #333; line-height: 1.4;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px;">
          <h1 style="font-size: 18px; margin: 5px 0;">
            Relatório Diário - CLUSTER ${cluster?.nome?.toUpperCase()} - ${format(new Date(filters.data), 'dd/MM')}
          </h1>
        </div>
        
        <div style="margin-bottom: 30px;">
          <div style="font-size: 16px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">
            UFV ${usina?.nome}
          </div>
          
          <div style="margin-bottom: 15px;">
            <div style="font-weight: bold; margin-bottom: 5px;">• Inversores:</div>
            <div style="margin-left: 15px; color: ${statusData.inversores.ok100 ? '#059669' : '#dc2626'};">
              ${statusData.inversores.ok100 
                ? 'Todos os inversores estão operando normalmente, sem alarmes, e performaram 100% de sua capacidade e 100% de disponibilidade.'
                : `${statusData.inversores.motivo}${statusData.inversores.acaoPrevista ? '. ' + statusData.inversores.acaoPrevista : ''}`
              }
            </div>
          </div>
          
          <div style="margin-bottom: 15px;">
            <div style="font-weight: bold; margin-bottom: 5px;">• Strings:</div>
            <div style="margin-left: 15px; color: ${statusData.strings.ok100 ? '#059669' : '#dc2626'};">
              ${statusData.strings.ok100 
                ? 'Todas as strings estão 100% e sem inconformidades.'
                : `${statusData.strings.motivo}${statusData.strings.acaoPrevista ? '. ' + statusData.strings.acaoPrevista : ''}`
              }
            </div>
          </div>
          
          <div style="margin-bottom: 15px;">
            <div style="font-weight: bold; margin-bottom: 5px;">• Trackers:</div>
            <div style="margin-left: 15px; color: ${statusData.trackers.ok100 ? '#059669' : '#dc2626'};">
              ${statusData.trackers.ok100 
                ? 'Todos os trackers estão com 100% de disponibilidade.'
                : `${statusData.trackers.motivo}${statusData.trackers.acaoPrevista ? '. ' + statusData.trackers.acaoPrevista : ''}`
              }
            </div>
          </div>
          
          ${statusData.observacoesGerais ? `
            <div style="margin-bottom: 15px;">
              <div style="font-weight: bold; margin-bottom: 5px;">• Observações:</div>
              <div style="margin-left: 15px;">${statusData.observacoesGerais}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Status de Equipamentos - ${cluster?.nome}</title>
          <style>
            @media print {
              body { margin: 15px; }
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

  return (
    <div className="space-y-4">
      {/* Erro de filtros */}
      {errors.filters && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{errors.filters}</p>
        </div>
      )}

      {/* Seleção de Usina */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Selecionar Usina</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Usina para Status de Equipamentos
          </label>
          <select
            value={usinaSelecionada}
            onChange={(e) => setUsinaSelecionada(e.target.value)}
            className="select-field"
            disabled={!filters.clusterId}
          >
            <option value="">
              {filters.clusterId ? 'Selecione uma usina' : 'Primeiro selecione um cluster'}
            </option>
            {data.usinas
              .filter(u => u.clusterId === filters.clusterId && u.ativo)
              .map(usina => (
                <option key={usina.id} value={usina.id}>
                  {usina.nome}
                </option>
              ))}
          </select>
          
          {errors.usina && (
            <p className="text-red-500 text-xs mt-1">{errors.usina}</p>
          )}
        </div>
      </div>

      {/* Cards de Subsistemas */}
      <div className="space-y-4">
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
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Observações Gerais</h3>
        <textarea
          value={statusData.observacoesGerais}
          onChange={(e) => setStatusData(prev => ({ ...prev, observacoesGerais: e.target.value }))}
          placeholder="Observações gerais do status de equipamentos..."
          className="input-field h-20 resize-none"
        />
      </div>

      {/* Ações */}
      <div className="space-y-3">
        <button
          onClick={generatePDF}
          disabled={!filtersComplete}
          className="btn-primary w-full flex items-center justify-center"
        >
          <Printer className="w-5 h-5 mr-2" />
          Gerar PDF
        </button>
        
        <button
          onClick={saveStatus}
          disabled={!filtersComplete}
          className="btn-secondary w-full"
        >
          Salvar Status de Equipamentos
        </button>
      </div>
    </div>
  );
};

export default QuickModeStatus;
