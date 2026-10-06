import { Calculator } from "@/components/Calculator";
import { PageHeader } from "@/components/PageHeader";

export default function Home() {
  return (
    <main className="page">
      <PageHeader />
      <Calculator />
    </main>
  );
}
