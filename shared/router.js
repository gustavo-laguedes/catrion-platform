window.DevRouter = (() => {
  const routes = {};

  function register(name, renderer) {
    routes[name] = renderer;
  }

  function navigate(route, params = {}) {
    const query = new URLSearchParams(params).toString();
    const hash = query ? `#${route}?${query}` : `#${route}`;
    window.location.hash = hash;
  }

  function parseHash() {
    const raw = window.location.hash.replace('#', '') || 'dashboard';
    const [routeName, queryString] = raw.split('?');

    return {
      routeName: routeName || 'dashboard',
      params: Object.fromEntries(new URLSearchParams(queryString || ''))
    };
  }

  function updateSidebar(routeName) {
    document.querySelectorAll('.sidebar-link[data-route]').forEach((btn) => {
      const currentRoute = btn.dataset.route;

      const active =
  currentRoute === routeName ||
  (routeName === 'empresa' && currentRoute === 'empresas') ||
  (routeName === 'empresa-modulo' && currentRoute === 'empresas') ||
  (routeName === 'usuario' && currentRoute === 'usuarios') ||
  (routeName === 'sistema-core' && currentRoute === 'sistemas');

      btn.classList.toggle('active', active);
    });
  }

  function updateTopbarContext(routeName, params) {
    const map = {
  dashboard: 'Torre de controle da Catrion',
  cadastros: 'Gestão de empresas e estrutura da plataforma',
  empresas: 'Gestão de empresas, contratos, módulos e estrutura',
  usuarios: 'Gestão global de usuários, vínculos e acessos',
  usuario: params.id ? `Detalhe do usuário: ${params.id}` : 'Detalhe do usuário',
  empresa: params.tenant ? `Empresa ativa: ${params.tenant}` : 'Detalhe da empresa',
  'empresa-modulo': params.tenant && params.module
    ? `Empresa: ${params.tenant} • Módulo: ${params.module}`
    : 'Detalhe do módulo',
  sistemas: 'Visão geral dos módulos e saúde da plataforma',
  'sistema-core': 'Sistema Core • papéis, módulos e permissões',
  financeiro: 'Contratos, custos, recebimentos e inadimplência',
  configuracoes: 'Parâmetros internos do painel'
};

    document.getElementById('topbarContext').textContent = map[routeName] || 'Dev Panel';
  }

  function render() {
    const target = document.getElementById('app');
    const { routeName, params } = parseHash();
    const page = routes[routeName] || routes.dashboard;

    if (!page) {
      target.innerHTML = `
        <section class="app-page">
          <div class="empty-card">
            <div class="empty-title">Rota não encontrada</div>
            <div class="empty-text">A página solicitada não existe.</div>
          </div>
        </section>
      `;
      return;
    }

    target.innerHTML = page(params);
    updateSidebar(routeName);
    updateTopbarContext(routeName, params);

    window.dispatchEvent(
      new CustomEvent('devpanel:rendered', {
        detail: { routeName, params }
      })
    );
  }

  function bindNav() {
    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-route]');
      if (!button) return;

      const route = button.dataset.route;
      if (!route) return;

      if (route === 'empresa' && button.dataset.tenant) {
        navigate('empresa', { tenant: button.dataset.tenant });
        return;
      }

      if (route === 'empresa-modulo' && button.dataset.tenant && button.dataset.module) {
        navigate('empresa-modulo', {
          tenant: button.dataset.tenant,
          module: button.dataset.module
        });
        return;
      }

            if (route === 'usuario' && button.dataset.id) {
        navigate('usuario', { id: button.dataset.id });
        return;
      }

      navigate(route);
    });
  }

  return {
    register,
    navigate,
    render,
    bindNav
  };
})();