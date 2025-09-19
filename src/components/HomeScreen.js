import React, { useState } from 'react';
import { Calendar, Settings, Users, FileText, Clock, Zap, Wifi, WifiOff } from 'lucide-react';
import { useData } from '../context/DataContext';
import UserMenu from './UserMenu';

const HomeScreen = ({ onNavigate }) => {
  const { loading, apiConnected } = useData();
  const [quickMode, setQuickMode] = useState(false);

  const handleNavigation = (screen) => {
    onNavigate(screen, { quickMode });
  };

  return (
    <div className="mobile-container">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="text-center flex-1">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Sistema de Relatórios
            </h1>
            <p className="text-gray-600">
              Registre atividades e status técnico das usinas
            </p>
          </div>
          
          {/* User Menu */}
          <div className="xl:block">
            <UserMenu />
          </div>
        </div>

        {/* Quick Mode Toggle */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Zap className="w-5 h-5 text-primary-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                Modo Rápido
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={quickMode}
                onChange={(e) => setQuickMode(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {quickMode 
              ? "Preencher ambos os relatórios na mesma tela"
              : "Preencher relatórios separadamente"
            }
          </p>
        </div>

        {/* Main Action Buttons */}
        <div className="space-y-4 xl:grid xl:grid-cols-2 xl:gap-6 xl:space-y-0 mb-6">
          {/* Relatório Diário */}
          <button
            onClick={() => handleNavigation('daily-report')}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 xl:p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            <div className="flex items-center justify-center mb-3">
              <Clock className="w-8 h-8 xl:w-10 xl:h-10" />
            </div>
            <h2 className="text-xl xl:text-2xl font-bold mb-2">
              Relatório Diário de Atividades
            </h2>
            <p className="text-primary-100 text-sm xl:text-base">
              Planejamento do dia por equipe/técnico
            </p>
          </button>

          {/* Status Técnico */}
          <button
            onClick={() => handleNavigation('technical-status')}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white p-6 xl:p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            <div className="flex items-center justify-center mb-3">
              <FileText className="w-8 h-8 xl:w-10 xl:h-10" />
            </div>
            <h2 className="text-xl xl:text-2xl font-bold mb-2">
              Relatório de Status de Equipamentos
            </h2>
            <p className="text-green-100 text-sm xl:text-base">
              Inversores, Strings e Trackers por usina
            </p>
          </button>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => handleNavigation('management')}
            className="bg-white border-2 border-gray-200 text-gray-700 p-4 rounded-lg hover:border-primary-300 hover:text-primary-600 transition-colors duration-200"
          >
            <Users className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-medium">Gerenciar</span>
          </button>
          
          <button
            onClick={() => handleNavigation('master-data')}
            className="bg-white border-2 border-gray-200 text-gray-700 p-4 rounded-lg hover:border-primary-300 hover:text-primary-600 transition-colors duration-200"
          >
            <Settings className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm font-medium">Cadastros</span>
          </button>
        </div>

        {/* Quick Mode Info */}
        {quickMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Zap className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-1">
                  Modo Rápido Ativado
                </h3>
                <p className="text-xs text-blue-700">
                  Os próximos relatórios serão preenchidos em uma única tela com filtros compartilhados.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="text-center text-xs text-gray-500 mt-8">
          <p>Versão 1.0 - Sistema de Relatórios Diários</p>
          
          {/* Status da Conexão */}
          <div className={`mt-2 flex items-center justify-center px-3 py-1 rounded-full ${
            loading ? 'bg-yellow-100 text-yellow-800' : 
            apiConnected ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
          }`}>
            {loading ? (
              <>
                <div className="animate-spin w-3 h-3 border border-yellow-600 border-t-transparent rounded-full mr-2"></div>
                <span>Conectando...</span>
              </>
            ) : apiConnected ? (
              <>
                <Wifi className="w-3 h-3 mr-2" />
                <span>Banco de dados conectado</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-2" />
                <span>Modo offline - dados locais</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
