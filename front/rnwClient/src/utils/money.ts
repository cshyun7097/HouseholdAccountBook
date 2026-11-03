// Amount inputs keep plain digits in state and only show commas, so Number(state) still works.
export const onlyDigits = (text: string) => text.replace(/\D/g, '');
export const withCommas = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
