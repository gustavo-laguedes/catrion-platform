(function(){
  const { DevMock, DevUI, DevRouter } = window;
  DevRouter.register('logs', () => `
    <div class="app-page">
      ${DevUI.pageHead({
        title: 'Logs',
        subtitle: 'Auditoria administrativa completa: quem fez, quando fez, em qual tenant e com qual severidade.',
        actionsHtml: DevUI.button('Exportar logs', 'btn-primary')
      })}
      <article class="panel">
        <div class="panel-head"><div><h2 class="panel-title">Filtros</h2><p class="panel-subtitle">Estrutura inicial de navegação</p></div></div>
        <div class="panel-divider"></div>
        <div class="filter-bar">
          <input class="search" placeholder="Buscar ação ou usuário" />
          <select class="select"><option>Tenant</option></select>
          <select class="select"><option>Módulo</option></select>
          <select class="select"><option>Severidade</option></select>
          <button class="btn-primary" type="button">Filtrar</button>
        </div>
      </article>
      <article class="table-card">
        <div class="table-scroll">
          <table class="table">
            <thead><tr><th>Data</th><th>Ação</th><th>Usuário</th><th>Tenant</th><th>Módulo</th><th>Severidade</th><th>Motivo</th></tr></thead>
            <tbody>
              ${DevMock.logs.map(log => `
                <tr>
                  <td>${log.date}</td>
                  <td>${log.action}</td>
                  <td>${log.actor}</td>
                  <td>${log.tenantId}</td>
                  <td>${log.module}</td>
                  <td>${DevUI.statusBadge(log.severity)}</td>
                  <td>${log.reason}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  `);
})();
