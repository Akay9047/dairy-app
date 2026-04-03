import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { farmersApi } from "../lib/api";
import toast from "react-hot-toast";
import { Plus, Search, Pencil, Trash2, X, Phone, MapPin } from "lucide-react";

interface Farmer {
  id: string;
  name: string;
  mobile: string;
  code: string;
  village: string;
}

function FarmerModal({
  farmer,
  onClose,
}: {
  farmer?: Farmer;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: farmer?.name ?? "",
    mobile: farmer?.mobile ?? "",
    code: farmer?.code ?? "",
    village: farmer?.village ?? "",
  });

  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      farmer ? farmersApi.update(farmer.id, data) : farmersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmers"] });
      toast.success(farmer ? "Farmer update ho gaya!" : "Naya farmer add ho gaya!");
      onClose();
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err.response?.data?.error ?? "Kuch gadbad ho gayi");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-900">
            {farmer ? "Farmer Edit Karein" : "Naya Farmer Jodein"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Naam (Name) *
            </label>
            <input
              className="input-field"
              placeholder="Ramesh Kumar"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number *
            </label>
            <input
              className="input-field"
              placeholder="9876543210"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              required
              maxLength={10}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unique Code *
            </label>
            <input
              className="input-field"
              placeholder="RK001"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gaon (Village) *
            </label>
            <input
              className="input-field"
              placeholder="Sikar"
              value={form.village}
              onChange={(e) => setForm({ ...form, village: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Ruko
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary flex-1"
            >
              {mutation.isPending ? "Saving..." : farmer ? "Update Karein" : "Jodein"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FarmersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ open: boolean; farmer?: Farmer }>({
    open: false,
  });

  const { data: farmers = [], isLoading } = useQuery({
    queryKey: ["farmers", search],
    queryFn: () => farmersApi.list({ search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: farmersApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmers"] });
      toast.success("Farmer delete ho gaya");
    },
    onError: () => toast.error("Delete nahi hua"),
  });

  const handleDelete = (farmer: Farmer) => {
    if (confirm(`"${farmer.name}" ko delete karein?`)) {
      deleteMutation.mutate(farmer.id);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kisaan List</h1>
          <p className="text-sm text-gray-500">
            {farmers.length} registered farmers
          </p>
        </div>
        <button
          onClick={() => setModal({ open: true })}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Naya Jodein</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          className="input-field pl-9"
          placeholder="Search by naam, mobile, code, gaon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : farmers.length === 0 ? (
        <div className="card text-center py-10">
          <div className="text-4xl mb-2">👨‍🌾</div>
          <p className="text-gray-500">Koi farmer nahi mila</p>
          <button
            onClick={() => setModal({ open: true })}
            className="btn-primary mt-3"
          >
            Pehla Farmer Jodein
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {farmers.map((f: Farmer) => (
            <div key={f.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{f.name}</p>
                  <span className="inline-block bg-brand-100 text-brand-700 text-xs font-medium px-2 py-0.5 rounded-full">
                    {f.code}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setModal({ open: true, farmer: f })}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(f)}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="space-y-1 mt-2">
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Phone size={13} className="text-gray-400" />
                  {f.mobile}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <MapPin size={13} className="text-gray-400" />
                  {f.village}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <FarmerModal
          farmer={modal.farmer}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
}
