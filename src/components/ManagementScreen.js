import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  User, 
  Filter, 
  Download, 
  Printer, 
  Copy,
  BarChart3,
  Trash2
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { 
  generateConsolidatedTechnicalStatusWhatsApp
} from '../utils/whatsappGenerator';
// import { format } from 'date-fns'; // Removido para evitar problemas de fuso horário
import ConfirmationModal from './ConfirmationModal';

const ManagementScreen = ({ onBack }) => {
  const { data, deleteAtividade, deleteStatusTecnico } = useData();
  
  const [filters, setFilters] = useState({
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: '',
    clusterId: '',
    usinaId: '',
    tecnicoId: ''
  });

  const [viewMode, setViewMode] = useState('table'); // 'table' ou 'grouped'
  const [activeTab, setActiveTab] = useState('atividades'); // 'atividades' ou 'status'
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: '',
    item: null,
    title: '',
    message: ''
  });

  // Filtrar dados baseado nos filtros
  const filteredData = useMemo(() => {
    let filtered = activeTab === 'atividades' ? data.atividades : data.statusTecnico;

    if (filters.dataInicio) {
      filtered = filtered.filter(item => item.data >= filters.dataInicio);
    }
    if (filters.dataFim) {
      filtered = filtered.filter(item => item.data <= filters.dataFim);
    }
    if (filters.clusterId) {
      filtered = filtered.filter(item => item.clusterId === filters.clusterId);
    }
    if (filters.usinaId) {
      filtered = filtered.filter(item => item.usinaId === filters.usinaId);
    }
    if (filters.tecnicoId) {
      filtered = filtered.filter(item => item.tecnicoId === filters.tecnicoId);
    }

    return filtered;
  }, [data, filters, activeTab]);

  // Agrupar dados por cluster
  const groupedData = useMemo(() => {
    const grouped = {};
    
    filteredData.forEach(item => {
      const cluster = data.clusters.find(c => c.id === item.clusterId);
      const usina = data.usinas.find(u => u.id === item.usinaId);
      const tecnico = data.tecnicos.find(t => t.id === item.tecnicoId);
      
      const clusterName = cluster?.nome || 'Cluster Desconhecido';
      
      if (!grouped[clusterName]) {
        grouped[clusterName] = {};
      }
      
      const usinaName = usina?.nome || 'Usina Desconhecida';
      
      if (!grouped[clusterName][usinaName]) {
        grouped[clusterName][usinaName] = [];
      }
      
      grouped[clusterName][usinaName].push({
        ...item,
        clusterName,
        usinaName,
        tecnicoName: tecnico?.nome || 'Técnico Desconhecido'
      });
    });
    
    return grouped;
  }, [filteredData, data]);

  // Exportar CSV
  const exportCSV = () => {
    if (filteredData.length === 0) {
      alert('Nenhum dado para exportar');
      return;
    }

    let csvContent = '';
    
    if (activeTab === 'atividades') {
      csvContent = 'Data,Cluster,Usina,Técnico,Tarefa,Início,Fim,Observações\n';
      filteredData.forEach(item => {
        const cluster = data.clusters.find(c => c.id === item.clusterId)?.nome || '';
        const usina = data.usinas.find(u => u.id === item.usinaId)?.nome || '';
        const tecnico = data.tecnicos.find(t => t.id === item.tecnicoId)?.nome || '';
        
        csvContent += `${item.data},${cluster},${usina},${tecnico},"${item.tarefa}",${item.inicio},${item.fim},"${item.observacoes || ''}"\n`;
      });
    } else {
      csvContent = 'Data,Cluster,Usina,Técnico,Inversores,Strings,Trackers,Observações\n';
      filteredData.forEach(item => {
        const cluster = data.clusters.find(c => c.id === item.clusterId)?.nome || '';
        const usina = data.usinas.find(u => u.id === item.usinaId)?.nome || '';
        const tecnico = data.tecnicos.find(t => t.id === item.tecnicoId)?.nome || '';
        
        const inversoresStatus = item.inversores?.ok100 ? '100%' : `Problema: ${item.inversores?.motivo}`;
        const stringsStatus = item.strings?.ok100 ? '100%' : `Problema: ${item.strings?.motivo}`;
        const trackersStatus = item.trackers?.ok100 ? '100%' : `Problema: ${item.trackers?.motivo}`;
        
        csvContent += `${item.data},${cluster},${usina},${tecnico},"${inversoresStatus}","${stringsStatus}","${trackersStatus}","${item.observacoesGerais || ''}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Gerar WhatsApp consolidado
  const generateConsolidatedWhatsApp = (clusterName) => {
    const clusterData = Object.values(groupedData[clusterName] || {}).flat();
    
    if (clusterData.length === 0) return;

    if (activeTab === 'atividades') {
      // Para atividades, gerar um resumo por técnico
      const resumoPorTecnico = {};
      clusterData.forEach(item => {
        if (!resumoPorTecnico[item.tecnicoName]) {
          resumoPorTecnico[item.tecnicoName] = [];
        }
        resumoPorTecnico[item.tecnicoName].push(item);
      });

      let message = `📋 *Resumo de Atividades - ${clusterName}*\n`;
      message += `📅 Período: ${filters.dataInicio || 'Início'} até ${filters.dataFim || 'Hoje'}\n\n`;

      Object.keys(resumoPorTecnico).forEach(tecnicoName => {
        message += `👷 *${tecnicoName}*\n`;
        resumoPorTecnico[tecnicoName].forEach(item => {
          message += `📍 ${item.usinaName} - ${item.data.split('-').reverse().join('/').substring(0, 5)}: ${item.tarefa}\n`;
        });
        message += '\n';
      });

      copyToClipboard(message);
    } else {
      // Para status técnico, usar o gerador existente
      const dataReferencia = clusterData[0]?.data || new Date().toISOString().split('T')[0];
      
      const message = generateConsolidatedTechnicalStatusWhatsApp(
        clusterData,
        clusterName,
        dataReferencia
      );
      
      copyToClipboard(message);
    }
  };

  // Copiar para área de transferência
  const copyToClipboard = (message) => {
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

  // Função de impressão formatada
  const printReport = () => {
    const printWindow = window.open('', '_blank');
    
    // Gerar conteúdo HTML para impressão
    const reportContent = generatePrintableReport();
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório - Sistema de Relatórios Diários</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 20px;
            }
            .filters { 
              background: #f8fafc; 
              padding: 15px; 
              margin-bottom: 20px; 
              border-radius: 8px;
            }
            .record { 
              border: 1px solid #e5e7eb; 
              margin-bottom: 15px; 
              padding: 15px; 
              border-radius: 8px;
              page-break-inside: avoid;
            }
            .record-header { 
              font-weight: bold; 
              color: #1f2937; 
              margin-bottom: 10px;
              font-size: 16px;
            }
            .record-meta { 
              color: #6b7280; 
              font-size: 12px; 
              margin-bottom: 10px;
            }
            .record-content { 
              font-size: 14px; 
              line-height: 1.5;
            }
            .status-badge { 
              display: inline-block; 
              padding: 2px 8px; 
              border-radius: 12px; 
              font-size: 11px; 
              font-weight: bold;
            }
            .status-ok { 
              background: #d1fae5; 
              color: #065f46; 
            }
            .status-problem { 
              background: #fecaca; 
              color: #991b1b; 
            }
            .footer { 
              margin-top: 30px; 
              text-align: center; 
              color: #6b7280; 
              font-size: 12px;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${reportContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Aguardar carregamento e imprimir
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Gerar conteúdo HTML para impressão
  const generatePrintableReport = () => {
    const now = new Date().toLocaleString('pt-BR');
    
    // Informações dos filtros
    const filterInfo = [
      filters.dataInicio && `Data início: ${filters.dataInicio.split('-').reverse().join('/')}`,
      filters.dataFim && `Data fim: ${filters.dataFim.split('-').reverse().join('/')}`,
      filters.clusterId && `Cluster: ${data.clusters.find(c => c.id === filters.clusterId)?.nome}`,
      filters.usinaId && `Usina: ${data.usinas.find(u => u.id === filters.usinaId)?.nome}`,
      filters.tecnicoId && `Técnico: ${data.tecnicos.find(t => t.id === filters.tecnicoId)?.nome}`
    ].filter(Boolean).join(' | ');

    let content = `
      <div class="header">
        <h1>Sistema de Relatórios Diários</h1>
        <h2>Relatório de ${activeTab === 'atividades' ? 'Atividades' : 'Status de Equipamentos'}</h2>
        <p>Gerado em: ${now}</p>
      </div>
      
      <div class="filters">
        <strong>Filtros aplicados:</strong> ${filterInfo || 'Nenhum filtro aplicado'}
        <br><strong>Total de registros:</strong> ${filteredData.length}
      </div>
    `;

    // Gerar registros
    filteredData.forEach(item => {
      const cluster = data.clusters.find(c => c.id === item.clusterId);
      const usina = data.usinas.find(u => u.id === item.usinaId);
      const tecnico = data.tecnicos.find(t => t.id === item.tecnicoId);
      
      content += `
        <div class="record">
          <div class="record-header">${usina?.nome || 'Usina não encontrada'}</div>
          <div class="record-meta">
            📅 ${item.data.split('-').reverse().join('/')} | 
            📍 ${cluster?.nome || 'Cluster não encontrado'} | 
            👷 ${item.tecnicosNomes || tecnico?.nome || 'Técnico não encontrado'}
          </div>
          <div class="record-content">
      `;

      if (activeTab === 'atividades') {
        content += `
            <strong>Tarefa:</strong> ${item.tarefa}<br>
            <strong>Horário:</strong> ${item.inicio} - ${item.fim}<br>
            ${item.observacoes ? `<strong>Observações:</strong> ${item.observacoes}<br>` : ''}
        `;
      } else {
        content += `
            <div style="margin-bottom: 15px;">
              <strong>• Inversores:</strong><br>
              <div style="margin-left: 15px; color: ${item.inversores?.ok100 ? '#059669' : '#dc2626'};">
                ${item.inversores?.ok100 
                  ? 'Todos os inversores estão operando normalmente, sem alarmes, e performaram 100% de sua capacidade e 100% de disponibilidade.'
                  : `${item.inversores?.motivo || 'Problema não especificado'}${item.inversores?.acaoPrevista ? '. ' + item.inversores.acaoPrevista : ''}`
                }
              </div>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>• Strings:</strong><br>
              <div style="margin-left: 15px; color: ${item.strings?.ok100 ? '#059669' : '#dc2626'};">
                ${item.strings?.ok100 
                  ? 'Todas as strings estão 100% e sem inconformidades.'
                  : `${item.strings?.motivo || 'Problema não especificado'}${item.strings?.acaoPrevista ? '. ' + item.strings.acaoPrevista : ''}`
                }
              </div>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong>• Trackers:</strong><br>
              <div style="margin-left: 15px; color: ${item.trackers?.ok100 ? '#059669' : '#dc2626'};">
                ${item.trackers?.ok100 
                  ? 'Todos os trackers estão com 100% de disponibilidade.'
                  : `${item.trackers?.motivo || 'Problema não especificado'}${item.trackers?.acaoPrevista ? '. ' + item.trackers.acaoPrevista : ''}`
                }
              </div>
            </div>
            
            ${item.observacoesGerais ? `
              <div style="margin-bottom: 15px;">
                <strong>• Observações:</strong><br>
                <div style="margin-left: 15px;">${item.observacoesGerais}</div>
              </div>
            ` : ''}
        `;
      }

      content += `
          </div>
        </div>
      `;
    });

    content += `
      <div class="footer">
        Sistema de Relatórios Diários - Versão 2.0<br>
        Relatório gerado automaticamente
      </div>
    `;

    return content;
  };

  // Filtrar usinas por cluster selecionado
  const filteredUsinas = filters.clusterId 
    ? data.usinas.filter(usina => usina.clusterId === filters.clusterId)
    : data.usinas;

  // Função para abrir modal de confirmação de exclusão
  const handleDeleteClick = (item, type) => {
    const isAtividade = type === 'atividade';
    const itemName = isAtividade 
      ? `atividade "${item.tarefa}"` 
      : `status técnico da ${data.usinas.find(u => u.id === item.usinaId)?.nome || 'usina'}`;
    
    setConfirmModal({
      isOpen: true,
      type,
      item,
      title: `Excluir ${isAtividade ? 'Atividade' : 'Status Técnico'}`,
      message: `Tem certeza que deseja excluir a ${itemName}? Esta ação não pode ser desfeita.`
    });
  };

  // Função para confirmar exclusão
  const handleDeleteConfirm = async () => {
    try {
      if (confirmModal.type === 'atividade') {
        await deleteAtividade(confirmModal.item.id);
      } else {
        await deleteStatusTecnico(confirmModal.item.id);
      }
      
      setConfirmModal({
        isOpen: false,
        type: '',
        item: null,
        title: '',
        message: ''
      });
      
      alert('Item excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir item. Tente novamente.');
    }
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
              Gerenciamento
            </h1>
            <p className="text-sm text-gray-600">Visualizar e exportar relatórios</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="card mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Filter className="w-5 h-5 mr-2 text-primary-600" />
            Filtros
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            {/* Período */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Início
                </label>
                <input
                  type="date"
                  value={filters.dataInicio}
                  onChange={(e) => setFilters(prev => ({ ...prev, dataInicio: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={filters.dataFim}
                  onChange={(e) => setFilters(prev => ({ ...prev, dataFim: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>

            {/* Cluster */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                Cluster
              </label>
              <select
                value={filters.clusterId}
                onChange={(e) => setFilters(prev => ({ ...prev, clusterId: e.target.value, usinaId: '' }))}
                className="select-field"
              >
                <option value="">Todos os clusters</option>
                {data.clusters.filter(c => c.ativo).map(cluster => (
                  <option key={cluster.id} value={cluster.id}>
                    {cluster.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Usina */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                Usina
              </label>
              <select
                value={filters.usinaId}
                onChange={(e) => setFilters(prev => ({ ...prev, usinaId: e.target.value }))}
                className="select-field"
                disabled={!filters.clusterId}
              >
                <option value="">
                  {filters.clusterId ? 'Todas as usinas' : 'Primeiro selecione um cluster'}
                </option>
                {filteredUsinas.filter(u => u.ativo).map(usina => (
                  <option key={usina.id} value={usina.id}>
                    {usina.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Técnico */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                Técnico
              </label>
              <select
                value={filters.tecnicoId}
                onChange={(e) => setFilters(prev => ({ ...prev, tecnicoId: e.target.value }))}
                className="select-field"
              >
                <option value="">Todos os técnicos</option>
                {data.tecnicos.filter(t => t.ativo).map(tecnico => (
                  <option key={tecnico.id} value={tecnico.id}>
                    {tecnico.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Resumo dos filtros */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{filteredData.length}</span> registro(s) encontrado(s)
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
          <button
            onClick={() => setActiveTab('atividades')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'atividades'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Atividades
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'status'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Status de Equipamentos
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
          <button
            onClick={() => setViewMode('table')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Tabela
          </button>
          <button
            onClick={() => setViewMode('grouped')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'grouped'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Agrupado
          </button>
        </div>

        {/* Ações */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={exportCSV}
            disabled={filteredData.length === 0}
            className="btn-secondary flex items-center justify-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </button>
          
          <button
            onClick={() => printReport()}
            disabled={filteredData.length === 0}
            className="btn-secondary flex items-center justify-center"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </button>
        </div>

        {/* Conteúdo */}
        {filteredData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Nenhum registro encontrado</h3>
            <p className="text-sm">Ajuste os filtros ou adicione novos relatórios</p>
          </div>
        ) : viewMode === 'table' ? (
          /* Visualização em Tabela */
          <div className="space-y-3">
            {filteredData.map((item, index) => {
              const cluster = data.clusters.find(c => c.id === item.clusterId);
              const usina = data.usinas.find(u => u.id === item.usinaId);
              const tecnico = data.tecnicos.find(t => t.id === item.tecnicoId);
              
              return (
                <div key={item.id || index} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        <Calendar className="w-4 h-4 mr-1" />
                {item.data.split('-').reverse().join('/')}
                        <span className="mx-2">•</span>
                        <MapPin className="w-4 h-4 mr-1" />
                        {cluster?.nome}
                        <span className="mx-2">•</span>
                        <User className="w-4 h-4 mr-1" />
                        {item.tecnicosNomes || tecnico?.nome}
                      </div>
                      <h4 className="font-semibold text-gray-900">{usina?.nome}</h4>
                    </div>
                  </div>
                  
                  {activeTab === 'atividades' ? (
                    <div className="text-sm text-gray-600">
                      <p><span className="font-medium">Tarefa:</span> {item.tarefa}</p>
                      <p><span className="font-medium">Horário:</span> {item.inicio} - {item.fim}</p>
                      {item.observacoes && (
                        <p><span className="font-medium">Obs:</span> {item.observacoes}</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="text-center">
                        <p className="text-gray-500 mb-1">Inversores</p>
                        <div className={`px-2 py-1 rounded text-xs ${
                          item.inversores?.ok100 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.inversores?.ok100 ? '100%' : 'Problema'}
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 mb-1">Strings</p>
                        <div className={`px-2 py-1 rounded text-xs ${
                          item.strings?.ok100 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.strings?.ok100 ? '100%' : 'Problema'}
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 mb-1">Trackers</p>
                        <div className={`px-2 py-1 rounded text-xs ${
                          item.trackers?.ok100 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.trackers?.ok100 ? '100%' : 'Problema'}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Botão de Exclusão */}
                  <div className="flex justify-end mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => handleDeleteClick(item, activeTab === 'atividades' ? 'atividade' : 'status')}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-3 rounded-md transition-colors flex items-center"
                      title="Excluir"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Visualização Agrupada */
          <div className="space-y-6">
            {Object.keys(groupedData).map(clusterName => (
              <div key={clusterName} className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-primary-600" />
                    {clusterName}
                  </h3>
                  <button
                    onClick={() => generateConsolidatedWhatsApp(clusterName)}
                    className="btn-primary text-sm py-1 px-3 flex items-center"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    WhatsApp
                  </button>
                </div>
                
                <div className="space-y-3">
                  {Object.keys(groupedData[clusterName]).map(usinaName => (
                    <div key={usinaName} className="border-l-4 border-primary-200 pl-4">
                      <h4 className="font-medium text-gray-800 mb-2">{usinaName}</h4>
                      <div className="space-y-2">
                        {groupedData[clusterName][usinaName].map((item, index) => (
                          <div key={index} className="bg-gray-50 rounded p-3 text-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{item.tecnicosNomes || item.tecnicoName}</span>
                              <span className="text-gray-500">
{item.data.split('-').reverse().join('/').substring(0, 5)}
                              </span>
                            </div>
                            
                            {activeTab === 'atividades' ? (
                              <p className="text-gray-600">
                                {item.tarefa} ({item.inicio} - {item.fim})
                              </p>
                            ) : (
                              <div className="flex space-x-2">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  item.inversores?.ok100 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  Inv: {item.inversores?.ok100 ? 'OK' : 'NOK'}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  item.strings?.ok100 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  Str: {item.strings?.ok100 ? 'OK' : 'NOK'}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  item.trackers?.ok100 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  Trk: {item.trackers?.ok100 ? 'OK' : 'NOK'}
                                </span>
                              </div>
                            )}
                            
                            {/* Botão de Exclusão na Visualização Agrupada */}
                            <div className="flex justify-end mt-2">
                              <button
                                onClick={() => handleDeleteClick(item, activeTab === 'atividades' ? 'atividade' : 'status')}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2 rounded transition-colors flex items-center"
                                title="Excluir"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Excluir
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Confirmação */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={handleDeleteConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default ManagementScreen;
