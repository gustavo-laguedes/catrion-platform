(function () {
  const { DevRouter, DevAPI, DevState } = window;

  const sortState = {
    key: 'nome',
    direction: 'asc'
  };

  let searchTerm = '';

    let shouldRefocusSearch = false;

  function onlyDigits(value) {
    return (value || '').replace(/\D/g, '');
  }

  function formatCpf(value) {
    const digits = onlyDigits(value).slice(0, 11);

    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }

  function formatCnpj(value) {
    const digits = onlyDigits(value).slice(0, 14);

    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  function formatPhone(value) {
    const digits = onlyDigits(value).slice(0, 11);

    if (digits.length <= 10) {
      return digits
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }

    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }

  function getSortValue(tenant, key) {
    switch (key) {
      case 'nome':
        return (tenant.nome || '').toLowerCase();
      case 'cnpj':
        return (tenant.cnpj || '').toLowerCase();
      case 'status':
        return (tenant.status || '').toLowerCase();
      case 'contactName':
        return (tenant.contactName || '').toLowerCase();
      case 'contactEmail':
        return (tenant.contactEmail || '').toLowerCase();
      default:
        return '';
    }
  }

  function sortTenants(tenants) {
    const items = [...tenants];

    items.sort((a, b) => {
      const valueA = getSortValue(a, sortState.key);
      const valueB = getSortValue(b, sortState.key);

      if (valueA < valueB) return sortState.direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortState.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return items;
  }

  function filterTenants(tenants) {
    const term = (searchTerm || '').trim().toLowerCase();
    if (!term) return tenants;

    return tenants.filter((tenant) => {
      return [
        tenant.nome,
        tenant.tenantId,
        tenant.cnpj,
        tenant.status,
        tenant.contactName,
        tenant.contactEmail
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }

  function sortIcon(key) {
    if (sortState.key !== key) return '↕';
    return sortState.direction === 'asc' ? '↑' : '↓';
  }

  function loadingTemplate() {
    return `
      <section class="app-page">
        <header class="page-head">
          <div>
            <h1 class="page-title">Empresas</h1>
<p class="page-subtitle">Gestão de empresas, contratos, módulos e estrutura da plataforma.</p>
          </div>
        </header>

        <div class="panel">
          <div class="panel-body">
            <div class="loading-box">Carregando empresas do Supabase...</div>
          </div>
        </div>
      </section>
    `;
  }

  function renderRows(tenants) {
    const filteredTenants = filterTenants(tenants);

    if (!filteredTenants.length) {
      return `
        <tr>
          <td colspan="8">
            <div class="empty-inline">
              ${searchTerm ? 'Nenhuma empresa encontrada para esta busca.' : 'Nenhuma empresa cadastrada ainda.'}
            </div>
          </td>
        </tr>
      `;
    }

    const sortedTenants = sortTenants(filteredTenants);

    return sortedTenants.map((tenant) => `
      <tr>
        <td>
          <div class="company-logo-cell">
            ${
              tenant.logoUrl
                ? `<img src="${tenant.logoUrl}" alt="Logo ${tenant.nome}" class="company-logo-thumb" />`
                : `<div class="company-logo-fallback">${(tenant.nome || '?').charAt(0).toUpperCase()}</div>`
            }
          </div>
        </td>
        <td>
          <div class="table-main">${tenant.nome}</div>
          <div class="table-sub">${tenant.tenantId}</div>
        </td>
        <td>${tenant.cnpj}</td>
        <td><span class="status-badge status-${tenant.status}">${tenant.status}</span></td>
        <td>${tenant.contactName || '-'}</td>
        <td>${tenant.contactEmail || '-'}</td>
        <td>${tenant.modules.map((m) => m.nome).join(', ') || '-'}</td>
        <td class="table-actions">
          <button class="btn-ghost btn-sm" type="button" data-route="empresa" data-tenant="${tenant.tenantId}">
            Abrir
          </button>
        </td>
      </tr>
    `).join('');
  }

  function renderModal() {
    return `
      <div class="modal-overlay hidden" id="modalNovaEmpresa">
        <div class="modal-card modal-card-lg">
          <div class="modal-head">
            <div>
              <h2 class="panel-title">Nova empresa</h2>
              <p class="panel-subtitle">Cadastro administrativo inicial</p>
            </div>

            <button class="modal-close" type="button" id="btnFecharModalNovaEmpresa">✕</button>
          </div>

          <div class="panel-body">
            <form id="formNovaEmpresa" class="form-grid">
              <div class="field">
                <label class="field-label">Tenant ID</label>
                <input class="field-input" name="tenantId" placeholder="ex: loja-centro" required />
              </div>

              <div class="field">
                <label class="field-label">Razão social</label>
                <input class="field-input" name="legalName" placeholder="Razão social" required />
              </div>

              <div class="field">
                <label class="field-label">Nome fantasia</label>
                <input class="field-input" name="tradeName" placeholder="Nome fantasia" required />
              </div>

              <div class="field">
                <label class="field-label">CNPJ</label>
                <input class="field-input" id="inputCnpjEmpresa" name="cnpj" placeholder="00.000.000/0000-00" />
              </div>

              <div class="field">
                <label class="field-label">Responsável</label>
                <input class="field-input" name="contactName" placeholder="Nome do responsável" />
              </div>

              <div class="field">
                <label class="field-label">E-mail do responsável</label>
                <input class="field-input" name="contactEmail" type="email" placeholder="email@empresa.com" />
              </div>

              <div class="field">
                <label class="field-label">CPF do responsável</label>
                <input class="field-input" id="inputCpfEmpresa" name="contactCpf" placeholder="000.000.000-00" />
              </div>

              <div class="field">
                <label class="field-label">Telefone</label>
                <input class="field-input" id="inputTelefoneEmpresa" name="phone" placeholder="(00) 00000-0000" />
              </div>

              <div class="field field-full">
                <label class="field-label">Endereço</label>
                <input class="field-input" name="address" placeholder="Rua, número, bairro, cidade, UF" />
              </div>

              <div class="field">
                <label class="field-label">Onboarding</label>
                <select class="field-input field-select" name="onboardingStatus">
                  <option value="implantando">implantando</option>
                  <option value="implantado">implantado</option>
                  <option value="pendente">pendente</option>
                </select>
              </div>

              <div class="field">
                <label class="field-label">Dia do vencimento</label>
                <input class="field-input" name="dueDay" type="number" min="1" max="31" placeholder="10" required />
              </div>

              <div class="field field-full">
                <label class="field-label">Logo da empresa</label>

                <input
                  id="inputLogoEmpresa"
                  name="logoFile"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  class="file-input-native"
                />

                <label for="inputLogoEmpresa" class="file-upload-shell">
                  <span class="file-upload-btn">Escolher arquivo</span>
                  <span class="file-upload-name" id="fileUploadName">Nenhum arquivo escolhido</span>
                </label>

                <div class="file-help">Envie PNG, JPG, WEBP ou SVG. Não vamos limitar no front.</div>
              </div>

              <div class="field field-full">
                <label class="field-label">Observações</label>
                <textarea class="field-input field-textarea" name="notes" placeholder="Observações administrativas"></textarea>
              </div>

              <div class="field-actions field-full">
                <button class="btn-ghost" type="button" id="btnCancelarNovaEmpresa">Cancelar</button>
                <button class="btn-primary" type="submit">Salvar empresa</button>
              </div>

              <div class="form-feedback field-full" id="feedbackNovaEmpresa"></div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  function renderDeleteModal(tenants) {
    const availableTenants = tenants || [];

    return `
      <div class="modal-overlay hidden" id="modalExcluirEmpresa">
        <div class="modal-card">
          <div class="modal-head">
            <div>
              <h2 class="panel-title">Excluir empresa</h2>
              <p class="panel-subtitle">Esta ação remove a empresa da base administrativa</p>
            </div>

            <button class="modal-close" type="button" id="btnFecharModalExcluirEmpresa">✕</button>
          </div>

          <div class="panel-body">
            <div class="danger-box">
              Ao excluir uma empresa:
              <br><br>
              - ela sairá da lista de empresas cadastradas
              <br>
              - vínculos relacionados podem ser removidos junto
              <br>
              - usuários e acessos da empresa podem ser afetados
              <br>
              - a empresa deixará de existir na base administrativa
              <br><br>
              Se a intenção for apenas impedir acesso, o ideal é bloquear a empresa, não excluir.
            </div>

            <form id="formExcluirEmpresa" class="form-grid" style="margin-top:16px;">
              <div class="field field-full">
                <label class="field-label">Empresa</label>
                <select class="field-input field-select" id="excluirEmpresaSelect" required>
                  <option value="">Selecione a empresa</option>
                  ${availableTenants.map((tenant) => `
                    <option value="${tenant.tenantId}">
                      ${tenant.nome} (${tenant.tenantId})
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="field field-full">
                <label class="field-label">Motivo da exclusão</label>
                <textarea
                  class="field-input field-textarea"
                  id="excluirEmpresaMotivo"
                  placeholder="Descreva o motivo da exclusão"
                ></textarea>
              </div>

              <div class="field-actions field-full">
                <button class="btn-ghost" type="button" id="btnCancelarExcluirEmpresa">Cancelar</button>
                <button class="btn-danger" type="submit">Confirmar exclusão</button>
              </div>

              <div class="form-feedback field-full" id="feedbackExcluirEmpresa"></div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  function renderPage(tenants) {
    return `
      <section class="app-page">
        <header class="page-head">
          <div>
            <h1 class="page-title">Empresas</h1>
<p class="page-subtitle">Gestão de empresas, contratos, módulos e estrutura da plataforma.</p>
          </div>

          <div class="page-actions">
            <button class="btn-danger" type="button" id="btnAbrirModalExcluirEmpresa">Excluir empresa</button>
            <button class="btn-primary" type="button" id="btnAbrirModalNovaEmpresa">+ Nova empresa</button>
          </div>
        </header>

        <article class="table-card">
          <div class="panel-head">
            <div>
              <h2 class="panel-title">Empresas cadastradas</h2>
              <p class="panel-subtitle">Base administrativa da plataforma</p>
            </div>

            <div class="table-toolbar">
              <input
                type="text"
                id="inputBuscaEmpresas"
                class="table-search-input"
                placeholder="Buscar empresa, tenant, CNPJ, responsável..."
                value="${searchTerm}"
              />
            </div>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="col-logo">Logo</th>
                  <th>
                    <button class="table-sort-btn" type="button" data-sort-key="nome">
                      Empresa <span>${sortIcon('nome')}</span>
                    </button>
                  </th>
                  <th>
                    <button class="table-sort-btn" type="button" data-sort-key="cnpj">
                      CNPJ <span>${sortIcon('cnpj')}</span>
                    </button>
                  </th>
                  <th>
                    <button class="table-sort-btn" type="button" data-sort-key="status">
                      Status <span>${sortIcon('status')}</span>
                    </button>
                  </th>
                  <th>
                    <button class="table-sort-btn" type="button" data-sort-key="contactName">
                      Responsável <span>${sortIcon('contactName')}</span>
                    </button>
                  </th>
                  <th>
                    <button class="table-sort-btn" type="button" data-sort-key="contactEmail">
                      E-mail <span>${sortIcon('contactEmail')}</span>
                    </button>
                  </th>
                  <th>Módulos</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                ${renderRows(tenants)}
              </tbody>
            </table>
          </div>
        </article>

        ${renderModal()}
        ${renderDeleteModal(tenants)}
      </section>
    `;
  }

  function openModal() {
    const modal = document.getElementById('modalNovaEmpresa');
    if (!modal) return;
    modal.classList.remove('hidden');
  }

  function closeModal() {
    const modal = document.getElementById('modalNovaEmpresa');
    if (!modal) return;
    modal.classList.add('hidden');
  }

  function openDeleteModal() {
    const modal = document.getElementById('modalExcluirEmpresa');
    if (!modal) return;
    modal.classList.remove('hidden');
  }

  function closeDeleteModal() {
    const modal = document.getElementById('modalExcluirEmpresa');
    if (!modal) return;
    modal.classList.add('hidden');
  }

  function bindMasks() {
    const cnpjInput = document.getElementById('inputCnpjEmpresa');
    const cpfInput = document.getElementById('inputCpfEmpresa');
    const phoneInput = document.getElementById('inputTelefoneEmpresa');

    if (cnpjInput) {
      cnpjInput.addEventListener('input', () => {
        cnpjInput.value = formatCnpj(cnpjInput.value);
      });
    }

    if (cpfInput) {
      cpfInput.addEventListener('input', () => {
        cpfInput.value = formatCpf(cpfInput.value);
      });
    }

    if (phoneInput) {
      phoneInput.addEventListener('input', () => {
        phoneInput.value = formatPhone(phoneInput.value);
      });
    }
  }

  function bindFileInput() {
    const input = document.getElementById('inputLogoEmpresa');
    const fileName = document.getElementById('fileUploadName');

    if (!input || !fileName) return;

    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      fileName.textContent = file ? file.name : 'Nenhum arquivo escolhido';
    });
  }

  function bindSorting() {
    document.querySelectorAll('[data-sort-key]').forEach((button) => {
      button.addEventListener('click', () => {
        const key = button.dataset.sortKey;

        if (sortState.key === key) {
          sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
        } else {
          sortState.key = key;
          sortState.direction = 'asc';
        }

        hydrate();
      });
    });
  }

    function bindSearch() {
    const input = document.getElementById('inputBuscaEmpresas');
    if (!input) return;

    input.addEventListener('input', () => {
      searchTerm = input.value || '';
      shouldRefocusSearch = true;
      hydrate();
    });
  }

  function bindModal() {
    const btnOpen = document.getElementById('btnAbrirModalNovaEmpresa');
    const btnClose = document.getElementById('btnFecharModalNovaEmpresa');
    const btnCancel = document.getElementById('btnCancelarNovaEmpresa');
    const modal = document.getElementById('modalNovaEmpresa');

    if (btnOpen) btnOpen.addEventListener('click', openModal);
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    if (modal) {
      modal.addEventListener('click', (event) => {
        if (event.target === modal) {
          closeModal();
        }
      });
    }

    const btnOpenDelete = document.getElementById('btnAbrirModalExcluirEmpresa');
    const btnCloseDelete = document.getElementById('btnFecharModalExcluirEmpresa');
    const btnCancelDelete = document.getElementById('btnCancelarExcluirEmpresa');
    const deleteModal = document.getElementById('modalExcluirEmpresa');

    if (btnOpenDelete) btnOpenDelete.addEventListener('click', openDeleteModal);
    if (btnCloseDelete) btnCloseDelete.addEventListener('click', closeDeleteModal);
    if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDeleteModal);

    if (deleteModal) {
      deleteModal.addEventListener('click', (event) => {
        if (event.target === deleteModal) {
          closeDeleteModal();
        }
      });
    }
  }

  async function bindForm() {
    const form = document.getElementById('formNovaEmpresa');
    const feedback = document.getElementById('feedbackNovaEmpresa');
    if (!form || !feedback) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      feedback.textContent = 'Salvando empresa...';
      feedback.className = 'form-feedback pending';

      const formData = new FormData(form);

      const payload = {
        tenantId: formData.get('tenantId'),
        legalName: formData.get('legalName'),
        tradeName: formData.get('tradeName'),
        cnpj: formData.get('cnpj'),
        onboardingStatus: formData.get('onboardingStatus'),
        dueDay: formData.get('dueDay'),
        contactName: formData.get('contactName'),
        contactEmail: formData.get('contactEmail'),
        contactCpf: formData.get('contactCpf'),
        address: formData.get('address'),
        phone: formData.get('phone'),
        notes: formData.get('notes'),
        logoFile: formData.get('logoFile')
      };

      try {
        await DevAPI.createTenant(payload);
        feedback.textContent = 'Empresa criada com sucesso.';
        feedback.className = 'form-feedback success';
        form.reset();
        closeModal();
        hydrate();
      } catch (error) {
        console.error(error);
        feedback.textContent = error.message || 'Erro ao criar empresa.';
        feedback.className = 'form-feedback error';
      }
    });
  }

  async function bindDeleteForm() {
    const form = document.getElementById('formExcluirEmpresa');
    const feedback = document.getElementById('feedbackExcluirEmpresa');
    const select = document.getElementById('excluirEmpresaSelect');

    if (!form || !feedback || !select) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const tenantId = select.value;
      const reason = document.getElementById('excluirEmpresaMotivo')?.value || '';

      if (!tenantId) {
        feedback.textContent = 'Selecione uma empresa para excluir.';
        feedback.className = 'form-feedback error';
        return;
      }

      feedback.textContent = 'Excluindo empresa...';
      feedback.className = 'form-feedback pending';

      try {
        await DevAPI.deleteTenant(tenantId, reason);
        feedback.textContent = 'Empresa excluída com sucesso.';
        feedback.className = 'form-feedback success';
        closeDeleteModal();
        hydrate();
      } catch (error) {
        console.error(error);
        feedback.textContent = error.message || 'Erro ao excluir empresa.';
        feedback.className = 'form-feedback error';
      }
    });
  }

    function restoreSearchFocus() {
    if (!shouldRefocusSearch) return;

    const input = document.getElementById('inputBuscaEmpresas');
    if (!input) return;

    input.focus();
    const length = input.value.length;
    input.setSelectionRange(length, length);

    shouldRefocusSearch = false;
  }

  async function hydrate() {
    const mount = document.getElementById('empresasMount');
    if (!mount) return;

    try {
      const tenants = await DevAPI.getTenants();
      DevState.set('tenants', tenants);
      mount.innerHTML = renderPage(tenants);
            bindSorting();
      bindSearch();
      bindModal();
      bindMasks();
      bindFileInput();
      bindForm();
      bindDeleteForm();
      restoreSearchFocus();
    } catch (error) {
      console.error(error);
      mount.innerHTML = `
        <section class="app-page">
          <div class="empty-card">
            <div class="empty-title">Erro ao carregar empresas</div>
            <div class="empty-text">${error.message || 'Falha ao consultar o Supabase.'}</div>
          </div>
        </section>
      `;
    }
  }

  function page() {
    setTimeout(hydrate, 0);
    return `<div id="empresasMount">${loadingTemplate()}</div>`;
  }

  DevRouter.register('cadastros', page);
  DevRouter.register('empresas', page);
})();