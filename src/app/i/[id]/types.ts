// The completion link as hangar returns it (GET /public/i/{id}).
export type LinkView = {
  item: string;
  category: string;
  critical: boolean;
  store: string;
  building: string | null;
  address: string | null;
  due: string | null;
  frequency: string;
  owner: string | null;
  with: string | null;
  vendor: string | null;
  vendor_phone: string | null;
  status: string;
  colour: "red" | "yellow" | "green";
  documents: { kind: string; uploaded_at: string }[];
  outstanding: string[];
  message: string;
};
