import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { loadData } from '../data/seedData';

const DataContext = createContext();

// Tipos de ações
const ACTIONS = {
  LOAD_DATA: 'LOAD_DATA',
  ADD_ATIVIDADE: 'ADD_ATIVIDADE',
  UPDATE_ATIVIDADE: 'UPDATE_ATIVIDADE',
  DELETE_ATIVIDADE: 'DELETE_ATIVIDADE',
  ADD_STATUS_TECNICO: 'ADD_STATUS_TECNICO',
  UPDATE_STATUS_TECNICO: 'UPDATE_STATUS_TECNICO',
  DELETE_STATUS_TECNICO: 'DELETE_STATUS_TECNICO',
  UPDATE_CLUSTER: 'UPDATE_CLUSTER',
  ADD_CLUSTER: 'ADD_CLUSTER',
  DELETE_CLUSTER: 'DELETE_CLUSTER',
  UPDATE_USINA: 'UPDATE_USINA',
  ADD_USINA: 'ADD_USINA',
  DELETE_USINA: 'DELETE_USINA',
  UPDATE_TECNICO: 'UPDATE_TECNICO',
  ADD_TECNICO: 'ADD_TECNICO',
  DELETE_TECNICO: 'DELETE_TECNICO'
};

// Reducer para gerenciar o estado
const dataReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.LOAD_DATA:
      return action.payload;
    
    case ACTIONS.ADD_ATIVIDADE:
      const newAtividade = {
        id: Date.now().toString(),
        ...action.payload
      };
      return {
        ...state,
        atividades: [...state.atividades, newAtividade]
      };
    
    case ACTIONS.UPDATE_ATIVIDADE:
      return {
        ...state,
        atividades: state.atividades.map(ativ => 
          ativ.id === action.payload.id ? { ...ativ, ...action.payload } : ativ
        )
      };
    
    case ACTIONS.DELETE_ATIVIDADE:
      return {
        ...state,
        atividades: state.atividades.filter(ativ => ativ.id !== action.payload)
      };
    
    case ACTIONS.ADD_STATUS_TECNICO:
      const newStatus = {
        id: Date.now().toString(),
        ...action.payload
      };
      return {
        ...state,
        statusTecnico: [...state.statusTecnico, newStatus]
      };
    
    case ACTIONS.UPDATE_STATUS_TECNICO:
      return {
        ...state,
        statusTecnico: state.statusTecnico.map(status => 
          status.id === action.payload.id ? { ...status, ...action.payload } : status
        )
      };
    
    case ACTIONS.ADD_CLUSTER:
      const newCluster = {
        id: Date.now().toString(),
        ...action.payload
      };
      return {
        ...state,
        clusters: [...state.clusters, newCluster]
      };
    
    case ACTIONS.UPDATE_CLUSTER:
      return {
        ...state,
        clusters: state.clusters.map(cluster => 
          cluster.id === action.payload.id ? { ...cluster, ...action.payload } : cluster
        )
      };
    
    case ACTIONS.ADD_USINA:
      const newUsina = {
        id: Date.now().toString(),
        ...action.payload
      };
      return {
        ...state,
        usinas: [...state.usinas, newUsina]
      };
    
    case ACTIONS.UPDATE_USINA:
      return {
        ...state,
        usinas: state.usinas.map(usina => 
          usina.id === action.payload.id ? { ...usina, ...action.payload } : usina
        )
      };
    
    case ACTIONS.ADD_TECNICO:
      const newTecnico = {
        id: Date.now().toString(),
        ...action.payload
      };
      return {
        ...state,
        tecnicos: [...state.tecnicos, newTecnico]
      };
    
    case ACTIONS.UPDATE_TECNICO:
      return {
        ...state,
        tecnicos: state.tecnicos.map(tecnico => 
          tecnico.id === action.payload.id ? { ...tecnico, ...action.payload } : tecnico
        )
      };

    case ACTIONS.DELETE_CLUSTER:
      return {
        ...state,
        clusters: state.clusters.filter(cluster => cluster.id !== action.payload)
      };

    case ACTIONS.DELETE_USINA:
      return {
        ...state,
        usinas: state.usinas.filter(usina => usina.id !== action.payload)
      };

    case ACTIONS.DELETE_TECNICO:
      return {
        ...state,
        tecnicos: state.tecnicos.filter(tecnico => tecnico.id !== action.payload)
      };


    case ACTIONS.DELETE_STATUS_TECNICO:
      return {
        ...state,
        statusTecnico: state.statusTecnico.filter(status => status.id !== action.payload)
      };
    
    default:
      return state;
  }
};

