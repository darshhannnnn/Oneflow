"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

export default function NewInvoicePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    number: `INV${Date.now().toString().slice(-6)}`,
    customerName: "",
    customerEmail: "",
    date: new Date().toISOString().split('T')[0],
    dueDate: "",
    currency: "INR",
    note: "",
    sendEmail: true, // Option to send email to customer
    lines: [
      { product: "", description: "", quantity: 1, unitPrice: 0, taxPercent: 0, amount: 0 }
    ]
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleLineChange = (index, field, value) => {
    const newLines = [...formData.lines];
    newLines[index][field] = value;

    // Recalculate amount
    const quantity = parseFloat(newLines[index].quantity) || 0;
    const unitPrice = parseFloat(newLines[index].unitPrice) || 0;
    newLines[index].amount = quantity * unitPrice;

    setFormData({ ...formData, lines: newLines });
  };

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [
        ...formData.lines,
        { product: "", description: "", quantity: 1, unitPrice: 0, taxPercent: 0, amount: 0 }
      ]
    });
  };

  const removeLine = (index) => {
    if (formData.lines.length > 1) {
      const newLines = formData.lines.filter((_, i) => i !== index);
      setFormData({ ...formData, lines: newLines });
    }
  };

  const calculateTotals = () => {
    const subtotal = formData.lines.reduce((sum, line) => sum + (parseFloat(line.amount) || 0), 0);
    const taxTotal = formData.lines.reduce((sum, line) => {
      const amount = parseFloat(line.amount) || 0;
      const taxPercent = parseFloat(line.taxPercent) || 0;
      return sum + (amount * taxPercent / 100);
    }, 0);
    const total = subtotal + taxTotal;
    
    return { subtotal, taxTotal, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.customerName || formData.customerName.trim() === "") {
        alert("Please enter customer name");
        setLoading(false);
        return;
      }

      if (!formData.customerEmail || formData.customerEmail.trim() === "") {
        alert("Please enter customer email");
        setLoading(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.customerEmail)) {
        alert("Please enter a valid email address");
        setLoading(false);
        return;
      }

      if (!formData.lines || formData.lines.length === 0) {
        alert("Please add at least one invoice line");
        setLoading(false);
        return;
      }

      const { subtotal, taxTotal, total } = calculateTotals();

      const payload = {
        number: formData.number,
        partnerId: null,
        projectId: null,
        date: formData.date,
        dueDate: formData.dueDate || null,
        subtotal,
        taxTotal,
        total,
        status: "DRAFT",
        currency: formData.currency,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        sendEmail: formData.sendEmail,
        note: formData.note || '',
        lines: formData.lines.map(line => ({
          productId: null,
          description: line.product || line.description,
          quantity: parseFloat(line.quantity) || 1,
          unit: "Unit",
          unitPrice: parseFloat(line.unitPrice) || 0,
          taxPercent: line.taxPercent ? parseFloat(line.taxPercent) : 0,
          amount: parseFloat(line.amount) || 0,
        })),
      };

      console.log("Sending payload:", payload);

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Response:", response.status, data);

      if (response.ok) {
        if (formData.sendEmail) {
          alert("Invoice created successfully and email sent to customer!");
        } else {
          alert("Invoice created successfully!");
        }
        router.push("/dashboard/invoices");
      } else {
        console.error("Error response:", data);
        console.error("Full error object:", JSON.stringify(data, null, 2));
        const errorMessage = data.error || data.message || "Failed to create invoice";
        alert(`Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error submitting invoice:", error);
      alert(`Failed to submit invoice: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, taxTotal, total } = calculateTotals();

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Link href="/dashboard/invoices">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Invoices
          </Button>
        </Link>
      </div>

      <Card className="border-2">
        <CardHeader className="border-b bg-muted/50">
          <CardTitle className="text-2xl">Invoice Create/edit view</CardTitle>
          <div className="flex gap-4 mt-4">
            <Button type="submit" form="invoice-form" disabled={loading}>
              {loading ? "Creating..." : "Confirm"}
            </Button>
            <Button variant="outline" type="button" onClick={() => router.push("/dashboard/invoices")}>
              Cancel
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <form id="invoice-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Invoice Title */}
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold">Customer Invoice</h2>
            </div>

            {/* Invoice Number */}
            <div className="border-b pb-4">
              <Label className="text-lg font-semibold">{formData.number}</Label>
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="customerEmail">Customer Email *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  placeholder="customer@example.com"
                  required
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="date">Invoice Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically set to today's date
                </p>
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            {/* Invoice Lines Section */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4 border-b pb-2">Invoice Lines</h3>
              
              {/* Table Header */}
              <div className="grid grid-cols-[2fr,1fr,1fr,1fr,1fr,auto] gap-2 mb-2 text-sm font-medium text-muted-foreground">
                <div>Product</div>
                <div>Quantity</div>
                <div>Unit Price</div>
                <div>Taxes</div>
                <div>Amount</div>
                <div></div>
              </div>

              {/* Invoice Lines */}
              {formData.lines.map((line, index) => (
                <div key={index} className="grid grid-cols-[2fr,1fr,1fr,1fr,1fr,auto] gap-2 mb-3 items-center">
                  <Input
                    type="text"
                    value={line.product}
                    onChange={(e) => handleLineChange(index, "product", e.target.value)}
                    placeholder="Enter product/service"
                    className="w-full"
                  />

                  <Input
                    type="number"
                    value={line.quantity}
                    onChange={(e) => handleLineChange(index, "quantity", e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full"
                  />

                  <Input
                    type="number"
                    value={line.unitPrice}
                    onChange={(e) => handleLineChange(index, "unitPrice", e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full"
                  />

                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={line.taxPercent}
                      onChange={(e) => handleLineChange(index, "taxPercent", e.target.value)}
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full"
                    />
                    <span className="text-sm">%</span>
                  </div>

                  <div className="font-medium">
                    ₹{parseFloat(line.amount || 0).toFixed(2)}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLine(index)}
                    disabled={formData.lines.length === 1}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}

              {/* Add Line Button */}
              <Button type="button" variant="outline" size="sm" onClick={addLine} className="mt-2">
                <Plus className="w-4 h-4 mr-2" />
                Add a product
              </Button>
            </div>

            {/* Notes and Email Option */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="note">Notes</Label>
                <Textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sendEmail"
                  checked={formData.sendEmail}
                  onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <Label htmlFor="sendEmail" className="cursor-pointer font-normal">
                  Send invoice to customer via email
                </Label>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Untaxed Amount:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>₹{taxTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
