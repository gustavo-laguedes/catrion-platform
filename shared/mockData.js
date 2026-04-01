window.DevMock = (() => {
  const tenants = [
    {
      id: 1,
      tenantId: 'clube-suplemento',
      nome: 'Clube do Suplemento',
      cnpj: '12.345.678/0001-90',
      status: 'ativo',
      plano: 'Pro',
      vencimento: '2026-03-28',
      adimplencia: 'adimplente',
      onboarding: 'implantado',
      notes: 'Cliente piloto do Core POS.',
      modules: [
        { key: 'core', nome: 'Core', status: 'ativo', environment: 'produção', version: '0.9.3', flags: ['split-payment', 'cash-session'] },
        { key: 'line', nome: 'Line', status: 'implantando', environment: 'homologação', version: '0.1.0', flags: ['lot-trace'] }
      ],
      metrics: { usuariosOnline: 3, logsCriticos: 1, backups: 2 }
    },
    {
      id: 2,
      tenantId: 'aco-fer',
      nome: 'Aço Fer',
      cnpj: '98.111.222/0001-44',
      status: 'ativo',
      plano: 'Enterprise',
      vencimento: '2026-03-24',
      adimplencia: 'adimplente',
      onboarding: 'implantando',
      notes: 'Tenant estratégico para Gate e Line.',
      modules: [
        { key: 'gate', nome: 'Gate', status: 'ativo', environment: 'produção', version: '0.2.1', flags: ['visitor-print'] },
        { key: 'line', nome: 'Line', status: 'ativo', environment: 'produção', version: '0.3.5', flags: ['traceability', 'labels'] }
      ],
      metrics: { usuariosOnline: 5, logsCriticos: 0, backups: 4 }
    },
    {
      id: 3,
      tenantId: 'mercadinho-vila',
      nome: 'Mercadinho Vila',
      cnpj: '11.456.222/0001-77',
      status: 'bloqueado',
      plano: 'Start',
      vencimento: '2026-03-10',
      adimplencia: 'inadimplente',
      onboarding: 'implantado',
      notes: 'Bloqueado por inadimplência.',
      modules: [
        { key: 'core', nome: 'Core', status: 'suspenso', environment: 'produção', version: '0.9.1', flags: [] }
      ],
      metrics: { usuariosOnline: 0, logsCriticos: 2, backups: 1 }
    }
  ];

  const users = [
    {
      id: 1,
      nome: 'Gustavo Guedes',
      email: 'gustavo@catrion.com.br',
      status: 'ativo',
      tenantId: 'catrion',
      role: 'admin_catrion',
      modules: ['devpanel', 'core', 'gate', 'line'],
      online: true
    },
    {
      id: 2,
      nome: 'Ana Dev',
      email: 'ana@catrion.com.br',
      status: 'ativo',
      tenantId: 'catrion',
      role: 'admin_catrion',
      modules: ['devpanel', 'core'],
      online: true
    },
    {
      id: 3,
      nome: 'Pamela Souza',
      email: 'pamela@clubesuplemento.com',
      status: 'ativo',
      tenantId: 'clube-suplemento',
      role: 'admin_tenant',
      modules: ['core'],
      online: true
    },
    {
      id: 4,
      nome: 'Carlos Lima',
      email: 'carlos@acofer.com.br',
      status: 'ativo',
      tenantId: 'aco-fer',
      role: 'gerente',
      modules: ['line', 'gate'],
      online: false
    }
  ];

  const permissions = [
    { role: 'operador', modulo: 'Core', actions: ['leitura', 'operacao'] },
    { role: 'gerente', modulo: 'Line', actions: ['leitura', 'operacao'] },
    { role: 'admin_tenant', modulo: 'Tenant', actions: ['leitura', 'operacao', 'admin'] },
    { role: 'admin_catrion', modulo: 'Plataforma', actions: ['leitura', 'operacao', 'admin', 'critico'] }
  ];

  const logs = [
    {
      id: 1,
      date: '2026-03-23 08:40',
      actor: 'Sistema',
      tenantId: 'mercadinho-vila',
      module: 'core',
      severity: 'danger',
      action: 'bloqueio_automatico',
      reason: 'inadimplencia'
    },
    {
      id: 2,
      date: '2026-03-23 09:15',
      actor: 'Ana Dev',
      tenantId: 'aco-fer',
      module: 'line',
      severity: 'info',
      action: 'feature_flag_ativada',
      reason: 'labels'
    },
    {
      id: 3,
      date: '2026-03-23 09:48',
      actor: 'Gustavo Guedes',
      tenantId: 'clube-suplemento',
      module: 'core',
      severity: 'warn',
      action: 'backup_solicitado',
      reason: 'rotina'
    }
  ];

  const moduleCatalog = [
    { key: 'core', nome: 'Core', tenants: 2, version: '0.9.3', incidentes: 1, ambiente: 'produção' },
    { key: 'gate', nome: 'Gate', tenants: 1, version: '0.2.1', incidentes: 0, ambiente: 'produção' },
    { key: 'line', nome: 'Line', tenants: 2, version: '0.3.5', incidentes: 0, ambiente: 'produção' },
    { key: 'devpanel', nome: 'Dev Panel', tenants: 1, version: '0.2.0', incidentes: 0, ambiente: 'mock' }
  ];

  function countActiveTenants() {
    return tenants.filter((t) => t.status === 'ativo').length;
  }

  function countBlockedTenants() {
    return tenants.filter((t) => t.status === 'bloqueado').length;
  }

  function countInadimplenteTenants() {
    return tenants.filter((t) => t.adimplencia === 'inadimplente').length;
  }

  function countOnlineUsers() {
    return users.filter((u) => u.online).length;
  }

  function countActiveModules() {
    return tenants.flatMap((t) => t.modules).filter((m) => m.status === 'ativo').length;
  }

  function getTenantById(tenantId) {
    return tenants.find((t) => t.tenantId === tenantId) || null;
  }

  function getUsersByTenant(tenantId) {
    return users.filter((u) => u.tenantId === tenantId);
  }

  function getLogsByTenant(tenantId) {
    return logs.filter((l) => l.tenantId === tenantId);
  }

  return {
    tenants,
    users,
    permissions,
    logs,
    moduleCatalog,
    countActiveTenants,
    countBlockedTenants,
    countInadimplenteTenants,
    countOnlineUsers,
    countActiveModules,
    getTenantById,
    getUsersByTenant,
    getLogsByTenant
  };
})();