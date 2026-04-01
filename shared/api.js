window.DevAPI = (() => {
  const { client } = window.DevSupabase;

  function ensureClient() {
    if (!client) {
      throw new Error('Cliente Supabase não inicializado.');
    }
  }

      async function createAuthUserViaFunction(email) {
    ensureClient();

    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      throw new Error('E-mail obrigatório para criar usuário no Auth.');
    }

    const {
      data: sessionData,
      error: sessionError
    } = await client.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    const accessToken = sessionData?.session?.access_token || '';

    if (!accessToken) {
      throw new Error('Sessão autenticada não encontrada para criar usuário.');
    }

    const { data, error } = await client.functions.invoke('create-platform-user', {
      body: { email: normalizedEmail },
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: window.DevConfig.supabasePublishableKey
      }
    });

    if (error) {
      throw error;
    }

    if (!data?.user?.id) {
      throw new Error('Falha ao criar usuário no Auth.');
    }

    return data.user;
  }

  async function updateAuthUserPasswordViaFunction(authUserId, newPassword) {
    ensureClient();

    const normalizedAuthUserId = String(authUserId || '').trim();
    const normalizedPassword = String(newPassword || '');

    if (!normalizedAuthUserId) {
      throw new Error('Usuário Auth não informado para alterar senha.');
    }

    if (!normalizedPassword || normalizedPassword.length < 6) {
      throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
    }

    const {
      data: sessionData,
      error: sessionError
    } = await client.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    const accessToken = sessionData?.session?.access_token || '';

    if (!accessToken) {
      throw new Error('Sessão autenticada não encontrada para chamar a Edge Function.');
    }

    const { data, error } = await client.functions.invoke('update-platform-user-password', {
      body: {
        authUserId: normalizedAuthUserId,
        newPassword: normalizedPassword
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: window.DevConfig.supabasePublishableKey
      }
    });

    if (error) {
      throw error;
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Falha ao atualizar senha no Auth.');
    }

    return true;
  }

    async function updateAuthUserEmailViaFunction(payload) {
    ensureClient();

    const profileId = String(payload?.profileId || '').trim();
    const authUserId = String(payload?.authUserId || '').trim();
    const newEmail = String(payload?.newEmail || '').trim().toLowerCase();

    if (!profileId) {
      throw new Error('Perfil não informado para alterar e-mail.');
    }

    if (!authUserId) {
      throw new Error('Usuário Auth não informado para alterar e-mail.');
    }

    if (!newEmail) {
      throw new Error('Novo e-mail obrigatório.');
    }

    const {
      data: sessionData,
      error: sessionError
    } = await client.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    const accessToken = sessionData?.session?.access_token || '';

    if (!accessToken) {
      throw new Error('Sessão autenticada não encontrada para chamar a Edge Function.');
    }

    const { data, error } = await client.functions.invoke('update-platform-user-email', {
      body: {
        profileId,
        authUserId,
        newEmail
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: window.DevConfig.supabasePublishableKey
      }
    });

    if (error) {
      throw error;
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Falha ao atualizar e-mail no Auth.');
    }

    return true;
  }

  function mapTenant(base, contract, moduleRows) {
    const nome = base.trade_name || base.legal_name;

    return {
      id: base.id,
      tenantId: base.tenant_id,
      nome,
      razaoSocial: base.legal_name,
      cnpj: base.cnpj || '-',
      status: base.status,
      onboarding: base.onboarding_status || 'pendente',
      notes: base.notes || '',
      contactName: base.contact_name || '-',
      contactEmail: base.contact_email || '-',
      contactCpf: base.contact_cpf || '-',
      address: base.address || '-',
      phone: base.phone || '-',
      logoUrl: base.logo_url || '',
     monthlyAmount: Number(contract?.monthly_amount || 0),
adimplencia: contract?.financial_status || '-',
vencimento: contract?.due_day ? `Dia ${contract.due_day}` : '-',
dueDay: Number(contract?.due_day || 1),
      modules: (moduleRows || []).map((row) => ({
        status: row.status,
        environment: row.environment,
        key: row.dp_modules?.module_key || '',
        nome: row.dp_modules?.module_name || ''
      }))
    };
  }

  async function uploadTenantLogo(tenantId, file) {
    ensureClient();

    if (!file) return '';

    const extension = (file.name.split('.').pop() || 'png').toLowerCase();
    const fileName = `${tenantId}-${Date.now()}.${extension}`;
    const filePath = `tenants/${tenantId}/${fileName}`;

    const { error: uploadError } = await client.storage
      .from('tenant-logos')
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) throw uploadError;

    const { data } = client.storage
      .from('tenant-logos')
      .getPublicUrl(filePath);

    return data?.publicUrl || '';
  }

  async function getTenants() {
    ensureClient();

    const [
      { data: tenants, error: tenantsError },
      { data: contracts, error: contractsError },
      { data: tenantModules, error: tmError }
    ] = await Promise.all([
      client
        .from('dp_tenants')
        .select(`
          id,
          tenant_id,
          legal_name,
          trade_name,
          cnpj,
          status,
          onboarding_status,
          notes,
          contact_name,
          contact_email,
          contact_cpf,
          address,
          phone,
          logo_url
        `)
        .order('created_at', { ascending: true }),

      client
        .from('dp_contracts')
.select('id, tenant_id, plan_name, monthly_amount, financial_status, due_day, created_at')
.order('created_at', { ascending: false }),

      client
        .from('dp_tenant_modules')
        .select(`
          id,
          tenant_id,
          status,
          environment,
          module_id,
          dp_modules:module_id (
            module_key,
            module_name
          )
        `)
    ]);

    if (tenantsError) throw tenantsError;
    if (contractsError) throw contractsError;
    if (tmError) throw tmError;

    const latestContractByTenant = new Map();
    (contracts || []).forEach((contract) => {
      if (!latestContractByTenant.has(contract.tenant_id)) {
        latestContractByTenant.set(contract.tenant_id, contract);
      }
    });

    const modulesByTenant = new Map();
    (tenantModules || []).forEach((row) => {
      const current = modulesByTenant.get(row.tenant_id) || [];
      current.push(row);
      modulesByTenant.set(row.tenant_id, current);
    });

    return (tenants || []).map((tenant) =>
      mapTenant(
        tenant,
        latestContractByTenant.get(tenant.id),
        modulesByTenant.get(tenant.id) || []
      )
    );
  }

  async function getTenantByTenantId(tenantId) {
    const tenants = await getTenants();
    return tenants.find((tenant) => tenant.tenantId === tenantId) || null;
  }

  async function getTenantRowByTenantId(tenantId) {
    ensureClient();

    const { data, error } = await client
      .from('dp_tenants')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

  async function getRoles() {
    ensureClient();

    const { data, error } = await client
      .from('dp_roles')
      .select('id, role_key, role_name, scope')
      .order('role_name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async function getModules() {
    ensureClient();

    const { data, error } = await client
      .from('dp_modules')
      .select('id, module_key, module_name, system_domain, is_active')
      .order('module_name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async function createTenant(payload) {
    ensureClient();

    const {
      tenantId,
      legalName,
      tradeName,
      cnpj,
      onboardingStatus,
      notes,
      dueDay,
      contactName,
      contactEmail,
      contactCpf,
      address,
      phone,
      logoFile
    } = payload;

    const { data: tenant, error: tenantError } = await client
      .from('dp_tenants')
      .insert({
        tenant_id: tenantId,
        legal_name: legalName,
        trade_name: tradeName,
        cnpj,
        status: 'ativo',
        onboarding_status: onboardingStatus,
        notes,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_cpf: contactCpf,
        address,
        phone
      })
      .select('id, tenant_id')
      .single();

    if (tenantError) throw tenantError;

    const { error: contractError } = await client
      .from('dp_contracts')
      .insert({
        tenant_id: tenant.id,
        plan_name: 'A definir',
        monthly_amount: 0,
        due_day: Number(dueDay || 1),
        financial_status: 'adimplente',
        auto_block_enabled: true,
        started_at: new Date().toISOString().slice(0, 10),
        notes: 'Contrato inicial criado pelo Dev Panel'
      });

    if (contractError) throw contractError;

    if (logoFile) {
      const logoUrl = await uploadTenantLogo(tenantId, logoFile);

      if (logoUrl) {
        const { error: updateError } = await client
          .from('dp_tenants')
          .update({ logo_url: logoUrl })
          .eq('id', tenant.id);

        if (updateError) throw updateError;
      }
    }

    return tenant;
  }

  async function uploadUserAvatar(userId, file) {
  ensureClient();

  if (!file) return '';

  const extension = (file.name.split('.').pop() || 'png').toLowerCase();
  const fileName = `${userId}-${Date.now()}.${extension}`;
  const filePath = `users/${userId}/${fileName}`;

  const { error: uploadError } = await client.storage
    .from('user-avatars')
    .upload(filePath, file, {
      upsert: true,
      cacheControl: '3600'
    });

  if (uploadError) throw uploadError;

  const { data } = client.storage
    .from('user-avatars')
    .getPublicUrl(filePath);

  return data?.publicUrl || '';
}

  async function deleteUserAvatarByUrl(avatarUrl) {
    ensureClient();

    if (!avatarUrl) return true;

    let objectPath = '';

    try {
      const url = new URL(avatarUrl);
      const marker = '/storage/v1/object/public/user-avatars/';
      const index = url.pathname.indexOf(marker);

      if (index === -1) return true;

      objectPath = decodeURIComponent(url.pathname.slice(index + marker.length));
    } catch (error) {
      console.warn('Não foi possível interpretar a URL do avatar para exclusão.', error);
      return true;
    }

    if (!objectPath) return true;

    const { error } = await client.storage
      .from('user-avatars')
      .remove([objectPath]);

    if (error) throw error;

    return true;
  }

  async function updateTenant(payload) {
  ensureClient();

  const {
    currentTenantId,
    tenantId,
    legalName,
    tradeName,
    cnpj,
    onboardingStatus,
    dueDay,
    contactName,
    contactEmail,
    contactCpf,
    address,
    phone,
    notes,
    logoFile
  } = payload;

  const tenant = await getTenantRowByTenantId(currentTenantId);

  if (!tenant) {
    throw new Error('Empresa não encontrada para edição.');
  }

  const { error: tenantError } = await client
    .from('dp_tenants')
    .update({
      tenant_id: tenantId,
      legal_name: legalName,
      trade_name: tradeName,
      cnpj,
      onboarding_status: onboardingStatus,
      notes,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_cpf: contactCpf,
      address,
      phone
    })
    .eq('id', tenant.id);

  if (tenantError) throw tenantError;

  const { data: latestContract, error: contractFindError } = await client
    .from('dp_contracts')
    .select('id')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (contractFindError) throw contractFindError;

  if (latestContract?.id) {
    const { error: contractUpdateError } = await client
      .from('dp_contracts')
      .update({
        due_day: Number(dueDay || 1)
      })
      .eq('id', latestContract.id);

    if (contractUpdateError) throw contractUpdateError;
  }

  if (logoFile && logoFile.size > 0) {
    const logoUrl = await uploadTenantLogo(tenantId, logoFile);

    if (logoUrl) {
      const { error: logoUpdateError } = await client
        .from('dp_tenants')
        .update({ logo_url: logoUrl })
        .eq('id', tenant.id);

      if (logoUpdateError) throw logoUpdateError;
    }
  }

  return tenant;
}

  async function attachModuleToTenant(tenantId, moduleKey, status = 'ativo', environment = 'producao') {
    ensureClient();

    const [tenant, modules] = await Promise.all([
      getTenantRowByTenantId(tenantId),
      getModules()
    ]);

    if (!tenant) {
      throw new Error('Empresa não encontrada para vincular módulo.');
    }

    const moduleRow = modules.find((item) => item.module_key === moduleKey);
    if (!moduleRow) {
      throw new Error('Módulo não encontrado.');
    }

    const { error } = await client
      .from('dp_tenant_modules')
      .insert({
        tenant_id: tenant.id,
        module_id: moduleRow.id,
        status,
        environment,
        activated_at: new Date().toISOString(),
        notes: 'Vínculo criado pelo Dev Panel'
      });

    if (error) throw error;
  }

  async function getUsersByTenantId(tenantId) {
    ensureClient();

    const { data: tenant, error: tenantError } = await client
      .from('dp_tenants')
      .select('id')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (tenantError) throw tenantError;
    if (!tenant) return [];

    const { data: memberships, error: membershipsError } = await client
      .from('dp_memberships')
      .select(`
        id,
        membership_status,
        user_id,
        role_id,
        dp_profiles:user_id (
          id,
          full_name,
          email,
          user_status,
          is_platform_admin
        ),
        dp_roles:role_id (
          role_key,
          role_name
        )
      `)
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: true });

    if (membershipsError) throw membershipsError;

    const membershipIds = (memberships || []).map((item) => item.id);
    const modulesByMembership = new Map();

    if (membershipIds.length) {
      const { data: membershipModules, error: mmError } = await client
        .from('dp_membership_modules')
        .select(`
          membership_id,
          access_level,
          is_enabled,
          module_id,
          dp_modules:module_id (
            module_key,
            module_name
          )
        `)
        .in('membership_id', membershipIds);

      if (mmError) throw mmError;

      (membershipModules || []).forEach((row) => {
        const current = modulesByMembership.get(row.membership_id) || [];
        current.push({
          key: row.dp_modules?.module_key || '',
          nome: row.dp_modules?.module_name || '',
          accessLevel: row.access_level,
          isEnabled: row.is_enabled
        });
        modulesByMembership.set(row.membership_id, current);
      });
    }

    return (memberships || []).map((row) => {
      const modules = modulesByMembership.get(row.id) || [];

      return {
        id: row.dp_profiles?.id || '',
        membershipId: row.id,
        nome: row.dp_profiles?.full_name || 'Usuário',
        email: row.dp_profiles?.email || '-',
        status: row.membership_status || row.dp_profiles?.user_status || 'ativo',
        role: row.dp_roles?.role_key || 'sem_role',
        roleName: row.dp_roles?.role_name || 'Sem papel',
        modules: modules.map((m) => m.key),
        modulesDetailed: modules
      };
    });
  }

    async function getGlobalUsers() {
    ensureClient();

    const [
      { data: profiles, error: profilesError },
      { data: memberships, error: membershipsError },
      { data: membershipModules, error: membershipModulesError }
    ] = await Promise.all([
      client
        .from('dp_profiles')
        .select('id, auth_user_id, full_name, email, user_status, is_platform_admin, phone, avatar_url, created_at')
        .order('created_at', { ascending: true }),

      client
        .from('dp_memberships')
        .select(`
          id,
          user_id,
          tenant_id,
          membership_status,
          role_id,
          dp_tenants:tenant_id (
            id,
            tenant_id,
            trade_name,
            legal_name,
            status
          ),
          dp_roles:role_id (
            role_key,
            role_name
          )
        `),

      client
        .from('dp_membership_modules')
        .select(`
          membership_id,
          access_level,
          is_enabled,
          module_id,
          dp_modules:module_id (
            module_key,
            module_name
          )
        `)
    ]);

    if (profilesError) throw profilesError;
    if (membershipsError) throw membershipsError;
    if (membershipModulesError) throw membershipModulesError;

    const modulesByMembership = new Map();
    (membershipModules || []).forEach((row) => {
      const current = modulesByMembership.get(row.membership_id) || [];
      current.push({
        key: row.dp_modules?.module_key || '',
        nome: row.dp_modules?.module_name || '',
        accessLevel: row.access_level || 'leitura',
        isEnabled: row.is_enabled === true
      });
      modulesByMembership.set(row.membership_id, current);
    });

    const membershipsByUser = new Map();
    (memberships || []).forEach((row) => {
      const current = membershipsByUser.get(row.user_id) || [];
      current.push({
        id: row.id,
        status: row.membership_status,
        tenantId: row.dp_tenants?.tenant_id || '',
        tenantName: row.dp_tenants?.trade_name || row.dp_tenants?.legal_name || 'Empresa',
        tenantStatus: row.dp_tenants?.status || 'ativo',
        roleKey: row.dp_roles?.role_key || '',
        roleName: row.dp_roles?.role_name || 'Sem papel',
        modules: modulesByMembership.get(row.id) || []
      });
      membershipsByUser.set(row.user_id, current);
    });

    return (profiles || []).map((profile) => {
      const links = membershipsByUser.get(profile.id) || [];
      const moduleCount = links.reduce((acc, item) => acc + item.modules.length, 0);

      return {
  id: profile.id,
  authUserId: profile.auth_user_id || '',
  nome: profile.full_name || '',
  email: profile.email || '',
  phone: profile.phone || '',
  avatarUrl: profile.avatar_url || '',
  status: profile.user_status || 'ativo',
  isPlatformAdmin: profile.is_platform_admin === true,
  tenantCount: links.length,
  moduleCount,
  memberships: links
};
    });
  }

    async function getGlobalUserById(userId) {
    ensureClient();

    const users = await getGlobalUsers();
    return users.find((user) => user.id === userId) || null;
  }

  async function deleteGlobalUser(userId) {
    ensureClient();

    if (!userId) {
      throw new Error('Usuário não informado para exclusão.');
    }

    const { data: profile, error: profileError } = await client
      .from('dp_profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) throw profileError;

    if (!profile) {
      throw new Error('Usuário não encontrado.');
    }

    const { data: memberships, error: membershipsError } = await client
      .from('dp_memberships')
      .select('id')
      .eq('user_id', userId);

    if (membershipsError) throw membershipsError;

    const membershipIds = (memberships || []).map((item) => item.id);

    if (membershipIds.length) {
      const { error: mmError } = await client
        .from('dp_membership_modules')
        .delete()
        .in('membership_id', membershipIds);

      if (mmError) throw mmError;

      const { error: membershipsDeleteError } = await client
        .from('dp_memberships')
        .delete()
        .eq('user_id', userId);

      if (membershipsDeleteError) throw membershipsDeleteError;
    }

    const { error: deleteProfileError } = await client
      .from('dp_profiles')
      .delete()
      .eq('id', userId);

    if (deleteProfileError) throw deleteProfileError;

    return true;
  }

       async function updateGlobalUser(payload) {
    ensureClient();

    const {
      userId,
      fullName,
      status,
      isPlatformAdmin,
      phone,
      avatarUrl
    } = payload;

    if (!userId) {
      throw new Error('Usuário não informado para edição.');
    }

    const { error } = await client
      .from('dp_profiles')
      .update({
        full_name: fullName || 'Usuário',
        user_status: status || 'ativo',
        is_platform_admin: isPlatformAdmin === true,
        phone: phone || '',
        avatar_url: avatarUrl || ''
      })
      .eq('id', userId);

    if (error) throw error;

    return true;
  }
    async function updateUserMembershipStatus(membershipId, nextStatus) {
    ensureClient();

    if (!membershipId) {
      throw new Error('Vínculo não informado.');
    }

    if (!nextStatus) {
      throw new Error('Status do vínculo não informado.');
    }

    const allowed = ['ativo', 'bloqueado', 'inativo'];
    if (!allowed.includes(nextStatus)) {
      throw new Error('Status de vínculo inválido.');
    }

    const { error } = await client
      .from('dp_memberships')
      .update({
        membership_status: nextStatus
      })
      .eq('id', membershipId);

    if (error) throw error;

    return true;
  }

  async function updateUserMembershipRole(membershipId, roleKey) {
    ensureClient();

    if (!membershipId) {
      throw new Error('Vínculo não informado.');
    }

    if (!roleKey) {
      throw new Error('Papel não informado.');
    }

    const { data: role, error: roleError } = await client
      .from('dp_roles')
      .select('id, role_key')
      .eq('role_key', roleKey)
      .maybeSingle();

    if (roleError) throw roleError;

    if (!role) {
      throw new Error('Papel não encontrado.');
    }

    const { error: membershipError } = await client
      .from('dp_memberships')
      .update({
        role_id: role.id
      })
      .eq('id', membershipId);

    if (membershipError) throw membershipError;

    return true;
  }

  async function deleteUserMembership(membershipId) {
    ensureClient();

    if (!membershipId) {
      throw new Error('Vínculo não informado.');
    }

    const { error: deleteModulesError } = await client
      .from('dp_membership_modules')
      .delete()
      .eq('membership_id', membershipId);

    if (deleteModulesError) throw deleteModulesError;

    const { error: deleteMembershipError } = await client
      .from('dp_memberships')
      .delete()
      .eq('id', membershipId);

    if (deleteMembershipError) throw deleteMembershipError;

    return true;
  }

    async function createUserMembershipLink(payload) {
    ensureClient();

    const {
      userId,
      tenantId,
      roleKey,
      moduleKey
    } = payload || {};

    if (!userId) {
      throw new Error('Usuário não informado para vincular.');
    }

    if (!tenantId) {
      throw new Error('Empresa não informada.');
    }

    if (!roleKey) {
      throw new Error('Papel não informado.');
    }

    if (!moduleKey) {
      throw new Error('Módulo não informado.');
    }

    const [profile, tenant, role, module] = await Promise.all([
      client
        .from('dp_profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle(),

      client
        .from('dp_tenants')
        .select('id, tenant_id')
        .eq('tenant_id', tenantId)
        .maybeSingle(),

      client
        .from('dp_roles')
        .select('id, role_key')
        .eq('role_key', roleKey)
        .maybeSingle(),

      client
        .from('dp_modules')
        .select('id, module_key')
        .eq('module_key', moduleKey)
        .maybeSingle()
    ]);

    if (profile.error) throw profile.error;
    if (tenant.error) throw tenant.error;
    if (role.error) throw role.error;
    if (module.error) throw module.error;

    if (!profile.data) {
      throw new Error('Usuário não encontrado.');
    }

    if (!tenant.data) {
      throw new Error('Empresa não encontrada.');
    }

    if (!role.data) {
      throw new Error('Papel não encontrado.');
    }

    if (!module.data) {
      throw new Error('Módulo não encontrado.');
    }

    const { data: existingMembership, error: existingMembershipError } = await client
      .from('dp_memberships')
      .select('id')
      .eq('user_id', userId)
      .eq('tenant_id', tenant.data.id)
      .maybeSingle();

    if (existingMembershipError) throw existingMembershipError;

    if (existingMembership?.id) {
      throw new Error('Este usuário já possui vínculo com esta empresa.');
    }

    const { data: membership, error: membershipError } = await client
      .from('dp_memberships')
      .insert({
        user_id: userId,
        tenant_id: tenant.data.id,
        role_id: role.data.id,
        membership_status: 'ativo'
      })
      .select('id')
      .single();

    if (membershipError) throw membershipError;

    const accessLevel =
      roleKey === 'core_admin'
        ? 'admin'
        : roleKey === 'core_visualizador'
          ? 'leitura'
          : 'operacao';

    const { error: membershipModuleError } = await client
      .from('dp_membership_modules')
      .insert({
        membership_id: membership.id,
        module_id: module.data.id,
        access_level: accessLevel,
        is_enabled: true
      });

    if (membershipModuleError) throw membershipModuleError;

    return membership;
  }

    async function createGlobalUser(payload) {
    ensureClient();

    const {
      fullName,
      email,
      status,
      companyLinks
    } = payload;

    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      throw new Error('E-mail obrigatório.');
    }

    const { data: existingProfile, error: profileLookupError } = await client
      .from('dp_profiles')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (profileLookupError) throw profileLookupError;

    if (existingProfile) {
      throw new Error('Já existe um usuário com este e-mail.');
    }

    const authUser = await createAuthUserViaFunction(normalizedEmail);

    const { data: profile, error: profileError } = await client
      .from('dp_profiles')
      .insert({
        auth_user_id: authUser.id,
        full_name: fullName || 'Usuário',
        email: normalizedEmail,
        user_status: status || 'ativo',
        is_platform_admin: false
      })
      .select('id, email, auth_user_id')
      .single();

    if (profileError) throw profileError;

    const validLinks = (companyLinks || []).filter(
      (item) => item.enabled && item.tenantId && item.roleKey && item.moduleKey
    );

    for (const link of validLinks) {
      const [tenant, role, module] = await Promise.all([
        client
          .from('dp_tenants')
          .select('id, tenant_id')
          .eq('tenant_id', link.tenantId)
          .maybeSingle(),

        client
          .from('dp_roles')
          .select('id, role_key')
          .eq('role_key', link.roleKey)
          .maybeSingle(),

        client
          .from('dp_modules')
          .select('id, module_key')
          .eq('module_key', link.moduleKey)
          .maybeSingle()
      ]);

      if (tenant.error) throw tenant.error;
      if (role.error) throw role.error;
      if (module.error) throw module.error;

      if (!tenant.data || !role.data || !module.data) continue;

      const { data: membership, error: membershipError } = await client
        .from('dp_memberships')
        .insert({
          user_id: profile.id,
          tenant_id: tenant.data.id,
          role_id: role.data.id,
          membership_status: 'ativo'
        })
        .select('id')
        .single();

      if (membershipError) throw membershipError;

      const accessLevel =
        link.roleKey === 'core_admin'
          ? 'admin'
          : link.roleKey === 'core_visualizador'
            ? 'leitura'
            : 'operacao';

      const { error: membershipModuleError } = await client
        .from('dp_membership_modules')
        .insert({
          membership_id: membership.id,
          module_id: module.data.id,
          access_level: accessLevel,
          is_enabled: true
        });

      if (membershipModuleError) throw membershipModuleError;
    }

    return profile;
  }
  
  async function createUserForTenant(payload) {
    ensureClient();

    const { tenantId, fullName, email, roleKey, moduleKeys } = payload;

    const [tenant, roles, modules] = await Promise.all([
      getTenantRowByTenantId(tenantId),
      getRoles(),
      getModules()
    ]);

    if (!tenant) {
      throw new Error('Empresa não encontrada.');
    }

    const role = roles.find((item) => item.role_key === roleKey);
    if (!role) {
      throw new Error('Papel não encontrado.');
    }

    const { data: existingProfile, error: existingProfileError } = await client
      .from('dp_profiles')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (existingProfileError) throw existingProfileError;

    let profileId = existingProfile?.id;

    if (!profileId) {
      const { data: profile, error: profileError } = await client
        .from('dp_profiles')
        .insert({
          full_name: fullName,
          email,
          user_status: 'ativo',
          is_platform_admin: false
        })
        .select('id')
        .single();

      if (profileError) throw profileError;
      profileId = profile.id;
    }

    const { data: membership, error: membershipError } = await client
      .from('dp_memberships')
      .insert({
        user_id: profileId,
        tenant_id: tenant.id,
        role_id: role.id,
        membership_status: 'ativo'
      })
      .select('id')
      .single();

    if (membershipError) throw membershipError;

    const selectedModules = modules.filter((item) => moduleKeys.includes(item.module_key));

        if (selectedModules.length) {
      const resolveAccessLevel = (key) => {
        if (key === 'core_admin') return 'admin';
        if (key === 'core_visualizador') return 'leitura';
        return 'operacao';
      };

      const rows = selectedModules.map((item) => ({
        membership_id: membership.id,
        module_id: item.id,
        access_level: resolveAccessLevel(roleKey),
        is_enabled: true
      }));

      const { error: mmError } = await client
        .from('dp_membership_modules')
        .insert(rows);

      if (mmError) throw mmError;
    }

    return membership;
  }

  async function getLogsByTenantId(tenantId) {
    ensureClient();

    const { data: tenant, error: tenantError } = await client
      .from('dp_tenants')
      .select('id')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (tenantError) throw tenantError;
    if (!tenant) return [];

    const { data, error } = await client
      .from('dp_admin_logs')
      .select(`
        id,
        action_key,
        severity,
        reason,
        created_at,
        actor_user_id,
        module_id,
        dp_profiles:actor_user_id (
          full_name
        ),
        dp_modules:module_id (
          module_key,
          module_name
        )
      `)
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      action: row.action_key,
      severity: row.severity,
      reason: row.reason || '-',
      date: new Date(row.created_at).toLocaleString('pt-BR'),
      actor: row.dp_profiles?.full_name || 'Sistema',
      module: row.dp_modules?.module_key || '',
      moduleName: row.dp_modules?.module_name || ''
    }));
  }

  async function getModulesCatalog() {
    ensureClient();

    const [
      { data: modules, error: modulesError },
      { data: tenantModules, error: tmError }
    ] = await Promise.all([
      client
        .from('dp_modules')
        .select('id, module_key, module_name, system_domain, is_active')
        .order('module_name', { ascending: true }),

      client
        .from('dp_tenant_modules')
        .select('module_id, status')
    ]);

    if (modulesError) throw modulesError;
    if (tmError) throw tmError;

    return (modules || []).map((module) => {
      const related = (tenantModules || []).filter((tm) => tm.module_id === module.id);

      return {
        key: module.module_key,
        nome: module.module_name,
        domain: module.system_domain || '-',
        isActive: module.is_active,
        tenants: related.length,
        ativos: related.filter((item) => item.status === 'ativo').length
      };
    });
  }

    function slugifyRoleName(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  async function getSystemRoleMatrix(systemKey) {
    ensureClient();

    const [roles, permissions, rolePermissions] = await Promise.all([
      client
        .from('dp_roles')
        .select('id, role_key, role_name, scope')
        .eq('scope', 'module')
        .ilike('role_key', `${systemKey}_%`)
        .order('role_name', { ascending: true }),

      client
        .from('dp_permissions')
        .select('id, permission_key, permission_name, module_key')
        .ilike('permission_key', `${systemKey}.%`)
        .order('permission_name', { ascending: true }),

      client
        .from('dp_role_permissions')
        .select('id, role_id, permission_id')
    ]);

    if (roles.error) throw roles.error;
    if (permissions.error) throw permissions.error;
    if (rolePermissions.error) throw rolePermissions.error;

    const permissionsById = new Map((permissions.data || []).map((item) => [item.id, item]));
    const rolePermissionSet = new Map();

    (rolePermissions.data || []).forEach((item) => {
      const permission = permissionsById.get(item.permission_id);
      if (!permission) return;

      const current = rolePermissionSet.get(item.role_id) || new Set();
      current.add(permission.permission_key);
      rolePermissionSet.set(item.role_id, current);
    });

    return {
      roles: (roles.data || []).map((role) => ({
        id: role.id,
        key: role.role_key,
        name: role.role_name,
        scope: role.scope,
        permissions: Array.from(rolePermissionSet.get(role.id) || [])
      })),
      permissions: permissions.data || []
    };
  }

    async function getSystemRoles(systemKey) {
    ensureClient();

    const { data, error } = await client
      .from('dp_roles')
      .select('id, role_key, role_name, scope')
      .eq('scope', 'module')
      .ilike('role_key', `${systemKey}_%`)
      .order('role_name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async function saveSystemRolePermissions(systemKey, roleKey, permissionKeys) {
    ensureClient();

    const { data: role, error: roleError } = await client
      .from('dp_roles')
      .select('id, role_key')
      .eq('role_key', roleKey)
      .eq('scope', 'module')
      .maybeSingle();

    if (roleError) throw roleError;
    if (!role) {
      throw new Error('Papel do sistema não encontrado.');
    }

    const { data: permissions, error: permissionsError } = await client
      .from('dp_permissions')
      .select('id, permission_key')
      .ilike('permission_key', `${systemKey}.%`);

    if (permissionsError) throw permissionsError;

    const allowedIds = (permissions || [])
      .filter((item) => permissionKeys.includes(item.permission_key))
      .map((item) => item.id);

    const allPermissionIds = (permissions || []).map((item) => item.id);

    if (allPermissionIds.length) {
      const { error: deleteError } = await client
        .from('dp_role_permissions')
        .delete()
        .eq('role_id', role.id)
        .in('permission_id', allPermissionIds);

      if (deleteError) throw deleteError;
    }

    if (allowedIds.length) {
      const rows = allowedIds.map((permissionId) => ({
        role_id: role.id,
        permission_id: permissionId
      }));

      const { error: insertError } = await client
        .from('dp_role_permissions')
        .insert(rows);

      if (insertError) throw insertError;
    }

    return true;
  }

  async function createSystemRole(systemKey, roleName) {
    ensureClient();

    const slug = slugifyRoleName(roleName);
    if (!slug) {
      throw new Error('Nome de papel inválido.');
    }

    const roleKey = `${systemKey}_${slug}`;

    const { data, error } = await client
      .from('dp_roles')
      .insert({
        role_key: roleKey,
        role_name: roleName,
        scope: 'module'
      })
      .select('id, role_key, role_name, scope')
      .single();

    if (error) throw error;
    return data;
  }

  async function getDashboardData() {
    const [tenants, modules] = await Promise.all([
      getTenants(),
      getModulesCatalog()
    ]);

    const totalTenants = tenants.length;
    const ativos = tenants.filter((t) => t.status === 'ativo').length;
    const bloqueados = tenants.filter((t) => ['bloqueado', 'suspenso'].includes(t.status)).length;
    const inadimplentes = tenants.filter((t) => t.adimplencia === 'inadimplente').length;
    const modulosAtivos = tenants.reduce((acc, tenant) => {
      return acc + tenant.modules.filter((m) => m.status === 'ativo').length;
    }, 0);

    return {
      counters: {
        totalTenants,
        ativos,
        bloqueados,
        inadimplentes,
        modulosAtivos
      },
      tenants,
      modules
    };
  }

        async function deleteTenant(tenantId) {
    ensureClient();

    const tenant = await getTenantRowByTenantId(tenantId);

    if (!tenant) {
      throw new Error('Empresa não encontrada.');
    }

    const { error } = await client
      .from('dp_tenants')
      .delete()
      .eq('id', tenant.id);

    if (error) throw error;
  }

        return {
    getTenants,
    getTenantByTenantId,
    getTenantRowByTenantId,
    getRoles,
    getModules,
    createTenant,
    updateTenant,
    attachModuleToTenant,
    deleteTenant,
    getUsersByTenantId,
    createUserForTenant,
    getLogsByTenantId,
    getModulesCatalog,
    getDashboardData,
    getSystemRoleMatrix,
    getSystemRoles,
    getGlobalUsers,
    getGlobalUserById,
    createGlobalUser,
    updateGlobalUser,
        deleteGlobalUser,
    updateUserMembershipStatus,
    updateUserMembershipRole,
        createUserMembershipLink,
    updateAuthUserPasswordViaFunction,
    updateAuthUserEmailViaFunction,
        uploadUserAvatar,
    deleteUserAvatarByUrl,
    deleteUserMembership,
    saveSystemRolePermissions,
    createSystemRole
  };
})();