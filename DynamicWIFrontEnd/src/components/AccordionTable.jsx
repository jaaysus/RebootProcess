import React, { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const PAGE_SIZE = 10;

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top bg-light">
      <small className="text-muted">Page {currentPage} of {totalPages}</small>
      <nav>
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button className="page-link text-danger border-0" onClick={() => onPageChange(currentPage - 1)}>
              <FaChevronLeft size={10} />
            </button>
          </li>
          {start > 1 && (
            <>
              <li className="page-item">
                <button className="page-link border-0" onClick={() => onPageChange(1)}>1</button>
              </li>
              {start > 2 && <li className="page-item disabled"><span className="page-link border-0">…</span></li>}
            </>
          )}
          {pages.map((p) => (
            <li key={p} className={`page-item ${p === currentPage ? "active" : ""}`}>
              <button
                className="page-link border-0"
                style={p === currentPage ? { backgroundColor: "#dc3545", borderColor: "#dc3545" } : {}}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            </li>
          ))}
          {end < totalPages && (
            <>
              {end < totalPages - 1 && <li className="page-item disabled"><span className="page-link border-0">…</span></li>}
              <li className="page-item">
                <button className="page-link border-0" onClick={() => onPageChange(totalPages)}>{totalPages}</button>
              </li>
            </>
          )}
          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
            <button className="page-link text-danger border-0" onClick={() => onPageChange(currentPage + 1)}>
              <FaChevronRight size={10} />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

/**
 * Props:
 *  - id          : unique collapse id
 *  - icon        : icon element
 *  - title       : section title string
 *  - defaultOpen : bool
 *  - toolbar     : JSX rendered in the top toolbar (buttons etc.)
 *  - totalCount  : number shown as "X total ..."
 *  - totalLabel  : label for count e.g. "users" / "operators"
 *  - columns     : array of { label, key? } for thead
 *  - data        : full array of rows
 *  - loading     : bool
 *  - renderRow   : (item, globalIndex) => <tr>...</tr>
 *  - emptyText   : string shown when no data
 *  - colSpan     : number of columns
 */
export default function AccordionTable({
  id,
  icon,
  title,
  defaultOpen = false,
  toolbar,
  totalCount,
  totalLabel = "items",
  columns = [],
  data = [],
  loading = false,
  renderRow,
  emptyText = "No data found.",
  colSpan,
  searchable = false,
  searchPlaceholder = "Search...",
  getSearchText,
  searchKeys = [],
  filters = [],
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [localFilters, setLocalFilters] = useState(() => filters.map((f) => f?.value ?? "all"));

  useEffect(() => { setPage(1); }, [data.length]);
  useEffect(() => {
    setLocalFilters(filters.map((f) => f?.value ?? "all"));
  }, [filters.length]);

  const normalized = (v) => String(v ?? "").toLowerCase().trim();
  const getRowSearchText = (item) => {
    if (typeof getSearchText === "function") return normalized(getSearchText(item));
    if (Array.isArray(searchKeys) && searchKeys.length > 0) {
      return normalized(searchKeys.map((k) => item?.[k]).join(" "));
    }
    return normalized(item);
  };
  const getFilterValue = (f, idx) => (f?.value !== undefined ? f.value : localFilters[idx] ?? "all");

  const filtered = data.filter((item) => {
    if (searchable && search) {
      const text = getRowSearchText(item);
      if (!text.includes(normalized(search))) return false;
    }
    if (filters.length > 0) {
      for (let i = 0; i < filters.length; i++) {
        const f = filters[i];
        const selected = getFilterValue(f, i);
        if (!selected || selected === "all") continue;
        const itemValue = normalized(typeof f?.getValue === "function" ? f.getValue(item) : "");
        if (itemValue !== normalized(selected)) return false;
      }
    }
    return true;
  });

  useEffect(() => { setPage(1); }, [filtered.length, search, JSON.stringify(localFilters)]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const span = colSpan ?? columns.length;

  return (
    <div className="accordion-item border-0">
      <h2 className="accordion-header">
        <button
          className={`accordion-button fw-semibold ${defaultOpen ? "bg-danger text-white" : "collapsed text-danger bg-white"}`}
          data-bs-toggle="collapse"
          data-bs-target={`#${id}`}
        >
          {icon && <span className="me-2">{icon}</span>}
          {title}
        </button>
      </h2>

      <div id={id} className={`accordion-collapse collapse ${defaultOpen ? "show" : ""}`}>
        <div className="accordion-body p-0">
          {/* Toolbar */}
          <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom bg-light flex-wrap gap-2">
            <div className="d-flex gap-2 flex-wrap">{toolbar}</div>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              {filters.map((f, i) => {
                const value = getFilterValue(f, i);
                const options = Array.isArray(f?.options) ? f.options : [];
                return (
                  <select
                    key={`${f?.label ?? "filter"}-${i}`}
                    className="form-select form-select-sm"
                    style={{ minWidth: 140 }}
                    value={value}
                    onChange={(e) => {
                      const next = e.target.value;
                      if (typeof f?.onChange === "function") f.onChange(next);
                      else setLocalFilters((prev) => prev.map((v, idx) => (idx === i ? next : v)));
                    }}
                  >
                    <option value="all">{f?.label ? `All ${f.label}` : "All"}</option>
                    {options.map((opt, idx) => (
                      <option key={`${opt?.value ?? opt?.label ?? idx}`} value={opt?.value ?? opt?.label ?? ""}>
                        {opt?.label ?? opt?.value ?? ""}
                      </option>
                    ))}
                  </select>
                );
              })}
              {searchable && (
                <input
                  type="text"
                  className="form-control form-control-sm"
                  style={{ minWidth: 200 }}
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              )}
              <small className="text-muted">{totalCount ?? filtered.length} total {totalLabel}</small>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-5 text-danger"><div className="spinner-border" /></div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-danger">
                    <tr>
                      {columns.map((col, i) => (
                        <th key={i} style={col.style}>{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.length === 0 && (
                      <tr><td colSpan={span} className="text-center py-4 text-muted">{emptyText}</td></tr>
                    )}
                    {paged.map((item, i) => renderRow(item, (page - 1) * PAGE_SIZE + i + 1))}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
