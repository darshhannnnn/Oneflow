"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

export default function NewPurchaseOrderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Mock vendors data
  const vendors = [
    { id: "vendor-1", name: "Acme Supplies Co." },
    { id: "vendor-2", name: "Global Tech Solutions" },
    { id: "vendor-3", name: "Premier Manufacturing Ltd." },
    { id: "vendor-4", name: "Industrial Parts Inc." },
    { id: "vendor-5", name: "Office Essentials Pvt Ltd" },
    { id: "vendor-6", name: "Tech Hardware Distributors" },
    { id: "vendor-7", name: "Quality Materials Corp" },
    { id: "vendor-8", name: "Swift Logistics & Supplies" },
  ];
  
  const [formData, setFormData] = useState({
    number: `PO${Date.now().toString().slice(-6)}`,
    vendorId: "",
    productName: "",
    date: new Date().toISOString().split('T')[0],
    expectedDate: "",
    currency: "INR",
    note: "",
    lines: [
      { description: "", quantity: 1, unit: "Unit", unitPrice: 0, taxPercent: 0, amount: 0 }
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
        { description: "", quantity: 1, unit: "Unit", unitPrice: 0, taxPercent: 0, amount: 0 }
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
      const { subtotal, taxTotal, total } = calculateTotals();

      // Validate required fields
      if (!formData.vendorId) {
        alert("Please select a vendor");
        setLoading(false);
        return;
      }

      if (!formData.productName || formData.productName.trim() === "") {
        alert("Please enter a product name");
        setLoading(false);
        return;
      }

      if (!formData.lines || formData.lines.length === 0) {
        alert("Please add at least one order line");
        setLoading(false);
        return;
      }

      const payload = {
        number: formData.number,
        partnerId: null, // We'll store vendor name in note for now
        projectId: null,
        date: formData.date,
        expectedDate: formData.expectedDate || null,
        subtotal,
        taxTotal,
        total,
        status: "DRAFT", // Create as draft instead
        currency: formData.currency,
        note: `Vendor: ${vendors.find(v => v.id === formData.vendorId)?.name || 'N/A'}\nProduct: ${formData.productName}\n${formData.note || ''}`,
        lines: formData.lines.map(line => ({
          description: line.description,
          quantity: parseFloat(line.quantity) || 1,
          unit: line.unit,
          unitPrice: parseFloat(line.unitPrice) || 0,
          taxPercent: line.taxPercent ? parseFloat(line.taxPercent) : 0,
          amount: parseFloat(line.amount) || 0,
        })),
      };

      console.log("Sending payload:", payload);

      const response = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Response:", response.status, data);

      if (response.ok) {
        alert("Purchase Order created successfully!");
        router.push("/dashboard/purchase-orders");
      } else {
        console.error("Error response:", data);
        alert(`Error: ${data.error || data.message || "Failed to create purchase order"}`);
      }
    } catch (error) {
      console.error("Error submitting purchase order:", error);
      alert(`Failed to submit purchase order: ${error.message}`);
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
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <Card className="border-2">
        <CardHeader className="border-b bg-muted/50">
          <CardTitle className="text-2xl">Purchase Order Create/Edit View</CardTitle>
          <div className="flex gap-4 mt-4">
            <Button type="submit" form="po-form" disabled={loading}>
              {loading ? "Creating..." : "Create Purchase Order"}
            </Button>
            <Button variant="outline" type="button" onClick={() => router.push("/dashboard/purchase-orders")}>
              Cancel
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <form id="po-form" onSubmit={handleSubmit} className="space-y-6">
            {/* PO Number */}
            <div className="border-b pb-4">
              <Label className="text-lg font-semibold">{formData.number}</Label>
            </div>

            {/* Vendor and Product Selection */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="vendor">Vendor *</Label>
                <Select
                  value={formData.vendorId}
                  onValueChange={(value) => setFormData({ ...formData, vendorId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="productName">Product Name *</Label>
                <Input
                  id="productName"
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="Enter product name"
                  required
                />
              </div>
            </div>

            {/* Order Lines Section */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4 border-b pb-2">Order Lines</h3>
              
              {/* Table Header */}
              <div className="grid grid-cols-[2fr,1fr,1fr,1fr,1fr,1fr,auto] gap-2 mb-2 text-sm font-medium text-muted-foreground">
                <div>Description</div>
                <div>Quantity</div>
                <div>Unit</div>
                <div>Unit Price</div>
                <div>Taxes</div>
                <div>Amount</div>
                <div></div>
              </div>

              {/* Order Lines */}
              {formData.lines.map((line, index) => (
                <div key={index} className="grid grid-cols-[2fr,1fr,1fr,1fr,1fr,1fr,auto] gap-2 mb-3 items-center">
                  <Input
                    type="text"
                    value={line.description}
                    onChange={(e) => handleLineChange(index, "description", e.target.value)}
                    placeholder="Enter product/service description"
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
                    type="text"
                    value={line.unit}
                    onChange={(e) => handleLineChange(index, "unit", e.target.value)}
                    placeholder="Unit"
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
                Add a line
              </Button>
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
