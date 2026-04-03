(function () {
  const { DevRouter, DevAPI, DevState } = window;

  function getFriendlyRoleLabel(roleKey, roleName) {
    if (roleKey === 'core_admin') return 'Administrador';
    if (roleKey === 'core_operador') return 'Operador';
    if (roleKey === 'core_visualizador') return 'Visualizador';
    return roleName || roleKey || '-';
  }

  function loadingTemplate(userId) {
    return `
      <section class="app-page">
        <header class="page-head">
          <div>
            <h1 class="page-title">Usuário</h1>
            <p class="page-subtitle">id: ${userId || '-'}</p>
          </div>
        </header>

        <div class="panel">
          <div class="panel-body">
            <div class="loading-box">Carregando detalhes do usuário...</div>
          </div>
        </div>
      </section>
    `;
  }

    function renderMemberships(user) {
    if (!user.memberships || !user.memberships.length) {
      return `<div class="empty-inline">Nenhum vínculo encontrado para este usuário.</div>`;
    }

    return user.memberships.map((membership) => {
      const isBlocked = membership.status === 'bloqueado';
      const actionLabel = isBlocked ? 'Ativar vínculo' : 'Bloquear vínculo';
      const actionNextStatus = isBlocked ? 'ativo' : 'bloqueado';

      return `
        <div class="list-row membership-row ${isBlocked ? 'membership-row-blocked' : ''}">
          <div>
            <div class="list-title">${membership.tenantName}</div>
            <div class="list-subtitle">tenant_id: ${membership.tenantId}</div>
            <div class="list-subtitle">
              papel: ${getFriendlyRoleLabel(membership.roleKey, membership.roleName)}
            </div>
            <div class="list-subtitle">
              módulos: ${membership.modules.map((module) => module.nome).join(', ') || '-'}
            </div>
          </div>

          <div class="membership-actions">
            <span class="status-badge status-${membership.status || 'ativo'}">
              ${membership.status || '-'}
            </span>

            <button
              class="btn-ghost btn-sm"
              type="button"
              data-membership-action="toggle-status"
              data-membership-id="${membership.id}"
              data-next-status="${actionNextStatus}"
            >
              ${actionLabel}
            </button>

            <button
              class="btn-ghost btn-sm"
              type="button"
              data-membership-action="edit-role"
              data-membership-id="${membership.id}"
              data-current-role="${membership.roleKey || ''}"
              data-tenant-name="${membership.tenantName || ''}"
            >
              Editar papel
            </button>

            <button
              class="btn-danger btn-sm"
              type="button"
              data-membership-action="delete"
              data-membership-id="${membership.id}"
            >
              Excluir vínculo
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

      function renderEditUserModal(user) {
    return `
      <div class="modal-overlay hidden" id="modalEditarUsuario">
        <div class="modal-card modal-card-user-edit">
          <div class="modal-head">
            <div>
              <h2 class="panel-title">Editar usuário</h2>
              <p class="panel-subtitle">Atualize os dados globais do usuário</p>
            </div>

            <button class="modal-close" type="button" id="btnFecharModalEditarUsuario">✕</button>
          </div>

          <div class="panel-body">
            <form id="formEditarUsuario" class="form-grid">
              <div class="field">
                <label class="field-label">Nome completo</label>
                <input
                  class="field-input"
                  name="fullName"
                  value="${user.nome || ''}"
                  required
                />
              </div>

              <div class="field">
  <label class="field-label">E-mail</label>
  <input
    class="field-input"
    name="email"
    type="email"
    value="${user.email || ''}"
    required
  />
</div>

              <div class="field">
                <label class="field-label">Telefone</label>
                <input
                  class="field-input"
                  name="phone"
                  value="${user.phone || ''}"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div class="field">
                <label class="field-label">Status</label>
                <select class="field-input field-select" name="status">
                  <option value="ativo" ${user.status === 'ativo' ? 'selected' : ''}>ativo</option>
                  <option value="inativo" ${user.status === 'inativo' ? 'selected' : ''}>inativo</option>
                  <option value="bloqueado" ${user.status === 'bloqueado' ? 'selected' : ''}>bloqueado</option>
                </select>
              </div>

              <div class="field">
  <label class="field-label">Senha atual</label>
  <input
    class="field-input"
    type="password"
    value="********"
    readonly
  />
</div>

              <div class="field">
                <label class="field-label">Nova senha</label>
                <input
  class="field-input"
  type="text"
  name="newPassword"
  placeholder="Digite para alterar"
/>
              </div>

              <div class="field">
                <label class="field-label">Platform admin</label>
                <select class="field-input field-select" name="isPlatformAdmin">
                  <option value="false" ${!user.isPlatformAdmin ? 'selected' : ''}>não</option>
                  <option value="true" ${user.isPlatformAdmin ? 'selected' : ''}>sim</option>
                </select>
              </div>

                            <div class="field field-full">
                <label class="field-label">Foto do usuário</label>

                <input type="hidden" name="removeAvatar" id="inputRemoveAvatarUsuario" value="false" />

                <div class="user-avatar-upload-row">
                  <div class="user-avatar user-avatar-preview" id="previewAvatarUsuario">
                    ${user.avatarUrl
                      ? `<img src="${user.avatarUrl}" alt="avatar atual do usuário" />`
                      : `<span>${(user.nome || 'U')[0]}</span>`
                    }
                  </div>

                  <div class="user-avatar-upload-box">
                    <input
                      id="inputAvatarUsuario"
                      class="file-input-native"
                      type="file"
                      name="avatarFile"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    />

                    <div class="user-avatar-upload-actions">
                      <label for="inputAvatarUsuario" class="file-upload-shell file-upload-shell-compact">
                        <span class="file-upload-btn">Escolher arquivo</span>
                        <span class="file-upload-name" id="fileUploadAvatarUsuarioNome">Nenhum arquivo escolhido</span>
                      </label>

                      <button
                        class="btn-danger btn-sm"
                        type="button"
                        id="btnExcluirFotoUsuario"
                      >
                        Excluir foto
                      </button>
                    </div>

                    <div class="file-help">Envie PNG, JPG, WEBP ou SVG.</div>
                  </div>
                </div>
              </div>

              <div class="field-actions field-full">
                <button class="btn-ghost" type="button" id="btnCancelarModalEditarUsuario">Cancelar</button>
                <button class="btn-primary" type="submit">Salvar alterações</button>
              </div>

              <div class="form-feedback field-full" id="feedbackEditarUsuario"></div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

    function renderEditMembershipRoleModal(user, roles) {
    const coreRoles = (roles || []).filter((role) => {
      const key = String(role.role_key || '').toLowerCase();
      return key.startsWith('core_');
    });

    return `
      <div class="modal-overlay hidden" id="modalEditarPapelVinculo">
        <div class="modal-card">
          <div class="modal-head">
            <div>
              <h2 class="panel-title">Editar papel do vínculo</h2>
              <p class="panel-subtitle">Atualize o papel do usuário dentro da empresa</p>
            </div>

            <button class="modal-close" type="button" id="btnFecharModalEditarPapelVinculo">✕</button>
          </div>

          <div class="panel-body">
            <form id="formEditarPapelVinculo" class="form-grid">
              <input type="hidden" name="membershipId" id="inputMembershipIdEditarPapel" />

              <div class="field field-full">
                <label class="field-label">Empresa</label>
                <input
                  class="field-input"
                  id="inputTenantNameEditarPapel"
                  type="text"
                  value=""
                  readonly
                />
              </div>

              <div class="field field-full">
                <label class="field-label">Papel</label>
                <select class="field-input field-select" name="roleKey" id="selectRoleKeyEditarPapel" required>
                  <option value="">Selecione</option>
                  ${coreRoles.map((role) => `
                    <option value="${role.role_key}">
                      ${getFriendlyRoleLabel(role.role_key, role.role_name)}
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="field-actions field-full">
                <button class="btn-ghost" type="button" id="btnCancelarModalEditarPapelVinculo">Cancelar</button>
                <button class="btn-primary" type="submit">Salvar papel</button>
              </div>

              <div class="form-feedback field-full" id="feedbackEditarPapelVinculo"></div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

    function renderCreateMembershipModal(user, tenants, roles, modules) {
    const coreRoles = (roles || []).filter((role) => {
      const key = String(role.role_key || '').toLowerCase();
      return key.startsWith('core_');
    });

    const coreModules = (modules || []).filter((module) => {
      return String(module.module_key || '').toLowerCase() === 'core';
    });

    return `
      <div class="modal-overlay hidden" id="modalNovoVinculoUsuario">
        <div class="modal-card">
          <div class="modal-head">
            <div>
              <h2 class="panel-title">Vincular empresa</h2>
              <p class="panel-subtitle">Criar novo vínculo para ${user.nome || 'usuário'}</p>
            </div>

            <button class="modal-close" type="button" id="btnFecharModalNovoVinculoUsuario">✕</button>
          </div>

          <div class="panel-body">
            <form id="formNovoVinculoUsuario" class="form-grid">
              <div class="field field-full">
                <label class="field-label">Empresa</label>
                <select class="field-input field-select" name="tenantId" required>
                  <option value="">Selecione</option>
                  ${(tenants || []).map((tenant) => `
                    <option value="${tenant.tenantId}">
                      ${tenant.nome} (${tenant.tenantId})
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="field">
                <label class="field-label">Módulo</label>
                <select class="field-input field-select" name="moduleKey" required>
                  <option value="">Selecione</option>
                  ${coreModules.map((module) => `
                    <option value="${module.module_key}">${module.module_name}</option>
                  `).join('')}
                </select>
              </div>

              <div class="field">
                <label class="field-label">Papel</label>
                <select class="field-input field-select" name="roleKey" required>
                  <option value="">Selecione</option>
                  ${coreRoles.map((role) => `
                    <option value="${role.role_key}">
                      ${getFriendlyRoleLabel(role.role_key, role.role_name)}
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="field-actions field-full">
                <button class="btn-ghost" type="button" id="btnCancelarModalNovoVinculoUsuario">Cancelar</button>
                <button class="btn-primary" type="submit">Salvar vínculo</button>
              </div>

              <div class="form-feedback field-full" id="feedbackNovoVinculoUsuario"></div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  function renderPage(user) {
    return `
      <section class="app-page">
        <header class="page-head">
  <div>
    <div class="user-header-block">
      <div class="user-avatar user-avatar-lg">
        ${user.avatarUrl
          ? `<img src="${user.avatarUrl}" alt="avatar do usuário" />`
          : `<span>${(user.nome || 'U')[0]}</span>`
        }
      </div>

      <div>
        <h1 class="page-title">${user.nome || 'Usuário'}</h1>
        <p class="page-subtitle">${user.email || '-'}</p>
      </div>
    </div>
  </div>

  <div class="page-actions">
            <button class="btn-ghost" type="button" id="btnVoltarUsuarios">Voltar</button>
            <button class="btn-danger" type="button" id="btnAbrirModalExcluirUsuarioDetalhe">Excluir usuário</button>
          </div>
        </header>

        <section class="grid-kpis">
          <article class="kpi-card">
            <div class="kpi-label">Status</div>
            <div class="kpi-value small">${user.status || '-'}</div>
            <div class="kpi-meta">Situação global do usuário</div>
          </article>

          <article class="kpi-card">
            <div class="kpi-label">Empresas</div>
            <div class="kpi-value small">${user.tenantCount || 0}</div>
            <div class="kpi-meta">Vínculos ativos no painel</div>
          </article>

          <article class="kpi-card">
            <div class="kpi-label">Módulos</div>
            <div class="kpi-value small">${user.moduleCount || 0}</div>
            <div class="kpi-meta">Total de módulos vinculados</div>
          </article>

          <article class="kpi-card">
            <div class="kpi-label">Platform admin</div>
            <div class="kpi-value small">${user.isPlatformAdmin ? 'sim' : 'não'}</div>
            <div class="kpi-meta">Permissão administrativa global</div>
          </article>
        </section>

        <section class="two-col-grid">
                    <article class="panel">
            <div class="panel-head">
              <div>
                <h2 class="panel-title">Visão geral</h2>
                <p class="panel-subtitle">Dados globais do usuário</p>
              </div>

              <button class="btn-primary btn-sm" type="button" id="btnAbrirModalEditarUsuario">
                Editar
              </button>
            </div>

            <div class="panel-body details-grid">
              <div class="detail-row"><strong>Nome:</strong> ${user.nome || '-'}</div>
              <div class="detail-row"><strong>E-mail:</strong> ${user.email || '-'}</div>
              <div class="detail-row"><strong>Status:</strong> ${user.status || '-'}</div>
      <div class="detail-row"><strong>Telefone:</strong> ${user.phone || '-'}</div>
              <div class="detail-row"><strong>Platform admin:</strong> ${user.isPlatformAdmin ? 'sim' : 'não'}</div>
              <div class="detail-row"><strong>Empresas:</strong> ${user.tenantCount || 0}</div>
              <div class="detail-row"><strong>Módulos:</strong> ${user.moduleCount || 0}</div>
            </div>
          </article>

          <article class="panel">
            <div class="panel-head">
              <div>
                <h2 class="panel-title">Ações</h2>
                <p class="panel-subtitle">Fluxos administrativos do usuário</p>
              </div>
            </div>

              <button class="btn-ghost action-wide" type="button" id="btnResetSenhaPlaceholder">
                Enviar link para definir senha
              </button>
            </div>
          </article>
        </section>

        <section class="panel">
  <div class="panel-head">
    <div>
      <h2 class="panel-title">Empresas, vínculos e acessos</h2>
      <p class="panel-subtitle">Resumo por empresa e módulo</p>
    </div>

    <button class="btn-primary btn-sm" type="button" id="btnAbrirModalNovoVinculoUsuario">
      + Vincular empresa
    </button>
  </div>

  <div class="panel-body list-body">
    ${renderMemberships(user)}
  </div>
</section>

        <div class="modal-overlay hidden" id="modalExcluirUsuarioDetalhe">
          <div class="modal-card">
            <div class="modal-head">
              <div>
                <h2 class="panel-title">Excluir usuário</h2>
                <p class="panel-subtitle">Remover este usuário global da plataforma</p>
              </div>

              <button class="modal-close" type="button" id="btnFecharModalExcluirUsuarioDetalhe">✕</button>
            </div>

            <div class="panel-body">
              <div class="danger-box">
                Você está prestes a excluir o usuário <strong>${user.nome || '-'}</strong>.
                Esta ação remove o perfil global e seus vínculos com empresas e módulos.
              </div>

              <div class="field-actions" style="margin-top:16px;">
                <button class="btn-ghost" type="button" id="btnCancelarExcluirUsuarioDetalhe">Cancelar</button>
                <button class="btn-danger" type="button" id="btnConfirmarExcluirUsuarioDetalhe">Excluir usuário</button>
              </div>

              <div class="form-feedback" id="feedbackExcluirUsuarioDetalhe" style="margin-top:12px;"></div>
            </div>
          </div>
        </div>
           ${renderEditUserModal(user)}
${renderEditMembershipRoleModal(user, window.DevState?.get('globalCoreRoles') || [])}
${renderCreateMembershipModal(
  user,
  window.DevState?.get('globalTenants') || [],
  window.DevState?.get('globalCoreRoles') || [],
  window.DevState?.get('allModules') || []
)}
      </section>
    `;
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('hidden');
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('hidden');
  }

      function bindAvatarFileInput(user) {
    const input = document.getElementById('inputAvatarUsuario');
    const fileName = document.getElementById('fileUploadAvatarUsuarioNome');
    const preview = document.getElementById('previewAvatarUsuario');
    const removeAvatarInput = document.getElementById('inputRemoveAvatarUsuario');

    if (!input || !fileName || !preview || !removeAvatarInput) return;

    input.addEventListener('change', () => {
      const file = input.files && input.files[0];

      fileName.textContent = file ? file.name : 'Nenhum arquivo escolhido';
      removeAvatarInput.value = 'false';

      if (!file) {
        preview.innerHTML = user.avatarUrl
          ? `<img src="${user.avatarUrl}" alt="avatar atual do usuário" />`
          : `<span>${(user.nome || 'U')[0]}</span>`;
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        preview.innerHTML = `<img src="${reader.result}" alt="prévia do avatar" />`;
      };
      reader.readAsDataURL(file);
    });
  }

    function bindRemoveAvatarButton(user) {
    const btn = document.getElementById('btnExcluirFotoUsuario');
    const input = document.getElementById('inputAvatarUsuario');
    const fileName = document.getElementById('fileUploadAvatarUsuarioNome');
    const preview = document.getElementById('previewAvatarUsuario');
    const removeAvatarInput = document.getElementById('inputRemoveAvatarUsuario');

    if (!btn || !input || !fileName || !preview || !removeAvatarInput) return;

    btn.addEventListener('click', () => {
      input.value = '';
      fileName.textContent = 'Nenhum arquivo escolhido';
      removeAvatarInput.value = 'true';
      preview.innerHTML = `<span>${(user.nome || 'U')[0]}</span>`;
    });
  }

     function bindActions(user) {
    const btnVoltar = document.getElementById('btnVoltarUsuarios');
    const btnSenha = document.getElementById('btnResetSenhaPlaceholder');

    if (btnVoltar) {
      btnVoltar.addEventListener('click', () => {
        DevRouter.navigate('usuarios');
      });
    }

   if (btnSenha) {
  btnSenha.addEventListener('click', async () => {
    try {
      const email = String(user.email || '').trim().toLowerCase();

      if (!email) {
        throw new Error('Este usuário não possui e-mail cadastrado.');
      }

      const redirectTo = `${window.DevConfig.portalAppUrl}`;

      await DevAPI.sendPasswordResetEmail(email, redirectTo);

      alert(`E-mail de troca de senha enviado com sucesso para ${email}.`);
    } catch (error) {
      console.error(error);
      alert(error.message || 'Erro ao enviar e-mail de troca de senha.');
    }
  });
}

    const btnOpenDeleteUser = document.getElementById('btnAbrirModalExcluirUsuarioDetalhe');
    const btnCloseDeleteUser = document.getElementById('btnFecharModalExcluirUsuarioDetalhe');
    const btnCancelDeleteUser = document.getElementById('btnCancelarExcluirUsuarioDetalhe');
    const btnConfirmDeleteUser = document.getElementById('btnConfirmarExcluirUsuarioDetalhe');
    const feedbackDeleteUser = document.getElementById('feedbackExcluirUsuarioDetalhe');
    const modalDeleteUser = document.getElementById('modalExcluirUsuarioDetalhe');

    if (btnOpenDeleteUser) btnOpenDeleteUser.addEventListener('click', () => openModal('modalExcluirUsuarioDetalhe'));
    if (btnCloseDeleteUser) btnCloseDeleteUser.addEventListener('click', () => closeModal('modalExcluirUsuarioDetalhe'));
    if (btnCancelDeleteUser) btnCancelDeleteUser.addEventListener('click', () => closeModal('modalExcluirUsuarioDetalhe'));

    if (modalDeleteUser) {
      modalDeleteUser.addEventListener('click', (event) => {
        if (event.target === modalDeleteUser) {
          closeModal('modalExcluirUsuarioDetalhe');
        }
      });
    }

    if (btnConfirmDeleteUser && feedbackDeleteUser) {
      btnConfirmDeleteUser.addEventListener('click', async () => {
        feedbackDeleteUser.textContent = 'Excluindo usuário...';
        feedbackDeleteUser.className = 'form-feedback pending';

        try {
          await DevAPI.deleteGlobalUser(user.id);
          feedbackDeleteUser.textContent = 'Usuário excluído com sucesso.';
          feedbackDeleteUser.className = 'form-feedback success';
          DevRouter.navigate('usuarios');
        } catch (error) {
          console.error(error);
          feedbackDeleteUser.textContent = error.message || 'Erro ao excluir usuário.';
          feedbackDeleteUser.className = 'form-feedback error';
        }
      });
    }

    const btnOpenEditUser = document.getElementById('btnAbrirModalEditarUsuario');
    const btnCloseEditUser = document.getElementById('btnFecharModalEditarUsuario');
    const btnCancelEditUser = document.getElementById('btnCancelarModalEditarUsuario');
    const modalEditUser = document.getElementById('modalEditarUsuario');
    const formEditUser = document.getElementById('formEditarUsuario');
    const feedbackEditUser = document.getElementById('feedbackEditarUsuario');

    if (btnOpenEditUser) btnOpenEditUser.addEventListener('click', () => openModal('modalEditarUsuario'));
    if (btnCloseEditUser) btnCloseEditUser.addEventListener('click', () => closeModal('modalEditarUsuario'));
    if (btnCancelEditUser) btnCancelEditUser.addEventListener('click', () => closeModal('modalEditarUsuario'));

    if (modalEditUser) {
      modalEditUser.addEventListener('click', (event) => {
        if (event.target === modalEditUser) {
          closeModal('modalEditarUsuario');
        }
      });
    }

            bindAvatarFileInput(user);
    bindRemoveAvatarButton(user);

    if (formEditUser && feedbackEditUser) {
      formEditUser.addEventListener('submit', async (event) => {
        event.preventDefault();

        feedbackEditUser.textContent = 'Salvando alterações...';
        feedbackEditUser.className = 'form-feedback pending';

        const formData = new FormData(formEditUser);

        try {
    let avatarUrl = user.avatarUrl || '';
  const avatarFile = formData.get('avatarFile');
  const removeAvatar = formData.get('removeAvatar') === 'true';

  if (removeAvatar && avatarUrl) {
    await DevAPI.deleteUserAvatarByUrl(avatarUrl);
    avatarUrl = '';
  }

  if (avatarFile && avatarFile.size > 0) {
    if (avatarUrl) {
      await DevAPI.deleteUserAvatarByUrl(avatarUrl);
    }

    avatarUrl = await DevAPI.uploadUserAvatar(user.id, avatarFile);
  }

  const nextEmail = String(formData.get('email') || '').trim().toLowerCase();
const currentEmail = String(user.email || '').trim().toLowerCase();

if (!nextEmail) {
  throw new Error('E-mail obrigatório.');
}

if (!user.authUserId) {
  throw new Error('Este usuário não possui auth_user_id vinculado.');
}

if (nextEmail !== currentEmail) {
  await DevAPI.updateAuthUserEmailViaFunction({
    profileId: user.id,
    authUserId: user.authUserId,
    newEmail: nextEmail
  });
}

await DevAPI.updateGlobalUser({
  userId: user.id,
  fullName: formData.get('fullName'),
  status: formData.get('status'),
  isPlatformAdmin: formData.get('isPlatformAdmin') === 'true',
  phone: formData.get('phone'),
  avatarUrl
});

const newPassword = String(formData.get('newPassword') || '').trim();

if (newPassword) {
  if (newPassword.length < 6) {
    throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
  }

  await DevAPI.updateAuthUserPasswordViaFunction(user.authUserId, newPassword);
}

  feedbackEditUser.textContent = 'Usuário atualizado com sucesso.';
  feedbackEditUser.className = 'form-feedback success';

  closeModal('modalEditarUsuario');
  hydrate(user.id);

} catch (error) {
          console.error(error);
          feedbackEditUser.textContent = error.message || 'Erro ao atualizar usuário.';
          feedbackEditUser.className = 'form-feedback error';
        }
      });
    }

    const btnCloseEditRole = document.getElementById('btnFecharModalEditarPapelVinculo');
    const btnCancelEditRole = document.getElementById('btnCancelarModalEditarPapelVinculo');
    const modalEditRole = document.getElementById('modalEditarPapelVinculo');
    const formEditRole = document.getElementById('formEditarPapelVinculo');
    const feedbackEditRole = document.getElementById('feedbackEditarPapelVinculo');
    const inputMembershipId = document.getElementById('inputMembershipIdEditarPapel');
    const inputTenantName = document.getElementById('inputTenantNameEditarPapel');
    const selectRoleKey = document.getElementById('selectRoleKeyEditarPapel');

    if (btnCloseEditRole) btnCloseEditRole.addEventListener('click', () => closeModal('modalEditarPapelVinculo'));
    if (btnCancelEditRole) btnCancelEditRole.addEventListener('click', () => closeModal('modalEditarPapelVinculo'));

    if (modalEditRole) {
      modalEditRole.addEventListener('click', (event) => {
        if (event.target === modalEditRole) {
          closeModal('modalEditarPapelVinculo');
        }
      });
    }

        const btnOpenCreateMembership = document.getElementById('btnAbrirModalNovoVinculoUsuario');
    const btnCloseCreateMembership = document.getElementById('btnFecharModalNovoVinculoUsuario');
    const btnCancelCreateMembership = document.getElementById('btnCancelarModalNovoVinculoUsuario');
    const modalCreateMembership = document.getElementById('modalNovoVinculoUsuario');
    const formCreateMembership = document.getElementById('formNovoVinculoUsuario');
    const feedbackCreateMembership = document.getElementById('feedbackNovoVinculoUsuario');

    if (btnOpenCreateMembership) {
      btnOpenCreateMembership.addEventListener('click', () => openModal('modalNovoVinculoUsuario'));
    }

    if (btnCloseCreateMembership) {
      btnCloseCreateMembership.addEventListener('click', () => closeModal('modalNovoVinculoUsuario'));
    }

    if (btnCancelCreateMembership) {
      btnCancelCreateMembership.addEventListener('click', () => closeModal('modalNovoVinculoUsuario'));
    }

    if (modalCreateMembership) {
      modalCreateMembership.addEventListener('click', (event) => {
        if (event.target === modalCreateMembership) {
          closeModal('modalNovoVinculoUsuario');
        }
      });
    }

    if (formCreateMembership && feedbackCreateMembership) {
      formCreateMembership.addEventListener('submit', async (event) => {
        event.preventDefault();

        feedbackCreateMembership.textContent = 'Salvando vínculo...';
        feedbackCreateMembership.className = 'form-feedback pending';

        const formData = new FormData(formCreateMembership);

        try {
          await DevAPI.createUserMembershipLink({
            userId: user.id,
            tenantId: formData.get('tenantId'),
            roleKey: formData.get('roleKey'),
            moduleKey: formData.get('moduleKey')
          });

          feedbackCreateMembership.textContent = 'Vínculo criado com sucesso.';
          feedbackCreateMembership.className = 'form-feedback success';

          closeModal('modalNovoVinculoUsuario');
          hydrate(user.id);
        } catch (error) {
          console.error(error);
          feedbackCreateMembership.textContent = error.message || 'Erro ao criar vínculo.';
          feedbackCreateMembership.className = 'form-feedback error';
        }
      });
    }

    if (formEditRole && feedbackEditRole) {
      formEditRole.addEventListener('submit', async (event) => {
        event.preventDefault();

        feedbackEditRole.textContent = 'Salvando papel...';
        feedbackEditRole.className = 'form-feedback pending';

        const formData = new FormData(formEditRole);
        const membershipId = formData.get('membershipId');
        const roleKey = formData.get('roleKey');

        try {
          await DevAPI.updateUserMembershipRole(membershipId, roleKey);
          feedbackEditRole.textContent = 'Papel atualizado com sucesso.';
          feedbackEditRole.className = 'form-feedback success';
          closeModal('modalEditarPapelVinculo');
          hydrate(user.id);
        } catch (error) {
          console.error(error);
          feedbackEditRole.textContent = error.message || 'Erro ao atualizar papel.';
          feedbackEditRole.className = 'form-feedback error';
        }
      });
    }

    document.querySelectorAll('[data-membership-action="toggle-status"]').forEach((button) => {
      button.addEventListener('click', async () => {
        const membershipId = button.getAttribute('data-membership-id');
        const nextStatus = button.getAttribute('data-next-status');

        if (!membershipId || !nextStatus) return;

        const label = nextStatus === 'ativo' ? 'ativar' : 'bloquear';
        const confirmed = window.confirm(`Deseja ${label} este vínculo?`);
        if (!confirmed) return;

        try {
          await DevAPI.updateUserMembershipStatus(membershipId, nextStatus);
          hydrate(user.id);
        } catch (error) {
          console.error(error);
          alert(error.message || 'Erro ao atualizar vínculo.');
        }
      });
    });

    document.querySelectorAll('[data-membership-action="edit-role"]').forEach((button) => {
      button.addEventListener('click', () => {
        const membershipId = button.getAttribute('data-membership-id') || '';
        const currentRole = button.getAttribute('data-current-role') || '';
        const tenantName = button.getAttribute('data-tenant-name') || '';

        if (inputMembershipId) inputMembershipId.value = membershipId;
        if (inputTenantName) inputTenantName.value = tenantName;
        if (selectRoleKey) selectRoleKey.value = currentRole;

        openModal('modalEditarPapelVinculo');
      });
    });

    document.querySelectorAll('[data-membership-action="delete"]').forEach((button) => {
      button.addEventListener('click', async () => {
        const membershipId = button.getAttribute('data-membership-id');
        if (!membershipId) return;

        const confirmed = window.confirm('Deseja excluir este vínculo?');
        if (!confirmed) return;

        try {
          await DevAPI.deleteUserMembership(membershipId);
          hydrate(user.id);
        } catch (error) {
          console.error(error);
          alert(error.message || 'Erro ao excluir vínculo.');
        }
      });
    });
  }

  async function hydrate(userId) {
    const mount = document.getElementById('usuarioMount');
    if (!mount) return;

    try {
            const [user, coreRoles, tenants, modules] = await Promise.all([
  DevAPI.getGlobalUserById(userId),
  DevAPI.getSystemRoles('core'),
  DevAPI.getTenants(),
  DevAPI.getModules()
]);

      if (!user) {
        mount.innerHTML = `
          <section class="app-page">
            <div class="empty-card">
              <div class="empty-title">Usuário não encontrado</div>
              <div class="empty-text">Verifique o id informado.</div>
            </div>
          </section>
        `;
        return;
      }

      DevState.set('userDetail', user);
DevState.set('globalCoreRoles', coreRoles || []);
DevState.set('globalTenants', tenants || []);
DevState.set('allModules', modules || []);
      mount.innerHTML = renderPage(user);
      bindActions(user);
    } catch (error) {
      console.error(error);
      mount.innerHTML = `
        <section class="app-page">
          <div class="empty-card">
            <div class="empty-title">Erro ao carregar usuário</div>
            <div class="empty-text">${error.message || 'Falha ao consultar o Supabase.'}</div>
          </div>
        </section>
      `;
    }
  }

  function page(params) {
    const userId = params.id || '';
    setTimeout(() => hydrate(userId), 0);
    return `<div id="usuarioMount">${loadingTemplate(userId)}</div>`;
  }

  DevRouter.register('usuario', page);
})();