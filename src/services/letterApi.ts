import { api } from "./api";
import type { LetterPad, LetterPadPayload } from "../types";

export const letterApi = {
  async list(search = "") {
    const { data } = await api.get<LetterPad[]>("/letters", {
      params: { search },
    });
    return data;
  },
  async get(id: number) {
    const { data } = await api.get<LetterPad>(`/letters/${id}`);
    return data;
  },
  async create(payload: LetterPadPayload) {
    const { data } = await api.post<LetterPad>("/letters", payload);
    return data;
  },
  async update(id: number, payload: LetterPadPayload) {
    const { data } = await api.put<LetterPad>(`/letters/${id}`, payload);
    return data;
  },
  async remove(id: number) {
    await api.delete(`/letters/${id}`);
  },
};
