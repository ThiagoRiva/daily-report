-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'tecnico',
    clusters_permitidos TEXT DEFAULT '[]',
    ativo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);

-- Tabela de Clusters
CREATE TABLE IF NOT EXISTS clusters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(100) NOT NULL UNIQUE,
    ativo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Usinas
CREATE TABLE IF NOT EXISTS usinas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(200) NOT NULL,
    cluster_id INTEGER NOT NULL,
    ativo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cluster_id) REFERENCES clusters(id),
    UNIQUE(nome, cluster_id)
);

-- Tabela de Técnicos
CREATE TABLE IF NOT EXISTS tecnicos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(100) NOT NULL,
    funcao VARCHAR(100) NOT NULL,
    cluster_id INTEGER,
    ativo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cluster_id) REFERENCES clusters(id),
    UNIQUE(nome, cluster_id)
);

-- Tabela de Funções
CREATE TABLE IF NOT EXISTS funcoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Atividades
CREATE TABLE IF NOT EXISTS atividades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data DATE NOT NULL,
    cluster_id INTEGER NOT NULL,
    usina_id INTEGER NOT NULL,
    tecnico_id INTEGER NOT NULL,
    funcao_id INTEGER,
    tarefa TEXT NOT NULL,
    inicio TIME NOT NULL,
    fim TIME NOT NULL,
    observacoes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cluster_id) REFERENCES clusters(id),
    FOREIGN KEY (usina_id) REFERENCES usinas(id),
    FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id),
    FOREIGN KEY (funcao_id) REFERENCES funcoes(id)
);

-- Tabela de Status Técnico
CREATE TABLE IF NOT EXISTS status_tecnico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data DATE NOT NULL,
    cluster_id INTEGER NOT NULL,
    usina_id INTEGER NOT NULL,
    tecnico_id INTEGER NOT NULL,
    
    -- Inversores
    inversores_ok100 BOOLEAN DEFAULT 1,
    inversores_motivo TEXT,
    inversores_acao_prevista TEXT,
    
    -- Strings
    strings_ok100 BOOLEAN DEFAULT 1,
    strings_motivo TEXT,
    strings_acao_prevista TEXT,
    
    -- Trackers
    trackers_ok100 BOOLEAN DEFAULT 1,
    trackers_motivo TEXT,
    trackers_acao_prevista TEXT,
    
    observacoes_gerais TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cluster_id) REFERENCES clusters(id),
    FOREIGN KEY (usina_id) REFERENCES usinas(id),
    FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id),
    
    -- Constraint para evitar duplicatas por data/usina
    UNIQUE(data, usina_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_atividades_data ON atividades(data);
CREATE INDEX IF NOT EXISTS idx_atividades_cluster ON atividades(cluster_id);
CREATE INDEX IF NOT EXISTS idx_atividades_usina ON atividades(usina_id);
CREATE INDEX IF NOT EXISTS idx_atividades_tecnico ON atividades(tecnico_id);

CREATE INDEX IF NOT EXISTS idx_status_data ON status_tecnico(data);
CREATE INDEX IF NOT EXISTS idx_status_cluster ON status_tecnico(cluster_id);
CREATE INDEX IF NOT EXISTS idx_status_usina ON status_tecnico(usina_id);
CREATE INDEX IF NOT EXISTS idx_status_tecnico ON status_tecnico(tecnico_id);

-- Tabela de Auditoria
CREATE TABLE IF NOT EXISTS auditoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    acao VARCHAR(50) NOT NULL,
    tabela VARCHAR(100) NOT NULL,
    registro_id INTEGER,
    dados_antes TEXT,
    dados_depois TEXT NOT NULL,
    ip_address VARCHAR(100),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_tabela ON auditoria(tabela);
CREATE INDEX IF NOT EXISTS idx_auditoria_created_at ON auditoria(created_at);
