(function () {
  const { DevRouter, DevAPI } = window;

  function loadingTemplate() {
    return `
      <section class="app-page">
        <header class="page-head">
          <div>
            <h1 class="page-title">Financeiro</h1>
            <p class="page-subtitle">Visão geral de contratos, custos e inadimplência.</p>
          </div>
        </header>

        <div class="panel">
          <div class="panel-body">
            <div class="loading-box">Carregando visão financeira...</div>
          </div>
        </div>
      </section>
    `;
  }

  function renderPage(tenants) {
    const adimplentes = tenants.filter(t => t.adimplencia === 'adimplente').length;
    const inadimplentes = tenants.filter(t => t.adimplencia === 'inadimplente').length;

    return `
      <section class="app-page">
        <header class="page-head">
          <div>
            <h1 class="page-title">Financeiro</h1>
            <p class="page-subtitle">Visão geral de contratos, custos e inadimplência.</p>
          </div>

          <div class="page-actions">
            <button class="btn-primary" type="button">+ Novo lançamento</button>
          </div>
        </header>

        <section class="grid-kpis">
          <article class="kpi-card">
            <div class="kpi-label">Empresas adimplentes</div>
            <div class="kpi-value">${adimplentes}</div>
            <div class="kpi-meta">Contratos em situação regular</div>
          </article>

          <article class="kpi-card">
            <div class="kpi-label">Empresas inadimplentes</div>
            <div class="kpi-value">${inadimplentes}</div>
            <div class="kpi-meta">Precisam de atenção financeira</div>
          </article>

          <article class="kpi-card">
            <div class="kpi-label">Total de empresas</div>
            <div class="kpi-value">${tenants.length}</div>
            <div class="kpi-meta">Base contratual atual</div>
          </article>

          <article class="kpi-card">
            <div class="kpi-label">Módulos faturáveis</div>
            <div class="kpi-value">${tenants.reduce((acc, t) => acc + t.modules.length, 0)}</div>
            <div class="kpi-meta">Soma de vínculos por empresa</div>
          </article>
        </section>

        <article class="table-card">
          <div class="panel-head">
            <div>
              <h2 class="panel-title">Resumo contratual</h2>
              <p class="panel-subtitle">Situação financeira por empresa</p>
            </div>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Plano</th>
                  <th>Financeiro</th>
                  <th>Vencimento</th>
                  <th>Módulos</th>
                </tr>
              </thead>
              <tbody>
                ${tenants.map((tenant) => `
                  <tr>
                    <td>
                      <div class="table-main">${tenant.nome}</div>
                      <div class="table-sub">${tenant.tenantId}</div>
                    </td>
                    <td>${tenant.plano}</td>
                    <td>${tenant.adimplencia}</td>
                    <td>${tenant.vencimento}</td>
                    <td>${tenant.modules.map((m) => m.nome).join(', ') || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    `;
  }

  async function hydrate() {
    const mount = document.getElementById('financeiroMount');
    if (!mount) return;

    try {
      const tenants = await DevAPI.getTenants();
      mount.innerHTML = renderPage(tenants);
    } catch (error) {
      console.error(error);
      mount.innerHTML = `
        <section class="app-page">
          <div class="empty-card">
            <div class="empty-title">Erro ao carregar financeiro</div>
            <div class="empty-text">${error.message || 'Falha ao consultar o Supabase.'}</div>
          </div>
        </section>
      `;
    }
  }

  function page() {
    setTimeout(hydrate, 0);
    return `<div id="financeiroMount">${loadingTemplate()}</div>`;
  }

  DevRouter.register('financeiro', page);
})();