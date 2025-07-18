export type EquipmentOptionData = {
  id: string;
  name: string;
  asset_tag: string | null;
  location: string | null;
  status: string;
  condition: string;
  categories: { name: string }[] | null;
};

export type UserOptionData = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: string;
};

export interface EquipmentOption {
  value: string;
  label: string;
  data: EquipmentOptionData;
}

export interface UserOption {
  value: string;
  label: string;
  data: UserOptionData;
}
