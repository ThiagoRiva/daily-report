#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('../config');

// Conectar ao banco de dados
const dbPath = path.resolve(config.dbPath);
const dbDirectory = path.dirname(dbPath);
const db = new sqlite3.Database(dbPath);

// Funções de administração
const commands = {
  // Listar usuários
  users: () => {
    console.log('📋 Usuários do Sistema:');
    db.all('SELECT id, nome, email, role, clusters_permitidos, ativo FROM usuarios ORDER BY nome', (err, rows) => {
      if (err) {
        console.error('Erro:', err);
        return;
      }
      
      rows.forEach(user => {
        const clusters = user.clusters_permitidos ? JSON.parse(user.clusters_permitidos) : [];
        console.log(`${user.id}. ${user.nome} (${user.email})`);
        console.log(`   Role: ${user.role} | Clusters: [${clusters.join(',')}] | Ativo: ${user.ativo ? 'Sim' : 'Não'}`);
        console.log('');
      });
      
      db.close();
    });
  },

  // Criar usuário admin
  createAdmin: (nome, email, senha) => {
    if (!nome || !email || !senha) {
      console.log('❌ Uso: node dbAdmin.js createAdmin "Nome" "email@empresa.com" "senha123"');
      return;
    }

    const bcrypt = require('bcryptjs');
    const senhaHash = bcrypt.hashSync(senha, 10);

    db.run(
      'INSERT INTO usuarios (nome, email, senha, role, clusters_permitidos, ativo) VALUES (?, ?, ?, ?, ?, ?)',
      [nome, email, senhaHash, 'admin', '[1,2,3,4,5]', 1],
      function(err) {
        if (err) {
          console.error('❌ Erro ao criar admin:', err.message);
        } else {
          console.log('✅ Admin criado com sucesso!');
          console.log(`   ID: ${this.lastID}`);
          console.log(`   Nome: ${nome}`);
          console.log(`   Email: ${email}`);
          console.log(`   Senha: ${senha}`);
        }
        db.close();
      }
    );
  },

  // Resetar senha
  resetPassword: (email, novaSenha) => {
    if (!email || !novaSenha) {
      console.log('❌ Uso: node dbAdmin.js resetPassword "email@empresa.com" "novaSenha123"');
      return;
    }

    const bcrypt = require('bcryptjs');
    const senhaHash = bcrypt.hashSync(novaSenha, 10);

    db.run(
      'UPDATE usuarios SET senha = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?',
      [senhaHash, email],
      function(err) {
        if (err) {
          console.error('❌ Erro ao resetar senha:', err.message);
        } else if (this.changes === 0) {
          console.log('❌ Usuário não encontrado');
        } else {
          console.log('✅ Senha resetada com sucesso!');
          console.log(`   Email: ${email}`);
          console.log(`   Nova senha: ${novaSenha}`);
        }
        db.close();
      }
    );
  },

  // Backup do banco
  backup: () => {
    const fs = require('fs');
    const backupPath = path.join(dbDirectory, `backup_${new Date().toISOString().split('T')[0]}.db`);
    
    db.serialize(() => {
      db.exec(`VACUUM INTO '${backupPath}'`, (err) => {
        if (err) {
          console.error('❌ Erro ao criar backup:', err.message);
        } else {
          console.log('✅ Backup criado com sucesso!');
          console.log(`   Arquivo: ${backupPath}`);
        }
        db.close();
      });
    });
  },

  // Estatísticas
  stats: () => {
    console.log('📊 Estatísticas do Sistema:');
    
    const queries = [
      'SELECT COUNT(*) as total FROM usuarios',
      'SELECT COUNT(*) as total FROM clusters',
      'SELECT COUNT(*) as total FROM usinas',
      'SELECT COUNT(*) as total FROM tecnicos',
      'SELECT COUNT(*) as total FROM atividades',
      'SELECT COUNT(*) as total FROM status_tecnico'
    ];
    
    const labels = ['Usuários', 'Clusters', 'Usinas', 'Técnicos', 'Atividades', 'Status Técnico'];
    
    let completed = 0;
    queries.forEach((query, index) => {
      db.get(query, (err, row) => {
        if (!err) {
          console.log(`${labels[index]}: ${row.total}`);
        }
        completed++;
        if (completed === queries.length) {
          db.close();
        }
      });
    });
  },

  // Ajuda
  help: () => {
    console.log(`
🛠️  Script de Administração do Banco de Dados

Comandos disponíveis:
  users              - Listar todos os usuários
  createAdmin        - Criar usuário administrador
  resetPassword      - Resetar senha de usuário
  backup             - Criar backup do banco
  stats              - Mostrar estatísticas
  help               - Mostrar esta ajuda

Exemplos:
  node dbAdmin.js users
  node dbAdmin.js createAdmin "João Silva" "joao@empresa.com" "senha123"
  node dbAdmin.js resetPassword "admin@empresa.com" "novaSenha123"
  node dbAdmin.js backup
  node dbAdmin.js stats
`);
  }
};

// Executar comando
const command = process.argv[2];
const args = process.argv.slice(3);

if (!command || !commands[command]) {
  commands.help();
} else {
  commands[command](...args);
}
