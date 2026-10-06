import { Calculator } from "@/components/Calculator";
import { PageHeader } from "@/components/PageHeader";
import { BackToTop } from "@/components/BackToTop";

export default function Home() {
  return (
    <main className="page">
      <PageHeader />
      <Calculator />
      <BackToTop />
    </main>
  );
}
