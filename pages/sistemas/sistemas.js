(function () {
  const { DevRouter, DevAPI } = window;

  function loadingTemplate() {
    return `
      <section class="app-page">
        <header class="page-head">
          <div>
            <h1 class="page-title">Sistemas</h1>
            <p class="page-subtitle">Visão geral dos módulos e saúde da plataforma.</p>
          </div>
        </header>

        <div class="panel">
          <div class="panel-body">
            <div class="loading-box">Carregando sistemas...</div>
          </div>
        </div>
      </section>
    `;
  }

  function healthBadge(module) {
    if (!module.isActive) return 'status-badge status-bloqueado';
    return module.ativos > 0 ? 'status-badge status-ativo' : 'status-badge status-implantando';
  }

  function healthLabel(module) {
    if (!module.isActive) return 'inativo';
    return module.ativos > 0 ? 'saudável' : 'sem tenants ativos';
  }

  function renderPage(modules) {
    return `
      <section class="app-page">
        <header class="page-head">
          <div>
            <h1 class="page-title">Sistemas</h1>
            <p class="page-subtitle">Visão geral dos módulos e saúde da plataforma.</p>
          </div>
        </header>

        <section class="two-col-grid">
          ${modules.map((module) => `
            <article class="panel info-card-button" data-module="${module.key}">
              <div class="panel-head">
                <div>
                  <h2 class="panel-title">${module.nome}</h2>
                  <p class="panel-subtitle">${module.domain}</p>
                </div>
                <span class="${healthBadge(module)}">${healthLabel(module)}</span>
              </div>

              <div class="panel-body details-grid">
                <div class="detail-row"><strong>Chave:</strong> ${module.key}</div>
                <div class="detail-row"><strong>Ativo no catálogo:</strong> ${module.isActive ? 'sim' : 'não'}</div>
                <div class="detail-row"><strong>Total de tenants:</strong> ${module.tenants}</div>
                <div class="detail-row"><strong>Tenants ativos:</strong> ${module.ativos}</div>
                <div class="detail-row full"><strong>Saúde:</strong> ${healthLabel(module)}</div>
              </div>
            </article>
          `).join('')}
        </section>
      </section>
    `;
  }

  async function hydrate() {
    const mount = document.getElementById('sistemasMount');
    if (!mount) return;

    try {
     const modules = await DevAPI.getModulesCatalog();
const filtered = modules.filter((m) =>
  m.key === 'core' || m.key === 'devpanel'
);

mount.innerHTML = renderPage(filtered);

document.querySelectorAll('[data-module]').forEach((card) => {
  card.addEventListener('click', () => {
    const moduleKey = card.getAttribute('data-module');

    if (moduleKey === 'core') {
      DevRouter.navigate('sistema-core');
      return;
    }

    if (moduleKey === 'devpanel') {
      alert('Tela interna do Dev Panel ainda vamos montar.');
      return;
    }
  });
});
    } catch (error) {
      console.error(error);
      mount.innerHTML = `
        <section class="app-page">
          <div class="empty-card">
            <div class="empty-title">Erro ao carregar sistemas</div>
            <div class="empty-text">${error.message || 'Falha ao consultar o Supabase.'}</div>
          </div>
        </section>
      `;
    }
  }

  function page() {
    setTimeout(hydrate, 0);
    return `<div id="sistemasMount">${loadingTemplate()}</div>`;
  }

  DevRouter.register('sistemas', page);
})();