#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('../config');

// Conectar ao banco de dados
const dbPath = path.resolve(config.dbPath);
const dbDirectory = path.dirname(dbPath);
const db = new sqlite3.Database(dbPath);

async function cleanDuplicates() {
  console.log('🧹 Iniciando limpeza de duplicatas...');
  
  try {
    // 1. Backup de segurança
    console.log('📦 Criando backup de segurança...');
    const backupPath = path.join(dbDirectory, `backup_before_clean_${Date.now()}.db`);
    await new Promise((resolve, reject) => {
      db.exec(`VACUUM INTO '${backupPath}'`, (err) => {
        if (err) reject(err);
        else {
          console.log(`✅ Backup criado: ${backupPath}`);
          resolve();
        }
      });
    });

    // 2. Verificar duplicatas antes da limpeza
    const checkDuplicates = async (table, groupBy) => {
      return new Promise((resolve) => {
        db.all(`SELECT COUNT(*) as duplicates FROM (
          SELECT ${groupBy}, COUNT(*) as count 
          FROM ${table} 
          GROUP BY ${groupBy} 
          HAVING COUNT(*) > 1
        )`, (err, rows) => {
          resolve(err ? 0 : rows[0]?.duplicates || 0);
        });
      });
    };

    const clusterDupes = await checkDuplicates('clusters', 'nome');
    const usinaDupes = await checkDuplicates('usinas', 'nome, cluster_id');
    const tecnicoDupes = await checkDuplicates('tecnicos', 'nome, cluster_id');

    console.log(`📊 Duplicatas encontradas:`);
    console.log(`   Clusters: ${clusterDupes}`);
    console.log(`   Usinas: ${usinaDupes}`);
    console.log(`   Técnicos: ${tecnicoDupes}`);

    if (clusterDupes === 0 && usinaDupes === 0 && tecnicoDupes === 0) {
      console.log('✅ Nenhuma duplicata encontrada!');
      db.close();
      return;
    }

    // 3. Limpar duplicatas
    console.log('🧹 Removendo duplicatas...');
    
    const cleanQueries = [
      'DELETE FROM tecnicos WHERE id NOT IN (SELECT MIN(id) FROM tecnicos GROUP BY nome, cluster_id)',
      'DELETE FROM usinas WHERE id NOT IN (SELECT MIN(id) FROM usinas GROUP BY nome, cluster_id)',
      'DELETE FROM clusters WHERE id NOT IN (SELECT MIN(id) FROM clusters GROUP BY nome)'
    ];

    for (const query of cleanQueries) {
      await new Promise((resolve, reject) => {
        db.run(query, function(err) {
          if (err) {
            console.error(`❌ Erro na limpeza: ${err.message}`);
            reject(err);
          } else {
            console.log(`✅ Removidos ${this.changes} registros duplicados`);
            resolve();
          }
        });
      });
    }

    // 4. Verificar resultado final
    const finalCounts = await new Promise((resolve) => {
      db.all(`
        SELECT 'clusters' as tabela, COUNT(*) as total FROM clusters
        UNION ALL
        SELECT 'usinas' as tabela, COUNT(*) as total FROM usinas  
        UNION ALL
        SELECT 'tecnicos' as tabela, COUNT(*) as total FROM tecnicos
      `, (err, rows) => {
        resolve(err ? [] : rows);
      });
    });

    console.log('📊 Contagem final:');
    finalCounts.forEach(row => {
      console.log(`   ${row.tabela}: ${row.total}`);
    });

    console.log('🎉 Limpeza concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante limpeza:', error.message);
  } finally {
    db.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  cleanDuplicates();
}

module.exports = { cleanDuplicates };
