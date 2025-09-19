// Configuração da API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Adicionar token de autenticação se disponível
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Se token expirou ou inválido, redirecionar para login
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          window.location.reload();
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Métodos GET
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // Métodos POST
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
    });
  }

  // Métodos PUT
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data,
    });
  }

  // Métodos DELETE
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // ===== CLUSTERS =====
  async getClusters() {
    return this.get('/clusters');
  }

  async createCluster(cluster) {
    return this.post('/clusters', cluster);
  }

  async updateCluster(id, cluster) {
    return this.put(`/clusters/${id}`, cluster);
  }

  // ===== USINAS =====
  async getUsinas() {
    return this.get('/usinas');
  }

  async createUsina(usina) {
    return this.post('/usinas', usina);
  }

  async updateUsina(id, usina) {
    return this.put(`/usinas/${id}`, usina);
  }

  // ===== TÉCNICOS =====
  async getTecnicos() {
    return this.get('/tecnicos');
  }

  async createTecnico(tecnico) {
    return this.post('/tecnicos', tecnico);
  }

  async updateTecnico(id, tecnico) {
    return this.put(`/tecnicos/${id}`, tecnico);
  }

  // ===== FUNÇÕES =====
  async getFuncoes() {
    return this.get('/funcoes');
  }

  // ===== ATIVIDADES =====
  async getAtividades(filters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.get(`/atividades${query}`);
  }

  async createAtividade(atividade) {
    return this.post('/atividades', atividade);
  }

  // ===== STATUS TÉCNICO =====
  async getStatusTecnico(filters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.get(`/status-tecnico${query}`);
  }

  async createStatusTecnico(status) {
    return this.post('/status-tecnico', status);
  }

  // ===== DADOS CONSOLIDADOS =====
  async getAllData() {
    return this.get('/data');
  }

  // ===== HEALTH CHECK =====
  async healthCheck() {
    return this.get('/health');
  }

  // Excluir Cluster
  async deleteCluster(id) {
    const response = await fetch(`${this.baseURL}/clusters/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Erro ao excluir cluster');
    }
    
    return await response.json();
  }

  // Excluir Usina
  async deleteUsina(id) {
    const response = await fetch(`${this.baseURL}/usinas/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Erro ao excluir usina');
    }
    
    return await response.json();
  }

  // Excluir Técnico
  async deleteTecnico(id) {
    const response = await fetch(`${this.baseURL}/tecnicos/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Erro ao excluir técnico');
    }
    
    return await response.json();
  }

  // Excluir Atividade
  async deleteAtividade(id) {
    const response = await fetch(`${this.baseURL}/atividades/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Erro ao excluir atividade');
    }
    
    return await response.json();
  }

  // Excluir Status Técnico
  async deleteStatusTecnico(id) {
    const response = await fetch(`${this.baseURL}/status-tecnico/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Erro ao excluir status técnico');
    }
    
    return await response.json();
  }

  // Método para testar conectividade
  async testConnection() {
    try {
      await this.healthCheck();
      return { success: true, message: 'Conexão com API estabelecida' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

// Exportar instância única
export const apiService = new ApiService();
export default apiService;
