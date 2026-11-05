import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/apiService";
import { clearStoredAuth, getStoredUser } from "../services/authService";

const modules = {
  customers: {
    title: "Customers",
    description: "Manage customer contact information and account status.",
    fields: [
      { name: "name", label: "Full name", required: true },
      { name: "email", label: "Email address", type: "email", required: true },
      { name: "phone", label: "Phone" },
      { name: "company", label: "Company" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
    ],
  },
  products: {
    title: "Products",
    description: "Browse the product catalog and manage available products.",
    fields: [
      { name: "name", label: "Product name", required: true },
      { name: "price", label: "Price", type: "number", min: "0.01", step: "0.01", required: true },
    ],
  },
  tickets: {
    title: "Tickets",
    description: "Track support requests, priorities, ownership, and resolution.",
    fields: [
      { name: "title", label: "Ticket title", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "customer", label: "Customer", type: "customer" },
      { name: "product", label: "Product", type: "product" },
      { name: "priority", label: "Priority", type: "select", options: ["Low", "Medium", "High", "Urgent"] },
      { name: "status", label: "Status", type: "select", options: ["Open", "In review", "Pending", "Resolved", "Closed"] },
      { name: "assignedTo", label: "Assigned to" },
    ],
  },
};

const listPath = (name, search = "") =>
  `/${name}${search ? `?q=${encodeURIComponent(search)}` : ""}`;

function getId(value) {
  return value?._id || value?.id || value || "";
}

function formValues(moduleName, record) {
  if (!record) {
    return moduleName === "customers"
      ? { name: "", email: "", phone: "", company: "", status: "Active" }
      : moduleName === "products"
        ? { name: "", price: "" }
        : { title: "", description: "", customer: "", product: "", priority: "Medium", status: "Open", assignedTo: "" };
  }
  return {
    ...record,
    customer: getId(record.customer),
    product: getId(record.product),
    price: record.price ?? "",
  };
}

function WorkspaceForm({ moduleName, initialRecord, customers, products, canManage, onSubmit, onClose }) {
  const [values, setValues] = useState(() => formValues(moduleName, initialRecord));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fields = modules[moduleName].fields.filter((field) => {
    if (field.name === "customer" && !canManage) return false;
    if (["status", "assignedTo"].includes(field.name) && !canManage) return false;
    return true;
  });

  function updateField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = { ...values };
      if (moduleName === "products") body.price = Number(body.price);
      if (!canManage && moduleName === "tickets") {
        delete body.customer;
        delete body.status;
        delete body.assignedTo;
      }
      await onSubmit(body);
    } catch (requestError) {
      setError(requestError.message || "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="product-form-modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
        <header className="modal-header">
          <div>
            <p className="eyebrow">{modules[moduleName].title.toUpperCase()}</p>
            <h2 id="form-title">{initialRecord ? "Edit" : "Add"} {moduleName === "tickets" ? "ticket" : moduleName.slice(0, -1)}</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close form">×</button>
        </header>
        <form className="product-form" onSubmit={submit}>
          {fields.map((field) => (
            <label key={field.name}>
              <span>{field.label}</span>
              {field.type === "select" ? (
                <select value={values[field.name] ?? ""} onChange={(event) => updateField(field.name, event.target.value)}>
                  {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : field.type === "customer" ? (
                <select required value={values.customer || ""} onChange={(event) => updateField("customer", event.target.value)}>
                  <option value="">Select a customer</option>
                  {customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.name} ({customer.email})</option>)}
                </select>
              ) : field.type === "product" ? (
                <select value={values.product || ""} onChange={(event) => updateField("product", event.target.value)}>
                  <option value="">No product</option>
                  {products.map((product) => <option key={product._id} value={product._id}>{product.name}</option>)}
                </select>
              ) : field.type === "textarea" ? (
                <textarea rows="4" value={values[field.name] ?? ""} onChange={(event) => updateField(field.name, event.target.value)} />
              ) : (
                <input
                  type={field.type || "text"}
                  min={field.min}
                  step={field.step}
                  required={field.required}
                  value={values[field.name] ?? ""}
                  onChange={(event) => updateField(field.name, event.target.value)}
                />
              )}
            </label>
          ))}
          {error && <p className="message error" role="alert">{error}</p>}
          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function displayDate(value) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

function RecordsTable({ moduleName, rows, canManage, onEdit, onDelete }) {
  const cells = {
    customers: [
      ["Customer", (row) => row.name],
      ["Email", (row) => row.email],
      ["Company", (row) => row.company || "—"],
      ["Phone", (row) => row.phone || "—"],
      ["Status", (row) => row.status],
      ["Created", (row) => displayDate(row.createdAt)],
    ],
    products: [
      ["Product", (row) => row.name],
      ["Price", (row) => `₹${Number(row.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`],
      ["Created", (row) => displayDate(row.createdAt)],
    ],
    tickets: [
      ["Ticket", (row) => row.title],
      ["Customer", (row) => row.customer?.name || "—"],
      ["Product", (row) => row.product?.name || "—"],
      ["Priority", (row) => row.priority],
      ["Status", (row) => row.status],
      ...(canManage ? [["Assigned to", (row) => row.assignedTo || "Unassigned"]] : []),
      ["Updated", (row) => displayDate(row.updatedAt)],
    ],
  }[moduleName];

  if (!rows.length) return <div className="message">No {moduleName} found. Create one to get started.</div>;

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>{cells.map(([heading]) => <th key={heading}>{heading}</th>)}{canManage && <th>Actions</th>}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              {cells.map(([heading, value]) => <td key={heading}>{value(row)}</td>)}
              {canManage && (
                <td className="row-actions">
                  <button type="button" className="text-button" onClick={() => onEdit(row)}>Edit</button>
                  <button type="button" className="text-button danger-text" onClick={() => onDelete(row)}>Delete</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Workspace() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const canManage = ["admin", "agent"].includes(user?.role);
  const moduleName = location.pathname.slice(1) || "overview";
  const [records, setRecords] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchState, setSearchState] = useState({ module: "", value: "" });
  const [loadedKey, setLoadedKey] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [formRecord, setFormRecord] = useState(undefined);
  const [overviewCounts, setOverviewCounts] = useState({ customers: 0, products: 0, tickets: 0 });
  const isModule = Object.hasOwn(modules, moduleName);
  const moduleConfig = modules[moduleName];
  const search = searchState.module === moduleName ? searchState.value : "";
  const requestKey = `${moduleName}:${search}`;
  const loading = refreshing || loadedKey !== requestKey;

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        if (moduleName === "overview") {
          const [ticketRows, productRows, customerRows] = await Promise.all([
            apiRequest(listPath("tickets")),
            apiRequest(listPath("products")),
            canManage ? apiRequest(listPath("customers")) : Promise.resolve([]),
          ]);
          if (active) {
            setError("");
            setOverviewCounts({
              customers: customerRows.length,
              products: productRows.length,
              tickets: ticketRows.length,
            });
          }
        } else if (isModule) {
          const rows = await apiRequest(listPath(moduleName, search));
          if (!active) return;
          setError("");
          setRecords(rows);
          if (moduleName === "tickets" && canManage) {
            const [customerRows, productRows] = await Promise.all([
              apiRequest("/customers"),
              apiRequest("/products"),
            ]);
            if (active) {
              setCustomers(customerRows);
              setProducts(productRows);
            }
          } else if (moduleName === "tickets") {
            const productRows = await apiRequest("/products");
            if (active) setProducts(productRows);
          }
        }
      } catch (loadError) {
        if (active) setError(loadError.message || "Unable to load this module.");
      } finally {
        if (active) setLoadedKey(requestKey);
      }
    }

    load();
    return () => { active = false; };
  }, [moduleName, search, isModule, canManage, requestKey]);

  const filteredProducts = useMemo(() => {
    if (moduleName !== "products" || !search.trim()) return records;
    const query = search.toLowerCase();
    return records.filter((record) => record.name.toLowerCase().includes(query));
  }, [moduleName, records, search]);

  const handleLogout = () => {
    clearStoredAuth();
    navigate("/login", { replace: true });
  };

  async function refresh() {
    setRefreshing(true);
    setError("");
    try {
      setRecords(await apiRequest(listPath(moduleName, search)));
      setLoadedKey(requestKey);
    } catch (refreshError) {
      setError(refreshError.message || "Unable to refresh this module.");
    } finally {
      setRefreshing(false);
    }
  }

  async function saveRecord(values) {
    const isEditing = Boolean(formRecord?._id);
    const id = formRecord?._id;
    const method = !isEditing ? "POST" : moduleName === "products" ? "PUT" : "PATCH";
    const saved = await apiRequest(`/${moduleName}${isEditing ? `/${id}` : ""}`, { method, body: values });
    setFormRecord(undefined);
    await refresh();
    if (moduleName === "tickets" && canManage) {
      const [customerRows, productRows] = await Promise.all([apiRequest("/customers"), apiRequest("/products")]);
      setCustomers(customerRows);
      setProducts(productRows);
    }
    return saved;
  }

  async function deleteRecord(record) {
    if (!window.confirm(`Delete "${record.name || record.title}"?`)) return;
    try {
      await apiRequest(`/${moduleName}/${record._id}`, { method: "DELETE" });
      await refresh();
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete this record.");
    }
  }

  if (moduleName !== "overview" && !isModule) {
    return <div className="message error">This page does not exist.</div>;
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand"><span className="brand-icon">S</span>SupportPilot</div>
        <p className="menu-label">WORKSPACE</p>
        <nav className="navigation">
          <NavLink end to="/" className={({ isActive }) => `nav-button${isActive ? " active" : ""}`}>◫ <span>Overview</span></NavLink>
          {canManage && <NavLink to="/customers" className={({ isActive }) => `nav-button${isActive ? " active" : ""}`}>♙ <span>Customers</span></NavLink>}
          <NavLink to="/products" className={({ isActive }) => `nav-button${isActive ? " active" : ""}`}>▦ <span>Products</span></NavLink>
          <NavLink to="/tickets" className={({ isActive }) => `nav-button${isActive ? " active" : ""}`}>▤ <span>Tickets</span></NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="avatar">{(user?.name || "User").slice(0, 1).toUpperCase()}</div>
          <div className="user-summary"><strong>{user?.name || "User"}</strong><small>{user?.role || "customer"}</small></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">SupportPilot <strong>/ {moduleConfig?.title || "Overview"}</strong></div>
          <div className="topbar-right"><span className="status-dot" /> Signed in <button className="logout-button" type="button" onClick={handleLogout}>Log out</button></div>
        </header>
        <div className="page-content">
          {moduleName === "overview" ? (
            <>
              <div className="page-heading">
                <div><p className="eyebrow">SUPPORT WORKSPACE</p><h1>Overview</h1><p className="subtitle">A snapshot of your support workspace.</p></div>
              </div>
              {error && <p className="message error" role="alert">{error}</p>}
              {loading ? <p className="message">Loading overview...</p> : (
                <section className="stats-grid">
                  {[
                    ["Tickets", overviewCounts.tickets, "blue"],
                    ["Products", overviewCounts.products, "green"],
                    ...(canManage ? [["Customers", overviewCounts.customers, "purple"]] : []),
                  ].map(([title, count, color]) => (
                    <article className="stat-card" key={title}>
                      <div className={`stat-icon ${color}`}>◈</div>
                      <p>{title}</p><h2>{count}</h2><small>Current records</small>
                    </article>
                  ))}
                </section>
              )}
              <section className="module-panel overview-welcome">
                <p className="eyebrow">GET STARTED</p>
                <h2>Manage your support workflow</h2>
                <p>Use the workspace navigation to manage customer records, browse products, and respond to support tickets.</p>
                <div className="overview-actions">
                  {canManage && <NavLink className="primary-button" to="/customers">Manage customers</NavLink>}
                  <NavLink className="secondary-button" to="/products">Browse products</NavLink>
                  <NavLink className="secondary-button" to="/tickets">View tickets</NavLink>
                </div>
              </section>
            </>
          ) : (
            <>
              <div className="page-heading">
                <div><p className="eyebrow">SUPPORT WORKSPACE</p><h1>{moduleConfig.title}</h1><p className="subtitle">{moduleConfig.description}</p></div>
                {(canManage || moduleName === "tickets") && (
                  <button className="primary-button compact-button" type="button" onClick={() => setFormRecord(null)}>
                    + Add {moduleName === "tickets" ? "ticket" : moduleName.slice(0, -1)}
                  </button>
                )}
              </div>
              <section className="products-panel">
                <div className="panel-heading">
                  <div><h2>{moduleConfig.title} directory</h2><p>{records.length} record{records.length === 1 ? "" : "s"}</p></div>
                  <span className="count-badge">{moduleConfig.title}</span>
                </div>
                <div className="toolbar">
                  <label className="search-box"><span>⌕</span><input placeholder={`Search ${moduleName}...`} value={search} onChange={(event) => setSearchState({ module: moduleName, value: event.target.value })} /></label>
                </div>
                {error && <p className="message error" role="alert">{error}</p>}
                {loading ? <p className="message">Loading {moduleName}...</p> : (
                  <RecordsTable
                    moduleName={moduleName}
                    rows={moduleName === "products" ? filteredProducts : records}
                    canManage={canManage}
                    onEdit={(record) => setFormRecord(record)}
                    onDelete={deleteRecord}
                  />
                )}
              </section>
            </>
          )}
        </div>
      </main>
      {formRecord !== undefined && (
        <WorkspaceForm
          moduleName={moduleName}
          initialRecord={formRecord}
          customers={customers}
          products={products}
          canManage={canManage}
          onSubmit={saveRecord}
          onClose={() => setFormRecord(undefined)}
        />
      )}
    </div>
  );
}
