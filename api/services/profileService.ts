import { randomUUID } from 'node:crypto';
import { supabase } from '../../src/lib/supabase.js';
import type { CreateProfileBody, ProfileRecord, UpdateProfileBody } from '../types/kpi.js';

export const getProfilesByEmpresa = async (empresaId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nombre, email, activo, empresa_id')
    .eq('empresa_id', empresaId)
    .eq('activo', true)
    .order('nombre');

  if (error) throw error;
  return (data as ProfileRecord[] | null) ?? [];
};

export const createProfile = async (body: CreateProfileBody) => {
  const { empresa_id, nombre, email } = body;

  if (!empresa_id || !nombre.trim() || !email.trim()) {
    throw new Error('Debes proporcionar empresa, nombre y email.');
  }

  const normalizedEmail = email.trim().toLowerCase();

  const { data: existingProfile, error: existingError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingProfile) {
    throw new Error('Ya existe un trabajador con ese email.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: randomUUID(),
      empresa_id,
      nombre: nombre.trim(),
      email: normalizedEmail,
      activo: true
    })
    .select('id, nombre, email, activo, empresa_id')
    .single();

  if (error) throw error;
  return data as ProfileRecord;
};

export const updateProfile = async (body: UpdateProfileBody) => {
  const id = body.id?.trim();
  const empresaId = body.empresa_id?.trim();
  const nombre = body.nombre?.trim();
  const normalizedEmail = body.email?.trim().toLowerCase();

  if (!id || !empresaId || !nombre || !normalizedEmail) {
    throw new Error('id, empresa_id, nombre y email son obligatorios.');
  }

  const { data: existingProfile, error: existingError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .neq('id', id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingProfile) {
    throw new Error('Ya existe otro trabajador con ese email.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      nombre,
      email: normalizedEmail
    })
    .eq('id', id)
    .eq('empresa_id', empresaId)
    .select('id, nombre, email, activo, empresa_id')
    .single();

  if (error) throw error;
  return data as ProfileRecord;
};

export const deactivateProfile = async (profileId: string) => {
  const { error } = await supabase
    .from('profiles')
    .update({ activo: false })
    .eq('id', profileId);

  if (error) throw error;
};

export const getProfileAreaAssignments = async (profileId: string) => {
  const { data, error } = await supabase
    .from('profile_areas')
    .select('area_id')
    .eq('profile_id', profileId);

  if (error) throw error;
  return ((data as Array<{ area_id: string }> | null) ?? []).map((item) => item.area_id);
};

export const getProfileKpiAssignments = async (profileId: string) => {
  const { data, error } = await supabase
    .from('profile_kpis')
    .select('kpi_id')
    .eq('profile_id', profileId);

  if (error) throw error;
  return ((data as Array<{ kpi_id: string }> | null) ?? []).map((item) => item.kpi_id);
};

export const updateProfileAreaAssignments = async (profileId: string, areaIds: string[]) => {
  const uniqueAreaIds = Array.from(new Set(areaIds.filter(Boolean)));

  const { error: deleteError } = await supabase
    .from('profile_areas')
    .delete()
    .eq('profile_id', profileId);

  if (deleteError) throw deleteError;

  if (uniqueAreaIds.length === 0) return;

  const { error: insertError } = await supabase.from('profile_areas').insert(
    uniqueAreaIds.map((areaId) => ({
      profile_id: profileId,
      area_id: areaId
    }))
  );

  if (insertError) throw insertError;
};

export const updateProfileKpiAssignments = async (profileId: string, kpiIds: string[]) => {
  const uniqueKpiIds = Array.from(new Set(kpiIds.filter(Boolean)));

  const { error: deleteError } = await supabase
    .from('profile_kpis')
    .delete()
    .eq('profile_id', profileId);

  if (deleteError) throw deleteError;

  if (uniqueKpiIds.length === 0) return;

  const { error: insertError } = await supabase.from('profile_kpis').insert(
    uniqueKpiIds.map((kpiId) => ({
      profile_id: profileId,
      kpi_id: kpiId
    }))
  );

  if (insertError) throw insertError;
};
