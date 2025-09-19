const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('../config');

// Conectar ao banco de dados
const dbPath = path.resolve(config.dbPath);
const db = new sqlite3.Database(dbPath);

async function createUser(nome, email, senha, role = 'tecnico') {
  try {
    // Hash da senha
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(senha, saltRounds);
    
    // Inserir usuário no banco
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO usuarios (nome, email, senha, role, ativo) VALUES (?, ?, ?, ?, ?)',
        [nome, email, senhaHash, role, 1],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  } catch (error) {
    throw error;
  }
}

// Função para criar usuários iniciais
async function createInitialUsers() {
  try {
    console.log('Criando usuários iniciais...');
    
    // Usuário administrador
    await createUser('Administrador', 'admin@empresa.com', 'admin123', 'admin');
    console.log('✅ Usuário admin criado: admin@empresa.com / admin123');
    
    // Usuário coordenador
    await createUser('Coordenador', 'coordenador@empresa.com', 'coord123', 'coordenador');
    console.log('✅ Usuário coordenador criado: coordenador@empresa.com / coord123');
    
    // Usuário técnico exemplo
    await createUser('Técnico Exemplo', 'tecnico@empresa.com', 'tecnico123', 'tecnico');
    console.log('✅ Usuário técnico criado: tecnico@empresa.com / tecnico123');
    
    console.log('\n🎉 Usuários criados com sucesso!');
    console.log('\n📋 Credenciais de acesso:');
    console.log('Admin: admin@empresa.com / admin123');
    console.log('Coordenador: coordenador@empresa.com / coord123');
    console.log('Técnico: tecnico@empresa.com / tecnico123');
    
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      console.log('⚠️ Usuários já existem no banco de dados');
    } else {
      console.error('❌ Erro ao criar usuários:', error.message);
    }
  } finally {
    db.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createInitialUsers();
}

module.exports = { createUser };
