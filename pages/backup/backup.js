(function(){
  const { DevMock, DevUI, DevRouter } = window;
  DevRouter.register('backup', () => `
    <div class="app-page">
      ${DevUI.pageHead({
        title: 'Backup',
        subtitle: 'Solicitação, histórico e rastreabilidade de backups por tenant.',
        actionsHtml: DevUI.button('Solicitar backup', 'btn-primary')
      })}
      <article class="panel">
        <div class="panel-head"><div><h2 class="panel-title">Histórico</h2><p class="panel-subtitle">Backups mockados do MVP</p></div></div>
        <div class="panel-divider"></div>
        <div class="list-stack">
          ${DevMock.backups.map(item => `
            <div class="item-row">
              <div><div class="item-title">${item.tenantId}</div><div class="item-meta">${item.date} • solicitado por ${item.requestedBy}</div></div>
              ${DevUI.statusBadge(item.status)}
            </div>
          `).join('')}
        </div>
      </article>
    </div>
  `);
})();
