window.DevUI = (() => {
  function statusBadge(value){
    const map = {
      ativo: 'success', adimplente: 'success', concluido: 'success',
      implantando: 'warn', homologação: 'warn', aguardando: 'warn', pendente: 'warn',
      bloqueado: 'danger', inadimplente: 'danger', suspenso: 'danger',
      produção: 'info', mock: 'info', inativo: 'danger', 'checklist pendente': 'warn'
    };
    const css = map[value] || 'info';
    return `<span class="badge ${css}">${value}</span>`;
  }

  function actions(buttons = []){
    return `<div class="row-actions">${buttons.join('')}</div>`;
  }

  function pageHead({ title, subtitle, actionsHtml = '' }){
    return `
      <section class="page-head">
        <div>
          <h1 class="page-title">${title}</h1>
          <p class="page-subtitle">${subtitle}</p>
        </div>
        <div class="page-actions">${actionsHtml}</div>
      </section>
    `;
  }

  function button(label, variant = 'btn-ghost', attrs = ''){
    return `<button class="${variant}" type="button" ${attrs}>${label}</button>`;
  }

  return { statusBadge, actions, pageHead, button };
})();
