// Dados padrão (seed) conforme especificado
export const seedData = {
  clusters: [
    { id: 'clu1', nome: 'Araraquara', ativo: true },
    { id: 'clu2', nome: 'Barretos', ativo: true },
    { id: 'clu3', nome: 'Aracatuba', ativo: true },
    { id: 'clu4', nome: 'Porangatu', ativo: true },
    { id: 'clu5', nome: 'Nova Crixas', ativo: true }
  ],

  usinas: [
    // Araraquara
    { id: 'u1', nome: 'Boa Esperanca do Sul II', clusterId: 'clu1', ativo: true },
    { id: 'u2', nome: 'Boa Esperanca do Sul V', clusterId: 'clu1', ativo: true },
    { id: 'u3', nome: 'Araraquara III', clusterId: 'clu1', ativo: true },
    { id: 'u4', nome: 'Araraquara IV', clusterId: 'clu1', ativo: true },
    { id: 'u5', nome: 'Descalvado I', clusterId: 'clu1', ativo: true },
    { id: 'u6', nome: 'Dourado III', clusterId: 'clu1', ativo: true },
    { id: 'u7', nome: 'Santa Lucia I', clusterId: 'clu1', ativo: true },
    { id: 'u8', nome: 'Rincao', clusterId: 'clu1', ativo: true },
    
    // Barretos
    { id: 'u9', nome: 'Altair I', clusterId: 'clu2', ativo: true },
    { id: 'u10', nome: 'Miguelopolis', clusterId: 'clu2', ativo: true },
    
    // Nova Crixas
    { id: 'u11', nome: 'Nova Crixas I', clusterId: 'clu5', ativo: true },
    { id: 'u12', nome: 'Nova Crixas II', clusterId: 'clu5', ativo: true },
    
    // Porangatu
    { id: 'u13', nome: 'Porangatu I', clusterId: 'clu4', ativo: true },
    { id: 'u14', nome: 'Novo Planalto II', clusterId: 'clu4', ativo: true },
    { id: 'u15', nome: 'Novo Planalto I', clusterId: 'clu4', ativo: true },
    { id: 'u16', nome: 'Minacu', clusterId: 'clu4', ativo: true },
    
    // Aracatuba
    { id: 'u17', nome: 'Pompeia II', clusterId: 'clu3', ativo: true },
    { id: 'u18', nome: 'Piacatu I', clusterId: 'clu3', ativo: true },
    { id: 'u19', nome: 'Avanhandava I', clusterId: 'clu3', ativo: true },
    { id: 'u20', nome: 'Getulina II', clusterId: 'clu3', ativo: true }
  ],

  tecnicos: [
    // Araraquara
    { id: 't1', nome: 'Claudevan da Silva', funcao: 'Tecnico Eletrotecnico', clusterId: 'clu1', ativo: true },
    { id: 't2', nome: 'Aparecido', funcao: 'Mantenedor', clusterId: 'clu1', ativo: true },
    { id: 't3', nome: 'Luiz Vilela', funcao: 'Tecnico Eletrotecnico', clusterId: 'clu1', ativo: true },
    { id: 't4', nome: 'Vitor Silva', funcao: 'Mantenedor', clusterId: 'clu1', ativo: true },
    
    // Barretos
    { id: 't5', nome: 'Victor Santos', funcao: 'Tecnico Eletrotecnico', clusterId: 'clu2', ativo: true },
    { id: 't6', nome: 'Richard', funcao: 'Mantenedor', clusterId: 'clu2', ativo: true },
    
    // Aracatuba
    { id: 't7', nome: 'Eduardo Costa', funcao: 'Tecnico Eletrotecnico', clusterId: 'clu3', ativo: true },
    { id: 't8', nome: 'Diogo Ito', funcao: 'Mantenedor', clusterId: 'clu3', ativo: true },
    
    // Porangatu
    { id: 't9', nome: 'Sergio Ribeiro', funcao: 'Tecnico de Campo', clusterId: 'clu4', ativo: true },
    
    // Nova Crixas
    { id: 't10', nome: 'Jose Morais', funcao: 'Tecnico de Campo', clusterId: 'clu5', ativo: true },
    { id: 't11', nome: 'Igor Souza', funcao: 'Tecnico de Campo', clusterId: 'clu5', ativo: true }
  ],

  funcoes: [
    { id: 'f1', nome: 'Eletricista', descricao: 'Responsável por atividades elétricas' },
    { id: 'f2', nome: 'Técnico de Campo', descricao: 'Atividades gerais de campo' },
    { id: 'f3', nome: 'Supervisor', descricao: 'Supervisão de equipes' },
    { id: 'f4', nome: 'Operador', descricao: 'Operação de equipamentos' }
  ]
};

// Função para carregar dados do localStorage ou usar seed
export const loadData = () => {
  try {
    const savedData = localStorage.getItem('dailyReportData');
    if (savedData) {
      return JSON.parse(savedData);
    }
  } catch (error) {
    console.error('Erro ao carregar dados do localStorage:', error);
  }
  
  return {
    clusters: seedData.clusters,
    usinas: seedData.usinas,
    tecnicos: seedData.tecnicos,
    funcoes: seedData.funcoes,
    atividades: [],
    statusTecnico: []
  };
};

// Função para salvar dados no localStorage
export const saveData = (data) => {
  try {
    localStorage.setItem('dailyReportData', JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Erro ao salvar dados no localStorage:', error);
    return false;
  }
};
