-- Inserir Clusters
INSERT OR IGNORE INTO clusters (nome, ativo) VALUES 
('Araraquara', 1),
('Barretos', 1),
('Aracatuba', 1),
('Porangatu', 1),
('Nova Crixas', 1);

-- Inserir Usinas
INSERT OR IGNORE INTO usinas (nome, cluster_id, ativo) VALUES 
-- Araraquara (cluster_id = 1)
('Boa Esperanca do Sul II', 1, 1),
('Boa Esperanca do Sul V', 1, 1),
('Araraquara III', 1, 1),
('Araraquara IV', 1, 1),
('Descalvado I', 1, 1),
('Dourado III', 1, 1),
('Santa Lucia I', 1, 1),
('Rincao', 1, 1),

-- Barretos (cluster_id = 2)
('Altair I', 2, 1),
('Miguelopolis', 2, 1),

-- Nova Crixas (cluster_id = 5)
('Nova Crixas I', 5, 1),
('Nova Crixas II', 5, 1),

-- Porangatu (cluster_id = 4)
('Porangatu I', 4, 1),
('Novo Planalto II', 4, 1),
('Novo Planalto I', 4, 1),
('Minacu', 4, 1),

-- Aracatuba (cluster_id = 3)
('Pompeia II', 3, 1),
('Piacatu I', 3, 1),
('Avanhandava I', 3, 1),
('Getulina II', 3, 1);

-- Inserir Técnicos por Cluster
INSERT OR IGNORE INTO tecnicos (nome, funcao, cluster_id, ativo) VALUES 
-- Araraquara (cluster_id = 1)
('Claudevan da Silva', 'Tecnico Eletrotecnico', 1, 1),
('Aparecido', 'Mantenedor', 1, 1),
('Luiz Vilela', 'Tecnico Eletrotecnico', 1, 1),
('Vitor Silva', 'Mantenedor', 1, 1),

-- Barretos (cluster_id = 2)
('Victor Santos', 'Tecnico Eletrotecnico', 2, 1),
('Richard', 'Mantenedor', 2, 1),

-- Aracatuba (cluster_id = 3)
('Eduardo Costa', 'Tecnico Eletrotecnico', 3, 1),
('Diogo Ito', 'Mantenedor', 3, 1),

-- Porangatu (cluster_id = 4)
('Sergio Ribeiro', 'Tecnico Eletrotecnico', 4, 1),

-- Nova Crixas (cluster_id = 5)
('Jose Morais', 'Tecnico Eletrotecnico', 5, 1),
('Igor Souza', 'Mantenedor', 5, 1);

-- Inserir Funções
INSERT OR IGNORE INTO funcoes (nome, descricao) VALUES
('Eletricista', 'Responsável por atividades elétricas'),
('Técnico de Campo', 'Atividades gerais de campo'),
('Supervisor', 'Supervisão de equipes'),
('Operador', 'Operação de equipamentos');

-- Inserir usuário administrador padrão (senha padrão: admin123)
INSERT OR IGNORE INTO usuarios (nome, email, senha, role, clusters_permitidos, ativo) VALUES
('Administrador', 'admin@empresa.com', '$2b$10$nFDmklUI.PwcBea56kC8kujkQnaILRnr4E8JU1JebTjYtTdiQcHES', 'admin', '[1,2,3,4,5]', 1);
