(function(){
  const { DevMock, DevUI, DevRouter } = window;
  DevRouter.register('saude', () => `
    <div class="app-page">
      ${DevUI.pageHead({
        title: 'Saúde da plataforma',
        subtitle: 'Monitoramento administrativo da disponibilidade, erros e comportamento dos módulos.',
        actionsHtml: DevUI.button('Atualizar monitoramento', 'btn-primary')
      })}
      <section class="three-col">
        ${DevMock.moduleCatalog.map(module => `
          <article class="panel">
            <div class="panel-head"><div><h2 class="panel-title">${module.nome}</h2><p class="panel-subtitle">incidentes: ${module.incidentes}</p></div>${DevUI.statusBadge(module.incidentes ? 'implantando' : 'ativo')}</div>
            <div class="panel-divider"></div>
            <div class="note-box">${module.tenants} tenant(s) conectados ao módulo ${module.nome}. Esta tela depois pode receber heartbeat, healthcheck e fila de erros reais.</div>
          </article>
        `).join('')}
      </section>
    </div>
  `);
})();
