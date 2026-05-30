import InvoicePrintPage from '@/components/invoices/InvoicePrintPage'

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  return <InvoicePrintPage id={params.id} />
}
