(function(){
  const { DevMock, DevUI, DevRouter } = window;
  DevRouter.register('reset', () => `
    <div class="app-page">
      ${DevUI.pageHead({
        title: 'Reset',
        subtitle: 'Área crítica: resets operacionais exigem confirmação forte, motivo e auditoria.',
        actionsHtml: DevUI.button('Novo reset', 'btn-danger')
      })}
      <section class="two-col">
        <article class="panel">
          <div class="panel-head"><div><h2 class="panel-title">Solicitar reset</h2><p class="panel-subtitle">Mock visual do formulário</p></div></div>
          <div class="panel-divider"></div>
          <div class="list-stack">
            <select class="select"><option>Selecione o tenant</option>${DevMock.tenants.map(t => `<option>${t.nome}</option>`).join('')}</select>
            <select class="select"><option>Tipo de reset</option><option>Parcial</option><option>Operacional</option></select>
            <textarea class="textarea" placeholder="Justificativa obrigatória"></textarea>
            <div class="danger-box">Na versão real, esta ação deve passar pelo backend admin, exigir duplo aceite e gravar log obrigatório.</div>
            <button class="btn-danger" type="button">Solicitar reset</button>
          </div>
        </article>
        <article class="panel">
          <div class="panel-head"><div><h2 class="panel-title">Histórico recente</h2><p class="panel-subtitle">Últimos resets do ambiente mockado</p></div></div>
          <div class="panel-divider"></div>
          <div class="list-stack">
            ${DevMock.resets.map(item => `<div class="item-row"><div><div class="item-title">${item.tenantId}</div><div class="item-meta">${item.date} • ${item.type} • ${item.requestedBy}</div></div>${DevUI.statusBadge(item.status)}</div>`).join('')}
          </div>
        </article>
      </section>
    </div>
  `);
})();
