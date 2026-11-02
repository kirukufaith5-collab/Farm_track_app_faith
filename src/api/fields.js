import { api } from './client.js';

/** Backend snake_case → frontend camelCase (matches existing UI). */
export function fromApiField(f) {
  return {
    id: f.id,
    farmerCode: f.farmer_code ?? '',
    ownerName: f.owner_name ?? '',
    crop: f.crop ?? 'Unassigned',
    notes: f.notes ?? '',
    areaHa: f.area_ha ?? null,
    coordinates: f.coordinates ?? [],
    centreLat: f.centre_lat ?? null,
    centreLng: f.centre_lng ?? null,
    createdAt: f.created_at ?? null,
    updatedAt: f.updated_at ?? null,
  };
}

function toApiPayload(values, coordinates, areaHa) {
  const body = {
    farmer_code: values.farmerCode || null,
    owner_name: values.ownerName || null,
    crop: values.crop || 'Unassigned',
    notes: values.notes || null,
    area_ha: areaHa ?? values.areaHa ?? null,
  };
  if (coordinates?.length) {
    body.coordinates = coordinates.map((c) => ({ lat: c.lat, lng: c.lng }));
  }
  return body;
}

export async function listFields() {
  const rows = await api('/fields');
  return (rows || []).map(fromApiField);
}

export async function createField({ coordinates, areaHa, ...values }) {
  const body = toApiPayload(values, coordinates, areaHa);
  if (!body.coordinates?.length) {
    throw new Error('A parcel needs a boundary');
  }
  const row = await api('/fields', { method: 'POST', body });
  return fromApiField(row);
}

export async function updateField(id, { coordinates, areaHa, ...values }) {
  const body = toApiPayload(values, coordinates, areaHa);
  // PATCH: only send defined fields; coordinates optional
  if (!coordinates?.length) delete body.coordinates;
  const row = await api(`/fields/${id}`, { method: 'PATCH', body });
  return fromApiField(row);
}

export async function deleteField(id) {
  await api(`/fields/${id}`, { method: 'DELETE' });
}
