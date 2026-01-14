import { MainLayout } from "@/components/layout/main-layout"
import { PageHeader } from "@/components/ui/page-header"
import { ReceiveItemForm } from "@/components/inventory/receive-item-form"

export default function ReceiveItemPage() {
  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader title="Receive New Item" description="Register a new IT asset and generate a barcode/QR code" />

        <ReceiveItemForm />
      </div>
    </MainLayout>
  )
}
