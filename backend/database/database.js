const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const config = require('../config');

class Database {
  constructor() {
    this.db = null;
    this.dbPath = path.resolve(config.dbPath);
    this.init();
  }

  init() {
    // Criar diretório do banco se não existir
    const dbDir = path.dirname(this.dbPath);
    try {
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
    } catch (err) {
      console.error(`Não foi possível preparar o diretório do banco de dados (${dbDir}):`, err.message);
      throw err;
    }

    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error('Erro ao conectar com o banco de dados:', err.message);
      } else {
        console.log(`Conectado ao banco de dados SQLite em ${this.dbPath}.`);
        this.createTables();
      }
    });
  }

  createTables() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    let schema;

    try {
      schema = fs.readFileSync(schemaPath, 'utf8');
    } catch (err) {
      console.error(
        `Não foi possível carregar o schema do banco de dados em ${schemaPath}. ` +
          'Verifique se o arquivo existe e possui permissões de leitura.'
      );
      console.error('Detalhes do erro:', err.message);
      return;
    }

    this.db.exec(schema, (err) => {
      if (err) {
        console.error('Erro ao criar tabelas:', err.message);
      } else {
        console.log('Tabelas criadas com sucesso.');
        this.seedData();
      }
    });
  }

  seedData() {
    // Verificar se já existem dados antes de inserir
    this.db.get('SELECT COUNT(*) as count FROM clusters', (err, row) => {
      if (err) {
        console.error('Erro ao verificar dados existentes:', err.message);
        return;
      }
      
      if (row.count > 0) {
        console.log('Dados iniciais já existem. Pulando seed data.');
        return;
      }
      
      console.log('Inserindo dados iniciais...');
      const seedPath = path.join(__dirname, 'seedData.sql');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      
      this.db.exec(seedSql, (err) => {
        if (err) {
          console.error('Erro ao inserir dados iniciais:', err.message);
        } else {
          console.log('Dados iniciais inseridos com sucesso.');
        }
      });
    });
  }

  // Métodos para Clusters
  getAllClusters(callback) {
    this.db.all('SELECT * FROM clusters ORDER BY nome', callback);
  }

  createCluster(data, callback) {
    const { nome, ativo = 1 } = data;
    this.db.run(
      'INSERT OR IGNORE INTO clusters (nome, ativo) VALUES (?, ?)',
      [nome, ativo],
      function(err) {
        if (err && err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          callback(new Error('Cluster com este nome já existe'));
        } else {
          callback.call(this, err);
        }
      }
    );
  }

  updateCluster(id, data, callback) {
    const { nome, ativo } = data;
    this.db.run(
      'UPDATE clusters SET nome = ?, ativo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nome, ativo, id],
      callback
    );
  }

  deleteCluster(id, callback) {
    this.db.run('DELETE FROM clusters WHERE id = ?', [id], callback);
  }

  // Métodos para Usinas
  getAllUsinas(callback) {
    this.db.all(`
      SELECT u.*, c.nome as cluster_nome 
      FROM usinas u 
      LEFT JOIN clusters c ON u.cluster_id = c.id 
      ORDER BY c.nome, u.nome
    `, callback);
  }

  createUsina(data, callback) {
    const { nome, cluster_id, ativo = 1 } = data;
    this.db.run(
      'INSERT OR IGNORE INTO usinas (nome, cluster_id, ativo) VALUES (?, ?, ?)',
      [nome, cluster_id, ativo],
      function(err) {
        if (err && err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          callback(new Error('Usina com este nome já existe neste cluster'));
        } else {
          callback.call(this, err);
        }
      }
    );
  }

  updateUsina(id, data, callback) {
    const { nome, cluster_id, ativo } = data;
    this.db.run(
      'UPDATE usinas SET nome = ?, cluster_id = ?, ativo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nome, cluster_id, ativo, id],
      callback
    );
  }

  deleteUsina(id, callback) {
    this.db.run('DELETE FROM usinas WHERE id = ?', [id], callback);
  }

  // Métodos para Técnicos
  getAllTecnicos(callback) {
    this.db.all(`
      SELECT t.*, c.nome as cluster_nome 
      FROM tecnicos t 
      LEFT JOIN clusters c ON t.cluster_id = c.id 
      ORDER BY c.nome, t.nome
    `, callback);
  }

  createTecnico(data, callback) {
    const { nome, funcao, cluster_id, ativo = 1 } = data;
    this.db.run(
      'INSERT OR IGNORE INTO tecnicos (nome, funcao, cluster_id, ativo) VALUES (?, ?, ?, ?)',
      [nome, funcao, cluster_id, ativo],
      function(err) {
        if (err && err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          callback(new Error('Técnico com este nome já existe neste cluster'));
        } else {
          callback.call(this, err);
        }
      }
    );
  }

  updateTecnico(id, data, callback) {
    const { nome, funcao, cluster_id, ativo } = data;
    this.db.run(
      'UPDATE tecnicos SET nome = ?, funcao = ?, cluster_id = ?, ativo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nome, funcao, cluster_id, ativo, id],
      callback
    );
  }

  deleteTecnico(id, callback) {
    this.db.run('DELETE FROM tecnicos WHERE id = ?', [id], callback);
  }

  // Métodos para Funções
  getAllFuncoes(callback) {
    this.db.all('SELECT * FROM funcoes ORDER BY nome', callback);
  }

  // Métodos para Atividades
  getAllAtividades(filters, callback) {
    let query = `
      SELECT a.*, c.nome as cluster_nome, u.nome as usina_nome, t.nome as tecnico_nome
      FROM atividades a
      LEFT JOIN clusters c ON a.cluster_id = c.id
      LEFT JOIN usinas u ON a.usina_id = u.id
      LEFT JOIN tecnicos t ON a.tecnico_id = t.id
      WHERE 1=1
    `;
    let params = [];

    if (filters.dataInicio) {
      query += ' AND a.data >= ?';
      params.push(filters.dataInicio);
    }
    if (filters.dataFim) {
      query += ' AND a.data <= ?';
      params.push(filters.dataFim);
    }
    if (filters.clusterId) {
      query += ' AND a.cluster_id = ?';
      params.push(filters.clusterId);
    }
    if (filters.usinaId) {
      query += ' AND a.usina_id = ?';
      params.push(filters.usinaId);
    }
    if (filters.tecnicoId) {
      query += ' AND a.tecnico_id = ?';
      params.push(filters.tecnicoId);
    }

    query += ' ORDER BY a.data DESC, a.inicio ASC';

    this.db.all(query, params, callback);
  }

  createAtividade(data, callback) {
    const { data: date, cluster_id, usina_id, tecnico_id, funcao_id, tarefa, inicio, fim, observacoes } = data;
    this.db.run(`
      INSERT INTO atividades (data, cluster_id, usina_id, tecnico_id, funcao_id, tarefa, inicio, fim, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [date, cluster_id, usina_id, tecnico_id, funcao_id, tarefa, inicio, fim, observacoes], callback);
  }

  // Métodos para Status Técnico
  getAllStatusTecnico(filters, callback) {
    let query = `
      SELECT s.*, c.nome as cluster_nome, u.nome as usina_nome, t.nome as tecnico_nome
      FROM status_tecnico s
      LEFT JOIN clusters c ON s.cluster_id = c.id
      LEFT JOIN usinas u ON s.usina_id = u.id
      LEFT JOIN tecnicos t ON s.tecnico_id = t.id
      WHERE 1=1
    `;
    let params = [];

    if (filters.dataInicio) {
      query += ' AND s.data >= ?';
      params.push(filters.dataInicio);
    }
    if (filters.dataFim) {
      query += ' AND s.data <= ?';
      params.push(filters.dataFim);
    }
    if (filters.clusterId) {
      query += ' AND s.cluster_id = ?';
      params.push(filters.clusterId);
    }
    if (filters.usinaId) {
      query += ' AND s.usina_id = ?';
      params.push(filters.usinaId);
    }
    if (filters.tecnicoId) {
      query += ' AND s.tecnico_id = ?';
      params.push(filters.tecnicoId);
    }

    query += ' ORDER BY s.data DESC';

    this.db.all(query, params, callback);
  }

  createStatusTecnico(data, callback) {
    const {
      data: date, cluster_id, usina_id, tecnico_id,
      inversores_ok100, inversores_motivo, inversores_acao_prevista,
      strings_ok100, strings_motivo, strings_acao_prevista,
      trackers_ok100, trackers_motivo, trackers_acao_prevista,
      observacoes_gerais
    } = data;

    this.db.run(`
      INSERT OR REPLACE INTO status_tecnico (
        data, cluster_id, usina_id, tecnico_id,
        inversores_ok100, inversores_motivo, inversores_acao_prevista,
        strings_ok100, strings_motivo, strings_acao_prevista,
        trackers_ok100, trackers_motivo, trackers_acao_prevista,
        observacoes_gerais
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      date, cluster_id, usina_id, tecnico_id,
      inversores_ok100, inversores_motivo, inversores_acao_prevista,
      strings_ok100, strings_motivo, strings_acao_prevista,
      trackers_ok100, trackers_motivo, trackers_acao_prevista,
      observacoes_gerais
    ], callback);
  }

  deleteAtividade(id, callback) {
    this.db.run('DELETE FROM atividades WHERE id = ?', [id], callback);
  }

  deleteStatusTecnico(id, callback) {
    this.db.run('DELETE FROM status_tecnico WHERE id = ?', [id], callback);
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Erro ao fechar banco de dados:', err.message);
        } else {
          console.log('Conexão com banco de dados fechada.');
        }
      });
    }
  }
}

module.exports = new Database();
