(function(){
  const { DevUI, DevRouter } = window;
  DevRouter.register('configuracoes', () => `
    <div class="app-page">
      ${DevUI.pageHead({
        title: 'Configurações',
        subtitle: 'Parâmetros internos do Dev Panel e toggles administrativos.',
        actionsHtml: DevUI.button('Salvar alterações', 'btn-primary')
      })}
      <section class="two-col">
        <article class="panel">
          <div class="panel-head"><div><h2 class="panel-title">Ambiente</h2><p class="panel-subtitle">Configurações globais</p></div></div>
          <div class="panel-divider"></div>
          <div class="list-stack">
            <div class="config-row"><div><div class="item-title">Modo debug</div><div class="item-meta">Ativa logs avançados por tenant</div></div><span class="badge warn">desligado</span></div>
            <div class="config-row"><div><div class="item-title">Feature flags</div><div class="item-meta">Controle por módulo e tenant</div></div><span class="badge success">ativo</span></div>
            <div class="config-row"><div><div class="item-title">Auditoria obrigatória</div><div class="item-meta">Logs críticos sempre gravados</div></div><span class="badge success">ativo</span></div>
          </div>
        </article>
        <article class="panel">
          <div class="panel-head"><div><h2 class="panel-title">Próxima integração</h2><p class="panel-subtitle">O que vamos plugar depois</p></div></div>
          <div class="panel-divider"></div>
          <div class="note-box">Próxima fase: autenticação real do portal Catrion, contexto de sessão, memberships, membership_modules, tenant_modules e backend admin protegido.</div>
        </article>
      </section>
    </div>
  `);
})();
