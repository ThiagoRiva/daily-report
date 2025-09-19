import { format } from 'date-fns';

// Gerar relatório diário de atividades
export const generateDailyReportWhatsApp = ({ 
  cluster, 
  data, 
  tecnico, 
  usina, 
  atividades, 
  tcuComFalha, 
  observacoesGerais 
}) => {
  const dataFormatada = format(new Date(data), 'dd/MM/yyyy');
  
  // Gerar linhas de atividades numeradas
  const linhasAtividades = atividades
    .map((atividade, index) => {
      const inicio = atividade.inicio || '--:--';
      const fim = atividade.fim || '--:--';
      const usinaInfo = atividade.usinaName && usina === 'Múltiplas Usinas' ? ` (${atividade.usinaName})` : '';
      return `${index + 1}) ${atividade.tarefa}${usinaInfo} – ⏰ ${inicio}/${fim}`;
    })
    .join('\n');

  // Gerar observações
  const observacoes = observacoesGerais.trim() || '-';

  // Gerar status de TCU
  let statusTCU = 'NÃO';
  if (tcuComFalha.tem && tcuComFalha.falhas.length > 0) {
    const falhasDetalhadas = tcuComFalha.falhas
      .filter(falha => falha.skid || falha.tracker || falha.tipoFalha)
      .map(falha => {
        const partes = [];
        if (falha.skid) partes.push(`Skid: ${falha.skid}`);
        if (falha.tracker) partes.push(`Tracker: ${falha.tracker}`);
        
        let detalhes = partes.join(' - ');
        
        if (falha.tipoFalha) {
          detalhes += ` (${falha.tipoFalha})`;
        }
        
        if (falha.previsaoInspecao) {
          const dataPrevisao = format(new Date(falha.previsaoInspecao), 'dd/MM/yyyy');
          detalhes += ` - Previsão: ${dataPrevisao}`;
        }
        
        return detalhes;
      })
      .join('\n• ');
    
    statusTCU = falhasDetalhadas ? `SIM\n• ${falhasDetalhadas}` : 'SIM';
  }

  return `🔆 *Relatório Diário ${cluster} – ${dataFormatada}*
👷 Equipe: ${tecnico}
📍 Usina: ${usina}

🔧 *Atividades Programadas*
${linhasAtividades}

📌 *Observações*
${observacoes}

⚡ *TCU com falha*
${statusTCU}`;
};

// Gerar status técnico por usina
export const generateTechnicalStatusWhatsApp = ({ 
  usina, 
  data, 
  cluster, 
  tecnico, 
  inversores, 
  strings, 
  trackers, 
  observacoesGerais 
}) => {
  const dataFormatada = format(new Date(data), 'dd/MM/yyyy');
  
  // Função auxiliar para gerar status de subsistema
  const gerarStatusSubsistema = (subsistema, nome) => {
    const status = subsistema.ok100 ? 'SIM' : 'NÃO';
    let detalhes = '';
    
    if (!subsistema.ok100 && (subsistema.motivo || subsistema.acaoPrevista)) {
      const partes = [];
      if (subsistema.motivo) partes.push(`Motivo: ${subsistema.motivo}`);
      if (subsistema.acaoPrevista) partes.push(`Ação: ${subsistema.acaoPrevista}`);
      detalhes = `\n${partes.join('. ')}`;
    }
    
    return `🔧 *${nome}*: ${status}${detalhes}`;
  };

  const observacoes = observacoesGerais.trim() || '-';

  return `📍 *${usina}* – ${dataFormatada} – ${cluster}
👷 Técnico: ${tecnico}

${gerarStatusSubsistema(inversores, 'Inversores')}

${gerarStatusSubsistema(strings, 'Strings')}

${gerarStatusSubsistema(trackers, 'Trackers')}

📝 Observações: ${observacoes}`;
};

// Gerar status técnico consolidado por cluster
export const generateConsolidatedTechnicalStatusWhatsApp = (statusTecnicoArray, cluster, data) => {
  const dataFormatada = format(new Date(data), 'dd/MM/yyyy');
  
  const blocosPorUsina = statusTecnicoArray
    .map(status => generateTechnicalStatusWhatsApp(status))
    .join('\n\n');

  return `🗂️ *Status Técnico – ${cluster} – ${dataFormatada}*

${blocosPorUsina}`;
};

// Função auxiliar para formatar data
export const formatDateForWhatsApp = (date) => {
  return format(new Date(date), 'dd/MM/yyyy');
};