// Provider do contexto
export const DataProvider = ({ children }) => {
  const [data, dispatch] = useReducer(dataReducer, {
    clusters: [],
    usinas: [],
    tecnicos: [],
    funcoes: [],
    atividades: [],
    statusTecnico: []
  });

  const [loading, setLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);

  // Carregar dados na inicialização
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Tentar conectar com a API primeiro
        const connectionTest = await apiService.testConnection();
        
        if (connectionTest.success) {
          setApiConnected(true);
          console.log('✅ Conectado à API - usando banco de dados');
          
          // Carregar dados da API
          const apiData = await apiService.getAllData();
          
          // Transformar dados da API para formato compatível com frontend
          const transformedData = {
            clusters: apiData.clusters.map(c => ({
              id: c.id.toString(),
              nome: c.nome,
              ativo: Boolean(c.ativo)
            })),
            usinas: apiData.usinas.map(u => ({
              id: u.id.toString(),
              nome: u.nome,
              clusterId: u.cluster_id.toString(),
              ativo: Boolean(u.ativo)
            })),
            tecnicos: apiData.tecnicos.map(t => ({
              id: t.id.toString(),
              nome: t.nome,
              funcao: t.funcao,
              clusterId: t.cluster_id?.toString(),
              ativo: Boolean(t.ativo)
            })),
            funcoes: apiData.funcoes.map(f => ({
              id: f.id.toString(),
              nome: f.nome,
              descricao: f.descricao
            })),
            atividades: apiData.atividades.map(a => ({
              id: a.id.toString(),
              data: a.data,
              clusterId: a.cluster_id.toString(),
              usinaId: a.usina_id.toString(),
              tecnicoId: a.tecnico_id.toString(),
              funcaoId: a.funcao_id?.toString(),
              tarefa: a.tarefa,
              inicio: a.inicio,
              fim: a.fim,
              observacoes: a.observacoes
            })),
            statusTecnico: apiData.statusTecnico.map(s => ({
              id: s.id.toString(),
              data: s.data,
              clusterId: s.cluster_id.toString(),
              usinaId: s.usina_id.toString(),
              tecnicoId: s.tecnico_id.toString(),
              tecnicosNomes: s.tecnicos_nomes || '', // Adicionar campo para múltiplos técnicos
              inversores: {
                ok100: Boolean(s.inversores_ok100),
                motivo: s.inversores_motivo || '',
                acaoPrevista: s.inversores_acao_prevista || ''
              },
              strings: {
                ok100: Boolean(s.strings_ok100),
                motivo: s.strings_motivo || '',
                acaoPrevista: s.strings_acao_prevista || ''
              },
              trackers: {
                ok100: Boolean(s.trackers_ok100),
                motivo: s.trackers_motivo || '',
                acaoPrevista: s.trackers_acao_prevista || ''
              },
              observacoesGerais: s.observacoes_gerais || ''
            }))
          };
          
          dispatch({ type: ACTIONS.LOAD_DATA, payload: transformedData });
        } else {
          setApiConnected(false);
          console.log('⚠️ API não disponível - usando dados locais');
          
          // Fallback para dados locais
          const localData = loadData();
          dispatch({ type: ACTIONS.LOAD_DATA, payload: localData });
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setApiConnected(false);
        
        // Fallback para dados locais em caso de erro
        const localData = loadData();
        dispatch({ type: ACTIONS.LOAD_DATA, payload: localData });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Funções de ação
  const addAtividade = async (atividade) => {
    if (apiConnected) {
      try {
        // Transformar dados para formato da API
        const apiData = {
          data: atividade.data,
          cluster_id: parseInt(atividade.clusterId),
          usina_id: parseInt(atividade.usinaId),
          tecnico_id: parseInt(atividade.tecnicoId),
          funcao_id: atividade.funcaoId ? parseInt(atividade.funcaoId) : null,
          tarefa: atividade.tarefa,
          inicio: atividade.inicio,
          fim: atividade.fim,
          observacoes: atividade.observacoes || ''
        };
        
        await apiService.createAtividade(apiData);
        
        // Atualizar estado local
        dispatch({ type: ACTIONS.ADD_ATIVIDADE, payload: atividade });
      } catch (error) {
        console.error('Erro ao salvar atividade:', error);
        throw error;
      }
    } else {
      dispatch({ type: ACTIONS.ADD_ATIVIDADE, payload: atividade });
    }
  };

  const updateAtividade = (atividade) => {
    dispatch({ type: ACTIONS.UPDATE_ATIVIDADE, payload: atividade });
  };


  const addStatusTecnico = async (status) => {
    if (apiConnected) {
      try {
        // Transformar dados para formato da API
        const apiData = {
          data: status.data,
          cluster_id: parseInt(status.clusterId),
          usina_id: parseInt(status.usinaId),
          tecnico_id: parseInt(status.tecnicoId),
          tecnicos_nomes: status.tecnicosNomes || '', // Adicionar campo para múltiplos técnicos
          inversores_ok100: status.inversores.ok100 ? 1 : 0,
          inversores_motivo: status.inversores.motivo || '',
          inversores_acao_prevista: status.inversores.acaoPrevista || '',
          strings_ok100: status.strings.ok100 ? 1 : 0,
          strings_motivo: status.strings.motivo || '',
          strings_acao_prevista: status.strings.acaoPrevista || '',
          trackers_ok100: status.trackers.ok100 ? 1 : 0,
          trackers_motivo: status.trackers.motivo || '',
          trackers_acao_prevista: status.trackers.acaoPrevista || '',
          observacoes_gerais: status.observacoesGerais || ''
        };
        
        await apiService.createStatusTecnico(apiData);
        
        // Atualizar estado local
        dispatch({ type: ACTIONS.ADD_STATUS_TECNICO, payload: status });
      } catch (error) {
        console.error('Erro ao salvar status técnico:', error);
        throw error;
      }
    } else {
      dispatch({ type: ACTIONS.ADD_STATUS_TECNICO, payload: status });
    }
  };

  const updateStatusTecnico = async (status) => {
    if (apiConnected) {
      try {
        // Transformar dados para formato da API (implementar quando necessário)
        console.log('Atualizando status técnico via API:', status);
        
        // Por enquanto, atualizar apenas localmente
        dispatch({ type: ACTIONS.UPDATE_STATUS_TECNICO, payload: status });
      } catch (error) {
        console.error('Erro ao atualizar status técnico:', error);
        throw error;
      }
    } else {
      dispatch({ type: ACTIONS.UPDATE_STATUS_TECNICO, payload: status });
    }
  };

  const addCluster = async (cluster) => {
    if (apiConnected) {
      try {
        const result = await apiService.createCluster({
          nome: cluster.nome,
          ativo: cluster.ativo ? 1 : 0
        });
        
        const newCluster = {
          id: result.id.toString(),
          nome: cluster.nome,
          ativo: cluster.ativo
        };
        
        dispatch({ type: ACTIONS.ADD_CLUSTER, payload: newCluster });
      } catch (error) {
        console.error('Erro ao criar cluster:', error);
        throw error;
      }
    } else {
      dispatch({ type: ACTIONS.ADD_CLUSTER, payload: cluster });
    }
  };

  const updateCluster = async (cluster) => {
    if (apiConnected) {
      try {
        await apiService.updateCluster(cluster.id, {
          nome: cluster.nome,
          ativo: cluster.ativo ? 1 : 0
        });
        
        dispatch({ type: ACTIONS.UPDATE_CLUSTER, payload: cluster });
      } catch (error) {
        console.error('Erro ao atualizar cluster:', error);
        throw error;
      }
    } else {
      dispatch({ type: ACTIONS.UPDATE_CLUSTER, payload: cluster });
    }
  };

  const addUsina = async (usina) => {
    if (apiConnected) {
      try {
        const result = await apiService.createUsina({
          nome: usina.nome,
          cluster_id: parseInt(usina.clusterId),
          ativo: usina.ativo ? 1 : 0
        });
        
        const newUsina = {
          id: result.id.toString(),
          nome: usina.nome,
          clusterId: usina.clusterId,
          ativo: usina.ativo
        };
        
        dispatch({ type: ACTIONS.ADD_USINA, payload: newUsina });
      } catch (error) {
        console.error('Erro ao criar usina:', error);
        throw error;
      }
    } else {
      dispatch({ type: ACTIONS.ADD_USINA, payload: usina });
    }
  };

  const updateUsina = async (usina) => {
    if (apiConnected) {
      try {
        await apiService.updateUsina(usina.id, {
          nome: usina.nome,
          cluster_id: parseInt(usina.clusterId),
          ativo: usina.ativo ? 1 : 0
        });
        
        dispatch({ type: ACTIONS.UPDATE_USINA, payload: usina });
      } catch (error) {
        console.error('Erro ao atualizar usina:', error);
        throw error;
      }
    } else {
      dispatch({ type: ACTIONS.UPDATE_USINA, payload: usina });
    }
  };

  const addTecnico = async (tecnico) => {
    if (apiConnected) {
      try {
        const result = await apiService.createTecnico({
          nome: tecnico.nome,
          funcao: tecnico.funcao,
          cluster_id: tecnico.clusterId ? parseInt(tecnico.clusterId) : null,
          ativo: tecnico.ativo ? 1 : 0
        });
        
        const newTecnico = {
          id: result.id.toString(),
          nome: tecnico.nome,
          funcao: tecnico.funcao,
          clusterId: tecnico.clusterId,
          ativo: tecnico.ativo
        };
        
        dispatch({ type: ACTIONS.ADD_TECNICO, payload: newTecnico });
      } catch (error) {
        console.error('Erro ao criar técnico:', error);
        throw error;
      }
    } else {
      dispatch({ type: ACTIONS.ADD_TECNICO, payload: tecnico });
    }
  };

  const updateTecnico = async (tecnico) => {
    if (apiConnected) {
      try {
        await apiService.updateTecnico(tecnico.id, {
          nome: tecnico.nome,
          funcao: tecnico.funcao,
          cluster_id: tecnico.clusterId ? parseInt(tecnico.clusterId) : null,
          ativo: tecnico.ativo ? 1 : 0
        });
        
        dispatch({ type: ACTIONS.UPDATE_TECNICO, payload: tecnico });
      } catch (error) {
        console.error('Erro ao atualizar técnico:', error);
        throw error;
      }
    } else {
      dispatch({ type: ACTIONS.UPDATE_TECNICO, payload: tecnico });
    }
  };

  const deleteCluster = async (id) => {
    if (apiConnected) {
      try {
        await apiService.deleteCluster(id);
        dispatch({ type: ACTIONS.DELETE_CLUSTER, payload: id });
      } catch (error) {
        console.error('Erro ao excluir cluster:', error);
        throw error;
      }
    } else {
      dispatch({ type: ACTIONS.DELETE_CLUSTER, payload: id });
    }
  };

  const deleteUsina = async (id) => {
    if (apiConnected) {
      try {
        await apiService.deleteUsina(id);
        dispatch({ type: ACTIONS.DELETE_USINA, payload: id });
      } catch (error) {
        console.error('Erro ao excluir usina:', error);
        throw error;
      }
    } else {
      dispatch({ type: ACTIONS.DELETE_USINA, payload: id });
    }
  };

  const deleteTecnico = async (id) => {
    if (apiConnected) {
      try {
        await apiService.deleteTecnico(id);
        dispatch({ type: ACTIONS.DELETE_TECNICO, payload: id });
      } catch (error) {
        console.error('Erro ao excluir técnico:', error);
        throw error;
      }
    } else {
      dispatch({ type: ACTIONS.DELETE_TECNICO, payload: id });
    }
  };

  const deleteAtividade = async (id) => {
    if (apiConnected) {
      try {
        await apiService.deleteAtividade(id);
        dispatch({ type: ACTIONS.DELETE_ATIVIDADE, payload: id });
      } catch (error) {
        console.error('Erro ao excluir atividade:', error);
        throw error;
      }
    } else {
      dispatch({ type: ACTIONS.DELETE_ATIVIDADE, payload: id });
    }
  };

  const deleteStatusTecnico = async (id) => {
    if (apiConnected) {
      try {
        await apiService.deleteStatusTecnico(id);
        dispatch({ type: ACTIONS.DELETE_STATUS_TECNICO, payload: id });
      } catch (error) {
        console.error('Erro ao excluir status técnico:', error);
        throw error;
      }
    } else {
      dispatch({ type: ACTIONS.DELETE_STATUS_TECNICO, payload: id });
    }
  };

  const value = {
    data,
    loading,
    apiConnected,
    addAtividade,
    updateAtividade,
    addStatusTecnico,
    updateStatusTecnico,
    addCluster,
    updateCluster,
    deleteCluster,
    addUsina,
    updateUsina,
    deleteUsina,
    addTecnico,
    updateTecnico,
    deleteTecnico,
    deleteAtividade,
    deleteStatusTecnico
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

// Hook para usar o contexto
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData deve ser usado dentro de um DataProvider');
  }
  return context;
};
