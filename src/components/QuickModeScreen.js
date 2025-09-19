import React, { useState } from 'react';
import { ArrowLeft, Clock, Zap } from 'lucide-react';
import { useData } from '../context/DataContext';
import SharedFilters from './SharedFilters';
import QuickModeAtividades from './QuickModeAtividades';
import QuickModeStatus from './QuickModeStatus';

const QuickModeScreen = ({ onBack }) => {
  const { data } = useData();
  
  const [activeTab, setActiveTab] = useState('atividades');
  
  // Estado compartilhado entre as abas
  const [sharedFilters, setSharedFilters] = useState({
    data: new Date().toISOString().split('T')[0],
    clusterId: '',
    tecnicoIds: []
  });

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
              Modo Rápido - Relatórios Combinados
            </h1>
            <p className="text-sm text-blue-600">Preencha ambos os relatórios com filtros compartilhados</p>
          </div>
        </div>

        {/* Filtros Compartilhados */}
        <SharedFilters
          filters={sharedFilters}
          onFiltersChange={setSharedFilters}
          clusters={data.clusters}
          usinas={data.usinas}
          tecnicos={data.tecnicos}
          funcoes={data.funcoes}
          showFuncao={false}
          showUsina={false}
          allowMultipleTecnicos={true}
        />

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('atividades')}
            className={`flex-1 py-3 px-4 rounded-md text-sm xl:text-base font-medium transition-colors ${
              activeTab === 'atividades'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock className="w-4 h-4 xl:w-5 xl:h-5 inline mr-2" />
            Atividades
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-3 px-4 rounded-md text-sm xl:text-base font-medium transition-colors ${
              activeTab === 'status'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Zap className="w-4 h-4 xl:w-5 xl:h-5 inline mr-2" />
            Status de Equipamentos
          </button>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === 'atividades' ? (
          <QuickModeAtividades filters={sharedFilters} />
        ) : (
          <QuickModeStatus filters={sharedFilters} />
        )}

        {/* Ações Finais do Modo Rápido */}
        <div className="space-y-3 pt-4 border-t border-gray-200 mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Zap className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-1">
                  Modo Rápido Ativo
                </h3>
                <p className="text-xs text-blue-700">
                  Os filtros são compartilhados entre as abas. Preencha cada relatório e salve independentemente.
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={onBack}
            className="btn-secondary w-full"
          >
            Voltar à Tela Inicial
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickModeScreen;