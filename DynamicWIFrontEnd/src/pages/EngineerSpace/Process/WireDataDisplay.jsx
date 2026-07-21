import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWireData, uploadWireData, deleteAllWireData, clearWireError } from '../../../redux/slices/wireDataSlice';
import { selectWireData, selectWireDataLoading, selectWireDataUploading, selectWireDataError, selectWireDataPagination } from '../../../redux/slices/wireDataSlice';
import AppNavbar from '../../../components/Navbar';

export default function WireDataDisplay() {
  const dispatch = useDispatch();
  const wires = useSelector(selectWireData);
  const loading = useSelector(selectWireDataLoading);
  const uploading = useSelector(selectWireDataUploading);
  const error = useSelector(selectWireDataError);
  const pagination = useSelector(selectWireDataPagination);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [sortColumn, setSortColumn] = useState('wireNumber');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filters, setFilters] = useState({
    wireNumber: '',
    core: '',
    module: '',
    spliceCode: '',
    station: '',
    end1Node: '',
    end2Node: ''
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      dispatch(fetchWireData({ page: currentPage, pageSize: itemsPerPage, filters }));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [dispatch, currentPage, itemsPerPage, filters]);

  useEffect(() => {
    setCurrentPage(pagination.page || 1);
  }, [pagination.page]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setShowOverwriteConfirm(true);
    }
  };

  const handleOverwriteConfirm = async () => {
    if (!selectedFile) return;

    try {
      setUploadSuccess(null);
      dispatch(clearWireError());
      const result = await dispatch(uploadWireData(selectedFile)).unwrap();
      setUploadSuccess(`Successfully uploaded ${result.WireCount} wires with ${result.EndCount} ends.`);
      setCurrentPage(1);
      setSelectedFile(null);
      setShowOverwriteConfirm(false);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleOverwriteCancel = () => {
    setSelectedFile(null);
    setShowOverwriteConfirm(false);
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete all wire data? This action cannot be undone.')) {
      try {
        await dispatch(deleteAllWireData()).unwrap();
        setCurrentPage(1);
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  const handleClearError = () => {
    dispatch(clearWireError());
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      wireNumber: '',
      core: '',
      module: '',
      spliceCode: '',
      station: '',
      end1Node: '',
      end2Node: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  const totalPages = pagination.totalPages || 0;
  const totalCount = pagination.totalCount || 0;

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortedAndFilteredWires = () => {
    let filteredWires = [...wires];

    // Apply sort
    filteredWires.sort((a, b) => {
      let aValue, bValue;

      switch (sortColumn) {
        case 'wireNumber':
          aValue = a.wireNumber || '';
          bValue = b.wireNumber || '';
          break;
        case 'csa':
          aValue = a.csa || 0;
          bValue = b.csa || 0;
          break;
        case 'length':
          aValue = a.length || 0;
          bValue = b.length || 0;
          break;
        case 'core':
          aValue = a.core || '';
          bValue = b.core || '';
          break;
        case 'colorC1':
          aValue = a.colorC1 || '';
          bValue = b.colorC1 || '';
          break;
        case 'colorC2':
          aValue = a.colorC2 || '';
          bValue = b.colorC2 || '';
          break;
        case 'module':
          aValue = a.module || '';
          bValue = b.module || '';
          break;
        case 'spliceCode':
          aValue = a.spliceCode || '';
          bValue = b.spliceCode || '';
          break;
        case 'end1':
          aValue = a.ends?.[0]?.node || '';
          bValue = b.ends?.[0]?.node || '';
          break;
        case 'end2':
          aValue = a.ends?.[1]?.node || '';
          bValue = b.ends?.[1]?.node || '';
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        const comparison = String(aValue).localeCompare(String(bValue));
        return sortDirection === 'asc' ? comparison : -comparison;
      }
    });

    return filteredWires;
  };

  const sortedAndFilteredWires = getSortedAndFilteredWires();

  return (
    <>
      <AppNavbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Global Harness Data</h1>
          <div className="d-flex gap-2">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="form-control"
              style={{ display: 'none' }}
              id="wireUploadInput"
            />
            <button
              className="btn btn-primary"
              onClick={() => document.getElementById('wireUploadInput').click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload New Data'}
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDeleteAll}
              disabled={loading || uploading || wires.length === 0}
            >
              Delete All Data
            </button>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Filters</h5>
              {hasActiveFilters && (
                <button className="btn btn-sm btn-outline-secondary" onClick={clearFilters}>
                  Clear All Filters
                </button>
              )}
            </div>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label small fw-bold">Wire Number</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Filter by wire number..."
                  value={filters.wireNumber}
                  onChange={(e) => handleFilterChange('wireNumber', e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">Core</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Filter by core..."
                  value={filters.core}
                  onChange={(e) => handleFilterChange('core', e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">Module</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Filter by module..."
                  value={filters.module}
                  onChange={(e) => handleFilterChange('module', e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">Splice Code</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Filter by splice code..."
                  value={filters.spliceCode}
                  onChange={(e) => handleFilterChange('spliceCode', e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">Station</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Filter by station..."
                  value={filters.station}
                  onChange={(e) => handleFilterChange('station', e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">End 1 Node</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Filter by end 1 node..."
                  value={filters.end1Node}
                  onChange={(e) => handleFilterChange('end1Node', e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold">End 2 Node</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Filter by end 2 node..."
                  value={filters.end2Node}
                  onChange={(e) => handleFilterChange('end2Node', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={handleClearError}></button>
          </div>
        )}

        {uploadSuccess && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            {uploadSuccess}
            <button type="button" className="btn-close" onClick={() => setUploadSuccess(null)}></button>
          </div>
        )}

        {showOverwriteConfirm && (
          <div className="alert alert-warning d-flex align-items-center justify-content-between">
            <div>
              <strong>Overwrite Warning:</strong> Uploading new data will replace all existing wire data. 
              File: {selectedFile?.name}
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-warning btn-sm" 
                onClick={handleOverwriteConfirm} 
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Confirm Overwrite'}
              </button>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={handleOverwriteCancel}
                disabled={uploading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading wire data...</p>
          </div>
        ) : !wires || !Array.isArray(wires) || wires.length === 0 ? (
          <div className="alert alert-info">
            No wire data available. Upload an Excel file to get started.
            {error && <div className="mt-2 text-danger">Error: {error}</div>}
          </div>
        ) : (
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="text-muted">
                  {sortedAndFilteredWires.length > 0 ? (
                    <>
                      {hasActiveFilters ? (
                        <>Showing {sortedAndFilteredWires.length} of {totalCount} wires (filtered)</>
                      ) : (
                        <>Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} wires</>
                      )}
                    </>
                  ) : (
                    <>No wires to display</>
                  )}
                </div>
                <div className="text-muted">
                  {!hasActiveFilters && <>Page {currentPage} of {totalPages || 1}</>}
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('end1')}>
                        End 1 {sortColumn === 'end1' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('wireNumber')}>
                        Wire Number {sortColumn === 'wireNumber' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('csa')}>
                        CSA {sortColumn === 'csa' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('length')}>
                        Length {sortColumn === 'length' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('core')}>
                        Core {sortColumn === 'core' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('colorC1')}>
                        Color C1 {sortColumn === 'colorC1' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('colorC2')}>
                        Color C2 {sortColumn === 'colorC2' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('module')}>
                        Module {sortColumn === 'module' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('spliceCode')}>
                        Splice Code {sortColumn === 'spliceCode' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('end2')}>
                        End 2 {sortColumn === 'end2' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAndFilteredWires.map((wire) => {
                      const end1 = wire.ends && wire.ends.length > 0 ? wire.ends[0] : null;
                      const end2 = wire.ends && wire.ends.length > 1 ? wire.ends[1] : null;

                      const formatEnd = (end) => {
                        if (!end) return '-';
                        return (
                          <div className="small">
                            <div><strong>{end.node}</strong></div>
                            <div>Cavity: {end.cavity}</div>
                            <div>Location: {end.location}</div>
                            <div>Station: {end.station}</div>
                            {end.isSpliceCavity && <span className="badge bg-info">Splice</span>}
                          </div>
                        );
                      };

                      return (
                        <tr key={wire.id}>
                          <td>{formatEnd(end1)}</td>
                          <td>{wire.wireNumber}</td>
                          <td>{wire.csa}</td>
                          <td>{wire.length}</td>
                          <td>{wire.core}</td>
                          <td>{wire.colorC1}</td>
                          <td>{wire.colorC2}</td>
                          <td>{wire.module}</td>
                          <td>{wire.spliceCode || '-'}</td>
                          <td>{formatEnd(end2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {!hasActiveFilters && totalPages > 1 && (
                <nav aria-label="Page navigation" className="mt-3">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={handlePreviousPage} disabled={currentPage === 1}>
                        Previous
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => {
                      const pageNumber = i + 1;
                      // Show first page, last page, current page, and pages around current page
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <li key={pageNumber} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => handlePageChange(pageNumber)}>
                              {pageNumber}
                            </button>
                          </li>
                        );
                      } else if (
                        pageNumber === currentPage - 2 ||
                        pageNumber === currentPage + 2
                      ) {
                        return (
                          <li key={pageNumber} className="page-item disabled">
                            <span className="page-link">...</span>
                          </li>
                        );
                      }
                      return null;
                    })}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={handleNextPage} disabled={currentPage === totalPages}>
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