// Gerar relatório diário consolidado de todos os clusters
export const generateConsolidatedDailyReportWhatsApp = (data, clustersComRelatorios, allData, tcuPorCluster = {}) => {
  const dataFormatada = format(new Date(data), 'dd/MM/yyyy');
  
  let message = `📋 *Relatório Diário Consolidado – ${dataFormatada}*\n\n`;
  
  // Ordenar clusters por nome
  const clustersOrdenados = clustersComRelatorios
    .sort((a, b) => a.cluster.nome.localeCompare(b.cluster.nome));
  
  clustersOrdenados.forEach((clusterData, clusterIndex) => {
    const { cluster, atividades } = clusterData;
    
    // Separador entre clusters (exceto o primeiro)
    if (clusterIndex > 0) {
      message += '\n' + '─'.repeat(40) + '\n\n';
    }
    
    message += `🔆 *${cluster.nome.toUpperCase()}*\n`;
    
    // Buscar todos os técnicos únicos do cluster
    const tecnicosDoCluster = new Set();
    atividades.forEach(atividade => {
      tecnicosDoCluster.add(atividade.tecnicoId);
    });
    
    const nomesTecnicos = Array.from(tecnicosDoCluster)
      .map(tecnicoId => {
        const tecnico = allData.tecnicos.find(t => t.id === tecnicoId);
        return tecnico?.nome || 'Técnico Desconhecido';
      })
      .join(' / ');
    
    message += `👷 Equipe: ${nomesTecnicos}\n`;
    
    // Agrupar atividades por usina
    const atividadesPorUsina = {};
    atividades.forEach(atividade => {
      const usina = allData.usinas.find(u => u.id === atividade.usinaId);
      const usinaName = usina?.nome || 'Usina Desconhecida';
      
      if (!atividadesPorUsina[usinaName]) {
        atividadesPorUsina[usinaName] = [];
      }
      atividadesPorUsina[usinaName].push(atividade);
    });
    
    // Listar atividades por usina (sem separação por técnico)
    Object.keys(atividadesPorUsina).forEach(usinaName => {
      message += `\n📍 *${usinaName}*\n`;
      
      // Consolidar todas as atividades da usina (sem duplicatas)
      const atividadesUnicas = [];
      const atividadesVistas = new Set();
      
      atividadesPorUsina[usinaName].forEach(atividade => {
        const chave = `${atividade.tarefa}-${atividade.inicio}-${atividade.fim}`;
        if (!atividadesVistas.has(chave)) {
          atividadesVistas.add(chave);
          atividadesUnicas.push(atividade);
        }
      });
      
      // Ordenar por horário e numerar
      atividadesUnicas
        .sort((a, b) => a.inicio.localeCompare(b.inicio))
        .forEach((atividade, index) => {
          const inicio = atividade.inicio || '--:--';
          const fim = atividade.fim || '--:--';
          message += `${index + 1}) ${atividade.tarefa} – ⏰ ${inicio}/${fim}\n`;
        });
    });
  });
  
  // Adicionar seção de TCU com falha se houver registros
  const tcuComFalhas = Object.values(tcuPorCluster).filter(tcu => 
    tcu.data === data && tcu.tcuComFalha.tem && tcu.tcuComFalha.falhas.length > 0
  );
  
  if (tcuComFalhas.length > 0) {
    message += '\n\n' + '─'.repeat(40) + '\n\n';
    message += '⚡ *TCU COM FALHA REGISTRADAS*\n\n';
    
    tcuComFalhas.forEach(tcuData => {
      const cluster = allData.clusters.find(c => c.id === tcuData.clusterId);
      message += `🔆 *${cluster?.nome.toUpperCase()}*\n`;
      
      tcuData.tcuComFalha.falhas.forEach((falha, index) => {
        const identificacao = [];
        if (falha.skid) identificacao.push(`Skid: ${falha.skid}`);
        if (falha.tracker) identificacao.push(`Tracker: ${falha.tracker}`);
        
        message += `${index + 1}) ${identificacao.join(' - ')}`;
        
        if (falha.tipoFalha) {
          message += `\n   🔧 Tipo: ${falha.tipoFalha}`;
        }
        
        if (falha.previsaoInspecao) {
          const dataPrevisao = format(new Date(falha.previsaoInspecao), 'dd/MM/yyyy');
          message += `\n   📅 Previsão: ${dataPrevisao}`;
        }
        
        message += '\n\n';
      });
    });
  }
  
  return message.trim();
};

// Função auxiliar para validar dados antes de gerar mensagem
export const validateDataForWhatsApp = (data, type) => {
  const errors = [];
  
  if (!data.cluster) errors.push('Cluster é obrigatório');
  if (!data.data) errors.push('Data é obrigatória');
  if (!data.usina) errors.push('Usina é obrigatória');
  if (!data.tecnico) errors.push('Técnico é obrigatório');
  
  if (type === 'daily' && (!data.atividades || data.atividades.length === 0)) {
    errors.push('Pelo menos uma atividade é obrigatória');
  }
  
  if (type === 'technical' && (!data.inversores || !data.strings || !data.trackers)) {
    errors.push('Status de todos os subsistemas é obrigatório');
  }
  
  return errors;
};
