import React, { useState } from 'react';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomeScreen from './components/HomeScreen';
import DailyReportScreen from './components/DailyReportScreen';
import TechnicalStatusScreen from './components/TechnicalStatusScreen';
import QuickModeScreen from './components/QuickModeScreen';
import ManagementScreen from './components/ManagementScreen';
import MasterDataScreen from './components/MasterDataScreen';
import LoginScreen from './components/LoginScreen';

// Componente principal da aplicação
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('home');
  const [screenOptions, setScreenOptions] = useState({});

  const navigateToScreen = (screen, options = {}) => {
    setCurrentScreen(screen);
    setScreenOptions(options);
  };

  const navigateBack = () => {
    setCurrentScreen('home');
    setScreenOptions({});
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen onNavigate={navigateToScreen} />;
      
      case 'daily-report':
        return screenOptions.quickMode ? (
          <QuickModeScreen onBack={navigateBack} />
        ) : (
          <DailyReportScreen onBack={navigateBack} />
        );
      
      case 'technical-status':
        return screenOptions.quickMode ? (
          <QuickModeScreen onBack={navigateBack} />
        ) : (
          <TechnicalStatusScreen onBack={navigateBack} />
        );
      
      case 'management':
        return <ManagementScreen onBack={navigateBack} />;
      
      case 'master-data':
        return <MasterDataScreen onBack={navigateBack} />;
      
      default:
        return <HomeScreen onNavigate={navigateToScreen} />;
    }
  };

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Mostrar login se não autenticado
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Mostrar aplicação se autenticado
  return (
    <DataProvider>
      <div className="App">
        {renderCurrentScreen()}
      </div>
    </DataProvider>
  );
};

// Componente App com providers
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
