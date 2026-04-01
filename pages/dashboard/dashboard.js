(function () {
  const { DevRouter, DevAPI, DevState } = window;

  function loadingTemplate() {
    return `
      <section class="app-page">
        <header class="page-head">
          <div>
            <h1 class="page-title">Dashboard</h1>
            <p class="page-subtitle">A torre de controle da plataforma Catrion.</p>
          </div>
        </header>

        <div class="panel">
          <div class="panel-body">
            <div class="loading-box">Carregando dashboard do Supabase...</div>
          </div>
        </div>
      </section>
    `;
  }

  function renderDashboard(data) {
    const tenantsHtml = data.tenants.length
      ? data.tenants.map((tenant) => `
          <button class="tenant-mini-card" type="button" data-route="empresa" data-tenant="${tenant.tenantId}">
            <div class="tenant-mini-top">
              <div class="tenant-mini-name">${tenant.nome}</div>
              <span class="status-badge status-${tenant.status}">${tenant.status}</span>
            </div>
            <div class="tenant-mini-line">tenant_id: ${tenant.tenantId}</div>
            <div class="tenant-mini-line">plano: ${tenant.plano}</div>
            <div class="tenant-mini-line">financeiro: ${tenant.adimplencia}</div>
          </button>
        `).join('')
      : `<div class="empty-inline">Nenhum tenant cadastrado ainda.</div>`;

    const modulesHtml = data.modules.length
      ? data.modules.map((module) => `
          <div class="list-row">
            <div>
              <div class="list-title">${module.nome}</div>
              <div class="list-subtitle">${module.domain}</div>
            </div>
            <div class="list-meta">${module.ativos}/${module.tenants} ativos</div>
          </div>
        `).join('')
      : `<div class="empty-inline">Nenhum módulo encontrado.</div>`;

    return `
      <section class="app-page">
        <header class="page-head">
          <div>
            <h1 class="page-title">Dashboard</h1>
            <p class="page-subtitle">A torre de controle da plataforma Catrion.</p>
          </div>

          <div class="page-actions">
            <button class="btn-ghost" type="button" onclick="window.DevRouter.navigate('cadastros')">Ver cadastros</button>
          </div>
        </header>

        <section class="grid-kpis">
          <article class="kpi-card">
            <div class="kpi-label">Total de empresas</div>
            <div class="kpi-value">${data.counters.totalTenants}</div>
            <div class="kpi-meta">Tenants cadastrados na plataforma</div>
          </article>

          <article class="kpi-card">
            <div class="kpi-label">Empresas ativas</div>
            <div class="kpi-value">${data.counters.ativos}</div>
            <div class="kpi-meta">Tenants com operação liberada</div>
          </article>

          <article class="kpi-card">
            <div class="kpi-label">Bloqueadas</div>
            <div class="kpi-value">${data.counters.bloqueados}</div>
            <div class="kpi-meta">Bloqueadas ou suspensas</div>
          </article>

          <article class="kpi-card">
            <div class="kpi-label">Inadimplentes</div>
            <div class="kpi-value">${data.counters.inadimplentes}</div>
            <div class="kpi-meta">Necessitam ação financeira</div>
          </article>
        </section>

        <section class="two-col-grid">
          <article class="panel">
            <div class="panel-head">
              <div>
                <h2 class="panel-title">Módulos</h2>
                <p class="panel-subtitle">Catálogo e uso atual</p>
              </div>
            </div>
            <div class="panel-body list-body">
              ${modulesHtml}
            </div>
          </article>

          <article class="panel">
            <div class="panel-head">
              <div>
                <h2 class="panel-title">Empresas</h2>
                <p class="panel-subtitle">Acesso rápido aos tenants</p>
              </div>
            </div>
            <div class="panel-body tenant-mini-grid">
              ${tenantsHtml}
            </div>
          </article>
        </section>
      </section>
    `;
  }

  async function hydrate() {
    const mount = document.getElementById('dashboardMount');
    if (!mount) return;

    try {
      const data = await DevAPI.getDashboardData();
      DevState.set('dashboard', data);
      mount.innerHTML = renderDashboard(data);
    } catch (error) {
      console.error(error);
      mount.innerHTML = `
        <section class="app-page">
          <div class="empty-card">
            <div class="empty-title">Erro ao carregar dashboard</div>
            <div class="empty-text">${error.message || 'Falha ao consultar o Supabase.'}</div>
          </div>
        </section>
      `;
    }
  }

  function page() {
    setTimeout(hydrate, 0);
    return `<div id="dashboardMount">${loadingTemplate()}</div>`;
  }

  DevRouter.register('dashboard', page);
})();