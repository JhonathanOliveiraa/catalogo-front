/** Único parser do `:id` da rota (AD-6): só inteiro positivo; qualquer outra coisa é `null` (estado 404). */
export function lerIdProduto(param: string | null | undefined): number | null {
  if (param == null || !/^\d+$/.test(param)) {
    return null;
  }
  const id = Number(param);
  return Number.isSafeInteger(id) && id > 0 && id <= 2_147_483_647 ? id : null;
}
