import { Suspense } from "react";
import { Loading, Section } from "@/components/kit";
import { Field, Select, TextInput } from "@/components/fields";
import { PublicForm } from "@/components/public-form";
import { CannotLoad, PublicPage, hangar, load } from "@/components/public-page";

// Where a vendor uploads a certificate of insurance. The COI reminders link
// here. A certificate is filed, never edited; Kelly approves the vendor per
// store once that store's certificate is on file.

export const metadata = { title: "Upload a certificate of insurance", robots: { index: false } };

type Options = { vendors: { id: string; name: string }[]; stores: { id: string; name: string }[] };

export default function CoiPage() {
  return (
    <PublicPage>
      <Suspense fallback={<Loading rows={4} />}>
        <Content />
      </Suspense>
    </PublicPage>
  );
}

async function Content() {
  const result = await load<Options>("/public/forms/coi");
  if (!result || !("data" in result)) return <CannotLoad />;
  const { vendors, stores } = result.data;
  return (
    <Section>
      <h1 className="display mt-5 text-[22px] font-semibold text-ink">Upload a certificate of insurance</h1>
      <p className="mt-1 mb-5 text-[14px] text-graphite">For vendors working at McGrath dealerships. Upload a new one each time your certificate renews.</p>
      <PublicForm action={`${hangar()}/public/forms/coi`} submit="Upload certificate">
        <Field label="Your company" htmlFor="vendor_id">
          <Select id="vendor_id" name="vendor_id" required defaultValue="">
            <option value="">Choose your company</option>
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </Select>
        </Field>
        <Field label="Which store does it cover?" htmlFor="store_id" hint="Certificates are usually issued per location.">
          <Select id="store_id" name="store_id" defaultValue="">
            <option value="">Every McGrath store</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </Field>
        <Field label="Expiration date on the certificate" htmlFor="expiration">
          <TextInput id="expiration" name="expiration" type="date" required />
        </Field>
        <Field label="The certificate (PDF or photo)" htmlFor="file">
          <TextInput id="file" name="file" type="file" required accept=".pdf,image/*" />
        </Field>
        <Field label="Your name" htmlFor="uploaded_by">
          <TextInput id="uploaded_by" name="uploaded_by" required autoComplete="name" />
        </Field>
      </PublicForm>
    </Section>
  );
}
