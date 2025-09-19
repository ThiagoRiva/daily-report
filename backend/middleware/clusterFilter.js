// Middleware para filtrar dados por clusters permitidos do usuário
const clusterFilterMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  // Admin e coordenador têm acesso total (por enquanto)
  if (req.user.role === 'admin' || req.user.role === 'coordenador') {
    return next();
  }

  // Para técnicos, aplicar filtro de cluster
  try {
    let clustersPermitidos = [];
    
    if (req.user.clusters_permitidos) {
      // Se já é array, usar diretamente; se é string, fazer parse
      clustersPermitidos = typeof req.user.clusters_permitidos === 'string' ? 
        JSON.parse(req.user.clusters_permitidos) : 
        req.user.clusters_permitidos;
    }
    
    if (clustersPermitidos.length === 0) {
      return res.status(403).json({ error: 'Usuário não tem acesso a nenhum cluster' });
    }

    // Adicionar filtro de cluster à requisição
    req.clustersPermitidos = clustersPermitidos;
    
    next();
  } catch (error) {
    console.error('Erro ao processar clusters permitidos:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Função helper para aplicar filtro de cluster em queries
const aplicarFiltroCluster = (req, baseQuery, clusterIdField = 'cluster_id') => {
  if (req.user.role === 'admin' || req.user.role === 'coordenador') {
    return baseQuery; // Sem filtro para admin/coordenador
  }

  if (!req.clustersPermitidos || req.clustersPermitidos.length === 0) {
    return `${baseQuery} WHERE 1=0`; // Nenhum resultado
  }

  const clusterIds = req.clustersPermitidos.join(',');
  const whereClause = baseQuery.toLowerCase().includes('where') ? 
    ` AND ${clusterIdField} IN (${clusterIds})` :
    ` WHERE ${clusterIdField} IN (${clusterIds})`;
    
  return baseQuery + whereClause;
};

// Função para verificar se usuário pode acessar cluster específico
const podeAcessarCluster = (req, clusterId) => {
  if (req.user.role === 'admin' || req.user.role === 'coordenador') {
    return true;
  }

  return req.clustersPermitidos && req.clustersPermitidos.includes(parseInt(clusterId));
};

module.exports = {
  clusterFilterMiddleware,
  aplicarFiltroCluster,
  podeAcessarCluster
};
