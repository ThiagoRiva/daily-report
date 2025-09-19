const db = require('../database/database');

// Middleware de auditoria
const auditMiddleware = (acao, tabela) => {
  return (req, res, next) => {
    // Salvar dados originais para comparação
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Capturar dados antes da ação (para UPDATE/DELETE)
    let dadosAntes = null;
    
    if ((acao === 'UPDATE' || acao === 'DELETE') && req.params.id) {
      // Buscar dados antes da modificação
      const getId = req.params.id;
      
      // Função para buscar dados baseado na tabela
      const buscarDadosAntes = () => {
        return new Promise((resolve) => {
          switch (tabela) {
            case 'atividades':
              db.db.get('SELECT * FROM atividades WHERE id = ?', [getId], (err, row) => {
                resolve(err ? null : row);
              });
              break;
            case 'status_tecnico':
              db.db.get('SELECT * FROM status_tecnico WHERE id = ?', [getId], (err, row) => {
                resolve(err ? null : row);
              });
              break;
            case 'clusters':
              db.db.get('SELECT * FROM clusters WHERE id = ?', [getId], (err, row) => {
                resolve(err ? null : row);
              });
              break;
            case 'usinas':
              db.db.get('SELECT * FROM usinas WHERE id = ?', [getId], (err, row) => {
                resolve(err ? null : row);
              });
              break;
            case 'tecnicos':
              db.db.get('SELECT * FROM tecnicos WHERE id = ?', [getId], (err, row) => {
                resolve(err ? null : row);
              });
              break;
            default:
              resolve(null);
          }
        });
      };
      
      // Buscar dados antes da ação
      buscarDadosAntes().then(dados => {
        dadosAntes = dados;
        req.dadosAntes = dadosAntes;
        next();
      });
    } else {
      next();
    }

    // Interceptar resposta para capturar resultado
    res.json = function(data) {
      // Registrar auditoria após sucesso
      if (res.statusCode >= 200 && res.statusCode < 300) {
        registrarAuditoria(req, acao, tabela, dadosAntes, data);
      }
      
      return originalJson.call(this, data);
    };
  };
};

// Função para registrar auditoria
const registrarAuditoria = (req, acao, tabela, dadosAntes, dadosDepois) => {
  if (!req.user) return; // Só auditar ações autenticadas
  
  const auditData = {
    usuario_id: req.user.id,
    acao,
    tabela,
    registro_id: req.params.id || (dadosDepois && dadosDepois.id) || null,
    dados_antes: dadosAntes ? JSON.stringify(dadosAntes) : null,
    dados_depois: JSON.stringify(dadosDepois),
    ip_address: req.ip || req.connection.remoteAddress,
    user_agent: req.get('User-Agent') || null
  };

  db.db.run(`
    INSERT INTO auditoria (
      usuario_id, acao, tabela, registro_id, 
      dados_antes, dados_depois, ip_address, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    auditData.usuario_id,
    auditData.acao,
    auditData.tabela,
    auditData.registro_id,
    auditData.dados_antes,
    auditData.dados_depois,
    auditData.ip_address,
    auditData.user_agent
  ], (err) => {
    if (err) {
      console.error('Erro ao registrar auditoria:', err);
    }
  });
};

module.exports = {
  auditMiddleware,
  registrarAuditoria
};
