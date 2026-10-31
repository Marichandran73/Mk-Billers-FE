import { api } from "./api";
import type { Founder, FounderPayload } from "../types";

export const founderApi = {
  async list() {
    const { data } = await api.get<Founder[]>("/founders");
    return data;
  },
  async create(payload: FounderPayload) {
    const { data } = await api.post<Founder>("/founders", payload);
    return data;
  },
  async update(id: number, payload: FounderPayload) {
    const { data } = await api.put<Founder>(`/founders/${id}`, payload);
    return data;
  },
  async remove(id: number) {
    await api.delete(`/founders/${id}`);
  },
};
