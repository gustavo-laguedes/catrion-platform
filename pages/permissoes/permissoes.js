(function(){
  const { DevMock, DevUI, DevRouter } = window;
  DevRouter.register('permissoes', () => `
    <div class="app-page">
      ${DevUI.pageHead({
        title: 'Permissões',
        subtitle: 'RBAC da plataforma: papéis, módulos e ações permitidas.',
        actionsHtml: DevUI.button('Novo papel', 'btn-primary')
      })}
      <section class="panel">
        <div class="panel-head"><div><h2 class="panel-title">Matriz de acesso</h2><p class="panel-subtitle">Base para controlar leitura, operação, admin e ações críticas</p></div></div>
        <div class="panel-divider"></div>
        <div class="list-stack">
          ${DevMock.permissions.map(item => `
            <div class="permission-row">
              <div>
                <div class="item-title">${item.role}</div>
                <div class="item-meta">${item.modulo} • ações: ${item.actions.join(', ')}</div>
              </div>
              <span class="badge info">${item.actions.length} ação(ões)</span>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  `);
})();
