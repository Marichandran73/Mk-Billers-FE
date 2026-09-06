import type { BillItem } from '../types'

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)

export const calculateBillTotals = (
  items: Pick<BillItem, 'quantity' | 'rate' | 'gst_percent'>[],
  transportation: number,
  discount: number,
) => {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0)
  const gst = items.reduce(
    (sum, item) => sum + (item.quantity * item.rate * item.gst_percent) / 100,
    0,
  )
  const cgst = gst / 2
  const sgst = gst / 2
  const grandTotal = Math.max(subtotal + gst + transportation - discount, 0)
  return { subtotal, gst, cgst, sgst, grandTotal }
}

export const amountToWords = (amount: number) => {
  const formatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
  return `Rupees ${formatter.format(Math.round(amount))} only`
}

export const getUpiUrl = (upiId: string, companyName: string, amount: number) => {
  const params = new URLSearchParams({
    pa: upiId,
    pn: companyName,
    am: amount.toFixed(2),
    cu: 'INR',
  })
  return `upi://pay?${params.toString()}`
}
