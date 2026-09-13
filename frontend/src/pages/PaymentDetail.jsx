import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { formatMoney, formatDate } from "../utils/format";

const PaymentDetail = () => {
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const receiptRef = useRef();

  useEffect(() => {
    api.get(`/payments/${id}`).then((res) => setPayment(res.data));
  }, [id]);

  const handlePrint = () => {
    const content = receiptRef.current.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Receipt ${payment.receiptNumber}</title>
      <style>body{font-family: 'IBM Plex Sans', sans-serif; padding: 32px; color:#1C2321;} h1{font-family: 'Lora', serif; font-size:20px;} table{width:100%; border-collapse:collapse; margin-top:12px;} td{padding:6px 0;} .label{color:#777;}</style>
      </head><body>${content}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  if (!payment) return <p className="text-ink/50">Waa la soo shubayaa...</p>;

  const fee = payment.feeId;
  const beforePaid = fee ? Math.max(fee.totalPaid - payment.amount, 0) : null;

  return (
    <div className="max-w-2xl space-y-5">
      <Link to="/payments" className="text-sm text-navy hover:underline">&larr; Ku Noqo Lacag Bixinta</Link>

      <div className="card" ref={receiptRef}>
        <h1 className="font-serif text-lg mb-1">SCHOOL FEE RECEIPT</h1>
        <p className="text-ink/50 text-sm mb-4">Receipt Number: {payment.receiptNumber}</p>
        <table className="w-full text-sm">
          <tbody>
            <tr><td className="label text-ink/50 py-1">Taariikh</td><td className="text-right">{formatDate(payment.paymentDate)}</td></tr>
            <tr><td className="label text-ink/50 py-1">Magaca Waalidka</td><td className="text-right">{payment.parentId?.fullName}</td></tr>
            <tr><td className="label text-ink/50 py-1">Sanad Dugsiyeed</td><td className="text-right">{payment.academicYearId?.name}</td></tr>
            {fee && (
              <>
                <tr><td className="label text-ink/50 py-1">Wadarta Lacagta</td><td className="text-right">{formatMoney(fee.totalAmount)}</td></tr>
                <tr><td className="label text-ink/50 py-1">Hore Loo Bixiyey</td><td className="text-right">{formatMoney(beforePaid)}</td></tr>
              </>
            )}
            <tr><td className="label text-ink/50 py-1 font-medium">Lacagta Hadda La Bixiyey</td><td className="text-right font-medium">{formatMoney(payment.amount)}</td></tr>
            {fee && <tr><td className="label text-ink/50 py-1">Lacagta Ku Dhiman</td><td className="text-right">{formatMoney(fee.balance)}</td></tr>}
            <tr><td className="label text-ink/50 py-1">Habka Lacagta</td><td className="text-right">{payment.paymentMethod}</td></tr>
            {payment.referenceNumber && <tr><td className="label text-ink/50 py-1">Reference</td><td className="text-right">{payment.referenceNumber}</td></tr>}
            <tr><td className="label text-ink/50 py-1">Waxaa Qaabilay</td><td className="text-right">{payment.createdBy?.fullName || "Admin"}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <button onClick={handlePrint} className="btn-primary">Print Receipt</button>
      </div>
    </div>
  );
};

export default PaymentDetail;
